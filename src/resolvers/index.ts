import generateQueryResolvers from './query';
import generateMutationResolvers from './mutation';
import generateTypeResolvers from './type';
import resolverCompose from '../utils/resolverCompose';
import { IMongqlMongooseSchemaFull, IResolverPartial, ISchemaInfo } from '../types';
import { checkDeepNestedProps } from "../utils/objManip";

export default function generateResolvers(Schema: IMongqlMongooseSchemaFull, InitResolver: undefined | Object | IResolverPartial, SchemaInfo: ISchemaInfo) {
  const { mongql: { generate } } = Schema;
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} };
  if (!checkDeepNestedProps(generate, false)) {
    InitResolver = {
      ...generateTypeResolvers(SchemaInfo),
      ...InitResolver,
    };
    (InitResolver as IResolverPartial).Query = {
      ...generateQueryResolvers(Schema, SchemaInfo),
      ...(InitResolver as IResolverPartial).Query,
    };
    (InitResolver as IResolverPartial).Mutation = {
      ...generateMutationResolvers(Schema, SchemaInfo),
      ...(InitResolver as IResolverPartial).Mutation,
    };
    return resolverCompose(InitResolver);
  } else return resolverCompose(InitResolver);
}

export {
  generateQueryResolvers,
  generateMutationResolvers,
  generateTypeResolvers
}
