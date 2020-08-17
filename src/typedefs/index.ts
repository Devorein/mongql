import { IMongqlMongooseSchemaFull, MutableDocumentNode } from "../types";

import generateQueryFields from './query';
import generateMutationFields from './mutation';
import {
  parseMongooseSchema,
  decorateTypes,
  generateGenericType,
  parseScalarType,
  generateSpecificType
} from './type';
import { DocumentNode } from "graphql";

export default function (Schema: IMongqlMongooseSchemaFull, InitTypedefsAST: DocumentNode | undefined) {
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(Schema, InitTypedefsAST);
  generateQueryFields(SchemaInfo, DocumentAST);
  generateMutationFields(SchemaInfo, DocumentAST);
  return { GeneratedDocumentNode: DocumentAST as MutableDocumentNode, SchemaInfo };
}

export {
  generateQueryFields,
  generateMutationFields,
  decorateTypes,
  generateGenericType,
  parseScalarType,
  generateSpecificType,
  parseMongooseSchema
}