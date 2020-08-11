import S from "voca";
import { ObjectTypeExtensionNode, OperationTypeNode } from "graphql";

import { createSelections, isScalar, getNestedType, createOperation, createVariableDefAndArguments, createSelectionSet, createFragmentSpread } from "./index";
import { MutableDocumentNode } from "../../types";

export default function populateOperationAST(TypeExt: ObjectTypeExtensionNode, operation: OperationTypeNode, OperationNodes: MutableDocumentNode, DocumentNode: MutableDocumentNode) {
  if (TypeExt.fields)
    TypeExt.fields.forEach(FieldDefinition => {
      const { name, arguments: FieldDefinitonArgs, type } = FieldDefinition;
      const FieldDefinitonType = getNestedType(type);
      if (FieldDefinitonArgs && FieldDefinitonArgs.length !== 0) {
        const { VariableDefinitions, ArgumentNodes } = createVariableDefAndArguments(FieldDefinitonArgs);
        OperationNodes.definitions.push(createOperation(
          S.capitalize(`${name.value}`), operation, isScalar(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`, ArgumentNodes)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType)], ArgumentNodes)], VariableDefinitions,
        ));
      } else
        OperationNodes.definitions.push(createOperation(
          S.capitalize(`${name.value}`), operation, isScalar(FieldDefinitonType, DocumentNode) ? [createSelections(`${name.value}`)] : [createSelectionSet(`${name.value}`, [createFragmentSpread(FieldDefinitonType)])],
        ));
    });
}