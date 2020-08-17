import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode, FieldDefinitionNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { getNestedType } from '.';
import { TParsedSchemaInfo, MutableDocumentNode } from '../../types';
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
 * Generate auto and custom Fragments from DocumentNode 
 * @param InitTypedefsAST DocumentNode to generate fragments from
 * @param SchemaInfo Parsed Schemainfo for generating custom fragments
 */
export function generateFragments(OperationNodes: MutableDocumentNode, InitTypedefsAST: DocumentNode, SchemasInfo: Record<string, TParsedSchemaInfo>): Record<string, string[]> {
  const DocumentNodeTypes: any = {
    objects: {},
    inputs: {},
    interfaces: {},
    unions: {},
    enums: {},
    scalars: {
      String: true, Boolean: true, Int: true, Float: true, ID: true
    }
  };

  const GeneratedFragmentsMap: Record<string, string[]> = {}

  const RefsNodeMap: any = {};

  InitTypedefsAST.definitions.forEach(DefinitionNode => {
    if (DefinitionNode.kind === "ObjectTypeDefinition") DocumentNodeTypes.objects[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "EnumTypeDefinition") DocumentNodeTypes.enums[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "InputObjectTypeDefinition") DocumentNodeTypes.inputs[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "InterfaceTypeDefinition") DocumentNodeTypes.interfaces[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "UnionTypeDefinition") DocumentNodeTypes.unions[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "ScalarTypeDefinition") DocumentNodeTypes.scalars[DefinitionNode.name.value] = true;
  });

  function generateObjectFragments(FragmentName: string, ObjTypeDef: ObjectTypeDefinitionNode, part: string) {
    if (!GeneratedFragmentsMap[FragmentName]) GeneratedFragmentsMap[FragmentName] = [];
    GeneratedFragmentsMap[FragmentName].push(part);
    const selections = (ObjTypeDef.fields as FieldDefinitionNode[]).reduce(
      (acc, FieldDefinition) => {
        const FieldType = getNestedType(FieldDefinition.type);
        const isScalar = (DocumentNodeTypes.enums[FieldType] || DocumentNodeTypes.scalars[FieldType]) === true;
        const FragmentSpread = FieldType + part + 'Fragment';
        let Selection = null;
        if (isScalar) Selection = createSelections(FieldDefinition.name.value);
        else if (part === "RefsNone" && RefsNodeMap[FieldType] !== true)
          Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FragmentSpread)]);
        else if (part === "ScalarsOnly") Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FieldType + "ObjectsNoneFragment")]);
        return Selection !== null ? acc.concat(
          Selection
        ) : acc;
      },
      [] as any[]
    );

    OperationNodes.definitions.push(createFragment(FragmentName + part + "Fragment", ObjTypeDef.name.value, selections));
  }

  Object.keys(SchemasInfo).forEach((ResourceName) => {
    ['Mixed', 'Self', 'Others'].forEach(auth => {
      RefsNodeMap[auth + ResourceName + "Object"] = true;
    });
  })

  Object.values(SchemasInfo).forEach((SchemaInfo) => {
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
              const FragmentSpread = FieldInfo.generic_type.match(/(object|ref)/) ? decorateTypes(S.capitalize(includedAuthSegment) + FieldInfo.object_type + "Object", FieldInfo.nullable.object[includedAuthSegment]) : FieldInfo.decorated_types.object[includedAuthSegment]
              AuthObjectTypes[includedAuthSegment].createField({ name: FragmentSelection, type: FragmentSpread as string });
            })
          });

          Object.entries(AuthObjectTypes).forEach(([AuthObjectType, AuthObjectValue]) => {
            generateObjectFragments(S.capitalize(AuthObjectType) + SchemaName + "Object", AuthObjectValue.node, FragmentName)
          })
        });
      })
    });
  })

  InitTypedefsAST.definitions.forEach((Node) => {
    if (Node.kind === "ObjectTypeDefinition" && Node.fields && (!Node.name.value.match(/(Query|Mutation)/)))
      ['RefsNone', 'ObjectsNone', 'ScalarsOnly'].forEach(FragmentPart => {
        generateObjectFragments(Node.name.value, Node, FragmentPart)
      })
  })
  return GeneratedFragmentsMap;
}
