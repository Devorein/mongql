import { TParsedSchemaInfo, ActionEnumString, TargetEnumString, IMongqlBaseSchemaConfigsFull } from "../types";

import pluralize from 'pluralize';

import createResource from '../utils/resource/createResource';
import updateResource from '../utils/resource/updateResource';
import deleteResource from '../utils/resource/deleteResource';

/**
 * Generates mutation resolvers from a mongoose schema
 * 1. Merges the Intital Mutation resolvers given via GlobalConfig or from the schema
 * 2. Checks the generate.mutation options to figure out what needs to be generated
 * 3. Generates based on action(CUD) and target(single, multi)
 * @param Schema Schema to generate mutation resolvers from
 * @param TypedefAST Initital or Previous DocumentNode to merge to Final AST
 */
export default function generateMutationResolvers(SchemaInfo: TParsedSchemaInfo, InitResolver: Record<string, any>) {
  if (!InitResolver.Mutation) InitResolver.Mutation = {};
  const BaseSchemaConfigs = Object.values(SchemaInfo.Schemas[0])[0] as IMongqlBaseSchemaConfigsFull;
  const { generate: { mutation }, resource, operationNameMapper = {} } = BaseSchemaConfigs;

  const capitalizedResource = resource.charAt(0).toUpperCase() + resource.substr(1);
  const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

  const MutationResolvers: { [key: string]: any } = InitResolver.Mutation;
  const MutationResolversMapper = {
    create: {
      single: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], args.data, ctx?.user?.id, SchemaInfo, BaseSchemaConfigs, ctx);
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], args.datas, ctx?.user?.id, SchemaInfo, BaseSchemaConfigs, ctx);
      }
    },
    update: {
      single: async function (parent: any, args: any, ctx: any) {
        return (await updateResource(ctx[capitalizedResource], args.data, ctx?.user?.id, SchemaInfo, ctx));
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await updateResource(ctx[capitalizedResource], args.datas, ctx?.user?.id, SchemaInfo, ctx);
      }
    },
    delete: {
      single: async function (parent: any, args: any, ctx: any) {
        return await deleteResource(ctx[capitalizedResource], args.id, ctx?.user?.id, SchemaInfo, ctx);
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await deleteResource(ctx[capitalizedResource], args.ids, ctx?.user?.id, SchemaInfo, ctx);
      }
    }
  };

  const actions = Object.keys(mutation);
  actions.forEach((action) => {
    const targets = Object.keys(mutation[action as ActionEnumString]).filter((target) => mutation[action as ActionEnumString][target as TargetEnumString]);
    targets.forEach((target) => {
      let key = `${action}${target === 'single' ? capitalizedResource : pluralizedcapitalizedResource}`;
      key = operationNameMapper[key] || key;
      if (!MutationResolvers[key])
        MutationResolvers[key] =
          MutationResolversMapper[(action as ActionEnumString)][target as TargetEnumString];
    });
  });
}