import S from 'voca';
import { Schema } from 'mongoose';
import { t, objectTypeApi, enumTypeApi, interfaceTypeApi, inputTypeApi, unionTypeApi, TypeDefinitonApi } from 'graphql-extra';
import { resolvers } from 'graphql-scalars';
import { GraphQLScalarType, DocumentNode, NamedTypeNode } from "graphql";

import { IMongqlBaseSchemaConfigsFull, IMongqlFieldConfigsFull, ISpecificTypeInfo, IMongqlMongooseSchemaFull, MongqlSchemaConfigsPartial, IMongqlGeneratedTypes, MongqlFieldAttachObjectConfigsFull, AuthEnumString, InputActionEnumString, MutableDocumentNode, FieldsFullInfos, FieldInfo, FieldFullInfo } from "../types";
import Password from "../utils/gql-types/password";
import Username from "../utils/gql-types/username";

import { generateSchemaConfigs, generateFieldConfigs } from "../utils/generate/configs";
import { calculateFieldDepth } from "../utils/mongoose";

const Validators: { [key: string]: GraphQLScalarType["serialize"] } = {
  Password: Password.serialize,
  Username: Username.serialize
};

Object.entries({ ...resolvers }).forEach(([key, value]) => {
  Validators[key] = value.serialize;
});

function snakeCapitalize(type: string): string {
  return type.split('_').map(c => S.capitalize(c)).join(' ');
}

/**
 * Adds graphql nullable and list information to the type
 * @param {string} type The type to decorate
 * @param {boolean[]} reference reference array for decorating with list and null
 * @returns {string} Decorated type
 */
function decorateTypes(type: string, reference: boolean[]): string {
  let currentNested = 0;
  while (currentNested < reference.length - 1) {
    type = `[${type}${!reference[currentNested] ? '!' : ''}]`;
    currentNested++;
  }
  type = `${type}${!reference[currentNested] ? '!' : ''}`
  return type;
}

/**
 * Generate the generic_type for the field
 * @param {MongooseField} value Mongoose Field to parse
 * @returns {string} The generated type generic_type of the field 
 */
function generateGenericType(value: any): string {
  let generic_type = 'mongoose';
  const instanceOfSchema = value instanceof Schema || Object.getPrototypeOf(value).instanceOfSchema;
  if (instanceOfSchema) generic_type = 'object';
  else if (value.enum) generic_type = 'enum';
  else if (value.ref) generic_type = 'ref';
  else if (value.mongql?.scalar) generic_type = 'scalar';
  return generic_type;
}

/**
 * Parses and returns the Mongoose field GQL scalar type
 * @param {MongooseField} mongooseField Mongoose field to parse
 * @returns {string} parsed type
 */
function parseScalarType(mongooseField: any): string {
  const scalar = mongooseField.mongql?.scalar;
  let type = mongooseField.type;
  while (Array.isArray(type))
    type = type[0];

  if (scalar)
    type = scalar;
  else if (type) type = type.name;
  else type = mongooseField.name;

  if (type.match(/(Int32|Number)/)) type = 'Int';
  else if (type === 'Double') type = 'Float';

  if (type === 'ObjectId') type = 'ID';

  return type;
}

/**
 * Generate object, input and resource type without adding nullable or List syntax
 * @param {string} generic_type generic_type of the field
 * @param {MongooseField} value Mongoose field to generate type from
 * @param {string} key The name of the field
 * @param {string} parentKey The name of the parent of the field
 * @param {SchemaConfigs} SchemaConfigs Schema configuration
 * @returns {ISpecificTypeInfo} Generated type from a field
 */
function generateSpecificType(generic_type: string, value: any, key: string, parentKey: MongqlPath, schemaConfigs: IMongqlBaseSchemaConfigsFull): ISpecificTypeInfo {
  const { resource } = schemaConfigs;

  let object_type = '',
    input_type = null,
    ref_type = null;
  if (generic_type.match(/(object)/)) {
    object_type = S.capitalize(resource) + S.capitalize(value.mongql?.type || key);
    input_type = object_type + 'Input'
  }
  else if (generic_type === 'enum')
    object_type = (parentKey ? parentKey.object_type + "_" : S.capitalize(resource) + '_').toUpperCase() + key.toUpperCase();
  else if (generic_type.match('ref')) {
    object_type = value.ref;
    input_type = `ID`;
    ref_type = value.ref;
  } else if (generic_type.match(/(scalar|mongoose)/))
    object_type = parseScalarType(value);

  input_type = input_type ? input_type : object_type;
  return { object_type, input_type, ref_type };
}

