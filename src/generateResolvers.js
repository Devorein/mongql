const generateQueryResolvers = require('./generateQueryResolvers');
const generateMutationResolvers = require('./generateMutationResolvers');
const generateTypeResolvers = require('./generateTypeResolvers');
const resolverCompose = require('../utils/resolverCompose');

function transformResolvers (Schema, InitResolver, transformedSchema) {
	const { mongql: { resource, generate } } = Schema;
	if (InitResolver === null) InitResolver = { Query: {}, Mutation: {} };
	if (generate !== false) {
		const { type, query, mutation } = generate;
		if (type)
			InitResolver = {
				...InitResolver,
				...generateTypeResolvers(resource, transformedSchema)
			};
		if (query)
			InitResolver.Query = {
				...InitResolver.Query,
				...generateQueryResolvers(resource, transformedSchema)
			};
		if (mutation)
			InitResolver.Mutation = {
				...InitResolver.Mutation,
				...generateMutationResolvers(resource, transformedSchema)
			};
		return resolverCompose(InitResolver);
	} else return resolverCompose(InitResolver);
}

module.exports = transformResolvers;
