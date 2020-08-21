import { capitalize } from '../../utils';
import { ObjectTypeExtensionNode, OperationTypeNode } from "graphql";

import { createSelections, detectScalarity, getNestedType, createOperation, createVariableDefAndArguments, createSelectionSet, createFragmentSpread } from "./index";
import { MutableDocumentNode, TFragmentInfoMap } from "../../types";

/**
 * Creates OperationDefinitions from a given ObjectTypeExtension node fields
 * @param TypeExt Object Type to extract fields from
 * @param operation The name of the Operation
 * @param OperationNodes OperationNode to add OperationDefinition to
 * @param DocumentNode DocumentNode used to detect scalarity
 */
export default function (OperationNodes: MutableDocumentNode, DocumentNode: MutableDocumentNode, FragmentInfoMap: TFragmentInfoMap) {
  (['query', 'mutation'] as OperationTypeNode[]).forEach(operation => {
    const TypeExts = DocumentNode.definitions.filter(definition => definition.kind === "ObjectTypeExtension" && definition.name.value === capitalize(operation)) as ObjectTypeExtensionNode[];
    TypeExts.forEach(TypeExt => {
      if (TypeExt && TypeExt.fields)
        TypeExt.fields.forEach(Operation => {
          const { name, arguments: FieldDefinitonArgs, type } = Operation;
          const FieldDefinitonType = getNestedType(type);
          const Parts = FragmentInfoMap[FieldDefinitonType] ? Object.keys(FragmentInfoMap[FieldDefinitonType]) : [''];
          Parts.forEach(part => {
            const OperationName = name.value + (part !== '' ? "_" + part : '');
            if (FieldDefinitonArgs && FieldDefinitonArgs.length !== 0) {
              const { VariableDefinitions, ArgumentNodes } = createVariableDefAndArguments(FieldDefinitonArgs.map(FieldDefinitonArg => ({ name: FieldDefinitonArg.name.value, type: FieldDefinitonArg.type })));
              OperationNodes.definitions.push(createOperation(
                capitalize(OperationName), operation, detectScalarity(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`, ArgumentNodes)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType + part + "Fragment")], ArgumentNodes)], VariableDefinitions,
              ));
            } else
              OperationNodes.definitions.push(createOperation(
                capitalize(OperationName), operation, detectScalarity(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType + part + "Fragment")])],
              ));
          })
        });
    })
  })
}