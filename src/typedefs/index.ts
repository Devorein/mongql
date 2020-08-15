import { IMongqlMongooseSchemaFull, MutableDocumentNode } from "../types";

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
import generateFragments from "../utils/AST/generateFragments";

export default function (Schema: IMongqlMongooseSchemaFull, InitTypedefsAST: DocumentNode | undefined, OperationNodes: MutableDocumentNode) {
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(Schema, InitTypedefsAST);
  OperationNodes.definitions.push(...generateFragments(DocumentAST, SchemaInfo));
  generateQueryTypedefs(SchemaInfo, DocumentAST, OperationNodes);
  generateMutationTypedefs(SchemaInfo, DocumentAST, OperationNodes);
  return { typedefsAST: DocumentAST as MutableDocumentNode, SchemaInfo, OperationNodes };
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