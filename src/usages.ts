import { ANY, APP } from './consts';
import { AppUsage, Token } from './types';
import {
  flatten,
  getLiteralValue,
  getName,
  getObjectName,
  isNotNull,
} from './util';
import walk from './walk';

type MatchPath = Token[]; // from outside in, until a reference is found

interface Usage {
  path: MatchPath; // a usage of an identifier expressed as a token path
  extra: string[];
}

const tokenUsesSymbol = (token: Token, name: string[]): Usage[] => {
  switch (token.type) {
    case 'Identifier':
      return token.name === name[0]
        ? [{ path: [token], extra: name.slice(1) }]
        : [];
    case 'MemberExpression': {
      if (token.object.type === 'CallExpression') break;

      const tname = getObjectName(token);

      if (!tname.length) return [];

      const diff = tname
        .findIndex((k, i) => k !== name[i] && k !== ANY && name[i] !== ANY);

      const isUsed =
        // the token is exactly `name`, for example:
        // token = 'module.exports', name = 'module.exports'
        diff === -1
        // the token non-empty is a subset of `name`:
        // token = 'module.exports', name = 'module.exports.prop'
        || diff === tname.length
        // the token is a superset of `name`:
        // token = 'module.exports.prop', name = 'module.exports'
        || diff === name.length;

      const extra = diff > 0 && name.length > tname.length
        ? name.slice(tname.length)
        : [];

      return isUsed
        ? [{ extra, path: [token] }]
        : [];
    }
    case 'AssignmentExpression':
      if (token.left.type === 'Identifier'
        || token.left.type === 'MemberExpression'
      ) {
        return tokenUsesSymbol(token.right, name);
      }
      break;
    default:
      break;
  }

  const recurse = (ts: Token[]) =>
    flatten(ts.map(t => tokenUsesSymbol(t, name)));
  return (walk(recurse)(token) || [])
    .map(t => ({ ...t, path: [token, ...t.path] }));
};

export const setAppUsage = (method: string, path: string | null) =>
  `${APP}(${method}|${path})`;

export const getAppUsage = (s: string): AppUsage | null => {
  const data = s.split(APP)[1];
  if (!data) return null;
  const [method, path] = data.substring(1, data.length - 1).split('|', 2);
  return { method, path: path === 'null' ? null : path };
};

const getUsageName = (usage: Usage): string[] => {

  const arrayPatterns = usage.path
    .map(t =>
      t.type === 'VariableDeclarator' && t.id.type === 'ArrayPattern'
        ? t.id.elements.filter(isNotNull).map(getName)
        : null,
    )
    .find(t => !!t);

  if (arrayPatterns) return arrayPatterns;

  const nameParts = usage.path
    .map((token: Token): string => {
      switch (token.type) {
        case 'VariableDeclarator':
          return getName(token.id);
        case 'ExpressionStatement':
          if (token.expression.type === 'AssignmentExpression') {
            return getObjectName(token.expression.left).join('.');
          }
          if (token.expression.type === 'CallExpression'
            && token.expression.callee.type === 'MemberExpression'
            && token.expression.callee.object.type === 'Identifier'
            && token.expression.callee.object.name === 'app'
            && token.expression.callee.property.type === 'Identifier'
          ) {
            const method = token.expression.callee.property.name;
            const path = getLiteralValue(token.expression.arguments[0]);

            (token.expression.arguments[0] as any).value;
            return `${setAppUsage(method, path)}.NOTHING_AFTER_THIS`;
          }
          return 'NOTHING_AFTER_THIS';
        case 'ObjectMethod':
          return `${token.key.name}.NOTHING_AFTER_THIS`;
        case 'ObjectProperty':
          return token.key.name;
        case 'ClassDeclaration':
        case 'FunctionDeclaration':
          return token.id
            ? `${token.id.name}.NOTHING_AFTER_THIS`
            : 'NOTHING_AFTER_THIS';
        case 'ArrowFunctionExpression':
        case 'FunctionDeclaration':
        case 'FunctionExpression':
          return 'NOTHING_AFTER_THIS';
        default:
          return '';
      }
    })
    .filter(t => !!t);

  if (!nameParts.length) return [];

  const name = nameParts
    .concat(usage.extra)
    .join('.')
    .replace(/\.NOTHING_AFTER_THIS.*/, '');

  return [name];
};

const findUsagesOfIdentifier = (tokens: Token[], identifier: string[]) =>
  flatten(tokens.map(t => tokenUsesSymbol(t, identifier)));

const findUsagesRecursive = (
  tokens: Token[],
  identifiers: string[],
  exclude: string[],
): string[] => {
  if (!identifiers.length) return [];

  const ids = identifiers.map(i => i.split('.'));

  const usages = flatten(ids.map(
    i => flatten(findUsagesOfIdentifier(tokens, i).map(getUsageName))
      .filter(n => !!n),
  )).filter(i => !identifiers.includes(i) && !exclude.includes(i));

  return [
    ...usages,
    ...findUsagesRecursive(
      tokens,
      usages,
      [...identifiers, ...usages, ...exclude],
    ),
  ];
};

export const findUsages = (
  tokens: Token[],
  identifier: string,
): string[] =>
  findUsagesRecursive(tokens, [identifier], []);
