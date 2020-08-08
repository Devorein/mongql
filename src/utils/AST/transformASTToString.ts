import { TypeNode, InputValueDefinitionNode, NonNullTypeNode, ListTypeNode, NamedTypeNode, EnumValueDefinitionNode } from 'graphql/language/ast';
import { IMongqlTypeNode } from "../../types";

/**
 * Traverses a typenode and extracts necessary information as an array
 * @param type Typenode to traverse
 * @returns extracted info object
 */
function traverseType(type: TypeNode): IMongqlTypeNode[] {
  const types = [];
  function _wrapper(ast: TypeNode) {
    const { kind } = ast;
    if (kind !== 'NamedType') types.push(_wrapper((ast as (ListTypeNode | NonNullTypeNode)).type));
    return { type, kind, name: (ast as NamedTypeNode)?.name?.value };
  }
  types.push(_wrapper(type));
  return types;
}

/**
 * Convert generated Typenode array to string
 * @param typenodes Convert generated Typenode array
 * @return String representation of type node
 */
function convertToString(typenodes: IMongqlTypeNode[]): string {
  const name = typenodes[0].name;
  let res = name;
  typenodes.forEach((typenode: IMongqlTypeNode) => {
    if (typenode.kind === 'NonNullType') res = `${res}!`;
    else if (typenode.kind === 'ListType') res = `[${res}]`;
  })
  return res;
}

/**
 * Converts argument nodes to string representation
 * @param argAst Argument node to convert to string
 * @return String representation of arguments
 */
export function argumentsToString(argAst: InputValueDefinitionNode[]) {
  const args: string[] = [];
  if (argAst)
    argAst.forEach((arg) => {
      const name = arg.name.value;
      const argStr = convertToString(traverseType(arg.type));
      args.push(`${name}:${argStr}`);
    });
  return args.join(',');
}

/**
 * Converts a typenode to string representation
 * @param outputAst Typenode to convert
 * @return String representation of type
 */
export function outputToString(outputAst: TypeNode) {
  return convertToString(traverseType(outputAst));
}


/**
 * Converts a enum value to string representation
 * @param enumValues Enum value nodes array
 * @return String representation of enum value
 */
export function enumToString(enumValues: EnumValueDefinitionNode[]) {
  return enumValues.reduce((acc: string[], node) => acc.concat(node.name.value), []).join(",");
}