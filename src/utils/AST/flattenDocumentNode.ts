import { DocumentNode, DefinitionNode } from "graphql";

export default function (InitDocumentNode: DocumentNode): Record<string, Record<string, DefinitionNode>> {
  const FlattenedDocumentNode: Record<string, Record<string, DefinitionNode>> = {};
  InitDocumentNode.definitions.forEach(definition => {
    if (definition.kind !== "SchemaDefinition" && definition.kind !== "SchemaExtension" && definition.name) {
      if (!FlattenedDocumentNode[definition.kind]) FlattenedDocumentNode[definition.kind] = {};
      FlattenedDocumentNode[definition.kind][definition.name.value] = definition;
    }
  })
  return FlattenedDocumentNode;
}