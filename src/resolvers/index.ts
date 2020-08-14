import generateQueryResolvers from './query';
import generateMutationResolvers from './mutation';
import generateTypeResolvers from './type';
import resolverCompose from '../utils/resolverCompose';
import { IResolverPartial, TParsedSchemaInfo } from '../types';

/**
 * Generates the resolvers
 * @param InitResolver Initial Resolver for the resource
 * @param SchemaInfo Parsed Schema Info
 */
export default function generateResolvers(InitResolver: undefined | IResolverPartial, SchemaInfo: TParsedSchemaInfo) {
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} } as IResolverPartial;
  generateTypeResolvers(SchemaInfo, InitResolver);
  generateQueryResolvers(SchemaInfo, InitResolver);
  generateMutationResolvers(SchemaInfo, InitResolver);
  return resolverCompose(SchemaInfo, InitResolver);
}

export {
  generateQueryResolvers,
  generateMutationResolvers,
  generateTypeResolvers
}
