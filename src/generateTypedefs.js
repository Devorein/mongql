const { transformTypedefTypesAST, transformTypedefObjExtAST } = require('../utils/ast/transformGraphqlAST');

const generateQueryTypedefs = require('./generateQueryTypedefs');
const generateMutationTypedefs = require('./generateMutationTypedefs');
const generateTypeTypedefs = require('./generateTypeTypedefs');

module.exports = function transformTypeDefs (schema, typedefsAST, Validators) {
	if (typedefsAST === null || typedefsAST === undefined)
		typedefsAST = {
			kind: 'Document',
			definitions: []
		};
	const { generate } = schema.mongql;
	let transformedSchema = null;
	if (generate !== false) {
		const { type, query, mutation } = generate;
		if (type) {
			const generatedTypeTypedefs = generateTypeTypedefs(schema, Validators);
			transformTypedefTypesAST(typedefsAST, generatedTypeTypedefs.typedefTypeStr);
			transformedSchema = generatedTypeTypedefs.transformedSchema;
		}
		if (query) transformTypedefObjExtAST('Query', typedefsAST, generateQueryTypedefs(schema));
		if (mutation) transformTypedefObjExtAST('Mutation', typedefsAST, generateMutationTypedefs(schema));
		return { typedefsAST, transformedSchema };
	} else return { typedefsAST };
};
