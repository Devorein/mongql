import { GraphQLScalarType, GraphQLError } from 'graphql';
import { Kind } from 'graphql/language';

function isStrongPassword(input: string) {
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  return regex.test(input);
}

export default new GraphQLScalarType({
  name: 'Password',
  description: 'A custom scalar type to represent strong password',
  parseValue: (value) => value,
  serialize: (value) => value,
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isStrongPassword(ast.value)) return ast.value;
      else throw new GraphQLError('Password is not strong enough');
    }
    return null;
  }
});
