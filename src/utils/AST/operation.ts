import { SelectionNode, OperationDefinitionNode, OperationTypeNode, FieldNode, FragmentSpreadNode, ArgumentNode, VariableDefinitionNode } from "graphql";

/**
 * Create a SelectionNode used in fragment
 * @param name Name of Selections
 * @param selection_arguments Selection Arguments
 */
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

/**
 * Creates a fragmentSpread Node
 * @param value Name of the fragment Spread
 */
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

/**
 * Creates a SelectionSet node
 * @param name Name of the Fragment Selection Set
 * @param selections Selections of the fragment
 * @param selection_arguments Arguments of the fragment
 */
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

/**
 * Creates an OperationNode
 * @param value Name of the Operation
 * @param operation Type of the Operation
 * @param selections Selections OF the Operation
 * @param variableDefinitions Variables of the Operation
 */
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

/**
 * Creates an argumentNode used inside query and mutation
 * @param value Name of the Argument
 */
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