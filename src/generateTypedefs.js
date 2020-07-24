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
	const { generate } = schema.mongql;
	if (generate !== false) {
		const { transformedSchema, typedefTypeStr } = generateTypeTypedefs(schema, Validators);
		transformTypedefTypesAST(typedefsAST, typedefTypeStr);
		transformTypedefObjExtAST('Query', typedefsAST, generateQueryTypedefs(schema));
		transformTypedefObjExtAST('Mutation', typedefsAST, generateMutationTypedefs(schema));
		if (typeof output.AST === 'string') {
			await mkdirp(output.AST);
			await fs.writeFile(path.join(output.AST, `${schema.mongql.resource}.json`), JSON.stringify(typedefsAST), 'UTF-8');
		}
		return { typedefsAST, transformedSchema };
	} else return { typedefsAST };
};
