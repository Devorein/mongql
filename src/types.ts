import { Schema, } from "mongoose";
import { DocumentNode, DefinitionNode, TypeNode } from "graphql";
import { EnumTypeApi, UnionTypeApi, InterfaceTypeApi, ObjectTypeApi, InputTypeApi } from "graphql-extra";

export interface ITransformedPart {
  obj: {
    [key: string]: any
  },
  arr: any[]
}

/**
 * Mongql Mongoose schema Interfaace with additional mongql field
 */
export interface IMongqlMongooseSchemaPartial extends Schema {
  mongql: IMongqlBaseSchemaConfigsPartial,
}

export interface IMongqlMongooseSchemaFull extends Schema {
  mongql: IMongqlBaseSchemaConfigsFull,
}

/**
 * Partial interface of Query part generate config
 */
export interface IGenerateQueryPartPartial {
  whole?: boolean,
  nameandid?: boolean,
  count?: boolean
}

/**
 * FuLL interface of Query part generate config
 */
export interface IGenerateQueryPartFull {
  whole: boolean,
  nameandid: boolean,
  count: boolean
}

/**
 * Partial interface of Query auth generate config
 */
export interface IGenerateQueryAuthPartial {
  self?: boolean | IGenerateQueryPartPartial,
  others?: boolean | IGenerateQueryPartPartial,
  mixed?: boolean | IGenerateQueryPartPartial,
}

/**
 * Full interface of Query auth generate config
 */
export interface IGenerateQueryAuthFull {
  self: IGenerateQueryPartFull,
  others: IGenerateQueryPartFull,
  mixed: IGenerateQueryPartFull,
}

/**
 * partial interface of Query range generate config
 */
export interface IGenerateQueryRangePartial {
  all?: boolean | IGenerateQueryAuthPartial,
  filtered?: boolean | IGenerateQueryAuthPartial,
  paginated?: boolean | IGenerateQueryAuthPartial,
  id?: boolean | IGenerateQueryAuthPartial
}

/**
 * Full interface of Query range generate config
 */
export interface IGenerateQueryRangeFull {
  all: IGenerateQueryAuthFull,
  filtered: IGenerateQueryAuthFull,
  paginated: IGenerateQueryAuthFull,
  id: IGenerateQueryAuthFull
}

export interface IGenerateQueryPartial extends IGenerateQueryRangePartial, IGenerateQueryAuthPartial, IGenerateQueryPartPartial { }
export type IGenerateQueryFull = IGenerateQueryRangeFull;

export interface IGenerateMutationTargetPartial {
  single?: boolean,
  multi?: boolean
}

export interface IGenerateMutationTargetFull {
  single: boolean,
  multi: boolean
}

export interface IGenerateMutationActionPartial {
  create?: boolean | IGenerateMutationTargetPartial,
  update?: boolean | IGenerateMutationTargetPartial,
  delete?: boolean | IGenerateMutationTargetPartial,
}

export interface IGenerateMutationActionFull {
  create: IGenerateMutationTargetFull,
  update: IGenerateMutationTargetFull,
  delete: IGenerateMutationTargetFull,
}

export interface IGenerateMutationPartial extends IGenerateMutationActionPartial, IGenerateMutationTargetPartial { }
export type IGenerateMutationFull = IGenerateMutationActionFull

export interface IGenerateTypePartial {
  input?: {
    create?: boolean,
    update?: boolean
  },
  interface?: boolean,
  enum?: boolean,
  union?: boolean,
  object?: {
    self?: boolean,
    others?: boolean,
    mixed?: boolean,
  }
}

