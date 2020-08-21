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
  const FragmentRelationMap: Record<string, string[]> = {};
  const EmptyFragmentMap: any = {};

  Object.entries(FragmentsInfoMap).forEach(([FragmentName, FragmentInfo]) => {
    Object.entries(FragmentInfo).forEach(([FragmentPartName, FragmentPartRel]) => {
      if (FragmentPartRel !== false && !FragmentRelationMap[`${FragmentName}${FragmentPartRel}Fragment`]) FragmentRelationMap[`${FragmentName}${FragmentPartRel}Fragment`] = [`${FragmentName}${FragmentPartName}Fragment`];
      else if (FragmentPartRel !== false) FragmentRelationMap[`${FragmentName}${FragmentPartRel}Fragment`].push(`${FragmentName}${FragmentPartName}Fragment`);
      if (FragmentPartRel === false)
        EmptyFragmentMap[`${FragmentName}${FragmentPartName}Fragment`] = false
    })
  });
  type FlattenedOp = { node: FragmentDefinitionNode | OperationDefinitionNode, fragments_used: string[], definition_str: string, definition_str_lines: string[] }
  type TExport = { nodename: string, source: string, fragments: string[], kind: string };
  const ExportedDefinitions: { operations: TExport[], fragments: TExport[] } = { fragments: [], operations: [] };
  const FlattenedOperationMap: { fragments: Record<string, FlattenedOp>, operations: Record<string, FlattenedOp> } = { fragments: {}, operations: {} };

  (OperationNodes.definitions as SelectionSetDefinitionNodes).forEach((Node: SelectionSetDefinitionNode) => {
    const FragmentsUsed: string[] = extractFragments(Node.selectionSet);
    const DefinitionStringLines = print(Node).split("\n");
    const DefinitionString = DefinitionStringLines.join("\n\t");
    const NodeName = (Node.name as NameNode).value
    if (Node.kind === "FragmentDefinition") {
      if (FragmentsUsed.length > 0)
        ExportedDefinitions.fragments.push({
          source: DefinitionString,
          fragments: FragmentsUsed,
          kind: Node.kind,
          nodename: NodeName
        })
      FlattenedOperationMap.fragments[NodeName] = {
        node: Node,
        fragments_used: FragmentsUsed,
        definition_str: DefinitionString,
        definition_str_lines: DefinitionStringLines
      };
    } else if (Node.kind === "OperationDefinition") {
      FlattenedOperationMap.operations[NodeName] = {
        node: Node,
        fragments_used: FragmentsUsed,
        definition_str: DefinitionString,
        definition_str_lines: DefinitionStringLines
      };
      ExportedDefinitions.operations.push(
        {
          source: DefinitionString,
          fragments: FragmentsUsed,
          kind: Node.kind,
          nodename: NodeName
        }
      )
    }
  });

  Object.entries(FragmentRelationMap).forEach(([DependancyFragment, DependentFragments]) => {
    const { node: Fragment, fragments_used: FragmentsUsed, definition_str: DefinitionString, definition_str_lines } = FlattenedOperationMap.fragments[DependancyFragment];
    if (DependentFragments.length === 1)
      OperationOutput += (FragmentsUsed.length === 0 ? `Operations.${DependancyFragment} = ` : `const ${DependancyFragment} = `) + `${importGql ? "gql" : ""}` + `\`\n\t${DefinitionString}\`;\n\n`;
    else {
      const FragmentTarget = (Fragment as FragmentDefinitionNode).typeCondition.name.value;
      const common_fields = definition_str_lines.slice(1, definition_str_lines.length - 1).join("\n");
      OperationOutput += `const ${DependancyFragment}CommonFields = \`\n${common_fields}\n\`\n`;
      DependentFragments.forEach(DependentFragment => {
        OperationOutput += (FragmentsUsed.length === 0 ? `Operations.${DependentFragment} = ` : `const ${DependentFragment} = `) + `${importGql ? "gql" : ""}` + `\`\nfragment ${DependentFragment} on ${FragmentTarget} {\n\t\${${DependancyFragment}CommonFields}\n}\`;\n\n`;
      })
    }
  });

  Object.values(ExportedDefinitions).forEach((Nodes) => {
    Nodes.reverse().forEach(Node => {
      OperationOutput += `\nOperations.${Node.nodename} = ${importGql ? "gql" : ""}\`\n\t${Node.kind === "OperationDefinition" ? Node.source : "${" + Node.nodename + "}"}\n${Node.fragments.reduce((acc, cur) => acc + (EmptyFragmentMap[cur] !== false ? `\t\${${"Operations." + cur}}\n` : ''), '')} \`;\n`
    });
  });
  return OperationOutput += module === "esm" ? "\nexport default Operations;" : "\nmodule.exports = Operations;";
}
