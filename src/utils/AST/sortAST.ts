import { DefinitionNode, TypeDefinitionNode, TypeExtensionNode, InterfaceTypeDefinitionNode, InterfaceTypeExtensionNode, ObjectTypeExtensionNode, ObjectTypeDefinitionNode, FieldDefinitionNode, EnumTypeDefinitionNode, EnumValueDefinitionNode, UnionTypeDefinitionNode, NamedTypeNode } from "graphql";

export function sortNodes(DefinitionNodes: DefinitionNode[]) {
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

type FieldTypes = InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode | InterfaceTypeExtensionNode | ObjectTypeExtensionNode;

export function sortFields(DefinitionNodes: DefinitionNode[]) {
  return DefinitionNodes.map(DefinitionNode => {
    if (DefinitionNode.kind.match(/(Object|Interface)/) && (DefinitionNode as FieldTypes).fields) ((DefinitionNode as FieldTypes).fields as FieldDefinitionNode[]) = ((DefinitionNode as FieldTypes).fields as FieldDefinitionNode[]).sort((fieldA, fieldB) => fieldA.name.value.charCodeAt(0) - fieldB.name.value.charCodeAt(0))
    else if (DefinitionNode.kind.match(/(Enum)/) && (DefinitionNode as EnumTypeDefinitionNode).values) ((DefinitionNode as EnumTypeDefinitionNode).values as EnumValueDefinitionNode[]) = ((DefinitionNode as EnumTypeDefinitionNode).values as EnumValueDefinitionNode[]).sort((fieldA, fieldB) => fieldA.name.value.charCodeAt(0) - fieldB.name.value.charCodeAt(0))
    else if (DefinitionNode.kind.match(/(Union)/) && (DefinitionNode as UnionTypeDefinitionNode).types) ((DefinitionNode as UnionTypeDefinitionNode).types as NamedTypeNode[]) = ((DefinitionNode as UnionTypeDefinitionNode).types as NamedTypeNode[]).sort((fieldA, fieldB) => fieldA.name.value.charCodeAt(0) - fieldB.name.value.charCodeAt(0));
    return DefinitionNode;
  })
}