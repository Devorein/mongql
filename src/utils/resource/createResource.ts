import { Model } from "mongoose";

import { ISchemaInfo, IMongqlBaseSchemaConfigsFull } from "../../types";

async function createResource(model: Model<any>, data: any, userId: string, SchemaInfo: ISchemaInfo, SchemaConfig: IMongqlBaseSchemaConfigsFull) {
  const { uniqueBy } = SchemaConfig;
  // Check if previous resource with same uniqueBy key exists
  if (uniqueBy) {
    const alreadyExists = await model.countDocuments({
      [uniqueBy]: data[uniqueBy],
      user: userId
    }) > 0;
    if (alreadyExists)
      throw new Error(`You already have an environment named ${data.name}`);
  }

  data.user = userId;
  // Call the precreate and postcreate static methods on the schema if they exists
  if (typeof model.schema.statics.precreate === 'function') await model.schema.statics.precreate(data, SchemaInfo);
  const resource = await model.create(data);
  if (typeof model.schema.statics.postcreate === 'function') await model.schema.statics.postcreate(data, SchemaInfo);
  return resource;
}

/**
 * Creates and returns the created resource
 * @param model Model to create document from
 * @param datas Data required to create
 * @param userId Id of the user thats creating the resource
 * @param SchemaInfo Information related to the MongooseSchema
 * @param SchemaConfig Configuration of the BaseMongqlMongooseSchema
 * @returns created resource(s)
 */
export default async function (model: Model<any>, datas: any | any[], userId: string, SchemaInfo: ISchemaInfo, SchemaConfig: IMongqlBaseSchemaConfigsFull) {
  if (Array.isArray(datas)) {
    const created_resources = [];
    for (let i = 0; i < datas.length; i++)
      created_resources.push(await createResource(model, datas[i], userId, SchemaInfo, SchemaConfig));
    return created_resources
  }
  else return await createResource(model, datas, userId, SchemaInfo, SchemaConfig)
}
