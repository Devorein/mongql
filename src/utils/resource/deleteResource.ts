import { TParsedSchemaInfo } from "../../types";

import { Model } from "mongoose";

async function deleteResource(model: Model<any>, id: string, userId: string, SchemaInfo: TParsedSchemaInfo) {
  const resource = await model.findById(id);
  if (!resource) return new Error(`ResourceModel not found with id of ${id}`);
  if (resource.user.toString() !== userId.toString())
    return new Error(`User not authorized to delete resource`);
  if (typeof model.schema.statics.predelete === 'function') await model.schema.statics.predelete(id, SchemaInfo);
  const deleted_resource = await resource.remove();
  if (typeof model.schema.statics.postdelete === 'function') await model.schema.statics.postdelete(id, SchemaInfo);
  return deleted_resource;
}

/**
 * Deletes and returns the deleted resource
 * @param model Model to delete document from
 * @param datas Data required to delete
 * @param userId Id of the user thats deleting the resource
 * @param SchemaInfo Information related to the MongooseSchema
 * @returns deleted resource(s)
 */
export default async function (model: Model<any>, ids: string | string[], userId: string, SchemaInfo: TParsedSchemaInfo) {
  if (Array.isArray(ids)) {
    const deleted_resources = [];
    for (let i = 0; i < ids.length; i++)
      deleted_resources.push(await deleteResource(model, ids[i], userId, SchemaInfo));
    return deleted_resources
  }
  else return await deleteResource(model, ids, userId, SchemaInfo)
}
