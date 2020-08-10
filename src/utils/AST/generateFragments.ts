import { TSchemaInfo } from '../../types';
import { FragmentDefinitionNode, SelectionNode, print } from 'graphql';
import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import S from "voca";

export function createFragment(name: string, selections: SelectionNode[]): FragmentDefinitionNode {
  return {
    kind: 'FragmentDefinition',
    name:
    {
      kind: 'Name',
      value: name.replace('Object', 'Fragment')
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

export default function generateFragments(SchemaInfo: TSchemaInfo): FragmentDefinitionNode[] {
  const FragmentDefinitionNodes: FragmentDefinitionNode[] = [];
  SchemaInfo.Types.objects.reverse().forEach((Objects) => {
    Object.entries(Objects).forEach(([ObjectKey, ObjectValue]) => {
      const selections: SelectionNode[] = Object.entries(ObjectValue.fields).reduce(
        (acc, [field, value]) =>
          acc.concat(
            value.generic_type.match(/(ref|object)/)
              ? createSelectionSet(field, [createFragmentSpread(S.capitalize(value.auth) + value.object_type + 'Fragment')])
              : createSelections(field)
          ),
        [] as any[]
      );
      FragmentDefinitionNodes.push(createFragment(ObjectKey, selections));
    });
  });
  return FragmentDefinitionNodes;
}
