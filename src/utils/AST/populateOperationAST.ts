import S from "voca";
import { ObjectTypeExtensionNode, OperationTypeNode } from "graphql";

import { createSelections, detectScalarity, getNestedType, createOperation, createVariableDefAndArguments, createSelectionSet, createFragmentSpread } from "./index";
import { MutableDocumentNode } from "../../types";

export default function populateOperationAST(TypeExt: ObjectTypeExtensionNode, operation: OperationTypeNode, OperationNodes: MutableDocumentNode, DocumentNode: MutableDocumentNode) {
  if (TypeExt.fields)
    TypeExt.fields.forEach(FieldDefinition => {
      const { name, arguments: FieldDefinitonArgs, type } = FieldDefinition;
      const FieldDefinitonType = getNestedType(type);
      if (FieldDefinitonArgs && FieldDefinitonArgs.length !== 0) {
        const { VariableDefinitions, ArgumentNodes } = createVariableDefAndArguments(FieldDefinitonArgs.map(FieldDefinitonArg => ({ name: FieldDefinitonArg.name.value, type: FieldDefinitonArg.type })));
        OperationNodes.definitions.push(createOperation(
          S.capitalize(`${name.value}`), operation, detectScalarity(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`, ArgumentNodes)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType + "Fragment")], ArgumentNodes)], VariableDefinitions,
        ));
      } else
        OperationNodes.definitions.push(createOperation(
          S.capitalize(`${name.value}`), operation, detectScalarity(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType + "Fragment")])],
        ));
    });
}