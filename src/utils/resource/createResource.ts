import { Model } from "mongoose";
import { capitalize } from "../../utils";
import { TParsedSchemaInfo, IMongqlBaseSchemaConfigsFull } from "../../types";
import { ObjectID } from "bson";

async function createResource(model: Model<any>, data: any, userId: string, SchemaInfo: TParsedSchemaInfo, SchemaConfig: IMongqlBaseSchemaConfigsFull, ctx: any) {
  const { uniqueBy } = SchemaConfig;
  if (uniqueBy) {
    for (let i = 0; i < uniqueBy.length; i++) {
      const uniqueKey = uniqueBy[i];
      const query = {
        [uniqueKey]: data[uniqueKey],
      };
      if (model.name !== "user") query.user = userId;
      const alreadyExists = await model.countDocuments(query) > 0;
      if (alreadyExists)
        throw new Error(`${capitalize(model.collection.collectionName)} with ${uniqueKey} ${data[uniqueKey]} already exists`);
    }
  }

  data.user = userId;
  data._id = new ObjectID();
  if (typeof model.schema.statics.precreate === 'function') await model.schema.statics.precreate(data, SchemaInfo, ctx);
  const resource = new model(data);
  await resource.save();
  if (typeof model.schema.statics.postcreate === 'function') await model.schema.statics.postcreate(data, SchemaInfo, ctx);
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
export default async function (model: Model<any>, datas: any | any[], userId: string, SchemaInfo: TParsedSchemaInfo, SchemaConfig: IMongqlBaseSchemaConfigsFull, ctx: any) {
  if (Array.isArray(datas)) {
    const created_resources = [];
    for (let i = 0; i < datas.length; i++)
      created_resources.push(await createResource(model, datas[i], userId, SchemaInfo, SchemaConfig, ctx));
    return created_resources
  }
  else return await createResource(model, datas, userId, SchemaInfo, SchemaConfig, ctx)
}
