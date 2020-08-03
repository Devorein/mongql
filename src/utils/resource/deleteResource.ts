import { ISchemaInfo } from "../../types";

import { Model } from "mongoose";

async function deleteResource(model: Model<any>, id: string, userId: string, SchemaInfo: ISchemaInfo) {
  const resource = await model.findById(id);
  if (!resource) return new Error(`ResourceModel not found with id of ${id}`);
  if (resource.user.toString() !== userId.toString())
    return new Error(`User not authorized to delete resource`);
  if (typeof model.schema.statics.predelete === 'function') await model.schema.statics.predelete(id, SchemaInfo);
  const deleted_resource = await resource.remove();
  if (typeof model.schema.statics.postdelete === 'function') await model.schema.statics.postdelete(id, SchemaInfo);
  return deleted_resource;
}

export default async function (model: Model<any>, ids: string | string[], userId: string, SchemaInfo: ISchemaInfo) {
  if (Array.isArray(ids)) {
    const deleted_resources = [];
    for (let i = 0; i < ids.length; i++)
      deleted_resources.push(await deleteResource(model, ids[i], userId, SchemaInfo));
    return deleted_resources
  }
  else return await deleteResource(model, ids, userId, SchemaInfo)
}
