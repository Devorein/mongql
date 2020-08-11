import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { isScalar, getNestedType } from '.';
import { MutableDocumentNode } from '../../types';

export function createFragment(name: string, selections: SelectionNode[]): FragmentDefinitionNode {
  return {
    kind: 'FragmentDefinition',
    name:
    {
      kind: 'Name',
      value: name + 'Fragment'
    },
    typeCondition:
    {
      kind: 'NamedType',
      name:
      {
        kind: 'Name',
        value: name
      }
    },
    directives: [],
    selectionSet:
    {
      kind: 'SelectionSet',
      selections
    }
  };
}

export default function generateFragments(InitTypedefsAST: DocumentNode): FragmentDefinitionNode[] {
  const FragmentDefinitionNodes: FragmentDefinitionNode[] = [];
  (InitTypedefsAST.definitions.filter(Node => Node.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode[]).forEach((ObjTypeDef) => {
    let selections: SelectionNode[] = [];
    if (ObjTypeDef.fields)

      selections = ObjTypeDef.fields.reduce(
        (acc, FieldDefinition) => {
          const FieldType = getNestedType(FieldDefinition.type);
          return acc.concat(
            !isScalar(FieldType, InitTypedefsAST as MutableDocumentNode)
              ? createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FieldType + 'Fragment')])
              : createSelections(FieldDefinition.name.value)
          )
        },
        [] as any[]
      );
    FragmentDefinitionNodes.push(createFragment(ObjTypeDef.name.value, selections));
  })
  return FragmentDefinitionNodes;
}
