import { Model } from "mongoose";
import { ISchemaInfo } from "../../types";

export default async function (model: Model<any>, userId: string, data: any, SchemaInfo: ISchemaInfo) {
  const { Types } = SchemaInfo;
  Types.objects.forEach(object => {
    console.log(object)
  })
  data.user = userId;
  return await model.create(data);
}
