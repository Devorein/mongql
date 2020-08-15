import { MutableDocumentNode, ActionEnumString, TargetEnumString, TParsedSchemaInfo, IMongqlBaseSchemaConfigsFull } from "../types";

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

/**
 * Generates mutation typedefs from a mongoose schema
 * 1. Merges the Intital Mutation typedefs given via GlobalConfig or from the schema
 * 2. Checks the generate.mutation options to figure out what needs to be generated
 * 3. Generates based on action(CUD) and target(single, multi)
 * @param Schema Schema to generate mutation typedefs from
 * @param TypedefAST Initital or Previous DocumentNode to merge to Final AST
 */
export default function (Schemas: TParsedSchemaInfo, TypedefAST: MutableDocumentNode) {
  const { resource: r, generate: { mutation } } = Object.values(Schemas.Schemas[0])[0] as IMongqlBaseSchemaConfigsFull;
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
      const Arguments: any[] = ArgumentMap[action as ActionEnumString][target as TargetEnumString]({ r, pr, cr, cpr });

      if (target === 'single')
        MutationExt.createField({
          name: `${action}${cr}`,
          type: `Self${cr}Object!`,
          description: `${S.capitalize(action)} single ${r}`,
          arguments: Arguments
        });
      else if (target === 'multi')
        MutationExt.createField({
          name: `${action}${cpr}`,
          type: `[Self${cr}Object!]!`,
          description: `${S.capitalize(action)} multiple ${r}`,
          arguments: Arguments
        });
    });
  });
  if (MutationExt.getFields().length && !doesMutationExtExists) TypedefAST.definitions.push(MutationExt.node);
}
