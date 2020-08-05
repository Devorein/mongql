import { IMongqlGlobalConfigsPartial, IGeneratePartial, MongqlSchemaConfigsPartial, IMongqlFieldConfigsFull, IMongqlBaseSchemaConfigsFull, IMongqlGlobalConfigsFull, IMongqlNestedSchemaConfigsFull } from "../../types";

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
  return populateObjDefaultValue(InitialMongqlGlobalConfig, {
    output: {
      AST: undefined,
      SDL: undefined
    },
    generate: {
      mutation: nestedObjPopulation((InitialMongqlGlobalConfig?.generate as IGeneratePartial)?.mutation, mutation.options),
      type: nestedObjPopulation((InitialMongqlGlobalConfig?.generate as IGeneratePartial)?.type, type.options),
      query: nestedObjPopulation((InitialMongqlGlobalConfig?.generate as IGeneratePartial)?.query, query.options)
    },
    Typedefs: {
      init: undefined,
    },
    Resolvers: {
      init: undefined
    },
  });
}

/**
 * Generate full Schema config
 * @param MongqlSchemaConfig Mongql Schema Config
 * @param ExtensionSchema Schema to extend
 * @returns Generated MongqlSchemaConfig
 */
function generateSchemaConfigs(MongqlSchemaConfig: MongqlSchemaConfigsPartial, ExtensionSchema: IMongqlGlobalConfigsFull | IMongqlBaseSchemaConfigsFull | IMongqlNestedSchemaConfigsFull): IMongqlBaseSchemaConfigsFull {
  const ModifiedMongqlGlobalConfig: { [key: string]: any } = Object.assign({}, ExtensionSchema);
  const ModifiedMongqlSchemaConfig: { [key: string]: any } = Object.assign({}, MongqlSchemaConfig);
  ['Typedefs', 'Resolvers', 'Schemas'].forEach(globalConfigKey => delete ModifiedMongqlGlobalConfig[globalConfigKey]);
  ModifiedMongqlSchemaConfig.generate = {
    mutation: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.mutation, ModifiedMongqlGlobalConfig.generate.mutation),
    type: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.type, ModifiedMongqlGlobalConfig.generate.type),
    query: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.query, ModifiedMongqlGlobalConfig.generate.query)
  };
  return populateObjDefaultValue(ModifiedMongqlSchemaConfig, { ...ModifiedMongqlGlobalConfig, skip: false, uniqueBy: undefined });
}

/**
 * Generate full field config
 * @param MongooseField Field to parse
 * @param ExtensionSchema Schema to extend
 * @returns The extracted field options populated with default values
 */
function generateFieldConfigs(MongooseField: any, ExtensionSchema: IMongqlBaseSchemaConfigsFull | IMongqlNestedSchemaConfigsFull): IMongqlFieldConfigsFull {
  const [fieldDepth, InnerMongooseField] = calculateFieldDepth(MongooseField);

  const { mongql: MongooseFieldConfig = {} } = InnerMongooseField;

  const GeneratedMongooseFieldConfig = populateObjDefaultValue(MongooseFieldConfig, Object.assign({}, {
    nullable: {
      object: {
        mixed: [],
        others: [],
        self: []
      },
      input: {
        create: [],
        update: []
      }
    },
    attach: {
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
      enum: true
    },
    authMapper: {
      Mixed: 'Mixed',
      Others: 'Others',
      Self: 'Self',
    }
  }, ExtensionSchema));

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
  generateSchemaConfigs
};