import { DefinitionNode, TypeDefinitionNode, TypeExtensionNode } from "graphql";

export function sortDefinitions(DefinitionNodes: DefinitionNode[]) {
  return DefinitionNodes.sort((DefinitionNodeA, DefinitionNodeB) => {
    if (DefinitionNodeA.kind !== DefinitionNodeB.kind)
      return DefinitionNodeA.kind.charCodeAt(0) - DefinitionNodeB.kind.charCodeAt(0);
    else if (DefinitionNodeA.kind === "OperationDefinition" && DefinitionNodeB.kind === "OperationDefinition")
      return DefinitionNodeA.operation.charCodeAt(0) - DefinitionNodeB.operation.charCodeAt(0);
    else if ((DefinitionNodeA as TypeDefinitionNode | TypeExtensionNode).name && (DefinitionNodeB as TypeDefinitionNode | TypeExtensionNode).name)
      return (DefinitionNodeA as TypeDefinitionNode | TypeExtensionNode).name.value.charCodeAt(0) - (DefinitionNodeB as TypeDefinitionNode | TypeExtensionNode).name.value.charCodeAt(0);
    else return 0;
  });
}