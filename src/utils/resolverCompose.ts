import { composeResolvers } from '@graphql-tools/resolvers-composition';

import isAuthenticated from './middleware/auth';

export default function (resolver: any) {
  const resolversComposition: { [key: string]: any } = {};

  Object.entries(resolver).forEach(([outerkey, outervalue]) => {
    if (typeof outervalue === 'object') {
      Object.keys(outervalue as Record<string, any>).forEach((innerkey) => {
        if (!innerkey.match(/(Mixed)/) && (innerkey.match(/(Self|Others)/) || outerkey.match(/(Mutation)/))) {
          resolversComposition[`${outerkey}.${innerkey}`] = [isAuthenticated()];
        }
      });
    }
  });
  return composeResolvers(resolver, resolversComposition);
}
