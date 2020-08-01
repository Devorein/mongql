import { Schema, SchemaType } from "mongoose";
import { DocumentNode, DefinitionNode, TypeNode } from "graphql";
import { EnumTypeApi, UnionTypeApi, InterfaceTypeApi, ObjectTypeApi, InputTypeApi } from "graphql-extra";

export interface ITransformedPart {
  obj: {
    [key: string]: any
  },
  arr: any[]
}

export interface MongqlMongooseSchema extends Schema {
  mongql: IMongqlSchemaConfigs,
}

export interface IGenerateQueryPartOptions {
  whole: boolean,
  nameandid: boolean,
  count: boolean
}

export interface IGenerateQueryAuthOptions {
  self: IGenerateQueryPartOptions,
  others: IGenerateQueryPartOptions,
  mixed: IGenerateQueryPartOptions,
}

export interface IGenerateQueryRangeOptions {
  all: IGenerateQueryAuthOptions,
  filtered: IGenerateQueryAuthOptions,
  paginated: IGenerateQueryAuthOptions,
  id: IGenerateQueryAuthOptions
}

export interface IGenerateQueryOptions extends IGenerateQueryRangeOptions { };

export interface IGenerateMutationActionTargetOptions {
  single: boolean,
  multi: boolean
}

export interface IGenerateMutationActionOptions {
  create: IGenerateMutationActionTargetOptions,
  update: IGenerateMutationActionTargetOptions,
  delete: IGenerateMutationActionTargetOptions,
}

export interface IGenerateMutationOptions extends IGenerateMutationActionOptions { }

export interface IGenerateTypeOptions {
  input: {
    create: boolean,
    update: boolean
  },
  interface: boolean,
  enum: boolean,
  union: boolean,
  object: {
    self: boolean,
    others: boolean,
    mixed: boolean,
  }
}

export interface IGenerateOptions {
  query: IGenerateQueryOptions,
  mutation: IGenerateMutationOptions,
  type: IGenerateTypeOptions
}

export type IOutputOptions = {
  SDL?: string,
  AST?: string
}

export interface IMongqlGlobalConfigs {
  Schemas: ReadonlyArray<MongqlMongooseSchema>,
  readonly Typedefs: {
    init: { [key: string]: DocumentNode },
  },
  readonly Resolvers: {
    init: { [key: string]: Object },
  },
  generate: boolean | IGenerateOptions,
  output: IOutputOptions
}

export interface IMongqlGlobalConfigsOption {
  Schemas: string | MongqlMongooseSchema[],
  Typedefs?: {
    init: string | { [key: string]: DocumentNode },
  },
  Resolvers?: {
    init: string | { [key: string]: Object },
  },
  generate?: boolean | IGenerateOptions,
  output?: IOutputOptions
}

/**
 * Mongql Schema Configs
 */
export interface IMongqlSchemaConfigs {
  resource: string,
  generate: IGenerateOptions,
  skip: boolean,
  output: IOutputOptions
}

export type IMongqlSchemaConfigsOption = IMongqlNestedSchemaConfigsOption | IMongqlBaseSchemaConfigsOption;

export interface IMongqlBaseSchemaConfigsOption {
  resource: string,
  generate?: boolean | IGenerateOptions,
  skip?: boolean,
  output?: IOutputOptions
}

export type MongqlFieldAttachObjectConfigs = {
  mixed: boolean,
  others: boolean,
  self: boolean,
}

export interface IMongqlFieldConfigs {
  description: string | undefined,
  nullable: {
    object: {
      mixed: boolean[],
      others: boolean[],
      self: boolean[],
    },
    input: {
      create: boolean[],
      update: boolean[]
    }
  },
  attach: {
    object: MongqlFieldAttachObjectConfigs,
    input: {
      create: boolean,
      update: boolean
    },
    interface: boolean,
    enum: boolean
  },
  authMapper: {
    [key: string]: string
  }
};

export interface IMongqlFieldConfigsOptions {
  description?: string | undefined,
  nullable?: {
    object?: {
      mixed?: boolean[],
      others?: boolean[],
      self?: boolean[],
    },
    input?: {
      create?: boolean[],
      update?: boolean[]
    }
  },
  attach?: {
    object?: {
      mixed?: boolean,
      others?: boolean,
      self?: boolean,
    },
    input?: {
      create?: boolean,
      update?: boolean
    },
    interface?: boolean,
    enum?: boolean
  },
  authMapper?: {
    [key: string]: string
  }
};

export interface FieldInfo {
  input_type: string,
  generic_type: string,
  ref_type: string,
  object_type: string,
  excludedAuthSegments: string[],
  fieldDepth: number
}

export interface FieldFullInfo extends IMongqlFieldConfigs, FieldInfo { }

export interface IMongqlNestedSchemaConfigsOption {
  generate?: boolean | IGenerateOptions,
  skip?: boolean,
  output?: IOutputOptions
}

export interface ISpecificTypeInfo {
  object_type: string,
  input_type: string,
  ref_type: string
}

interface ExtendedObjectTypeApi extends ObjectTypeApi {
  fields: { [key: string]: FieldFullInfo }
}

export interface IMongqlGeneratedTypes {
  enums: { [key: string]: EnumTypeApi }[],
  unions: { [key: string]: UnionTypeApi }[],
  interfaces: { [key: string]: InterfaceTypeApi }[],
  objects: { [key: string]: ExtendedObjectTypeApi }[],
  inputs: { [key: string]: InputTypeApi }[],
}

export enum InputActionEnum {
  create,
  update
}

export type InputActionEnumString = keyof typeof InputActionEnum;

export enum ActionEnum {
  create,
  update,
  delete
}

export type ActionEnumString = keyof typeof ActionEnum;

export enum AuthEnum {
  self,
  others,
  mixed
}

export type AuthEnumString = keyof typeof AuthEnum;

export enum RangeEnum {
  all,
  filtered,
  paginated,
  id
}

export type RangeEnumString = keyof typeof RangeEnum;

export enum PartEnum {
  whole,
  count,
  nameandid
}

export type PartEnumString = keyof typeof PartEnum;

export interface MutableDocumentNode extends DocumentNode {
  definitions: DefinitionNode[]
}

export enum TargetEnum {
  single,
  multi
}

export type TargetEnumString = keyof typeof TargetEnum;

export interface IResolver {
  Query: { [key: string]: any },
  Mutation: { [key: string]: any },
  [key: string]: any
}

export type GeneratedField = {
  [key: string]: FieldFullInfo
}

export type GeneratedFields = GeneratedField[];

export interface ISchemaInfo {
  Fields: GeneratedFields,
  Types: IMongqlGeneratedTypes
}

export interface IMongqlTypeNode {
  type: TypeNode,
  kind: "NamedType" | "NonNullType" | "ListType",
  name: string
}

export interface IPaginationInput {
  page: number,
  limit: number,
  sort: string,
  filter: string
}

export interface IMongqlGenerateOptions {
  options: { [key: string]: any },
  fields: string[]
}