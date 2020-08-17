import { TypeNode, NamedTypeNode, DocumentNode } from "graphql/language/ast";
import { variableDefinitionNode } from 'graphql-extra';
import { typeDefs } from 'graphql-scalars';

const Scalars = typeDefs.map(scalar => scalar.split(" ")[1]).concat(["Password", "Username", "String", "Int", "Float", "Boolean", "ID"]);

import convertToDocumentNodes from "./convertToDocumentNodes";
import { createArgument } from "./operation";

import generateOperations from "./generateOperations";
import operationAstToJS from "./operationAstToJS";

export * from "./transformASTToString";
export * from "./operation";
export * from "./generateFragments";
export * from "./sortAST";

export function getNestedType(Type: TypeNode) {
  let currentNode = Type;
  while (currentNode.kind !== 'NamedType') currentNode = currentNode.type;
  return (currentNode as NamedTypeNode).name.value;
}

export function createVariableDefAndArguments(Arguments: readonly any[]) {
  return {
    VariableDefinitions: Arguments.reduce((acc, { name, type }) => acc.concat(variableDefinitionNode({ variable: name, type })), [] as any[]),
    ArgumentNodes: Arguments.reduce((acc, { name }) => acc.concat(createArgument(name)), [] as any[])
  }
}

export function detectScalarity(TypeName: string, DocumentNodes: DocumentNode) {
  return Scalars.includes(TypeName) || TypeName.includes("Enum") || DocumentNodes.definitions.find((Node) => Node.kind === "EnumTypeDefinition" && Node.name.value === TypeName);
}

export {
  convertToDocumentNodes,
  generateOperations,
  operationAstToJS
}