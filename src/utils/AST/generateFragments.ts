import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode, FieldDefinitionNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { detectScalarity, getNestedType } from '.';
import { MutableDocumentNode, TParsedSchemaInfo, FieldFullInfo } from '../../types';
import { objectTypeApi, ObjectTypeApi } from 'graphql-extra';
import { t } from 'graphql-extra';
import S from "voca";

export function createFragment(fragmentname: string, objectname: undefined | string, part: string, selections: SelectionNode[]): FragmentDefinitionNode {
  return {
    kind: 'FragmentDefinition',
    name:
    {
      kind: 'Name',
      value: fragmentname + part + 'Fragment'
    },
    typeCondition:
    {
      kind: 'NamedType',
      name:
      {
        kind: 'Name',
        value: objectname ? objectname : fragmentname
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

function generateObjectFragments(FragmentName: string, ObjTypeDef: ObjectTypeDefinitionNode, InitTypedefsAST: DocumentNode, part: string) {
  const selections = (ObjTypeDef.fields as FieldDefinitionNode[]).reduce(
    (acc, FieldDefinition) => {
      const FieldType = getNestedType(FieldDefinition.type);
      const isScalar = detectScalarity(FieldType, InitTypedefsAST as MutableDocumentNode);
      const FragmentSpread = FieldType + part + 'Fragment';
      let Selection = null;
      if (!isScalar && part !== "RefsNone") Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FragmentSpread)]);
      else if (!isScalar && part === 'RefsOnly') Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FragmentSpread)]);
      else if (isScalar && part !== 'RefsOnly') Selection = createSelections(FieldDefinition.name.value);
      return Selection !== null ? acc.concat(
        Selection
      ) : acc;
    },
    [] as any[]
  );

  return createFragment(FragmentName, ObjTypeDef.name.value, part, selections);
}

export default function generateFragments(InitTypedefsAST: DocumentNode, SchemaInfo: TParsedSchemaInfo): FragmentDefinitionNode[] {
  const FragmentDefinitionNodes: FragmentDefinitionNode[] = [];
  const TransformedSchemaInfoTypes: Record<string, any> = {};

  Object.entries(SchemaInfo.Types).forEach(([TypeKey, TypeVal]) => {
    TransformedSchemaInfoTypes[TypeKey] = {};
    TypeVal.forEach((val: any) => {
      Object.entries(val).forEach(([fieldkey, fieldval]: [string, any]) => {
        TransformedSchemaInfoTypes[TypeKey][fieldkey] = { node: fieldval.node, fields: fieldval.fields }
      })
    })
  });

  SchemaInfo.Schemas.forEach(Schemas => {
    Object.entries(Schemas).forEach(([SchemaName, SchemaInfo]) => {
      Object.entries(SchemaInfo.Fragments).forEach(([FragmentName, FragmentSelections]) => {
        const AuthObjectTypes: Record<string, ObjectTypeApi> = {};
        FragmentSelections.forEach(FragmentSelection => {
          const FieldInfo = SchemaInfo.fields[FragmentSelection];
          FieldInfo.includedAuthSegments.forEach(includedAuthSegment => {
            if (!AuthObjectTypes[includedAuthSegment]) {
              AuthObjectTypes[includedAuthSegment] = objectTypeApi(t.objectType({
                name: S.capitalize(includedAuthSegment) + SchemaName + "Object",
                description: ``,
                fields: [],
                interfaces: []
              }));
            }
            AuthObjectTypes[includedAuthSegment].createField({ name: FragmentSelection, type: FieldInfo.decorated_types.object[includedAuthSegment] as string });
          })
        });

        Object.entries(AuthObjectTypes).forEach(([AuthObjectType, AuthObjectValue]) => {
          FragmentDefinitionNodes.push(generateObjectFragments(S.capitalize(AuthObjectType) + SchemaName + FragmentName, AuthObjectValue.node, InitTypedefsAST, ''))
        })
      });
    })
  });

  (InitTypedefsAST.definitions.filter(Node => Node.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode[]).forEach((ObjTypeDef) => {
    const GeneratedNode = TransformedSchemaInfoTypes.objects[ObjTypeDef.name.value];
    const hasRefs = GeneratedNode && Object.values(TransformedSchemaInfoTypes.objects[ObjTypeDef.name.value].fields).find((field) => (field as FieldFullInfo).ref_type)
    if (ObjTypeDef.fields)
      GeneratedNode ? FragmentDefinitionNodes.push(...(hasRefs ? ['RefsWhole', 'RefsNone', 'RefsNameAndId', 'RefsOnly'] : []).reduce((acc, part) =>
        acc.concat(generateObjectFragments(ObjTypeDef.name.value, ObjTypeDef, InitTypedefsAST, part)), [] as any[])) : FragmentDefinitionNodes.push(generateObjectFragments(ObjTypeDef.name.value, ObjTypeDef, InitTypedefsAST, ''));
  })
  return FragmentDefinitionNodes;
}
