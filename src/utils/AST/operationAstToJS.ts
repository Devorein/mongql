import { DocumentNode, print, NameNode, FragmentDefinitionNode, OperationDefinitionNode } from "graphql";
import extractFragments from "./extractFragments";

type SelectionSetDefinitionNode = FragmentDefinitionNode | OperationDefinitionNode;
type SelectionSetDefinitionNodes = SelectionSetDefinitionNode[];

export default function operationAstToJS(OperationNodes: DocumentNode): string {
  let res = '';
  const Operations: string[] = [];
  (OperationNodes.definitions as SelectionSetDefinitionNodes).forEach((Node: SelectionSetDefinitionNode) => {
    const FragmentsUsed: string[] = extractFragments(Node.selectionSet);
    res += `\nexport const ${(Node.name as NameNode).value} = gql\`\n\t${print(Node).split("\n").join("\n\t")}\n${FragmentsUsed.reduce((acc, cur) => acc + "\t${" + cur + "}\n", '')}\`;\n`;
    Operations.push((Node.name as NameNode).value);
  });
  return res;
}