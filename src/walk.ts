import { Token } from './types';
import { isNotNull } from './util';

type MaybeToken = Token|null;

const maybe = (token: MaybeToken) => (token ? [token] : []);

export default <T>(fn: (t: Token[]) => T) => (token: Token) => {
  switch (token.type) {
    case 'ArrowFunctionExpression':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ObjectMethod':
      return fn([token.body]);
    case 'BlockStatement':
      return fn(token.body);
    case 'VariableDeclaration':
      return fn(token.declarations);
    case 'VariableDeclarator':
      return fn([token.id, ...maybe(token.init)]);
    case 'ReturnStatement':
      return !!token.argument && fn([token.argument]);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return fn([token.left, token.right]);
    case 'UnaryExpression':
      return fn([token.argument]);
    case 'CallExpression':
    case 'NewExpression':
      return fn([token.callee, ...token.arguments]);
    case 'ExpressionStatement':
      return fn([token.expression]);
    case 'AssignmentPattern':
    case 'AssignmentExpression':
      return fn([token.left, token.right]);
    case 'MemberExpression':
      return fn([token.object, token.property]);
    case 'ObjectExpression':
      return fn(token.properties);
    case 'ObjectProperty':
      return fn([token.value]);
    case 'ArrayExpression':
      return fn(token.elements.filter(isNotNull) as Token[]);
    case 'AwaitExpression':
      return fn([token.argument]);
    case 'SpreadElement':
      return fn([token.argument]);
    case 'TemplateLiteral':
      return fn(token.expressions);
    case 'IfStatement':
    case 'ConditionalExpression':
      return fn([token.test, token.consequent, ...maybe(token.alternate)]);
    case 'TryStatement':
      return fn([
        token.block,
        ...maybe(token.handler),
        ...maybe(token.finalizer),
      ]);
    case 'CatchClause':
      return fn([token.body]);
    case 'WhileStatement':
      return fn([token.test, token.body]);
    case 'ThrowStatement':
      return fn([token.argument]);
    case 'SwitchStatement':
      return fn([token.discriminant, ...token.cases]);
    case 'SwitchCase':
      return fn([...maybe(token.test), ...token.consequent]);
    case 'ClassDeclaration':
      return fn([...maybe(token.superClass), token.body]);
    case 'ClassMethod':
      return fn([token.body]);
    case 'ClassBody':
      return fn(token.body);
    case 'ForStatement':
      return fn([
        ...maybe(token.init),
        ...maybe(token.test),
        ...maybe(token.update),
        token.body,
      ]);
    case 'ForInStatement':
      return fn([token.left, token.right, token.body]);
    case 'ObjectPattern':
      return fn(token.properties);
    case 'ArrayPattern':
      return fn(token.elements);
    case 'BooleanLiteral':
    case 'BreakStatement':
    case 'EmptyStatement':
    case 'Identifier':
    case 'NullLiteral':
    case 'NumericLiteral':
    case 'RegExpLiteral':
    case 'StringLiteral':
    case 'Super':
    case 'ThisExpression':
      return false;
    default:
      throw new Error(JSON.stringify(token, null, 2));
  }
};
