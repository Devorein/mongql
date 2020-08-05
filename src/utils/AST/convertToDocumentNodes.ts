import { DocumentNode } from "graphql";
import gql from "graphql-tag";

export default function convertToDocumentNodes(TypeDefs: undefined | Record<string, string | DocumentNode>) {
  if (TypeDefs)
    Object.entries(TypeDefs).forEach(([key, typedef]) => {
      if (typeof typedef === 'string') TypeDefs[key] = gql(typedef);
    })
  return TypeDefs
}
