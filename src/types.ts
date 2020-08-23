import { Schema, } from "mongoose";
import { DocumentNode, DefinitionNode, TypeNode } from "graphql";
import { EnumTypeApi, UnionTypeApi, InterfaceTypeApi, ObjectTypeApi, InputTypeApi } from "graphql-extra";

/**
 * Mongql.generate() interface for TransformedTypedefs and TransformedResolvers
 */
export interface ITransformedASTPart {
  obj: {
    [key: string]: any
  },
  DocumentNode: MutableDocumentNode
}

export interface ITransformedResolverPart {
  obj: {
    [key: string]: any
  },
  arr: any[]
}

/**
 * Mongql Mongoose partial schema Interface with additional partial mongql field
 */
export interface IMongqlMongooseSchemaPartial extends Schema {
  mongql: IMongqlBaseSchemaConfigsPartial,
}

/**
 * Mongql Mongoose full schema Interface with additional full mongql field
 */
export interface IMongqlMongooseSchemaFull extends Schema {
  mongql: IMongqlBaseSchemaConfigsFull,
}

/**
 * Partial interface for Query part in generate option
 */
export interface IGenerateQueryPartPartial {
  whole?: boolean,
  count?: boolean
}

/**
 * FuLL interface for Query part in generate option
 */
export interface IGenerateQueryPartFull {
  whole: boolean,
  count: boolean
}

/**
 * Partial interface for Query auth in generate option
 */
export interface IGenerateQueryAuthPartial {
  self?: boolean | IGenerateQueryPartPartial,
  others?: boolean | IGenerateQueryPartPartial,
  mixed?: boolean | IGenerateQueryPartPartial,
}

/**
 * Full interface for Query auth in generate option
 */
export interface IGenerateQueryAuthFull {
  self: IGenerateQueryPartFull,
  others: IGenerateQueryPartFull,
  mixed: IGenerateQueryPartFull,
}

/**
 * partial interface for Query range in generate option
 */
export interface IGenerateQueryRangePartial {
  all?: boolean | IGenerateQueryAuthPartial,
  filtered?: boolean | IGenerateQueryAuthPartial,
  paginated?: boolean | IGenerateQueryAuthPartial,
  id?: boolean | IGenerateQueryAuthPartial
}

/**
 * Full interface for Query range in generate option
 */
export interface IGenerateQueryRangeFull {
  all: IGenerateQueryAuthFull,
  filtered: IGenerateQueryAuthFull,
  paginated: IGenerateQueryAuthFull,
  id: IGenerateQueryAuthFull
}

/**
 * Partial interface for Query in generate option
 */
export interface IGenerateQueryPartial extends IGenerateQueryRangePartial, IGenerateQueryAuthPartial, IGenerateQueryPartPartial { }
/**
 * Full interface for Query in generate option
 */
export type IGenerateQueryFull = IGenerateQueryRangeFull;

/**
 * Partial interface for Mutation target in generate option
 */
export interface IGenerateMutationTargetPartial {
  single?: boolean,
  multi?: boolean
}

/**
 * Full interface for Mutation target in generate option
 */
export interface IGenerateMutationTargetFull {
  single: boolean,
  multi: boolean
}

/**
 * Partial interface for Mutation action in generate option
 */
export interface IGenerateMutationActionPartial {
  create?: boolean | IGenerateMutationTargetPartial,
  update?: boolean | IGenerateMutationTargetPartial,
  delete?: boolean | IGenerateMutationTargetPartial,
}

/**
 * Full interface for Mutation action in generate option
 */
export interface IGenerateMutationActionFull {
  create: IGenerateMutationTargetFull,
  update: IGenerateMutationTargetFull,
  delete: IGenerateMutationTargetFull,
}

/**
 * Partial interface for Mutation in generate option
 */
export interface IGenerateMutationPartial extends IGenerateMutationActionPartial, IGenerateMutationTargetPartial { }
/**
 * Full interface for Mutation in generate option
 */
export type IGenerateMutationFull = IGenerateMutationActionFull

/**
 * Partial interface for Type in generate option
 */
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
  },
  fragment?: boolean
}

/**
 * Full interface for Type in generate option
 */
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
  },
  fragment: boolean
}

/**
 * Partial interface for generate in generate option
 */
export interface IGeneratePartial {
  query?: boolean | IGenerateQueryPartial,
  mutation?: boolean | IGenerateMutationPartial,
  type?: boolean | IGenerateTypePartial
}

/**
 * Full interface for generate in generate option
 */
export interface IGenerateFull {
  query: IGenerateQueryFull,
  mutation: IGenerateMutationFull,
  type: IGenerateTypeFull
}

