import pluralize from 'pluralize';
import { capitalize } from '../utils';
import { t, documentApi, objectExtApi, ObjectExtApi } from 'graphql-extra';

import { RangeEnumString, AuthEnumString, PartEnumString, MutableDocumentNode, IMongqlBaseSchemaConfigsFull, TParsedSchemaInfo } from "../types";

const ArgumentMap: Record<string, any[]> = {
  paginated: [
    {
      name: 'pagination',
      type: 'PaginationInput!',
      description: 'An input consisting of skip,limit,filter and sort'
    }
  ],
  all: [],
  filtered: [
    {
      name: 'filter',
      type: 'JSON',
      description: 'An input for filtering using JSON syntax'
    }
  ],
  id: [
    {
      name: 'id',
      type: 'ID!',
      description: 'An input selecting resource by id'
    }
  ]
};

/**
 * Generates query typedefs from a mongoose schema
 * 1. Merges the Intital Mutation typedefs given via GlobalConfig or from the schema
 * 2. Checks the generate.query options to figure out what needs to be generated
 * 3. Generates based on range, auth and part
 * @param Schema Schema to generate query typedefs from
 * @param TypedefAST Initital or Previous DocumentNode to merge to Final AST
 */

export default function (SchemaInfo: TParsedSchemaInfo, TypedefAST: MutableDocumentNode) {
  const ast = documentApi().addSDL(TypedefAST);
  const doesQueryExtExists = ast.hasExt('Query');
  const { resource: r, generate: { query }, operationNameMapper = {} } = Object.values(SchemaInfo.Schemas[0])[0] as IMongqlBaseSchemaConfigsFull;
  const cr = capitalize(r);
  const cpr = pluralize(cr, 2);
  const QueryExt = doesQueryExtExists ? ast.getExt('Query') as ObjectExtApi : objectExtApi(
    t.objectExt({
      name: 'Query',
      fields: [],
      interfaces: [],
      directives: []
    })
  );

  const ranges = Object.keys(query);
  ranges.forEach((range) => {
    const auths = Object.keys(query[range as RangeEnumString]);
    auths.forEach((auth) => {
      const parts = Object.keys(query[range as RangeEnumString][auth as AuthEnumString]).filter((part) => query[range as RangeEnumString][auth as AuthEnumString][part as PartEnumString]);
      parts.forEach((part) => {
        let output = range === "paginated" ? `${capitalize(auth)}${cr}PaginationObject!` : `${capitalize(auth)}${cr}Object!`;
        output = !range.match(/(id|paginated)/) ? `[${output}]!` : output;
        if (part === 'count') output = 'NonNegativeInt!';
        const QueryName = `get${capitalize(range)}${capitalize(auth)}${cpr}${capitalize(part)}`;
        const Arguments = ArgumentMap[range as RangeEnumString]
        QueryExt.createField({
          name: operationNameMapper[QueryName] || QueryName,
          type: output,
          description: `Get ${range} ${auth} ${r} ${part}`,
          arguments: Arguments
        });
        SchemaInfo.Operations.push(QueryName);
      });
    });
  });

  if (QueryExt.getFields().length > 0 && !doesQueryExtExists) TypedefAST.definitions.push(QueryExt.node);
}
