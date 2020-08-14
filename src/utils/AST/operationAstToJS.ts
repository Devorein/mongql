import { DocumentNode, print, NameNode, FragmentDefinitionNode, OperationDefinitionNode } from "graphql";
import extractFragments from "./extractFragments";
import { ModuleEnumType } from "../../types";

type SelectionSetDefinitionNode = FragmentDefinitionNode | OperationDefinitionNode;
type SelectionSetDefinitionNodes = SelectionSetDefinitionNode[];

export default function operationAstToJS(OperationNodes: DocumentNode, module: ModuleEnumType): string {
  let res = '';
  const Operations: string[] = [];
  (OperationNodes.definitions as SelectionSetDefinitionNodes).forEach((Node: SelectionSetDefinitionNode) => {
    const FragmentsUsed: string[] = extractFragments(Node.selectionSet);
    const startcode = module === "esm" ? 'export const ' : 'Operations.'
    res += `\n${startcode}${(Node.name as NameNode).value} = gql\`\n\t${print(Node).split("\n").join("\n\t")}\n${FragmentsUsed.reduce((acc, cur) => acc + "\t${" + (module === "cjs" ? "Operations." : "") + cur + "}\n", '')}\`;\n`;
    Operations.push((Node.name as NameNode).value);
  });
  return res;
}