/**
 * Partial type for Global and baseschema output config 
 */
export type IOutputPartial = {
  SDL?: string,
  AST?: string,
  Operation?: string
}

/**
 * Full type for Global and baseschema output config 
 */
export type IOutputFull = {
  SDL: string | undefined,
  AST: string | undefined,
  Operation: string | undefined
}

export type ISortFull = {
  fields: boolean,
  nodes: boolean
}

export type ISortPartial = {
  fields?: undefined | boolean,
  nodes?: undefined | boolean
}

export interface IMongqlGlobalAndBaseSchemaCommonPartial {
  generate?: boolean | IGeneratePartial,
  output?: boolean | IOutputPartial,
  Fragments?: Record<string, string[]>,
  sort?: boolean | ISortPartial
}

export interface IMongqlGlobalAndBaseSchemaCommonFull {
  generate: IGenerateFull,
  output: IOutputFull,
  Fragments: Record<string, string[]>,
  sort: ISortFull
}

export type ModuleEnumType = "esm" | "cjs";

export type JSExportConfigFull = {
  module: ModuleEnumType,
  importGql: boolean
};

export type JSExportConfigPartial = {
  module?: ModuleEnumType,
  importGql?: boolean
};

/**
 * Partial interface for Mongql Global configs
 */
export interface IMongqlGlobalConfigsPartial extends IMongqlGlobalAndBaseSchemaCommonPartial {
  Schemas: IMongqlMongooseSchemaPartial[],
  Typedefs?: {
    init?: string | Record<string, string | DocumentNode>,
    base?: string | DocumentNode
  },
  Resolvers?: {
    init?: string | Record<string, IResolverPartial>,
    base?: IResolverPartial
  },
  Operations?: JSExportConfigPartial
}

/**
 * Full interface for Mongql Global configs
 */
export interface IMongqlGlobalConfigsFull extends IMongqlGlobalAndBaseSchemaCommonFull {
  Schemas: IMongqlMongooseSchemaFull[],
  Typedefs: {
    init: undefined | Record<string, DocumentNode>,
    base: undefined | string | DocumentNode
  },
  Resolvers: {
    init: undefined | Record<string, IResolverFull>,
    base: undefined | IResolverFull
  },
  Operations: JSExportConfigFull
}


/**
 * Partial interface for Mongql BaseSchema Configs
 */
export interface IMongqlBaseSchemaConfigsPartial extends IMongqlGlobalAndBaseSchemaCommonPartial {
  resource: string,
  skip?: boolean,
  TypeDefs?: DocumentNode,
  Resolvers?: IResolverPartial,
  uniqueBy?: string[],
  unAuthOpsList?: string[],
}

/**
 * Full interface for Mongql BaseSchema Configs
 */
export interface IMongqlBaseSchemaConfigsFull extends IMongqlGlobalAndBaseSchemaCommonFull {
  resource: string,
  skip: boolean,
  TypeDefs: DocumentNode | undefined,
  Resolvers: IResolverFull | undefined,
  uniqueBy: undefined | string[],
  unAuthOpsList: [] | string[],
}

/**
 * Full interface for Mongql NestedSchema Configs extending Mongql Field Config
 */
export interface IMongqlNestedSchemaConfigsFull extends IMongqlFieldConfigsFull {
  generate: IGenerateFull,
  Fragments: Record<string, string[]>,
  type: undefined | string
}

/**
 * Partial interface for Mongql NestedSchema Configs extending Mongql Field Config
 */
export interface IMongqlNestedSchemaConfigsPartial extends IMongqlFieldConfigsPartial {
  generate?: IGeneratePartial,
  Fragments?: Record<string, string[]>,
  type?: string
}

/**
 * Full type for Field config attach.object option
 */
export type MongqlFieldAttachObjectConfigsFull = {
  [key in AuthEnumString]: boolean
}

/**
 * Partial type for Field config attach.object option
 */
export type MongqlFieldAttachObjectConfigsPartial = {
  [key in AuthEnumString]?: boolean
}

/**
 * Full type for Field config attach.input option
 */
export type MongqlFieldAttachInputConfigsFull = {
  [key in InputActionEnumString]: boolean
}

/**
 * Full type for Field config nullable.object option
 */
export type MongqlFieldNullableObjectConfigsFull = {
  [key in AuthEnumString]: boolean[]
}

/**
 * Partial type for Field config nullable.object option
 */
export type MongqlFieldNullableObjectConfigsPartial = {
  [key in AuthEnumString]?: boolean[]
}