export interface IGenerateTypeFull {
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

export interface IGeneratePartial {
  query?: boolean | IGenerateQueryPartial,
  mutation?: boolean | IGenerateMutationPartial,
  type?: boolean | IGenerateTypePartial
}

export interface IGenerateFull {
  query: IGenerateQueryFull,
  mutation: IGenerateMutationFull,
  type: IGenerateTypeFull
}

export type IOutputPartial = {
  SDL?: string,
  AST?: string
}

export type IOutputFull = {
  SDL: string,
  AST: string
}

export interface IMongqlGlobalConfigsPartial {
  Schemas: ReadonlyArray<IMongqlMongooseSchemaPartial>,
  readonly Typedefs?: {
    init?: string | { [key: string]: string | DocumentNode },
  },
  readonly Resolvers?: {
    init?: string | { [key: string]: Object },
  },
  generate?: boolean | IGeneratePartial,
  output?: IOutputPartial
}

export interface IMongqlGlobalConfigsFull {
  Schemas: ReadonlyArray<IMongqlMongooseSchemaFull>,
  readonly Typedefs: {
    init: { [key: string]: DocumentNode },
  },
  readonly Resolvers: {
    init: { [key: string]: Object },
  },
  generate: IGenerateFull,
  output: IOutputFull
}

/**
 * Mongql Schema Configs
 */
export interface IMongqlBaseSchemaConfigsFull {
  resource: string,
  generate: IGenerateFull,
  skip: boolean,
  output: IOutputFull,
  TypeDefs: DocumentNode | undefined,
  Resolvers: IResolverFull | undefined
}

export interface IMongqlBaseSchemaConfigsPartial {
  resource: string,
  generate?: IGeneratePartial,
  skip?: boolean,
  output?: IOutputPartial,
  TypeDefs?: DocumentNode,
  Resolvers?: IResolverPartial
}

export interface IMongqlNestedSchemaConfigsFull extends IMongqlFieldConfigsFull {
  generate: IGenerateFull,
}

export interface IMongqlNestedSchemaConfigsPartial extends IMongqlFieldConfigsPartial {
  generate?: IGeneratePartial,
}

export type MongqlFieldAttachObjectConfigsFull = {
  [key in AuthEnumString]: boolean
}

export type MongqlFieldAttachObjectConfigsPartial = {
  [key in AuthEnumString]?: boolean
}

export type MongqlFieldAttachInputConfigsFull = {
  [key in InputActionEnumString]: boolean
}

export type MongqlFieldAttachInputConfigsPartial = {
  [key in InputActionEnumString]?: boolean
}

export type MongqlFieldNullableObjectConfigsFull = {
  [key in AuthEnumString]: boolean[]
}

export type MongqlFieldNullableObjectConfigsPartial = {
  [key in AuthEnumString]?: boolean[]
}

export type MongqlFieldNullableInputConfigsFull = {
  [key in InputActionEnumString]: boolean[]
}

export type MongqlFieldNullableInputConfigsPartial = {
  [key in InputActionEnumString]?: boolean[]
}

export type MongqlFieldAuthMapperConfigsPartial = {
  [key in AuthEnumString]?: key
}

export type MongqlFieldAuthMapperConfigsFull = {
  [key in AuthEnumString]: key
}

export interface IMongqlFieldConfigsFull {
  description: string | undefined,
  nullable: {
    object: MongqlFieldNullableObjectConfigsFull,
    input: MongqlFieldNullableInputConfigsFull
  },
  attach: {
    object: MongqlFieldAttachObjectConfigsFull,
    input: MongqlFieldAttachInputConfigsFull,
    interface: boolean,
    enum: boolean
  },
  authMapper: MongqlFieldAuthMapperConfigsFull
}

export interface IMongqlFieldConfigsPartial {
  description?: string,
  nullable?: {
    object?: MongqlFieldNullableObjectConfigsPartial,
    input?: MongqlFieldNullableInputConfigsPartial
  },
  attach?: {
    object?: MongqlFieldAttachObjectConfigsPartial,
    input?: MongqlFieldAttachInputConfigsPartial,
    interface?: boolean,
    enum?: boolean
  },
  authMapper: MongqlFieldAuthMapperConfigsPartial
}

export interface FieldInfo {
  input_type: string,
  generic_type: string,
  ref_type: string,
  object_type: string,
  excludedAuthSegments: string[],
  fieldDepth: number
}

export interface FieldFullInfo extends IMongqlFieldConfigsFull, FieldInfo { }

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

export interface IResolverFull {
  Query: { [key: string]: any },
  Mutation: { [key: string]: any },
  [key: string]: any
}

export interface IResolverPartial {
  Query?: { [key: string]: any },
  Mutation?: { [key: string]: any },
  [key: string]: any
}

export type FieldsFullInfo = {
  [key: string]: FieldFullInfo
}

export type FieldsFullInfos = FieldsFullInfo[];

export interface ISchemaInfo {
  Fields: FieldsFullInfos,
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

export type MongqlSchemaConfigsPartial = IMongqlBaseSchemaConfigsPartial | IMongqlNestedSchemaConfigsPartial;
export type MongqlSchemaConfigsFull = IMongqlBaseSchemaConfigsFull | IMongqlNestedSchemaConfigsFull; 