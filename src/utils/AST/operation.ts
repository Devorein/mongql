import { SelectionNode, OperationDefinitionNode, OperationTypeNode, FieldNode } from "graphql";

export function createSelections(name: string) {
  return {
    kind: "Field",
    "name": {
      "kind": "Name",
      "value": name,
    },
    "arguments": [],
    "directives": [],
  } as FieldNode
}

export function createSelectionSet(name: string, selections: SelectionNode[]) {
  return {
    kind: "Field",
    "name": {
      "kind": "Name",
      "value": name,
    },
    "arguments": [],
    "directives": [],
    selectionSet: {
      kind: "SelectionSet",
      selections
    }
  } as FieldNode
}

export function createOperation(name: string, operation: OperationTypeNode, selections: SelectionNode[]): OperationDefinitionNode {
  return {
    kind: 'OperationDefinition',
    operation,
    name: {
      kind: 'Name',
      value: name
    },
    variableDefinitions: [],
    directives: [],
    selectionSet: {
      kind: "SelectionSet",
      selections
    }
  }
}