import { composeResolvers } from '@graphql-tools/resolvers-composition';

import { IMongqlMongooseSchemaFull } from "../types";
import isAuthenticated from './middleware/auth';

/**
 * Adds authentication protection middleware to specific queries and mutations
 * @param resolver Resolver to compose
 */
export default function (Schema: IMongqlMongooseSchemaFull, resolver: any) {
  const resolversComposition: { [key: string]: any } = {};
  const { unAuthOpsList } = Schema.mongql;
  Object.entries(resolver).forEach(([outerkey, outervalue]) => {
    if (typeof outervalue === 'object') {
      Object.keys(outervalue as Record<string, any>).forEach((innerkey) => {
        if (!innerkey.match(/(Mixed)/) && (innerkey.match(/(Self|Others)/) || outerkey.match(/(Mutation)/)) && !unAuthOpsList.includes(`${outerkey}.${innerkey}` as never))
          resolversComposition[`${outerkey}.${innerkey}`] = [isAuthenticated()];
      });
    }
  });
  return composeResolvers(resolver, resolversComposition);
}
