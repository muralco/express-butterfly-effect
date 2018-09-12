import { ANY, APP } from './consts';
import { AppUsage, Require, Token } from './types';

export const flatten = <T>(arr: T[][]): T[] =>
  ([] as T[]).concat(...arr);

export const uniq = (s: string[]): string[] =>
  Object.keys(s.reduce(
    (acc, k) => { acc[k] = 1; return acc; },
    {} as { [k: string]: 1 },
  ));

export const isNotNull = <T>(t: T|null): t is T => t !== null;

export const range = (start: number, count: number) =>
  // tslint:disable-next-line prefer-array-literal
  new Array(count).fill(0).map((_, i) => start + i);

export const tokenAt = (line: number) => (token: Token): boolean =>
  !!token.loc && token.loc.start.line <= line && line <= token.loc.end.line;

export const getName = (token: Token): string => {
  switch (token.type) {
    case 'ExpressionStatement':
      return getName(token.expression);
    case 'AssignmentExpression':
      return getName(token.left);
    case 'MemberExpression':
      return `${getName(token.object)}.${getName(token.property)}`;
    case 'VariableDeclaration':
      return getName(token.declarations[0]);
    case 'VariableDeclarator':
      return getName(token.id);
    case 'FunctionDeclaration':
      return token.id ? getName(token.id) : '';
    case 'RestElement':
      return getName(token.argument);
    case 'Identifier':
      return token.name;
    case 'ObjectPattern':
    case 'CallExpression':
    case 'IfStatement':
      return '';
    default:
      throw new Error(JSON.stringify(token, null, 2));
  }
};

export const getObjectName = (token: Token): string[] => {
  switch (token.type) {
    case 'Identifier': return [token.name];
    case 'MemberExpression': return [
      ...getObjectName(token.object),
      token.property.type === 'Identifier'
        ? token.property.name
        : ANY,
    ];
    default: return [];
  }
};

export const getLiteralValue = (token: Token | null): string | null =>
  token && token.type === 'StringLiteral'
    ? token.value
    : null;

const isModuleExports = (t: Token): boolean =>
  t.type === 'MemberExpression'
  && t.object.type === 'Identifier'
  && t.object.name === 'module'
  && t.property.type === 'Identifier'
  && t.property.name === 'exports';

const isModuleExportsEqualApp = (t: Token): boolean =>
  t.type === 'ExpressionStatement'
  && t.expression.type === 'AssignmentExpression'
  && isModuleExports(t.expression.left)
  && t.expression.right.type === 'Identifier'
  && t.expression.right.name === 'app';

const isAppEqualModuleExportsEqualRequire = (t: Token) =>
  t.type === 'VariableDeclaration'
  && t.declarations.some(d =>
    d.id.type === 'Identifier'
    && d.id.name === 'app'
    && !!d.init
    && d.init.type === 'AssignmentExpression'
    && isModuleExports(d.init.left),
  );

export const defaultExportIsApp = (tokens: Token[]) => tokens.some(t =>
  isModuleExportsEqualApp(t)
  || isAppEqualModuleExportsEqualRequire(t),
);

export const requireMatches = (path: string) => (r: Require) =>
  `${r.path}.js` === path || `${r.path}/index.js` === path;

export const setAppUsage = ({ method, path }: AppUsage) =>
  `${APP}(${method}|${path})`;

export const getAppUsage = (s: string): AppUsage | null => {
  const data = s.split(APP)[1];
  if (!data) return null;
  const [method, path] = data.substring(1, data.length - 1).split('|', 2);
  return { method, path: path === 'null' ? null : path };
};

export const extractAppUsageFromToken = (token: Token): AppUsage | null => {
  if (token.type === 'ExpressionStatement'
    && token.expression.type === 'CallExpression'
    && token.expression.callee.type === 'MemberExpression'
    && token.expression.callee.object.type === 'Identifier'
    && token.expression.callee.object.name === 'app'
    && token.expression.callee.property.type === 'Identifier'
    ) {
    const method = token.expression.callee.property.name;
    const path = getLiteralValue(token.expression.arguments[0]);
    return { method, path };
  }

  return null;
};