const generateIncludedAuthSegments = (schema_object_auth: any, parentSchema_object_auth: string[] | any): [AuthEnumString[], AuthEnumString[]] => {
  const filterTrueKey = (obj: MongqlFieldAttachObjectConfigsFull) => Object.entries(obj).filter((entry) => entry[1]).map(([key]) => key);
  const parentSchema_auth_segments = Array.isArray(parentSchema_object_auth) ? parentSchema_object_auth : filterTrueKey(parentSchema_object_auth);
  const included_auth_segments = filterTrueKey(schema_object_auth).filter((auth) => parentSchema_auth_segments.includes(auth));
  const excluded_auth_segments = ['self', 'others', 'mixed'].filter(auth => !included_auth_segments.includes(auth));
  return [excluded_auth_segments as AuthEnumString[], included_auth_segments as AuthEnumString[]]
}

type MongqlPath = {
  object_type: string,
  key: string
}

/**
 * Parse the MongooseSchema and populate the Graphql AST
 * @param {MongooseSchema} BaseSchema Mongoose Schema to parse
 * @param {DocumentNode} [InitTypedefsAST] initial documentnode to add to 
 * @return {GraphqlDocumentNode} Generated GraphqlDocumentNode
 */
function parseMongooseSchema(BaseSchema: IMongqlMongooseSchemaFull, InitTypedefsAST: DocumentNode | undefined) {
  const BaseSchemaConfigs = BaseSchema.mongql;
  const cr = S.capitalize(BaseSchemaConfigs.resource);
  const DocumentNode = {
    kind: 'Document',
    definitions: InitTypedefsAST ? [...InitTypedefsAST.definitions] : []
  };

  const Fields: FieldsFullInfos = [];
  const Types: IMongqlGeneratedTypes = {
    enums: [],
    unions: [],
    interfaces: [],
    objects: [],
    inputs: [],
  };

  function hasFields(AST: any): boolean {
    return (AST.fields || AST.values || AST.types).length > 0;
  }

  function _inner(Schema: IMongqlMongooseSchemaFull, Type: string, path: MongqlPath[], ParentSchemaConfigs: IMongqlBaseSchemaConfigsFull) {
    const SchemaConfigs: MongqlSchemaConfigsPartial = Schema.mongql || {};
    const GeneratedSchemaConfigs: IMongqlBaseSchemaConfigsFull = generateSchemaConfigs(SchemaConfigs, ParentSchemaConfigs)
    const parentKey: MongqlPath = path[path.length - 1];
    const [, innerSchema_included_auth_segments] = generateIncludedAuthSegments(GeneratedSchemaConfigs.generate.type.object, ParentSchemaConfigs.generate.type.object);

    Object.values(Types).forEach(type => {
      if (!type[path.length]) type[path.length] = {}
    });

    const Interfaces = Types.interfaces[path.length];
    const Enums = Types.enums[path.length];
    const Objects = Types.objects[path.length];
    const Inputs = Types.inputs[path.length];
    const Unions = Types.unions[path.length];

    const UnionsObjTypes: NamedTypeNode[] = []
    innerSchema_included_auth_segments.forEach((auth) => {
      const ObjectName = `${S.capitalize(auth)}${Type}Object`;
      Objects[ObjectName] = Object.assign({}, objectTypeApi(
        t.objectType({
          name: ObjectName,
          description: `${S.capitalize(auth)} ${Type} Object Layer ${path.length + 1}`,
          fields: [],
          interfaces: GeneratedSchemaConfigs.generate.type.interface ? [`${Type}Interface`] : []
        })
      ), { fields: {} });
      UnionsObjTypes.push({
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: ObjectName
        }
      })
    });

    Unions[`${Type}Union`] = unionTypeApi(
      t.unionType({
        name: `${Type}Union`,
        description: `${Type} Union Layer ${path.length + 1}`,
        types: UnionsObjTypes
      })
    );

    ['Create', 'Update'].forEach(action => {
      Inputs[`${action}${Type}Input`] = inputTypeApi(
        t.inputType({
          name: `${action}${Type}Input`,
          description: `${action} ${Type} Input Layer ${path.length + 1}`,
          fields: []
        })
      );
    })

    Interfaces[`${Type}Interface`] = interfaceTypeApi(
      t.interfaceType({
        name: `${Type}Interface`,
        description: `${Type} Interface Layer ${path.length + 1}`,
        fields: []
      })
    );

    if (!Fields[path.length]) Fields.push({});

    Object.entries(Schema.obj).forEach((entry) => {
      const key = entry[0], value: any = entry[1];
      const [fieldDepth, innerValue] = calculateFieldDepth(value);
      const generatedFieldConfigs: IMongqlFieldConfigsFull = generateFieldConfigs(value, GeneratedSchemaConfigs);
      const { description, authMapper, nullable: { input: nullable_input, object: nullable_object }, attach: { input: attach_to_input, interface: attach_to_interface, enum: attach_to_enum } } = generatedFieldConfigs;
      const generic_type = generateGenericType(innerValue) + (fieldDepth > 0 ? 's' : '');
      let { object_type, input_type, ref_type } = generateSpecificType(generic_type, innerValue, key, parentKey, GeneratedSchemaConfigs);
      const generatedIncludedAuthSegments = generateIncludedAuthSegments(generatedFieldConfigs.attach.object, innerSchema_included_auth_segments);
      const field_excluded_auth_segments = generatedIncludedAuthSegments[0];
      const field_included_auth_segments: AuthEnumString[] = generatedIncludedAuthSegments[1];

      path = parentKey ? [...path, { object_type, key }] : [{ object_type, key }];
      const generatedFieldInfo: FieldInfo = {
        input_type,
        generic_type,
        ref_type,
        object_type,
        excludedAuthSegments: field_excluded_auth_segments,
        fieldDepth
      };
      const generatedFieldFullInfo: FieldFullInfo = { ...generatedFieldConfigs, ...generatedFieldInfo }
      Fields[path.length - 1][key] = generatedFieldFullInfo;
      if (generic_type.match(/(scalar)/))
        BaseSchema.path(path.map(({ key }) => key).join('.')).validate((v: any) => {
          const value = Validators[object_type](v);
          return value !== null && value !== undefined;
        }, (props: any) => props.reason.message);

      field_included_auth_segments.forEach((auth) => {
        path[path.length - 1] = { object_type, key };
        const auth_object_type = generic_type.match(/(ref|object)/)
          ? authMapper[S.capitalize(auth) as AuthEnumString] + object_type + "Object"
          : object_type;
        const decorated_object_type = decorateTypes(auth_object_type, nullable_object[auth]);
        const object_key = `${S.capitalize(auth)}${Type}Object`;
        if (!Objects[object_key].hasField(key)) {
          Objects[object_key].fields[key] = generatedFieldFullInfo
          Objects[object_key].createField({
            name: key, description, type: decorated_object_type
          });
        }
      });

      ['create', 'update'].forEach((action) => {
        const _action = S.capitalize(action)
        if (GeneratedSchemaConfigs.generate.type.input[action as InputActionEnumString] && attach_to_input[action as InputActionEnumString] && !Inputs[`${_action}${Type}Input`].hasField(key))
          Inputs[`${_action}${Type}Input`].createField({ name: key, type: decorateTypes((generic_type.match(/(object)/) ? _action : "") + input_type, nullable_input[action as InputActionEnumString]) });
      })

      if (GeneratedSchemaConfigs.generate.type.enum && attach_to_enum && generic_type.match(/(enum)/))
        Enums[object_type] = enumTypeApi(t.enumType({
          name: object_type,
          description: snakeCapitalize(`${parentKey ? parentKey.object_type : Type}_${key}_enum`),
          values: [...value.enum]
        }));

      if (GeneratedSchemaConfigs.generate.type.interface && (field_excluded_auth_segments.length !== 2 && field_included_auth_segments.length !== 2) && attach_to_interface && !Interfaces[`${Type}Interface`].hasField(key))
        Interfaces[`${Type}Interface`].createField({
          name: key, type: decorateTypes(object_type + (generic_type.match(/(ref|object)/) ? "Union" : ""), nullable_object[(field_included_auth_segments)[0]])
        })

      if (generic_type.match(/(object)/))
        _inner(innerValue, object_type, path, GeneratedSchemaConfigs);
      path.pop();
      if (value.mongql) delete value.mongql;
    });
    if (Schema.mongql && parentKey)
      delete Schema.mongql
  }

  _inner(BaseSchema, cr, [], BaseSchemaConfigs);

  Object.values(Types).forEach((types) => {
    types.forEach((type: TypeDefinitonApi) => {
      Object.values(type).forEach((value) => {
        if (hasFields(value.node)) DocumentNode.definitions.push(value.node || value);
      });
    })
  });

  return {
    DocumentAST: DocumentNode as MutableDocumentNode,
    SchemaInfo: {
      Types,
      Fields,
    }
  };
}

export {
  parseMongooseSchema,
  decorateTypes,
  generateGenericType,
  parseScalarType,
  generateSpecificType
};