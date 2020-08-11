import generateQueryResolvers from './query';
import generateMutationResolvers from './mutation';
import generateTypeResolvers from './type';
import resolverCompose from '../utils/resolverCompose';
import { IMongqlMongooseSchemaFull, IResolverPartial, ISchemaInfo } from '../types';

export default function generateResolvers(Schema: IMongqlMongooseSchemaFull, InitResolver: undefined | IResolverPartial, SchemaInfo: ISchemaInfo) {
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} } as IResolverPartial;
  generateTypeResolvers(SchemaInfo, InitResolver);
  generateQueryResolvers(Schema, SchemaInfo, InitResolver);
  generateMutationResolvers(Schema, SchemaInfo, InitResolver);
  return resolverCompose(Schema, InitResolver);
}

export {
  generateQueryResolvers,
  generateMutationResolvers,
  generateTypeResolvers
}
