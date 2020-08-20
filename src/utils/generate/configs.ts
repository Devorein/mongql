import { IMongqlGlobalConfigsPartial, IGeneratePartial, MongqlSchemaConfigsPartial, IMongqlFieldConfigsFull, IMongqlBaseSchemaConfigsFull, IMongqlGlobalConfigsFull, IMongqlNestedSchemaConfigsFull, MongqlSchemaConfigsFull, IMongqlBaseSchemaConfigsPartial } from "../../types";

import { populateObjDefaultValue, nestedObjPopulation } from '../../utils/objManip';
import { calculateFieldDepth } from '../mongoose';

import generateOptions from "./options";

/**
 * Generate full Global config
 * @param InitialMongqlGlobalConfig Initial Mongql Global Config by the user
 * @returns Generated Full Mongql Global Config
 */
function generateGlobalConfigs(InitialMongqlGlobalConfig: IMongqlGlobalConfigsPartial): IMongqlGlobalConfigsFull {
  const { mutation, query, type } = generateOptions();

  if (InitialMongqlGlobalConfig?.sort === false)
    populateLeafsFromStem(InitialMongqlGlobalConfig, 'sort', ['nodes', 'operations'], false);

  return populateObjDefaultValue(InitialMongqlGlobalConfig, {
    output: {
      AST: undefined,
      SDL: undefined,
      Operation: undefined
    },
    generate: {
      mutation: nestedObjPopulation((InitialMongqlGlobalConfig?.generate as IGeneratePartial)?.mutation, mutation.options),
      type: nestedObjPopulation((InitialMongqlGlobalConfig?.generate as IGeneratePartial)?.type, type.options),
      query: nestedObjPopulation((InitialMongqlGlobalConfig?.generate as IGeneratePartial)?.query, query.options)
    },
    Typedefs: {
      init: undefined,
      base: undefined
    },
    Resolvers: {
      init: undefined
    },
    Fragments: {},
    sort: { fields: true, nodes: true },
    Operations: {
      module: "esm",
      importGql: false
    }
  });
}

function populateLeafsFromStem(stemparent: any, stem: string, leafs: string[], value: any) {
  stemparent[stem] = {};
  leafs.forEach(leaf => stemparent[stem][leaf] = value)
}

/**
 * Generate full Schema config
 * @param MongqlSchemaConfig Mongql Schema Config
 * @param ExtensionSchema Schema to extend
 * @returns Generated MongqlSchemaConfig
 */
function generateBaseSchemaConfigs(MongqlBaseSchemaConfig: IMongqlBaseSchemaConfigsPartial, ExtensionSchema: IMongqlGlobalConfigsFull): IMongqlBaseSchemaConfigsFull {
  if (MongqlBaseSchemaConfig?.sort === false)
    populateLeafsFromStem(MongqlBaseSchemaConfig, 'sort', ['nodes', 'operations'], false);
  const ModifiedMongqlGlobalConfig: { [key: string]: any } = Object.assign({}, ExtensionSchema);
  const ModifiedMongqlSchemaConfig: { [key: string]: any } = Object.assign({}, MongqlBaseSchemaConfig);
  ['Typedefs', 'Resolvers', 'Schemas'].forEach(globalConfigKey => delete ModifiedMongqlGlobalConfig[globalConfigKey]);
  ModifiedMongqlSchemaConfig.generate = {
    mutation: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.mutation, ModifiedMongqlGlobalConfig.generate.mutation),
    type: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.type, ModifiedMongqlGlobalConfig.generate.type),
    query: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.query, ModifiedMongqlGlobalConfig.generate.query)
  };
  return populateObjDefaultValue(ModifiedMongqlSchemaConfig, Object.assign({}, ModifiedMongqlGlobalConfig, { skip: false, uniqueBy: undefined, unAuthOpsList: [] }));
}

/**
 * Generate full Schema config
 * @param MongqlSchemaConfig Mongql Schema Config
 * @param ExtensionSchema Schema to extend
 * @returns Generated MongqlSchemaConfig
 */