/**
 * Full type for Field config nullable.input option
 */
export type MongqlFieldNullableInputConfigsFull = {
  [key in InputActionEnumString]: boolean[]
}

/**
 * Partial type for Field config nullable.input option
 */
export type MongqlFieldNullableInputConfigsPartial = {
  [key in InputActionEnumString]?: boolean[]
}

/**
 * Partial type for Field config authMapper option
 */
export type MongqlFieldAuthMapperConfigsPartial = {
  [key in AuthEnumString]?: key
}

/**
 * Full type for Field config authMapper option
 */
export type MongqlFieldAuthMapperConfigsFull = {
  [key in AuthEnumString]: key
}

/**
 * Full interface for Mongql Field Configs
 */
export interface IMongqlFieldConfigsFull {
  description: string | undefined,
  nullable: {
    object: MongqlFieldNullableObjectConfigsFull,
    input: MongqlFieldNullableInputConfigsFull
  },
  attach: IGenerateTypeFull,
  authMapper: MongqlFieldAuthMapperConfigsFull
}

/**
 * Partial interface for Mongql Field Configs
 */
export interface IMongqlFieldConfigsPartial {
  description?: string,
  nullable?: {
    object?: MongqlFieldNullableObjectConfigsPartial,
    input?: MongqlFieldNullableInputConfigsPartial
  },
  attach?: IGenerateTypePartial,
  authMapper?: MongqlFieldAuthMapperConfigsPartial
}

/**
 * Generated info for mongoose field
 */
export interface FieldInfo extends ISpecificTypeInfo {
  generic_type: string,
  excludedAuthSegments: AuthEnumString[],
  includedAuthSegments: AuthEnumString[],
  fieldDepth: number,
  path: MongqlFieldPath[],
  auth?: AuthEnumString
}

export interface MongqlFieldPath {
  object_type: string,
  enum_type: null | string,
  key: string
}

/**
 * Mongoose field generated config and info
 */
export interface FieldFullInfo extends IMongqlFieldConfigsFull, FieldInfo {
  decorated_types: {
    object: {
      self?: string,
      others?: string,
      mixed?: string,
    },
    input: {
      create?: string,
      update?: string
    }
  }
}

/**
 * Mongoose field generated specific type info
 */
export interface ISpecificTypeInfo {
  object_type: string,
  input_type: string,
  ref_type: string,
  enum_type: null | string
}

/**
 * Extended ObjectTypeApi having fields key
 */
interface ExtendedObjectTypeApi extends ObjectTypeApi {
  fields: { [key: string]: FieldFullInfo }
}

/**
 * Generated types by mongql types generation
 */
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
}

export type PartEnumString = keyof typeof PartEnum;

export enum TargetEnum {
  single,
  multi
}

export type TargetEnumString = keyof typeof TargetEnum;

/**
 * Mutable document node by making definitions key mutable
 */
export interface MutableDocumentNode extends DocumentNode {
  definitions: DefinitionNode[]
}

/**
 * Full Resolver implementation
 */
export interface IResolverFull {
  Query: { [key: string]: any },
  Mutation: { [key: string]: any },
  [key: string]: any
}

/**
 * Partial Resolver implementation
 */
export interface IResolverPartial {
  Query?: { [key: string]: any },
  Mutation?: { [key: string]: any },
  [key: string]: any
}

export type FieldsFullInfo = {
  [key: string]: FieldFullInfo
}

export type FieldsFullInfos = FieldsFullInfo[]

export interface IMongqlTypeNode {
  type: TypeNode,
  kind: "NamedType" | "NonNullType" | "ListType",
  name: string
}

/**
 * Mongql pagination input for resolvers
 */
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

/**
 * Mongql Partial type for base or nested Schema config
 */
export type MongqlSchemaConfigsPartial = IMongqlBaseSchemaConfigsPartial | IMongqlNestedSchemaConfigsPartial;

/**
 * Mongql Full type for base or nested Schema config
 */
export type MongqlSchemaConfigsFull = IMongqlBaseSchemaConfigsFull | IMongqlNestedSchemaConfigsFull;

export type TSchemaInfo = Record<string, MongqlSchemaConfigsFull & { fields: FieldsFullInfo }>
export type TSchemaInfos = TSchemaInfo[];

/**
 * Generated Schema Info containing Fields and Types info
 */

export type TParsedSchemaInfo = {
  Types: IMongqlGeneratedTypes,
  Fields: FieldsFullInfos,
  Schemas: TSchemaInfos,
  Operations: string[]
}

export type TFragmentInfoMap = Record<string, { [k: string]: string | false }>;