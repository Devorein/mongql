import { MongqlMongooseSchema } from "../types";

import generateQueryTypedefs from './query';
import generateMutationTypedefs from './mutation';
import { parseMongooseSchema } from './type';
import { DocumentNode } from "graphql";

export default async function (schema: MongqlMongooseSchema, InitTypedefsAST: DocumentNode) {
  const { SchemaInfo, DocumentAST } = parseMongooseSchema(schema, InitTypedefsAST);
  generateQueryTypedefs(schema, DocumentAST);
  generateMutationTypedefs(schema, DocumentAST);
  return { typedefsAST: DocumentAST, SchemaInfo };
};

export * from "./query"
export * from "./mutation"
export * from "./type"
