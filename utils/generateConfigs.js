const { populateObjDefaultValue, nestedObjPopulation } = require('../utils/objManip');
const { calculateFieldDepth } = require('./mongoose');

const GenerateOptions = require("./generateOptions");

/**
 * Generate full Schema config
 * @param {MongqlGlobalConfig} InitialMongqlGlobalConfig Initial Mongql Global Config
 * @returns {MongqlGlobalConfig} Generated MongqlSchemaConfig
 */
function generateGlobalConfigs(InitialMongqlGlobalConfig) {
  return populateObjDefaultValue(InitialMongqlGlobalConfig, {
    output: false,
    generate: {
      mutation: nestedObjPopulation(InitialMongqlGlobalConfig?.generate?.mutation, GenerateOptions.mutation.options),
      type: nestedObjPopulation(InitialMongqlGlobalConfig?.generate?.type, GenerateOptions.type.options),
      query: nestedObjPopulation(InitialMongqlGlobalConfig?.generate?.query, GenerateOptions.query.options)
    },
    Typedefs: {
      init: {},
    },
    Resolvers: {
      init: {}
    }
  });
}

/**
 * Generate full Schema config
 * @param {MongqlSchemaConfig} MongqlSchemaConfig Mongql Schema Config
 * @param {MongqlGlobalConfig} MongqlGlobalConfig Mongql Global Config
 * @returns {MongqlSchemaConfig} Generated MongqlSchemaConfig
 */
function generateSchemaConfigs(MongqlSchemaConfig, MongqlGlobalConfig) {
  const ModifiedMongqlGlobalConfig = Object.assign({}, MongqlGlobalConfig);
  const ModifiedMongqlSchemaConfig = Object.assign({}, MongqlSchemaConfig);
  ['Typedefs', 'Resolvers', 'Schemas'].forEach(globalConfigKey => delete ModifiedMongqlGlobalConfig[globalConfigKey]);
  ModifiedMongqlSchemaConfig.generate = {
    mutation: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.mutation, ModifiedMongqlGlobalConfig.generate.mutation),
    type: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.type, ModifiedMongqlGlobalConfig.generate.type),
    query: nestedObjPopulation(ModifiedMongqlSchemaConfig?.generate?.query, ModifiedMongqlGlobalConfig.generate.query)
  };
  return populateObjDefaultValue(ModifiedMongqlSchemaConfig, { ...ModifiedMongqlGlobalConfig, skip: false });
}

/**
 * Extract the field options and sets default values
 * @param {MongooseField} MongooseField Field to parse
 * @returns {MongqlFieldConfig} The extracted field options populated with default values
 */
function generateFieldConfigs(MongooseField) {
  const [fieldDepth, InnerMongooseField] = calculateFieldDepth(MongooseField);

  const { mongql: MongooseFieldConfig = {} } = InnerMongooseField;

  const GeneratedMongooseFieldConfig = populateObjDefaultValue(MongooseFieldConfig, {
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

module.exports = {
  generateFieldConfigs,
  generateGlobalConfigs,
  generateSchemaConfigs
};