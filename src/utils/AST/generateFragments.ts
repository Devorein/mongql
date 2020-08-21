import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode, FieldDefinitionNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { getNestedType } from '.';
import { TParsedSchemaInfo, MutableDocumentNode } from '../../types';
import { objectTypeApi, ObjectTypeApi } from 'graphql-extra';
import { t } from 'graphql-extra';
import { capitalize } from '../../utils';
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
export function generateFragments(OperationNodes: MutableDocumentNode, InitTypedefsAST: DocumentNode, SchemasInfo: Record<string, TParsedSchemaInfo>) {
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

  const RefsNodeMap: any = {};
  const FragmentsInfoMap: Record<string, { [k: string]: string | boolean }> = {};
  const FieldInfoMap: any = {};

  InitTypedefsAST.definitions.forEach(DefinitionNode => {
    if (DefinitionNode.kind === "ObjectTypeDefinition") DocumentNodeTypes.objects[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "EnumTypeDefinition") DocumentNodeTypes.enums[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "InputObjectTypeDefinition") DocumentNodeTypes.inputs[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "InterfaceTypeDefinition") DocumentNodeTypes.interfaces[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "UnionTypeDefinition") DocumentNodeTypes.unions[DefinitionNode.name.value] = true;
    else if (DefinitionNode.kind === "ScalarTypeDefinition") DocumentNodeTypes.scalars[DefinitionNode.name.value] = true;
  });


  function generateCustomFragments(FragmentName: string, ObjTypeDef: ObjectTypeDefinitionNode, part: string) {
    part = capitalize(part);
    if (!FragmentsInfoMap[FragmentName]) FragmentsInfoMap[FragmentName] = {};
    FragmentsInfoMap[FragmentName][part] = part;
    const selections = (ObjTypeDef.fields as FieldDefinitionNode[]).reduce(
      (acc, FieldDefinition) => {
        const FieldType = getNestedType(FieldDefinition.type);
        const isScalar = (DocumentNodeTypes.enums[FieldType] || DocumentNodeTypes.scalars[FieldType]) === true;
        const FragmentSpread = FieldType + part + 'Fragment';
        let Selection = null;
        if (isScalar) Selection = createSelections(FieldDefinition.name.value);
        else Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FragmentSpread)]);
        return Selection !== null ? acc.concat(
          Selection
        ) : acc;
      },
      [] as any[]
    );

    OperationNodes.definitions.push(createFragment(FragmentName + part + "Fragment", ObjTypeDef.name.value, selections));
  }

  function generateObjectFragments(FragmentName: string, ObjTypeDef: ObjectTypeDefinitionNode, parts: string[]) {
    if (!FragmentsInfoMap[FragmentName]) FragmentsInfoMap[FragmentName] = {};
    FragmentsInfoMap[FragmentName].RefsNone = 'RefsNone';
    FragmentsInfoMap[FragmentName].ObjectsNone = 'ObjectsNone';
    FragmentsInfoMap[FragmentName].ScalarsOnly = 'ScalarsOnly';
    const SchemaName = FragmentName.replace('Object', '').replace(/(Self|Mixed|Others)/, '');
    const FieldMap: Record<string, { FieldType: string, FieldVariant: string }> = {};
    let containsScalar = false, containsRef = false, containsObject = false;
    ObjTypeDef.fields?.forEach(FieldDefinition => {
      const FieldType = getNestedType(FieldDefinition.type);
      const isScalar = (DocumentNodeTypes.enums[FieldType] || DocumentNodeTypes.scalars[FieldType]) === true;
      if (isScalar) containsScalar = true;
      else if (RefsNodeMap[FieldType]) containsRef = true;
      else containsObject = true;
      FieldMap[FieldDefinition.name.value] = {
        FieldType,
        FieldVariant: isScalar ? "Scalar" : RefsNodeMap[FieldType] ? 'Ref' : 'Object'
      }
    });

    const ConditionStr = (containsScalar ? "1" : "0") + (containsObject ? "1" : "0") + (containsRef ? "1" : "0");

    switch (ConditionStr) {
      case "101":
        FragmentsInfoMap[FragmentName].RefsNone = 'ObjectsNone';
        FragmentsInfoMap[FragmentName].ObjectsNone = 'ObjectsNone';
        break;
      case "100":
        FragmentsInfoMap[FragmentName].RefsNone = 'ObjectsNone'
        FragmentsInfoMap[FragmentName].ObjectsNone = 'ObjectsNone'
        FragmentsInfoMap[FragmentName].ScalarsOnly = 'ObjectsNone'
        break;
      case "011":
        FragmentsInfoMap[FragmentName].ObjectsNone = false;
        break;
      case "001":
        FragmentsInfoMap[FragmentName].ObjectsNone = false;
        FragmentsInfoMap[FragmentName].RefsNone = false;
        break;
      case "010":
        FragmentsInfoMap[FragmentName].ObjectsNone = false
        break;
    }
    parts.forEach(part => {
      const selections = (ObjTypeDef.fields as FieldDefinitionNode[]).reduce(
        (acc, FieldDefinition) => {
          const FieldInfo = FieldInfoMap[SchemaName]?.[FieldDefinition.name.value];
          const { FieldType, FieldVariant } = FieldMap[FieldDefinition.name.value];
          const isScalar = FieldVariant === "Scalar";
          const FragmentSpread = FieldType + part + 'Fragment';
          let Selection = null;
          if (isScalar) Selection = createSelections(FieldDefinition.name.value);
          else if (part === "RefsNone" && !RefsNodeMap[FieldType])
            Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FragmentSpread)]);
          else if (part === "ScalarsOnly") Selection = createSelectionSet(FieldDefinition.name.value, [createFragmentSpread(FieldType + "ObjectsNoneFragment")]);
          return FieldInfo === undefined || FieldInfo?.attach?.fragment && Selection !== null ? acc.concat(
            Selection
          ) : acc;
        },
        [] as any[]
      );

      OperationNodes.definitions.push(createFragment(FragmentName + part + "Fragment", ObjTypeDef.name.value, selections));
    })
  }

  Object.keys(SchemasInfo).forEach((ResourceName) => {
    ['Mixed', 'Self', 'Others'].forEach(auth => {
      RefsNodeMap[auth + ResourceName + "Object"] = true;
    });
  });

  Object.values(SchemasInfo).forEach((SchemaInfo) => {
    SchemaInfo.Schemas.forEach(Schemas => {
      Object.entries(Schemas).forEach(([SchemaName, SchemaInfo]) => {
        if (!FieldInfoMap[SchemaName]) FieldInfoMap[SchemaName] = {};
        Object.entries(SchemaInfo.fields).forEach(([fieldName, fieldInfo]) => {
          FieldInfoMap[SchemaName][fieldName] = fieldInfo;
        });
        Object.entries(SchemaInfo.Fragments).forEach(([FragmentName, FragmentSelections]) => {
          const AuthObjectTypes: Record<string, ObjectTypeApi> = {};
          FragmentSelections.forEach(FragmentSelection => {
            const FieldInfo = SchemaInfo.fields[FragmentSelection];
            if (!FieldInfo) throw new Error(`Field ${FragmentSelection} doesn't exist on Schema ${SchemaName}.`)
            FieldInfo.includedAuthSegments.forEach(includedAuthSegment => {
              if (!AuthObjectTypes[includedAuthSegment])
                AuthObjectTypes[includedAuthSegment] = objectTypeApi(t.objectType({
                  name: capitalize(includedAuthSegment) + SchemaName + "Object",
                  description: ``,
                  fields: [],
                  interfaces: []
                }));
              const FragmentSpread = FieldInfo.generic_type.match(/(object|ref)/) ? decorateTypes(capitalize(includedAuthSegment) + FieldInfo.object_type + "Object", FieldInfo.nullable.object[includedAuthSegment]) : FieldInfo.decorated_types.object[includedAuthSegment]
              AuthObjectTypes[includedAuthSegment].createField({ name: FragmentSelection, type: FragmentSpread as string });
            })
          });

          Object.entries(AuthObjectTypes).forEach(([AuthObjectType, AuthObjectValue]) => {
            generateCustomFragments(capitalize(AuthObjectType) + SchemaName + "Object", AuthObjectValue.node, FragmentName)
          })
        });
      })
    });
  })

  InitTypedefsAST.definitions.forEach((Node) => {
    if (Node.kind === "ObjectTypeDefinition" && Node.fields && (!Node.name.value.match(/(Query|Mutation)/)))
      generateObjectFragments(Node.name.value, Node, ['RefsNone', 'ObjectsNone', 'ScalarsOnly'])
  })
  return FragmentsInfoMap;
}
