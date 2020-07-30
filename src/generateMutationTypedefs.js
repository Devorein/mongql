const pluralize = require('pluralize');
const S = require('voca');
const { t, documentApi, objectExtApi } = require('graphql-extra');

const ArgumentMap = {
  'create.single': ({ r, cr }) => [
    {
      name: `data`,
      type: `Create${cr}Input!`,
      description: `input to create single ${r}`
    }
  ],
  'create.multi': ({ pr, cr }) => [
    {
      name: `data`,
      type: `[Create${cr}Input!]!`,
      description: `input to create multiple ${pr}`
    }
  ],
  'update.single': ({ r, pr, cr }) => [
    {
      name: `data`,
      type: `Update${cr}Input!`,
      description: `input to update single ${pr}`
    },
    {
      name: 'id',
      type: 'ID!',
      description: `id of the single ${r} to update`
    }
  ],
  'update.multi': ({ pr, cr }) => [
    {
      name: `data`,
      type: `[Update${cr}Input!]!`,
      description: `input to update multiple ${pr}`
    },
    {
      name: 'ids',
      type: '[ID!]!',
      description: `ids of the multiple ${pr} to update`
    }
  ],
  'delete.single': ({ r }) => [
    {
      name: `id`,
      type: `ID!`,
      description: `id of the single ${r} to delete`
    }
  ],
  'delete.multi': ({ pr }) => [
    {
      name: `ids`,
      type: `[ID!]!`,
      description: `ids of the multiple ${pr} to delete`
    }
  ]
};

module.exports = function (Schema, TypedefAST) {
  const { mongql: { resource: r, generate: { mutation } } } = Schema;
  const ast = documentApi().addSDL(TypedefAST);
  const doesMutationExtExists = ast.hasExt('Mutation');
  const cr = S.capitalize(r);
  const pr = pluralize(r, 2);
  const cpr = pluralize(cr, 2);
  const actions = Object.keys(mutation);
  const MutationExt = doesMutationExtExists ? ast.getExt('Mutation') : objectExtApi(
    t.objectExt({
      name: 'Mutation',
      description: `${cr} Mutation`,
      directives: [],
      interfaces: [],
      fields: []
    }));

  actions.forEach((action) => {
    const parts = Object.keys(mutation[action]).filter((part) => mutation[action][part]);
    parts.forEach((part) => {
      if (part === 'single')
        MutationExt.createField({
          name: `${action}${cr}`,
          type: `Self${cr}Object!`,
          description: `${S.capitalize(action)} single ${r}`,
          arguments: ArgumentMap[`${action}.${part}`]({ r, pr, cr, cpr })
        });
      else if (part === 'multi')
        MutationExt.createField({
          name: `${action}${cpr}`,
          type: `[Self${cr}Object!]!`,
          description: `${S.capitalize(action)} multiple ${r}`,
          arguments: ArgumentMap[`${action}.${part}`]({ r, pr, cr, cpr })
        });
    });
  });
  if (MutationExt.getFields().length && !doesMutationExtExists) TypedefAST.definitions.push(MutationExt.node);
};
