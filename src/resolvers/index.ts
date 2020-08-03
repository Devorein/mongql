import generateQueryResolvers from './query';
import generateMutationResolvers from './mutation';
import generateTypeResolvers from './type';
import resolverCompose from '../utils/resolverCompose';
import { IMongqlMongooseSchemaFull, IResolverPartial, ISchemaInfo } from '../types';

export default function generateResolvers(Schema: IMongqlMongooseSchemaFull, InitResolver: undefined | IResolverPartial, SchemaInfo: ISchemaInfo) {
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} } as IResolverPartial;
  InitResolver = {
    ...generateTypeResolvers(SchemaInfo),
    ...InitResolver,
  };
  InitResolver.Query = {
    ...generateQueryResolvers(Schema, SchemaInfo),
    ...InitResolver.Query,
  };
  InitResolver.Mutation = {
    ...generateMutationResolvers(Schema, SchemaInfo),
    ...InitResolver.Mutation,
  };
  return resolverCompose(InitResolver);
}

export {
  generateQueryResolvers,
  generateMutationResolvers,
  generateTypeResolvers
}
