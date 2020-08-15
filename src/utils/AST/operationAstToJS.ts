import { DocumentNode, print, NameNode, FragmentDefinitionNode, OperationDefinitionNode } from "graphql";
import extractFragments from "./extractFragments";
import { ModuleEnumType } from "../../types";

type SelectionSetDefinitionNode = FragmentDefinitionNode | OperationDefinitionNode;
type SelectionSetDefinitionNodes = SelectionSetDefinitionNode[];

/**
 * Converts A documentnode full of Operations to javascript string
 * @param OperationNodes DocumentNode containing Operation and Fragments
 * @param module Module System to convert to
 */
export default function operationAstToJS(OperationNodes: DocumentNode, module: ModuleEnumType): string {
  let OperationOutput = 'const Operations = {};\n';
  const ExportedDefinitions: Record<string, { source: string, fragments: string[] }>[] = [{}, {}];
  (OperationNodes.definitions as SelectionSetDefinitionNodes).forEach((Node: SelectionSetDefinitionNode) => {
    const FragmentsUsed: string[] = extractFragments(Node.selectionSet);
    const DefinitionString = print(Node).split("\n").join("\n\t");
    const NodeName = (Node.name as NameNode).value;
    if (Node.kind === "FragmentDefinition") {
      if (FragmentsUsed.length > 0)
        ExportedDefinitions[0][NodeName] = {
          source: DefinitionString,
          fragments: FragmentsUsed
        }
      OperationOutput += `const ${NodeName} = \`\n\t${DefinitionString}\`;\n\n${FragmentsUsed.length > 0 ? "" : `Operations.${NodeName} = ${NodeName};\n\n`}`;
    }
    else if (Node.kind === "OperationDefinition") {
      ExportedDefinitions[1][NodeName] = {
        source: DefinitionString,
        fragments: FragmentsUsed
      }
    }
  });

  ExportedDefinitions.forEach(Definitions => {
    Object.entries(Definitions).forEach(([DefinitionName, DefinitionInfo]) => {
      OperationOutput += `\nOperations.${DefinitionName} = \`\n\t${DefinitionInfo.source}\n${DefinitionInfo.fragments.reduce((acc, cur) => acc + `\t\${${cur}}`, '')}\n\`\n`
    });
  })

  return OperationOutput += module === "esm" ? "\nexport default Operations;" : "\nmodule.exports = Operations;";
}
