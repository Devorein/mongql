import { FragmentDefinitionNode, SelectionNode, DocumentNode, ObjectTypeDefinitionNode, FieldDefinitionNode, FieldNode } from 'graphql';

import { createSelections, createFragmentSpread, createSelectionSet } from './operation';
import { getNestedType } from '.';
import { TParsedSchemaInfo, MutableDocumentNode, TFragmentInfoMap } from '../../types';
import { capitalize } from '../../utils';
import flattenDocumentNode from './flattenDocumentNode';

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

export function createField(field_name: string): FieldNode {
  return {
    kind: "Field",
    name: {
      kind: "Name",
      value: field_name
    },
    arguments: [],
    directives: []
  }
}
/**
 * Generate auto and custom Fragments from DocumentNode 
 * @param InitTypedefsAST DocumentNode to generate fragments from
 * @param SchemaInfo Parsed Schemainfo for generating custom fragments
 */
export function generateFragments(OperationNodes: MutableDocumentNode, InitTypedefsAST: DocumentNode, SchemasInfo: Record<string, TParsedSchemaInfo>) {
  const FlattenedDocumentNode = flattenDocumentNode(InitTypedefsAST);
  const Scalars: any = {
    String: true,
    Boolean: true,
    ID: true,
    Float: true,
    Int: true
  };
  const RefsNodeMap: any = {};
  const FragmentsInfoMap: TFragmentInfoMap = {};
  const FieldInfoMap: any = {};

  // Generated and preadded types fragment generation
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
      const isScalar = Boolean(FlattenedDocumentNode?.EnumTypeDefinition?.[FieldType] || Scalars[FieldType] || FlattenedDocumentNode?.ScalarTypeDefinition[FieldType]);
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

  // Custom fragment generation
  Object.values(SchemasInfo).forEach((SchemaInfo) => {
    SchemaInfo.Schemas.forEach(Schemas => {
      Object.entries(Schemas).forEach(([SchemaName, SchemaInfo]) => {
        if (!FieldInfoMap[SchemaName]) FieldInfoMap[SchemaName] = {};
        Object.entries(SchemaInfo.fields).forEach(([fieldName, fieldInfo]) => {
          FieldInfoMap[SchemaName][fieldName] = fieldInfo;
        });
        Object.entries(SchemaInfo.Fragments).forEach(([FragmentName, FragmentSelections]) => {
          const CustomFragmentsMap: Record<string, FragmentDefinitionNode> = {};
          FragmentSelections.forEach((FragmentSelection) => {
            const FieldName = Array.isArray(FragmentSelection) ? FragmentSelection[0] : FragmentSelection;
            const FieldFragmentName = Array.isArray(FragmentSelection) ? FragmentSelection[1] : FragmentName;
            const FieldInfo = SchemaInfo.fields[FieldName];
            if (!FieldInfo) throw new Error(`Field ${FragmentSelection} doesn't exist on Schema ${SchemaName}.`)
            FieldInfo.includedAuthSegments.forEach(includedAuthSegment => {
              const FragmentObjectName = capitalize(includedAuthSegment) + SchemaName + "Object";
              if (!FragmentsInfoMap[FragmentObjectName]) FragmentsInfoMap[FragmentObjectName] = {};
              FragmentsInfoMap[FragmentObjectName][FragmentName] = FragmentName;
              if (!CustomFragmentsMap[includedAuthSegment])
                CustomFragmentsMap[includedAuthSegment] = createFragment(capitalize(includedAuthSegment) + SchemaName + "Object" + FragmentName + "Fragment", FragmentObjectName, []);
              (CustomFragmentsMap[includedAuthSegment].selectionSet.selections as SelectionNode[]).push(FieldInfo.generic_type.match(/(object|ref)/) ? createSelectionSet(FieldName, [createFragmentSpread(capitalize(includedAuthSegment) + FieldInfo.object_type + "Object" + FieldFragmentName + "Fragment")]) : createField(FragmentSelection as string))
            });
          });
          Object.values(CustomFragmentsMap).forEach((CustomGeneratedFragmentNode) => {
            OperationNodes.definitions.push(CustomGeneratedFragmentNode);
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
