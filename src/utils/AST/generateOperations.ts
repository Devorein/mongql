import S from "voca";
import { ObjectTypeExtensionNode, OperationTypeNode } from "graphql";

import { createSelections, detectScalarity, getNestedType, createOperation, createVariableDefAndArguments, createSelectionSet, createFragmentSpread } from "./index";
import { MutableDocumentNode, TParsedSchemaInfo } from "../../types";

/**
 * Creates OperationDefinitions from a given ObjectTypeExtension node fields
 * @param TypeExt Object Type to extract fields from
 * @param operation The name of the Operation
 * @param OperationNodes OperationNode to add OperationDefinition to
 * @param DocumentNode DocumentNode used to detect scalarity
 */
export default function (OperationNodes: MutableDocumentNode, DocumentNode: MutableDocumentNode, SchemaInfo: TParsedSchemaInfo) {
  const { Fragments } = Object.values(SchemaInfo.Schemas[0])[0];
  const BaseSchemaFragments = Object.keys(Fragments);

  (['query', 'mutation'] as OperationTypeNode[]).forEach(operation => {
    const TypeExt = DocumentNode.definitions.find(definition => definition.kind === "ObjectTypeExtension" && definition.name.value === S.capitalize(operation)) as ObjectTypeExtensionNode;
    if (TypeExt && TypeExt.fields)
      TypeExt.fields.forEach(FieldDefinition => {
        const { name, arguments: FieldDefinitonArgs, type } = FieldDefinition;
        const GeneratedNode = SchemaInfo.Operations.includes(name.value);
        const FieldDefinitonType = getNestedType(type);
        const Parts = name.value.endsWith("Count") ? [''] : GeneratedNode ? ['RefsWhole', ...BaseSchemaFragments] : ['RefsWhole'];
        Parts.forEach(part => {
          const OperationName = name.value + part;
          if (FieldDefinitonArgs && FieldDefinitonArgs.length !== 0) {
            const { VariableDefinitions, ArgumentNodes } = createVariableDefAndArguments(FieldDefinitonArgs.map(FieldDefinitonArg => ({ name: FieldDefinitonArg.name.value, type: FieldDefinitonArg.type })));
            OperationNodes.definitions.push(createOperation(
              S.capitalize(OperationName), operation, detectScalarity(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`, ArgumentNodes)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType + part + "Fragment")], ArgumentNodes)], VariableDefinitions,
            ));
          } else
            OperationNodes.definitions.push(createOperation(
              S.capitalize(OperationName), operation, detectScalarity(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType + part + "Fragment")])],
            ));
        })
      });
  })
}