import { MongqlMongooseSchema, ISchemaInfo, ActionEnumString, PartEnumString, TargetEnumString } from "../types";

const pluralize = require('pluralize');

const createResource = require('../utils/resource/createResource');
const updateResource = require('../utils/resource/updateResource');
const deleteResource = require('../utils/resource/deleteResource');

function generateMutationResolvers(Schema: MongqlMongooseSchema, SchemaInfo: ISchemaInfo): any {
  const { mongql: { resource, generate: { mutation } } } = Schema;

  const capitalizedResource = resource.charAt(0).toUpperCase() + resource.substr(1);
  const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

  const MutationResolvers: { [key: string]: any } = {};
  const MutationResolversMapper = {
    'create': {
      single: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], ctx.user.id, args.data);
      },
      multi: async function (parent: any, args: any, ctx: any) {
        return await createResource(ctx[capitalizedResource], ctx.user.id, args.data);
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
        return (await deleteResource(ctx[capitalizedResource], [args.id], ctx.user.id))[0];
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
};

export default generateMutationResolvers;