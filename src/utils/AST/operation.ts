import { SelectionNode, OperationDefinitionNode, OperationTypeNode, FieldNode, FragmentSpreadNode, ArgumentNode, VariableDefinitionNode } from "graphql";

export function createSelections(name: string, selection_arguments?: ArgumentNode[]): FieldNode {
  return {
    kind: "Field",
    "name": {
      "kind": "Name",
      "value": name,
    },
    "arguments": selection_arguments || [],
    "directives": [],
  }
}

export function createFragmentSpread(value: string): FragmentSpreadNode {
  return {
    kind: "FragmentSpread",
    name: {
      kind: "Name",
      value
    },
    directives: []
  }
}

export function createSelectionSet(name: string, selections: SelectionNode[], selection_arguments?: ArgumentNode[]): FieldNode {
  return {
    kind: "Field",
    "name": {
      "kind": "Name",
      "value": name,
    },
    "arguments": selection_arguments || [],
    "directives": [],
    selectionSet: {
      kind: "SelectionSet",
      selections
    }
  }
}

export function createOperation(value: string, operation: OperationTypeNode, selections: SelectionNode[], variableDefinitions?: VariableDefinitionNode[]): OperationDefinitionNode {
  return {
    kind: 'OperationDefinition',
    operation,
    name: {
      kind: 'Name',
      value
    },
    variableDefinitions,
    directives: [],
    selectionSet: {
      kind: "SelectionSet",
      selections
    }
  }
}

export function createArgument(value: string): ArgumentNode {
  return {
    kind: "Argument",
    name: {
      kind: "Name",
      value
    },
    value: {
      kind: "Variable",
      name: {
        kind: "Name",
        value
      }
    }
  }
}