function generateNestedSchemaConfigs(MongqlSchemaConfig: MongqlSchemaConfigsPartial, ParentSchema: MongqlSchemaConfigsFull): IMongqlNestedSchemaConfigsFull {
  const ModifiedMongqlParentSchemaConfig: { [key: string]: any } = Object.assign({}, ParentSchema);
  const ModifiedMongqlNestedSchemaConfig: { [key: string]: any } = Object.assign({}, MongqlSchemaConfig);
  ModifiedMongqlNestedSchemaConfig.generate = {
    mutation: nestedObjPopulation(ModifiedMongqlNestedSchemaConfig?.generate?.mutation, ModifiedMongqlParentSchemaConfig.generate.mutation),
    type: nestedObjPopulation(ModifiedMongqlNestedSchemaConfig?.generate?.type, ModifiedMongqlParentSchemaConfig.generate.type),
    query: nestedObjPopulation(ModifiedMongqlNestedSchemaConfig?.generate?.query, ModifiedMongqlParentSchemaConfig.generate.query)
  };
  delete ModifiedMongqlNestedSchemaConfig.attach;

  return populateObjDefaultValue(ModifiedMongqlNestedSchemaConfig, { type: undefined, Fragments: {} });
}

/**
 * Generate full field config
 * @param MongooseField Field to parse
 * @param ParentSchema Schema to extend
 * @returns The extracted field options populated with default values
 */

function generateFieldConfigs(MongooseField: any, ParentSchema: MongqlSchemaConfigsFull): IMongqlFieldConfigsFull {
  const [fieldDepth, InnerMongooseField] = calculateFieldDepth(MongooseField);

  if (Array.isArray(InnerMongooseField?.mongql?.nullable?.object))
    populateLeafsFromStem(InnerMongooseField.mongql.nullable, 'object', ['mixed', 'self', 'others'], [...InnerMongooseField.mongql.nullable.object]);
  if (Array.isArray(InnerMongooseField?.mongql?.nullable?.input))
    populateLeafsFromStem(InnerMongooseField.mongql.nullable, 'object', ['create', 'update'], [...InnerMongooseField.mongql.nullable.input]);

  if (InnerMongooseField?.mongql?.attach === false)
    populateLeafsFromStem(InnerMongooseField.mongql, 'attach', ['input', 'object', 'interface', 'enum', 'union', 'fragment'], false);
  if (InnerMongooseField?.mongql?.attach?.input === false)
    populateLeafsFromStem(InnerMongooseField.mongql.attach, 'input', ['create', 'update'], false);
  if (InnerMongooseField?.mongql?.attach?.object === false)
    populateLeafsFromStem(InnerMongooseField.mongql.attach, 'object', ['mixed', 'self', 'others'], false);

  const GeneratedMongooseFieldConfig = populateObjDefaultValue(InnerMongooseField.mongql || {}, {
    nullable: {
      object: {
        mixed: [false],
        others: [false],
        self: [false]
      },
      input: {
        create: [false],
        update: [true]
      }
    },
    attach: populateObjDefaultValue(InnerMongooseField?.mongql?.generate?.type || ParentSchema.generate.type, {
      object: {
        mixed: true,
        others: true,
        self: true
      },
      input: {
        create: true,
        update: true
      },
      interface: true,
      enum: true,
      fragment: true
    }),
    authMapper: {
      Mixed: 'Mixed',
      Others: 'Others',
      Self: 'Self',
    },
    description: undefined
  });

  ['mixed', 'self', 'others'].forEach(auth => {
    let initialObjNullable = GeneratedMongooseFieldConfig.nullable.object[auth].length;
    while (initialObjNullable++ <= fieldDepth)
      GeneratedMongooseFieldConfig.nullable.object[auth].push(false);
  });
  ['create', 'update'].forEach(action => {
    let initialInputNullable = GeneratedMongooseFieldConfig.nullable.input[action].length;
    while (initialInputNullable++ <= fieldDepth)
      GeneratedMongooseFieldConfig.nullable.input[action].push(false);
  })
  return GeneratedMongooseFieldConfig;
}

export {
  generateFieldConfigs,
  generateGlobalConfigs,
  generateBaseSchemaConfigs,
  generateNestedSchemaConfigs
};