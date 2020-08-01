import { Model } from "mongoose";

export default async function (model: Model<any>, userId: string, data: any) {
  data.user = userId;
  return await model.create(data);
};
