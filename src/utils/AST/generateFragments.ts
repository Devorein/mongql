import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode, DefinitionNode, FieldDefinitionNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { detectScalarity, getNestedType } from '.';
import { MutableDocumentNode, ISchemaInfo } from '../../types';

export function createFragment(name: string, part: string, selections: SelectionNode[]): FragmentDefinitionNode {
  return {
    kind: 'FragmentDefinition',
    name:
    {
      kind: 'Name',
      value: name + part + 'Fragment'
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

function generateObjectFragments(ObjTypeDef: ObjectTypeDefinitionNode, InitTypedefsAST: DocumentNode, part: string) {
  const selections = (ObjTypeDef.fields as FieldDefinitionNode[]).reduce(
    (acc, FieldDefinition) => {
      const FieldType = getNestedType(FieldDefinition.type);
      const isScalar = detectScalarity(FieldType, InitTypedefsAST as MutableDocumentNode);
      let Selection = null;
      if (!isScalar && part !== "RefsNone") Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(part === "RefsNameAndId" ? "NameAndId" : FieldType + part + 'Fragment')]);
      else if (isScalar) Selection = createSelections(FieldDefinition.name.value)
      return Selection !== null ? acc.concat(
        Selection
      ) : acc;
    },
    [] as any[]
  );

  return createFragment(ObjTypeDef.name.value, part, selections);
}


export default function generateFragments(InitTypedefsAST: DocumentNode, SchemaInfo: ISchemaInfo): FragmentDefinitionNode[] {
  const FragmentDefinitionNodes: FragmentDefinitionNode[] = [];
  const TransformedSchemaInfoTypes: Record<string, Record<string, DefinitionNode>> = {};

  Object.entries(SchemaInfo.Types).forEach(([key, value]) => {
    TransformedSchemaInfoTypes[key] = {};
    value.forEach((val: any) => {
      Object.entries(val).forEach(([_key, _val]: [string, any]) => {
        TransformedSchemaInfoTypes[key][_key] = _val.node
      })
    })
  });

  (InitTypedefsAST.definitions.filter(Node => Node.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode[]).forEach((ObjTypeDef) => {
    const isGenerated = Boolean(TransformedSchemaInfoTypes.objects[ObjTypeDef.name.value]);
    if (ObjTypeDef.fields)
      isGenerated ? FragmentDefinitionNodes.push(...['RefsWhole', 'RefsNone', 'RefsNameAndId'].reduce((acc, part) =>
        acc.concat(generateObjectFragments(ObjTypeDef, InitTypedefsAST, part)), [] as any[])) : FragmentDefinitionNodes.push(generateObjectFragments(ObjTypeDef, InitTypedefsAST, ''));
  })
  return FragmentDefinitionNodes;
}
