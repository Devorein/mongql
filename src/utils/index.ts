import loadFiles from "./loadFiles";
import resolverCompose from "./resolverCompose";
import createResource from "./resource/createResource";
import updateResource from "./resource/updateResource";
import deleteResource from "./resource/deleteResource";
import generateOptions from "./generate/options";
import capitalize from "./capitalize";
import parsePageLimit from "./query/parsePageLimit";
import parsePagination from "./query/parsePagination";
import parseSort from "./query/parseSort";

export * from "./generate/configs";
export * from "./AST";
export * from "./mongoose";
export * from "./objManip";
export * from "./colors";

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
  capitalize,
  parsePageLimit,
  parsePagination,
  parseSort,
}