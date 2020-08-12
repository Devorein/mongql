import loadFiles from "./loadFiles";
import resolverCompose from "./resolverCompose";
import createResource from "./resource/createResource";
import updateResource from "./resource/updateResource";
import deleteResource from "./resource/deleteResource";
import generateOptions from "./generate/options";

export * from "./generate/configs";
export * from "./AST";
export * from "./mongoose";
export * from "./objManip";

export async function AsyncForEach<T>(arr: readonly T[], cb: any) {
  for (let index = 0; index < arr.length; index++)
    await cb(arr[index] as T, index, arr);
}

export {
  loadFiles,
  resolverCompose,
  createResource,
  updateResource,
  deleteResource,
  generateOptions,
}