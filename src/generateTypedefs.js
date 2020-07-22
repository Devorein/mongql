const fs = require('fs-extra');
const path = require('path');
const mkdirp = require('mkdirp');

const generateQueryTypedefs = require('./generateQueryTypedefs');
const generateMutationTypedefs = require('./generateMutationTypedefs');
const generateTypeTypedefs = require('./generateTypeTypedefs');
const { transformTypedefTypesAST, transformTypedefObjExtAST } = require('../utils/ast/transformGraphqlAST');

module.exports = async function (schema, typedefsAST, GlobalConfigs) {
	const { Validators, output } = GlobalConfigs;
	if (typedefsAST === null || typedefsAST === undefined)
		typedefsAST = {
			kind: 'Document',
			definitions: []
		};
  // console.log(typedefsAST);
	const { generate } = schema.mongql;
	let transformedSchema = null;
	if (generate !== false) {
		const { type, query, mutation } = generate;
		if (generate === true || type) {
			const generatedTypeTypedefs = generateTypeTypedefs(schema, Validators);
			transformTypedefTypesAST(typedefsAST, generatedTypeTypedefs.typedefTypeStr);
			transformedSchema = generatedTypeTypedefs.transformedSchema;
		}
		if (generate === true || query) transformTypedefObjExtAST('Query', typedefsAST, generateQueryTypedefs(schema));
		if (generate === true || mutation)
			transformTypedefObjExtAST('Mutation', typedefsAST, generateMutationTypedefs(schema));
		if (typeof output.AST === 'string') {
			await mkdirp(output.AST);
			await fs.writeFile(path.join(output.AST, `${schema.mongql.resource}.json`), JSON.stringify(typedefsAST), 'UTF-8');
		}
		return { typedefsAST, transformedSchema };
	} else return { typedefsAST };
};
