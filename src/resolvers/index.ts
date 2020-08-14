import generateQueryResolvers from './query';
import generateMutationResolvers from './mutation';
import generateTypeResolvers from './type';
import resolverCompose from '../utils/resolverCompose';
import { IMongqlMongooseSchemaFull, IResolverPartial, TParsedSchemaInfo } from '../types';

/**
 * 
 * @param Schema 
 * @param InitResolver 
 * @param SchemaInfo 
 */
export default function generateResolvers(Schema: IMongqlMongooseSchemaFull, InitResolver: undefined | IResolverPartial, SchemaInfo: TParsedSchemaInfo) {
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} } as IResolverPartial;
  generateTypeResolvers(SchemaInfo, InitResolver);
  generateQueryResolvers(SchemaInfo, InitResolver);
  generateMutationResolvers(SchemaInfo, InitResolver);
  return resolverCompose(Schema, InitResolver);
}

export {
  generateQueryResolvers,
  generateMutationResolvers,
  generateTypeResolvers
}
