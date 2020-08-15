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
import { generateFragments, generateOperations } from "../utils/AST";

export default function (Schema: IMongqlMongooseSchemaFull, InitTypedefsAST: DocumentNode | undefined, OperationNodes: MutableDocumentNode) {
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(Schema, InitTypedefsAST);
  OperationNodes.definitions.push(...generateFragments(DocumentAST, SchemaInfo));
  generateQueryFields(SchemaInfo, DocumentAST);
  generateMutationFields(SchemaInfo, DocumentAST);
  generateOperations(OperationNodes, DocumentAST, SchemaInfo);

  return { typedefsAST: DocumentAST as MutableDocumentNode, SchemaInfo, OperationNodes };
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