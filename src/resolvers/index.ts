import generateQueryResolvers from './query';
import generateMutationResolvers from './mutation';
import generateTypeResolvers from './type';
import resolverCompose from '../utils/resolverCompose';
import { MongqlMongooseSchema, IResolver, ISchemaInfo } from '../types';
import { checkDeepNestedProps } from "../utils/objManip";

function transformResolvers(Schema: MongqlMongooseSchema, InitResolver: undefined | Object | IResolver, SchemaInfo: ISchemaInfo) {
  const { mongql: { generate } } = Schema;
  if (!InitResolver) InitResolver = { Query: {}, Mutation: {} };
  if (!checkDeepNestedProps(generate, false)) {
    InitResolver = {
      ...generateTypeResolvers(SchemaInfo),
      ...InitResolver,
    };
    (InitResolver as IResolver).Query = {
      ...generateQueryResolvers(Schema, SchemaInfo),
      ...(InitResolver as IResolver).Query,
    };
    (InitResolver as IResolver).Mutation = {
      ...generateMutationResolvers(Schema, SchemaInfo),
      ...(InitResolver as IResolver).Mutation,
    };
    return resolverCompose(InitResolver);
  } else return resolverCompose(InitResolver);
}

export default transformResolvers;

export {
  generateQueryResolvers,
  generateMutationResolvers,
  generateTypeResolvers
}
