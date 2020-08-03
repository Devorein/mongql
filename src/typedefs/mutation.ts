import { MutableDocumentNode, IMongqlMongooseSchemaFull, ActionEnumString, TargetEnumString } from "../types";

import pluralize from 'pluralize';
import S from 'voca';
import { t, documentApi, objectExtApi, ObjectExtApi } from 'graphql-extra';

interface ArgumentMapFnParam {
  r: string,
  cr: string,
  pr: string,
  cpr: string
}

const ArgumentMap = {
  create: {
    single: ({ r, cr }: ArgumentMapFnParam) => [
      {
        name: `data`,
        type: `Create${cr}Input!`,
        description: `input to create single ${r}`
      }
    ],
    multi: ({ pr, cr }: ArgumentMapFnParam) => [
      {
        name: `datas`,
        type: `[Create${cr}Input!]!`,
        description: `input to create multiple ${pr}`
      }
    ]
  },
  update: {
    single: ({ pr, cr }: ArgumentMapFnParam) => [
      {
        name: `data`,
        type: `Update${cr}Input!`,
        description: `input to update single ${pr}`
      },
    ],
    multi: ({ pr, cr }: ArgumentMapFnParam) => [
      {
        name: `datas`,
        type: `[Update${cr}Input!]!`,
        description: `input to update multiple ${pr}`
      },
    ]
  },
  delete: {
    single: ({ r }: ArgumentMapFnParam) => [
      {
        name: `id`,
        type: `ID!`,
        description: `id of the single ${r} to delete`
      }
    ],
    multi: ({ pr }: ArgumentMapFnParam) => [
      {
        name: `ids`,
        type: `[ID!]!`,
        description: `ids of the multiple ${pr} to delete`
      }
    ]
  }
};

export default function (Schema: IMongqlMongooseSchemaFull, TypedefAST: MutableDocumentNode) {
  const { mongql: { resource: r, generate: { mutation } } } = Schema;
  const ast = documentApi().addSDL(TypedefAST);
  const doesMutationExtExists = ast.hasExt('Mutation');
  const cr = S.capitalize(r);
  const pr = pluralize(r, 2);
  const cpr = pluralize(cr, 2);
  const actions = Object.keys(mutation);
  const MutationExt = doesMutationExtExists ? ast.getExt('Mutation') as ObjectExtApi : objectExtApi(
    t.objectExt({
      name: 'Mutation',
      directives: [],
      interfaces: [],
      fields: []
    }));

  actions.forEach((action) => {
    const targets = Object.keys(mutation[action as ActionEnumString]).filter((target) => mutation[action as ActionEnumString][target as TargetEnumString]);
    targets.forEach((target) => {
      if (target === 'single')
        MutationExt.createField({
          name: `${action}${cr}`,
          type: `Self${cr}Object!`,
          description: `${S.capitalize(action)} single ${r}`,
          arguments: ArgumentMap[action as ActionEnumString][target as TargetEnumString]({ r, pr, cr, cpr })
        });
      else if (target === 'multi')
        MutationExt.createField({
          name: `${action}${cpr}`,
          type: `[Self${cr}Object!]!`,
          description: `${S.capitalize(action)} multiple ${r}`,
          arguments: ArgumentMap[action as ActionEnumString][target as TargetEnumString]({ r, pr, cr, cpr })
        });
    });
  });
  if (MutationExt.getFields().length && !doesMutationExtExists) TypedefAST.definitions.push(MutationExt.node);
}
