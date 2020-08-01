const { composeResolvers } = require('@graphql-tools/resolvers-composition');

const isAuthenticated = require('./authResolver');

export default function (resolver: any) {
  const resolversComposition: { [key: string]: any } = {};

  Object.entries(resolver).forEach(([outerkey, outervalue]) => {
    if (typeof outervalue === 'object') {
      Object.keys(outervalue as object).forEach((innerkey) => {
        if (!innerkey.match(/(Mixed)/) && (innerkey.match(/(Self|Others)/) || outerkey.match(/(Mutation)/))) {
          resolversComposition[`${outerkey}.${innerkey}`] = [isAuthenticated()];
        }
      });
    }
  });
  return composeResolvers(resolver, resolversComposition);
};
