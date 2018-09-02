import { ANY } from './consts';
import { Require, Token } from './types';

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

export const defaultExportIsApp = (tokens: Token[]) => tokens.some(t =>
  t.type === 'ExpressionStatement'
  && t.expression.type === 'AssignmentExpression'
  && t.expression.left.type === 'MemberExpression'
  && t.expression.left.object.type === 'Identifier'
  && t.expression.left.object.name === 'module'
  && t.expression.left.property.type === 'Identifier'
  && t.expression.left.property.name === 'exports'
  && t.expression.right.type === 'Identifier'
  && t.expression.right.name === 'app',
);

export const requireMatches = (path: string) => (r: Require) =>
  `${r.path}.js` === path || `${r.path}/index.js` === path;
