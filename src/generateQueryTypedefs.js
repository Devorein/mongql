const pluralize = require('pluralize');
const S = require('voca');
const { t, documentApi, objectExtApi } = require('graphql-extra');

const ArgumentMap = {
  paginated: [
    {
      name: 'pagination',
      type: 'PaginationInput!',
      description: 'An input consisting of skip,limit,filter and sort'
    }
  ],
  nameandid: [],
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

module.exports = function (Schema, TypedefAST) {
  const ast = documentApi().addSDL(TypedefAST);
  const doesQueryExtExists = ast.hasExt('Query');
  const { mongql: { resource: r, generate: { query } } } = Schema;
  const cr = S.capitalize(r);
  const cpr = pluralize(cr, 2);
  const QueryExt = doesQueryExtExists ? ast.getExt('Query') : objectExtApi(
    t.objectExt({
      name: 'Query',
      description: `${cr} Queries`,
      fields: [],
      interfaces: [],
      directives: []
    })
  )

  const ranges = Object.keys(query);
  ranges.forEach((range) => {
    const auths = Object.keys(query[range]);
    auths.forEach((auth) => {
      const parts = Object.keys(query[range][auth]).filter((part) => query[range][auth][part]);
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
          arguments: ArgumentMap[`${range}`]
        });
      });
    });
  });
  if (QueryExt.getFields().length > 0 && !doesQueryExtExists) TypedefAST.definitions.push(QueryExt.node);

};
