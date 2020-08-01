import { Model } from "mongoose";

export default async function (model: Model<any>, Ids: string[], userId: string) {
  const deleted_resources = [];
  for (let i = 0; i < Ids.length; i++) {
    const resourceId = Ids[i];
    const resource = await model.findById(resourceId);
    if (!resource) return new Error(`ResourceModel not found with id of ${resourceId}`);
    if (resource.user.toString() !== userId.toString())
      return new Error(`User not authorized to delete resource`);
    await resource.remove();
    deleted_resources.push(resource);
  }
  return await Promise.all(deleted_resources);
};
