const generateQueryResolvers = require('./generateQueryResolvers');
const generateMutationResolvers = require('./generateMutationResolvers');
const generateTypeResolvers = require('./generateTypeResolvers');
const resolverCompose = require('../utils/resolverCompose');

function transformResolvers(Schema, InitResolver, transformedSchema) {
  const { mongql: { generate } } = Schema;
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} };
  if (generate !== false) {
    InitResolver = {
      ...generateTypeResolvers(transformedSchema),
      ...InitResolver,
    };
    InitResolver.Query = {
      ...generateQueryResolvers(Schema, transformedSchema),
      ...InitResolver.Query,
    };
    InitResolver.Mutation = {
      ...generateMutationResolvers(Schema, transformedSchema),
      ...InitResolver.Mutation,
    };
    return resolverCompose(InitResolver);
  } else return resolverCompose(InitResolver);
}

module.exports = transformResolvers;
