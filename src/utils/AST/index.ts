import { TypeNode, NamedTypeNode, DocumentNode, ScalarTypeDefinitionNode, EnumTypeDefinitionNode } from "graphql/language/ast";
import { variableDefinitionNode } from 'graphql-extra';

import convertToDocumentNodes from "./convertToDocumentNodes";
import { createArgument } from "./operation";

import generateOperations from "./generateOperations";
import operationAstToJS from "./operationAstToJS";
import flattenDocumentNode from "./flattenDocumentNode";

type ScalarNode = EnumTypeDefinitionNode | ScalarTypeDefinitionNode;

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
  return TypeName.match(/(String|ID|Int|Boolean|Float)/) || DocumentNodes.definitions.find((Node) => Node.kind.match(/(EnumTypeDefinition|ScalarTypeDefinition)/) && (Node as ScalarNode).name.value === TypeName);
}

export {
  convertToDocumentNodes,
  generateOperations,
  operationAstToJS,
  flattenDocumentNode
}