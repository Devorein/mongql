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

export default function (schema: IMongqlMongooseSchemaFull, InitTypedefsAST: DocumentNode | undefined) {
  const OperationNodes: MutableDocumentNode = {
    kind: "Document",
    definitions: []
  };
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(schema, InitTypedefsAST);
  OperationNodes.definitions.push(...generateFragments(DocumentAST, SchemaInfo));
  generateQueryTypedefs(schema, DocumentAST, OperationNodes);
  generateMutationTypedefs(schema, DocumentAST, OperationNodes);
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