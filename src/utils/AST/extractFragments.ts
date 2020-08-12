import { SelectionSetNode } from "graphql";

export default function extractFragments(SelectionSet: SelectionSetNode): string[] {
  const FragmentsUsed: Record<string, number> = {};
  function extract(SelectionSet: SelectionSetNode) {
    SelectionSet.selections.forEach((Field) => {
      if (Field.kind === "Field" && Field.selectionSet) extract(Field.selectionSet);
      else if (Field.kind === "FragmentSpread") {
        const FragmentName = Field.name.value;
        if (FragmentsUsed[FragmentName]) FragmentsUsed[FragmentName] = 1;
        else FragmentsUsed[FragmentName]++;
      }
    })
  }
  extract(SelectionSet);

  return Object.keys(FragmentsUsed);
}