import { TypeNode, NamedTypeNode, InputValueDefinitionNode } from "graphql/language/ast";
import { variableDefinitionNode } from 'graphql-extra';

import convertToDocumentNodes from "./convertToDocumentNodes";
import { createArgument } from "./operation";

import populateOperationAST from "./populateOperationAST";

export * from "./transformASTToString";
export * from "./operation";
export * from "./generateFragments";

export function getNestedType(Type: TypeNode) {
  let currentNode = Type;
  while (currentNode.kind !== 'NamedType') currentNode = currentNode.type;
  return (currentNode as NamedTypeNode).name.value;
}

export function createVariableDefAndArguments(Arguments: readonly InputValueDefinitionNode[]) {
  return {
    VariableDefinitions: Arguments.reduce((acc, { name, type }) => acc.concat(variableDefinitionNode({ variable: name.value, type })), [] as any[]),
    ArgumentNodes: Arguments.reduce((acc, { name }) => acc.concat(createArgument(name.value)), [] as any[])
  }
}

export function isScalar(TypeName: string) {
  return TypeName.match(/(String|Int|Float|Boolean|ID)/) !== null;
}

export {
  convertToDocumentNodes,
  populateOperationAST
}