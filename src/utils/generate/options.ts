import { IMongqlGenerateOptions } from "../../types";

const Query: IMongqlGenerateOptions = { options: {}, fields: [] },
  Mutation: IMongqlGenerateOptions = { options: {}, fields: [] },
  Type: IMongqlGenerateOptions = { options: {}, fields: [] };

['all', 'paginated', 'filtered', 'id'].forEach((range) => {
  Query.options[range] = {};
  ['self', 'others', 'mixed'].forEach((auth) => {
    Query.options[range][auth] = {};
    const parts = range.match(/(id|paginated)/) ? ['whole', 'nameandid'] : ['whole', 'nameandid', 'count'];
    parts.forEach((part) => {
      Query.options[range][auth][part] = true;
      Query.fields.push(`${range}.${auth}.${part}`);
    });
  });
});

['interface', 'object', 'input', 'enum'].forEach((type) => {
  Type.options[type] = {};
  if (type === 'object')
    ['self', 'others', 'mixed'].forEach(auth => {
      Type.options[type][auth] = true;
      Type.fields.push(`${type}.${auth}`);
    })
  else if (type === 'input')
    ['create', 'update'].forEach(action => {
      Type.options[type][action] = true;
      Type.fields.push(`${type}.${action}`);
    })
  else Type.options[type] = true;
});

['create', 'update', 'delete'].forEach((action) => {
  Mutation.options[action] = {};
  ['single', 'multi'].forEach((part) => {
    Mutation.options[action][part] = true;
    Mutation.fields.push(`${action}.${part}`);
  });
});

const GenerateOptions = {
  query: Query,
  type: Type,
  mutation: Mutation,
};

export default GenerateOptions;
