const generateQueryResolvers = require('./generateQueryResolvers');
const generateMutationResolvers = require('./generateMutationResolvers');
const generateTypeResolvers = require('./generateTypeResolvers');
const resolverCompose = require('../utils/resolverCompose');

function transformResolvers (Schema, InitResolver, transformedSchema) {
	const { mongql: { generate } } = Schema;
	if (InitResolver === null) InitResolver = { Query: {}, Mutation: {} };
	if (generate !== false) {
		const { type, query, mutation } = generate;
		if (type)
			InitResolver = {
				...InitResolver,
				...generateTypeResolvers(Schema, transformedSchema)
			};
		if (query)
			InitResolver.Query = {
				...InitResolver.Query,
				...generateQueryResolvers(Schema, transformedSchema)
			};
		if (mutation)
			InitResolver.Mutation = {
				...InitResolver.Mutation,
				...generateMutationResolvers(Schema, transformedSchema)
			};
		return resolverCompose(InitResolver);
	} else return resolverCompose(InitResolver);
}

module.exports = transformResolvers;
