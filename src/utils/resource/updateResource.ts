import { Model } from "mongoose";

export default async function (model: Model<any>, datas: any[], userId: string, next: any) {
  const updated_resources = [];
  for (let i = 0; i < datas.length; i++) {
    const data = datas[i];
    const resource = await model.findById(data.id);
    if (!resource) return next(new Error(`Resource not found with id of ${data.id}`));
    if (resource.user.toString() !== userId.toString())
      return next(new Error(`User not authorized to update this quiz`));
    data.updated_at = Date.now();
    delete data.id;
    Object.entries(data).forEach(([key, value]) => {
      resource[key] = value;
    });
    updated_resources.push(await resource.save());
  }
  return await Promise.all(updated_resources);
};
