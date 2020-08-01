import { TypeNode, InputValueDefinitionNode, NonNullTypeNode, ListTypeNode, NamedTypeNode } from 'graphql/language/ast';
import { IMongqlTypeNode } from "../../types";

function traverseType(type: TypeNode): IMongqlTypeNode[] {
  const types = [];
  function _wrapper(ast: TypeNode) {
    const { kind } = ast;
    if (kind !== 'NamedType') types.push(_wrapper((ast as (ListTypeNode | NonNullTypeNode)).type));
    return { type, kind, name: (ast as NamedTypeNode).name.value };
  }
  types.push(_wrapper(type));
  return types;
}

function convertToString(args: IMongqlTypeNode[]): string {
  const name = args[0].name;
  let res = name;
  args.forEach((arg: IMongqlTypeNode) => {
    if (arg.kind === 'NonNullType') res = `${res}!`;
    else if (arg.kind === 'ListType') res = `[${res}]`;
  })
  return res;
}

export function argumentsToString(argAst: InputValueDefinitionNode[]) {
  const args: string[] = [];
  if (argAst)
    argAst.forEach((arg) => {
      let name = arg.name.value;
      const argStr = convertToString(traverseType(arg.type));
      args.push(`${name}:${argStr}`);
    });
  return args.join(',');
}

export function outputToString(outputAst: TypeNode) {
  return convertToString(traverseType(outputAst));
}
