import { TParsedSchemaInfo } from "../../types";

import { Model } from "mongoose";

async function updateResource(model: Model<any>, data: any, userId: string, SchemaInfo: TParsedSchemaInfo, ctx: any) {
  if (typeof model.schema.statics.preupdate === 'function') await model.schema.statics.preupdate(data, SchemaInfo, ctx);
  const updated_resource = await model.findOneAndUpdate({ _id: data.id, user: userId }, Object.assign({}, { updated_at: Date.now() }, data), { new: true });
  if (typeof model.schema.statics.postupdate === 'function') await model.schema.statics.postupdate(data, SchemaInfo, ctx);
  return updated_resource;
}

/**
 * Updates and returns the updated resource
 * @param model Model to update document from
 * @param datas Data required to update
 * @param userId Id of the user thats deleting the resource
 * @param SchemaInfo Information related to the MongooseSchema
 * @returns updated resource(s)
 */
export default async function (model: Model<any>, datas: any | any[], userId: string, SchemaInfo: TParsedSchemaInfo, ctx: any) {
  if (Array.isArray(datas)) {
    const updated_resources = [];
    for (let i = 0; i < datas.length; i++)
      updated_resources.push(await updateResource(model, datas[i], userId, SchemaInfo, ctx));
    return updated_resources;
  } else
    return await updateResource(model, datas, userId, SchemaInfo, ctx);
}
