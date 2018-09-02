import { ANONYMOUS, DEFAULT } from './consts';
import { Require, Token } from './types';
import { flatten, getLiteralValue, isNotNull } from './util';

const getRequireArg = (token: Token | null): Token | null => (
  token && token.type === 'CallExpression'
  && token.callee.type === 'Identifier'
  && token.callee.name === 'require'
  && token.arguments[0]
) || null;

const getRequireForDeclaration = (
  path: string,
  token: Token,
): Require | null => {
  switch (token.type) {
    case 'Identifier':
      return {
        path,
        symbols: [{ imported: DEFAULT, local: token.name }],
      };
    case 'ObjectPattern': {
      const symbols = token.properties
        .map(p =>
          p.type === 'ObjectProperty' && p.value.type === 'Identifier'
            ? { local: p.key.name, imported: p.value.name }
            : null,
        )
        .filter(isNotNull);

      return {
        path,
        symbols,
      };
    }
    default:
      return null;
  }
};

const getRequires = (token: Token): Require[] => {
  switch (token.type) {
    case 'VariableDeclaration':
      return token.declarations
        .map((d) => {
          const path = getLiteralValue(getRequireArg(d.init));
          if (!path) return null;
          return getRequireForDeclaration(path, d.id);
        })
        .filter(isNotNull);
    case 'ExpressionStatement':
      if (token.expression.type !== 'CallExpression') return [];

      const app = token.expression.callee.type === 'MemberExpression'
        && token.expression.callee.object.type === 'Identifier'
        && token.expression.callee.object.name === 'app'
        && token.expression.callee.property.type === 'Identifier'
          ? {
            method: token.expression.callee.property.name,
            path: getLiteralValue(token.expression.arguments[0]) || null,
          }
          : undefined;

      return token.expression.arguments
        .map(a => getLiteralValue(getRequireArg(a)))
        .filter(isNotNull)
        .map(path => ({
          app,
          path,
          symbols: [{ imported: DEFAULT, local: ANONYMOUS }],
        }));
    default:
      return [];
  }
};

export const findRequires = (tokens: Token[]): Require[] =>
  flatten(tokens.map(getRequires));
