import { IMongqlMongooseSchemaFull } from "../types";

import generateQueryTypedefs from './query';
import generateMutationTypedefs from './mutation';
import {
  parseMongooseSchema,
  decorateTypes,
  generateGenericType,
  parseScalarType,
  generateSpecificType
} from './type';
import { DocumentNode } from "graphql";

export default async function (schema: IMongqlMongooseSchemaFull, InitTypedefsAST: DocumentNode | undefined) {
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(schema, InitTypedefsAST);
  generateQueryTypedefs(schema, DocumentAST);
  generateMutationTypedefs(schema, DocumentAST);
  return { typedefsAST: DocumentAST, SchemaInfo };
}

export {
  generateQueryTypedefs,
  generateMutationTypedefs,
  decorateTypes,
  generateGenericType,
  parseScalarType,
  generateSpecificType,
  parseMongooseSchema
}