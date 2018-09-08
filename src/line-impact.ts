import { Token } from './types';
import {
  extractAppUsageFromToken,
  getName,
  getObjectName,
  setAppUsage,
  tokenAt,
} from './util';

export const findSymbols = (
  tokens: Token[],
  line: number,
): string[] => {
  const token = tokens.find(tokenAt(line));
  if (!token) return [];

  switch (token.type) {
    case 'VariableDeclaration':
      return token.declarations.map(n => getName(n));
    case 'ExpressionStatement':
      if (token.expression.type === 'AssignmentExpression') {
        const assignment = token.expression;
        const object = getObjectName(assignment.left);
        if (assignment.right.type === 'ObjectExpression') {
          const property = assignment.right.properties.find(tokenAt(line));
          if (!property || property.type === 'SpreadElement') return [];
          return [[...object, property.key.name].join('.')];
        }
        return [object.join('.')];
      }
      const appUsage = extractAppUsageFromToken(token);
      if (appUsage) return [setAppUsage(appUsage)];
      return [];
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      return token.id
        ? [getName(token.id)]
        : [];
    default:
      return [];
  }
};
