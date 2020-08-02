import pluralize from 'pluralize';
import S from 'voca';
import { t, documentApi, objectExtApi, ObjectExtApi } from 'graphql-extra';

import { IMongqlMongooseSchemaFull, RangeEnumString, AuthEnumString, PartEnumString, MutableDocumentNode } from "../types";

const ArgumentMap = {
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

export default function (Schema: IMongqlMongooseSchemaFull, TypedefAST: MutableDocumentNode) {
  const ast = documentApi().addSDL(TypedefAST);
  const doesQueryExtExists = ast.hasExt('Query');
  const { mongql: { resource: r, generate: { query } } } = Schema;
  const cr = S.capitalize(r);
  const cpr = pluralize(cr, 2);
  const QueryExt = doesQueryExtExists ? ast.getExt('Query') as ObjectExtApi : objectExtApi(
    t.objectExt({
      name: 'Query',
      fields: [],
      interfaces: [],
      directives: []
    })
  )

  const ranges = Object.keys(query);
  ranges.forEach((range) => {
    const auths = Object.keys(query[range as RangeEnumString]);
    auths.forEach((auth) => {
      const parts = Object.keys(query[range as RangeEnumString][auth as AuthEnumString]).filter((part) => query[range as RangeEnumString][auth as AuthEnumString][part as PartEnumString]);
      parts.forEach((part) => {
        let output = `${S.capitalize(auth)}${cr}Object!`;
        output = range !== 'id' ? `[${output}]!` : output;
        if (part === 'nameandid') {
          if (range.match(/(paginated|filtered|all)/)) output = '[NameAndId!]!';
          else if (range === 'id') output = 'NameAndId!';
        }
        if (part === 'count') output = 'NonNegativeInt!';
        QueryExt.createField({
          name: `get${S.capitalize(range)}${S.capitalize(auth)}${cpr}${S.capitalize(part)}`,
          type: output,
          description: `Get ${range} ${auth} ${r} ${part}`,
          arguments: ArgumentMap[range as RangeEnumString]
        });
      });
    });
  });
  if (QueryExt.getFields().length > 0 && !doesQueryExtExists) TypedefAST.definitions.push(QueryExt.node);

};
