const S = require('voca');
const mongoose = require('mongoose');
const { t, objectTypeApi, interfaceTypeApi, inputTypeApi, unionTypeApi } = require('graphql-extra');
const { resolvers } = require('graphql-scalars');

const { enumTypeApi } = require('graphql-extra');

const Password = require("../utils/gql-types/password");
const Username = require("../utils/gql-types/username");

const { generateSchemaConfigs, generateFieldConfigs } = require("../utils/generateConfigs");
const { calculateFieldDepth } = require("../utils/mongoose");

const Validators = {
  Password: Password.serialize,
  Username: Username.serialize
};

Object.entries({ ...resolvers }).forEach(([key, value]) => {
  Validators[key] = value.serialize;
});

function snakeCapitalize(type) {
  return type.split('_').map(c => S.capitalize(c)).join(' ');
}

/**
 * Adds graphql nullable and list information to the type
 * @param {string} type The type to decorate
 * @param {boolean[]} reference reference array for decorating with list and null
 * @returns {string} Decorated type
 */
function decorateTypes(type, reference) {
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
function generateGenericType(value) {
  let generic_type = 'mongoose';
  const instanceOfSchema = value instanceof mongoose.Schema || Object.getPrototypeOf(value).instanceOfSchema;
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
function parseScalarType(mongooseField) {
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
 * @returns {string} Generated type from a field
 */
function generateSpecificType(generic_type, value, key, parentKey, schemaConfigs) {
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

const generateIncludedAuthSegments = (schema_object_auth, parentSchema_object_auth) => {
  const filterTrueKey = (obj) => Object.entries(obj).filter((entry) => entry[1]).map(([key]) => key);
  const parentSchema_auth_segments = Array.isArray(parentSchema_object_auth) ? parentSchema_object_auth : filterTrueKey(parentSchema_object_auth);
  const included_auth_segments = filterTrueKey(schema_object_auth).filter((auth) => parentSchema_auth_segments.includes(auth));
  const excluded_auth_segments = ['self', 'others', 'mixed'].filter(auth => !included_auth_segments.includes(auth));
  return [excluded_auth_segments, included_auth_segments]
}

/**
 * Parse the MongooseSchema and populate the Graphql AST
 * @param {MongooseSchema} BaseSchema Mongoose Schema to parse
 * @param {DocumentNode} [InitTypedefsAST] initial documentnode to add to 
 * @return {GraphqlDocumentNode} Generated GraphqlDocumentNode
 */
function parseMongooseSchema(BaseSchema, InitTypedefsAST) {
  const BaseSchemaConfigs = BaseSchema.mongql;
  const cr = S.capitalize(BaseSchemaConfigs.resource);
  const DocumentNode = {
    kind: 'Document',
    definitions: InitTypedefsAST ? [...InitTypedefsAST.definitions] : []
  };

  const Fields = [];
  const Types = {
    enums: [],
    unions: [],
    interfaces: [],
    objects: [],
    inputs: [],
  };

  function hasFields(AST) {
    return (AST.fields || AST.values || AST.types).length > 0;
  }

  function _inner(Schema, Type, path, ParentSchemaConfigs) {
    const { mongql: SchemaConfigs = {} } = Schema;
    const GeneratedSchemaConfigs = generateSchemaConfigs(SchemaConfigs, ParentSchemaConfigs)
    const parentKey = path[path.length - 1];
    const [, innerSchema_included_auth_segments] = generateIncludedAuthSegments(GeneratedSchemaConfigs.generate.type.object, ParentSchemaConfigs.generate.type.object);

    Object.values(Types).forEach(type => {
      if (!type[path.length]) type[path.length] = {}
    });

    const Interfaces = Types.interfaces[path.length];
    const Enums = Types.enums[path.length];
    const Objects = Types.objects[path.length];
    const Inputs = Types.inputs[path.length];
    const Unions = Types.unions[path.length];

    const UnionsObjTypes = []
    innerSchema_included_auth_segments.forEach((auth) => {
      const ObjectName = `${S.capitalize(auth)}${Type}Object`;
      Objects[ObjectName] = objectTypeApi(
        t.objectType({
          name: ObjectName,
          description: `${S.capitalize(auth)} ${Type} Object Layer ${path.length + 1}`,
          fields: [],
          interfaces: GeneratedSchemaConfigs.generate.type.interface ? [`${Type}Interface`] : []
        })
      )
      Objects[ObjectName].fields = {};
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

    Object.entries(Schema.obj).forEach(([key, value]) => {
      const [fieldDepth, innerValue] = calculateFieldDepth(value);
      const generatedFieldConfigs = generateFieldConfigs(value, GeneratedSchemaConfigs);
      const { description, authMapper, nullable: { input: nullable_input, object: nullable_object }, attach: { input: attach_to_input, interface: attach_to_interface, enum: attach_to_enum } } = generatedFieldConfigs;
      const generic_type = generateGenericType(innerValue) + (fieldDepth > 0 ? 's' : '');
      let { object_type, input_type, ref_type } = generateSpecificType(generic_type, innerValue, key, parentKey, GeneratedSchemaConfigs);

      const [field_excluded_auth_segments, field_included_auth_segments] = generateIncludedAuthSegments(generatedFieldConfigs.attach.object, innerSchema_included_auth_segments);

      path = parentKey ? [...path, { object_type, key }] : [{ object_type, key }];
      const commonFieldProps = {
        input_type,
        generic_type,
        ref_type,
        object_type,
        excludedAuthSegments: field_excluded_auth_segments,
        fieldDepth
      };

      if (generic_type.match(/(scalar)/))
        BaseSchema.path(path.map(({ key }) => key).join('.')).validate((v) => {
          const value = Validators[object_type](v);
          return value !== null && value !== undefined;
        }, (props) => props.reason.message);

      field_included_auth_segments.forEach((auth) => {
        path[path.length - 1] = { object_type, key };
        const auth_object_type = generic_type.match(/(ref|object)/)
          ? authMapper[S.capitalize(auth)] + object_type + "Object"
          : object_type;
        const decorated_object_type = decorateTypes(auth_object_type, nullable_object[auth]);
        const object_key = `${S.capitalize(auth)}${Type}Object`;
        if (!Objects[object_key].hasField(key)) {
          Objects[object_key].fields[key] = {
            ...commonFieldProps
          }
          Objects[object_key].createField({
            name: key, description, type: decorated_object_type
          });
        }
      });

      ['Create', 'Update'].forEach(action => {
        if (GeneratedSchemaConfigs.generate.type.input[action.toLowerCase()] && attach_to_input[action.toLowerCase()] && !Inputs[`${action}${Type}Input`].hasField(key))
          Inputs[`${action}${Type}Input`].createField({ name: key, type: decorateTypes((generic_type.match(/(object)/) ? action : "") + input_type, nullable_input[action.toLowerCase()]) });
      })

      if (GeneratedSchemaConfigs.generate.type.enum && attach_to_enum && generic_type.match(/(enum)/))
        Enums[object_type] = enumTypeApi(t.enumType({
          name: object_type,
          description: snakeCapitalize(`${parentKey ? parentKey.object_type : Type}_${key}_enum`),
          values: [...value.enum]
        }));

      if (GeneratedSchemaConfigs.generate.type.interface && (field_excluded_auth_segments.length !== 2 && field_included_auth_segments.length !== 2) && attach_to_interface && !Interfaces[`${Type}Interface`].hasField(key))
        Interfaces[`${Type}Interface`].createField({
          name: key, type: decorateTypes(object_type + (generic_type.match(/(ref|object)/) ? "Union" : ""), nullable_object[field_included_auth_segments[0]])
        })

      Fields[path.length - 1][key] = { ...generatedFieldConfigs, ...commonFieldProps };

      if (generic_type.match(/(object)/))
        _inner(innerValue, object_type, path, GeneratedSchemaConfigs);
      path.pop();
    });
  }

  _inner(BaseSchema, cr, [], BaseSchemaConfigs);

  Object.values(Types).forEach((types) => {
    types.forEach(type => {
      if (type.node) {
        if (hasFields(type.node))
          DocumentNode.definitions.push(type.node);
      }
      else
        Object.values(type).forEach((value) => {
          if (hasFields(value.node)) DocumentNode.definitions.push(value.node || value);
        });
    })
  });

  return {
    DocumentAST: DocumentNode,
    SchemaInfo: {
      Types,
      Fields,
    }
  };
}

module.exports = {
  parseMongooseSchema,
  decorateTypes,
  generateGenericType,
  parseScalarType,
  generateSpecificType,
  generateFieldConfigs
};