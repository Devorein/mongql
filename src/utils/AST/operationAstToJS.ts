import { DocumentNode, print, NameNode, FragmentDefinitionNode, OperationDefinitionNode } from "graphql";
import extractFragments from "./extractFragments";
import { ModuleEnumType, TFragmentInfoMap } from "../../types";

type SelectionSetDefinitionNode = FragmentDefinitionNode | OperationDefinitionNode;
type SelectionSetDefinitionNodes = SelectionSetDefinitionNode[];

/**
 * Converts A documentnode full of Operations to javascript string
 * @param OperationNodes DocumentNode containing Operation and Fragments
 * @param module Module System to convert to
 */
export default function operationAstToJS(OperationNodes: DocumentNode, FragmentsInfoMap: TFragmentInfoMap, module: ModuleEnumType): string {
  let OperationOutput = 'const Operations = {};\n';
  const EmptyFragmentMap: any = {};
  const FlattenedFragmentsInfoMap: any = {};


  Object.entries(FragmentsInfoMap).forEach(([FragmentName, FragmentInfo]) => {
    Object.entries(FragmentInfo).forEach(([FragmentPartName, FragmentPartRel]) => {
      if (FragmentPartRel === false)
        EmptyFragmentMap[`${FragmentName}${FragmentPartName}`] = false
      FlattenedFragmentsInfoMap[`${FragmentName}${FragmentPartName}Fragment`] = FragmentPartRel !== false ? FragmentName + FragmentPartRel : FragmentPartRel;
    })
  });

  const ExportedDefinitions: Record<string, { source: string, fragments: string[], kind: string }>[] = [{}, {}];
  (OperationNodes.definitions as SelectionSetDefinitionNodes).forEach((Node: SelectionSetDefinitionNode) => {
    const FragmentsUsed: string[] = extractFragments(Node.selectionSet);
    const DefinitionString = print(Node).split("\n").join("\n\t");
    const NodeName = (Node.name as NameNode).value;
    if (Node.kind === "FragmentDefinition") {
      if (FragmentsUsed.length > 0)
        ExportedDefinitions[0][NodeName] = {
          source: DefinitionString,
          fragments: FragmentsUsed,
          kind: Node.kind
        }
      const mapped_fragment = FlattenedFragmentsInfoMap[NodeName];
      if (mapped_fragment) {
        const same_fragment = mapped_fragment + "Fragment" === NodeName;
        const contains_nested_fragments = FragmentsUsed.length === 0;
        OperationOutput += (contains_nested_fragments ? `Operations.${NodeName} = ` : `const ${NodeName} = `) + (same_fragment ? `\`\n\t${DefinitionString}\`;\n\n` : `${contains_nested_fragments ? "Operations." : ""}${mapped_fragment}Fragment;\n\n`);
      }
    }
    else if (Node.kind === "OperationDefinition") {
      ExportedDefinitions[1][NodeName] = {
        source: DefinitionString,
        fragments: FragmentsUsed,
        kind: Node.kind
      }
    }
  });

  ExportedDefinitions.forEach((Definitions) => {
    Object.entries(Definitions).forEach(([DefinitionName, DefinitionInfo]) => {
      OperationOutput += `\nOperations.${DefinitionName} = \`\n\t${DefinitionInfo.kind === "OperationDefinition" ? DefinitionInfo.source : "${" + DefinitionName + "}"}\n${DefinitionInfo.fragments.reduce((acc, cur) => acc + `\t\${${"Operations." + cur}}\n`, '')} \`;\n`
    });
  })

  return OperationOutput += module === "esm" ? "\nexport default Operations;" : "\nmodule.exports = Operations;";
}
