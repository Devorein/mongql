import { DocumentNode, DefinitionNode } from "graphql";

export default function (InitDocumentNode: DocumentNode): Record<string, Record<string, DefinitionNode>> {
  const FlattenedDocumentNode: Record<string, Record<string, DefinitionNode>> = {};
  const Fragments: string[] = []
  InitDocumentNode.definitions.forEach(definition => {
    if (definition.kind !== "SchemaDefinition" && definition.kind !== "SchemaExtension" && definition.name) {
      if (definition.kind === "FragmentDefinition")
        Fragments.push(definition.name.value);
      if (!FlattenedDocumentNode[definition.kind]) FlattenedDocumentNode[definition.kind] = {};
      FlattenedDocumentNode[definition.kind][definition.name.value] = definition;
    }
  })
  // console.log(Object.keys(FlattenedDocumentNode.FragmentDefinition))

  return FlattenedDocumentNode;
}