import { DocumentNode, DefinitionNode } from "graphql";

export default function (InitDocumentNode: DocumentNode): Record<string, DefinitionNode> {
  const FlattenedDocumentNode: any = {};
  InitDocumentNode.definitions.forEach(definition => {
    if (definition.kind !== "SchemaDefinition" && definition.kind !== "SchemaExtension" && definition.name)
      FlattenedDocumentNode[definition.name.value] = definition;
  })
  return FlattenedDocumentNode;
}