import { DocumentNode, print, NameNode, FragmentDefinitionNode, OperationDefinitionNode } from "graphql";
import extractFragments from "./extractFragments";
import { TFragmentInfoMap, JSExportConfigFull } from "../../types";

type SelectionSetDefinitionNode = FragmentDefinitionNode | OperationDefinitionNode;
type SelectionSetDefinitionNodes = SelectionSetDefinitionNode[];

/**
 * Converts A documentnode full of Operations to javascript string
 * @param OperationNodes DocumentNode containing Operation and Fragments
 * @param module Module System to convert to
 */
export default function operationAstToJS(OperationNodes: DocumentNode, FragmentsInfoMap: TFragmentInfoMap, export_configs: JSExportConfigFull): string {
  const { module, importGql } = export_configs;
  let OperationOutput = '';
  if (importGql) {
    if (module === "esm") OperationOutput += "import gql from \"graphql-tag\";\n"
    else if (module === "cjs") OperationOutput += "const gql = require(\"graphql-tag\");\n"
  }

  OperationOutput += `const Operations = {};\n`
  const EmptyFragmentMap: any = {};
  const FlattenedFragmentsInfoMap: any = {};
  const GeneratedFragmentsMap: any = {};
  const DependentFragments: { dependency: string, dependents: string[] }[] = [];

  Object.entries(FragmentsInfoMap).forEach(([FragmentName, FragmentInfo]) => {
    Object.entries(FragmentInfo).forEach(([FragmentPartName, FragmentPartRel]) => {
      if (FragmentPartRel === false)
        EmptyFragmentMap[`${FragmentName}${FragmentPartName}Fragment`] = false
      FlattenedFragmentsInfoMap[`${FragmentName}${FragmentPartName}Fragment`] = FragmentPartRel !== false ? FragmentName + FragmentPartRel : FragmentPartRel;
    })
  });
  type TExport = { nodename: string, source: string, fragments: string[], kind: string };
  const ExportedDefinitions: { operations: TExport[], fragments: TExport[] } = { fragments: [], operations: [] };
  (OperationNodes.definitions as SelectionSetDefinitionNodes).reverse().forEach((Node: SelectionSetDefinitionNode) => {
    const FragmentsUsed: string[] = extractFragments(Node.selectionSet);
    const DefinitionString = print(Node).split("\n").join("\n\t");
    const NodeName = (Node.name as NameNode).value;
    if (Node.kind === "FragmentDefinition") {
      if (FragmentsUsed.length > 0)
        ExportedDefinitions.fragments.push({
          source: DefinitionString,
          fragments: FragmentsUsed,
          kind: Node.kind,
          nodename: NodeName
        })
      const mapped_fragment = FlattenedFragmentsInfoMap[NodeName];
      if (mapped_fragment) {
        const same_fragment = mapped_fragment + "Fragment" === NodeName;
        const contains_nested_fragments = FragmentsUsed.length === 0;
        let GeneratedCode = (contains_nested_fragments ? `Operations.${NodeName} = ` : `const ${NodeName} = `) + `${importGql ? "gql" : ""}`;
        if (same_fragment) {
          GeneratedFragmentsMap[NodeName] = true;
          GeneratedCode += `\`\n\t${DefinitionString}\`;\n\n`;
          OperationOutput += GeneratedCode;
        }
        else {
          const isDependencyGenerated = Boolean(GeneratedFragmentsMap[mapped_fragment]);
          if (!isDependencyGenerated)
            DependentFragments.push({ dependency: mapped_fragment + "Fragment", dependents: [NodeName] });
          else {
            GeneratedFragmentsMap[NodeName] = true;
            GeneratedCode += `${contains_nested_fragments ? "Operations." : ""}${mapped_fragment}Fragment;\n\n`;
            OperationOutput += GeneratedCode;
          }
        }
      }
    }
    else if (Node.kind === "OperationDefinition")
      ExportedDefinitions.operations.push(
        {
          source: DefinitionString,
          fragments: FragmentsUsed,
          kind: Node.kind,
          nodename: NodeName
        }
      )
  });

  DependentFragments.forEach(({ dependency, dependents }) => {
    dependents.forEach(dependent => {
      OperationOutput += `Operations.${dependent} = Operations.${dependency};\n\n`
    })
  });

  Object.values(ExportedDefinitions).forEach((Nodes) => {
    Nodes.forEach(Node => {
      OperationOutput += `\nOperations.${Node.nodename} = ${importGql ? "gql" : ""}\`\n\t${Node.kind === "OperationDefinition" ? Node.source : "${" + Node.nodename + "}"}\n${Node.fragments.reduce((acc, cur) => acc + (EmptyFragmentMap[cur] !== false ? `\t\${${"Operations." + cur}}\n` : ''), '')} \`;\n`
    });
  });
  return OperationOutput += module === "esm" ? "\nexport default Operations;" : "\nmodule.exports = Operations;";
}
