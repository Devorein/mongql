const generateQueryTypedefs = require('./generateQueryTypedefs');
const generateMutationTypedefs = require('./generateMutationTypedefs');
const { parseMongooseSchema } = require('./generateTypeTypedefs');

module.exports = async function (schema, InitTypedefsAST) {
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(schema, InitTypedefsAST);
  generateQueryTypedefs(schema, DocumentAST);
  generateMutationTypedefs(schema, DocumentAST);
  return { typedefsAST: DocumentAST, SchemaInfo };
};
