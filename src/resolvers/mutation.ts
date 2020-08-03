import { IMongqlMongooseSchemaFull, ISchemaInfo, ActionEnumString, TargetEnumString } from "../types";

import pluralize from 'pluralize';

import createResource from '../utils/resource/createResource';
import updateResource from '../utils/resource/updateResource';
import deleteResource from '../utils/resource/deleteResource';

export default function generateMutationResolvers(Schema: IMongqlMongooseSchemaFull, SchemaInfo: ISchemaInfo): any {
  const { mongql: { resource, generate: { mutation } } } = Schema;

  const capitalizedResource = resource.charAt(0).toUpperCase() + resource.substr(1);
  const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

  const MutationResolvers: { [key: string]: any } = {};
  const MutationResolversMapper = {
    create: {
      single: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], args.data, ctx.user.id, SchemaInfo, Schema.mongql);
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], args.datas, ctx.user.id, SchemaInfo, Schema.mongql);
      }
    },
    update: {
      single: async function (parent: any, args: any, ctx: any) {
        return (await updateResource(ctx[capitalizedResource], args.data, ctx.user.id, SchemaInfo));
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await updateResource(ctx[capitalizedResource], args.datas, ctx.user.id, SchemaInfo);
      }
    },
    delete: {
      single: async function (parent: any, args: any, ctx: any) {
        return await deleteResource(ctx[capitalizedResource], args.id, ctx.user.id, SchemaInfo);
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await deleteResource(ctx[capitalizedResource], args.ids, ctx.user.id, SchemaInfo);
      }
    }
  };

  const actions = Object.keys(mutation);
  actions.forEach((action) => {
    const targets = Object.keys(mutation[action as ActionEnumString]).filter((target) => mutation[action as ActionEnumString][target as TargetEnumString]);
    targets.forEach((target) => {
      MutationResolvers[`${action}${target === 'single' ? capitalizedResource : pluralizedcapitalizedResource}`] =
        MutationResolversMapper[(action as ActionEnumString)][target as TargetEnumString];
    });
  });
  return MutationResolvers;
}