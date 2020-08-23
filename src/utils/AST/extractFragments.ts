import { SelectionSetNode, OperationDefinitionNode, FragmentDefinitionNode, DocumentNode, print } from "graphql";
import flattenDocumentNode from "./flattenDocumentNode";
import { MutableDocumentNode } from "../../types";

/**
 * Captures all the fragments included in a selection set
 * @param SelectionSet SelectionSet to look for 
 */
export function extractFragments(SelectionSet: SelectionSetNode): string[] {
  const FragmentsUsed: Record<string, number> = {};
  function extract(SelectionSet: SelectionSetNode) {
    SelectionSet.selections.forEach((Field) => {
      if (Field?.kind === "Field" && Field.selectionSet) extract(Field.selectionSet);
      else if (Field?.kind === "FragmentSpread") {
        const FragmentName = Field.name.value;
        if (!FragmentsUsed[FragmentName]) FragmentsUsed[FragmentName] = 1;
        else FragmentsUsed[FragmentName]++;
      }
    })
  }
  extract(SelectionSet);
  return Object.keys(FragmentsUsed);
}

export function extractFragmentChain(DocNode: DocumentNode, OpNode: OperationDefinitionNode): FragmentDefinitionNode[] {
  const AllFragmentsUsed: FragmentDefinitionNode[] = [];
  const FlattenedDocumentNode = flattenDocumentNode(DocNode);
  function traverse(OpNode: OperationDefinitionNode | FragmentDefinitionNode) {
    const FragmentsUsed = extractFragments(OpNode.selectionSet);
    FragmentsUsed.forEach(FragmentUsed => {
      const InnerFragmentsUsed = extractFragments((FlattenedDocumentNode.FragmentDefinition[FragmentUsed] as FragmentDefinitionNode).selectionSet);
      if (InnerFragmentsUsed.length > 0) traverse(FlattenedDocumentNode.FragmentDefinition[FragmentUsed] as FragmentDefinitionNode);
      AllFragmentsUsed.push(FlattenedDocumentNode.FragmentDefinition[FragmentUsed] as FragmentDefinitionNode);
    })
  }
  traverse(OpNode);
  return AllFragmentsUsed
}

export function extractFragmentChainAndCreateOperation(DocNode: DocumentNode, OpNode: OperationDefinitionNode, convertToString = false): DocumentNode | string {
  const OperationNode: MutableDocumentNode = {
    kind: "Document",
    definitions: [OpNode]
  };
  OperationNode.definitions.push(...extractFragmentChain(DocNode, OpNode));
  return convertToString ? print(OperationNode) : OperationNode;
}