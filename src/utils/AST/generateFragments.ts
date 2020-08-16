import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode, FieldDefinitionNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { detectScalarity, getNestedType } from '.';
import { MutableDocumentNode, TParsedSchemaInfo, FragmentPartEnum } from '../../types';
import { objectTypeApi, ObjectTypeApi } from 'graphql-extra';
import { t } from 'graphql-extra';
import S from "voca";
import { decorateTypes } from '../../typedefs/index';

/**
 * Creates a fragment node
 * @param fragmentname Fragment Name
 * @param objectname Name of the object that this fragment in on
 * @param selections Selection node of the fragment
 */
export function createFragment(fragmentname: string, objectname: undefined | string, selections: SelectionNode[]): FragmentDefinitionNode {
  return {
    kind: 'FragmentDefinition',
    name:
    {
      kind: 'Name',
      value: fragmentname
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

/**
 * 
 * @param FragmentName Name of the fragment
 * @param ObjTypeDef Object to extract field from
 * @param InitTypedefsAST Initial DocumentNode for scalar detection
 * @param part Part of fragment to produce
 */
function generateObjectFragments(FragmentName: string, ObjTypeDef: ObjectTypeDefinitionNode, InitTypedefsAST: DocumentNode, part: '' | FragmentPartEnum) {
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

  return createFragment(FragmentName + part + "Fragment", ObjTypeDef.name.value, selections);
}

export function generateSchemaFragments(InitTypedefsAST: DocumentNode, SchemaInfo: TParsedSchemaInfo, FragmentDefinitionNodes: FragmentDefinitionNode[]) {
  // Generating Custom Fragments from schema
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
            const FragmentSpread = FieldInfo.generic_type.match(/(object|ref)/) ? decorateTypes(S.capitalize(includedAuthSegment) + FieldInfo.object_type + "Object" + FragmentName, FieldInfo.nullable.object[includedAuthSegment]) : FieldInfo.decorated_types.object[includedAuthSegment]
            AuthObjectTypes[includedAuthSegment].createField({ name: FragmentSelection, type: FragmentSpread as string });
          })
        });

        Object.entries(AuthObjectTypes).forEach(([AuthObjectType, AuthObjectValue]) => {
          FragmentDefinitionNodes.push(generateObjectFragments(S.capitalize(AuthObjectType) + SchemaName + "Object" + FragmentName, AuthObjectValue.node, InitTypedefsAST, ''))
        })
      });
    })
  });
}

/**
 * Generate auto and custom Fragments from DocumentNode 
 * @param InitTypedefsAST DocumentNode to generate fragments from
 * @param SchemaInfo Parsed Schemainfo for generating custom fragments
 */
export function generateFragments(InitTypedefsAST: DocumentNode, SchemaInfo?: TParsedSchemaInfo): FragmentDefinitionNode[] {
  const FragmentDefinitionNodes: FragmentDefinitionNode[] = [];
  if (SchemaInfo)
    generateSchemaFragments(InitTypedefsAST, SchemaInfo, FragmentDefinitionNodes);
  InitTypedefsAST.definitions.forEach((Node) => {
    if (Node.kind === "ObjectTypeDefinition" && Node.fields)
      FragmentDefinitionNodes.push(...['RefsNone'].reduce((acc, part) =>
        acc.concat(generateObjectFragments(Node.name.value, Node, InitTypedefsAST, part as FragmentPartEnum)), [] as any[]))
  })
  return FragmentDefinitionNodes;
}
