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
    'create': {
      single: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], ctx.user.id, args.data, SchemaInfo);
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], ctx.user.id, args.data, SchemaInfo);
      }
    },
    update: {
      single: async function (parent: any, args: any, ctx: any) {
        args.data.id = args.id;
        return (await updateResource(ctx[capitalizedResource], [args.data], ctx.user.id, (err: Error) => {
          throw err;
        }))[0];
      },
      multi: async function (parent: any, args: any, ctx: any) {
        (args.ids as string[]).forEach((id, i) => (args.data[i].id = id));
        return await updateResource(ctx[capitalizedResource], args.data, ctx.user.id, (err: Error) => {
          throw err;
        });
      }
    },
    delete: {
      single: async function (parent: any, args: any, ctx: any) {
        return ((await deleteResource(ctx[capitalizedResource], [args.id], ctx.user.id)) as Promise<any>[])[0];
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await deleteResource(ctx[capitalizedResource], args.ids, ctx.user.id);
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