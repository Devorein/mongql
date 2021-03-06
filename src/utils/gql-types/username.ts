import { GraphQLScalarType, GraphQLError } from 'graphql';
import { Kind } from 'graphql/language';

function isAlphaNumericOnly(input: string) {
  const letterNumberRegex = /^([0-9a-z]|_|\.)+$/;
  if (input.match(letterNumberRegex)) return true;
  return false;
}

/**
 * A custom graphql scalar type representating username
 */
export default new GraphQLScalarType({
  name: 'Username',
  description: 'A custom scalar type to represent a well formatted username',
  parseValue: (value) => value,
  serialize: (value) => value,
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isAlphaNumericOnly(ast.value) && ast.value.length >= 3 && ast.value.length <= 18) return ast.value;
      else throw new GraphQLError('Not a well formatted username');
    }
    return null;
  }
});
