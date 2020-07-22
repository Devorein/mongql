const { resolvers, typeDefs } = require('graphql-scalars');
const colors = require('colors');
const { documentApi } = require("graphql-extra");
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const path = require('path');
const S = require('voca');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const gql = require("graphql-tag")
const mongoose = require('mongoose');

const Password = require("../utils/gql-types/password")
const Username = require("../utils/gql-types/username")

const nestedObjPopulation = require("../utils/nestedObjPopulation");

const loadFiles = require("../utils/loadFiles");
const generateTypedefs = require('./generateTypedefs');
const generateResolvers = require('./generateResolvers');
const populateObjDefaultValue = require('../utils/populateObjDefaultValue');

Array.prototype.forEachAsync = async function (cb) {
  for (let index = 0; index < this.length; index++) {
    await cb(this[index], index, this);
  }
};

function generateQueryOptions(){
  const obj = {};
  ['all','paginated','filtered','id'].forEach(range=>{
    obj[range] = {};
    ['self','others','mixed'].forEach(auth=>{
      obj[range][auth] = {};
      const parts = range.match(/(Id|Paginated)/) ? [ 'whole', 'nameandid' ] : [ 'whole', 'nameandid', 'count' ];
      parts.forEach(part=>{
        obj[range][auth][part] = true;
      })
    })
  });
  return obj;
}

const baseTypedefs = gql`
  type Query {
		_empty: Boolean
	}

	type Mutation {
		_empty: Boolean
	}

	type UsernameAndId {
		username: String!
		id: ID!
	}

	type NameAndId {
		name: String!
		id: ID!
	}

  input PaginationInput {
		page: Int!
		limit: Int!
		sort: String
		filter: JSON
	}
`;

class Mongql {
  #globalConfigs = {};
  #schemaConfigs = {};

  constructor(options) {
    this.#globalConfigs = {
      ...options,
      Validators: [],
      resources: [],
    };

    this.#checkSchemaPath();
    this.#createDefaultGlobalConfigs();
    // Going through each schema to populate schema configs
    this.#globalConfigs.Schemas.forEach((schema) => {
      if (schema.mongql === undefined)
        throw new Error(
          colors.red.bold`Resource doesnt have a mongql key on the schema`
        )
      const { resource } = schema.mongql;
      if (resource === undefined)
        throw new Error(colors.red.bold`Provide the mongoose schema resource key for mongql`);
      else this.#globalConfigs.resources.push(resource);
      this.#createDefaultSchemaConfigs(schema);
    })

    // Adding custom gql scalars to validators

    Object.entries({ ...resolvers }).forEach(([key, value]) => {
      this.#globalConfigs.Validators[key] = value.serialize;
    });

    this.#globalConfigs.Validators.Password = Password.serialize;
    this.#globalConfigs.Validators.Username = Username.serialize;
  }

  #checkSchemaPath = () => {
    let { Schemas } = this.#globalConfigs
    if (!Array.isArray(Schemas) && typeof Schemas === 'string') {
      const schemaPath = String(Schemas);
      Schemas = [];
      const files = fs.readdirSync(schemaPath);
      files.forEach(file => {
        const schemaFile = path.join(schemaPath, file);
        const fileWithoutExt = path.basename(file, path.extname(file));
        let imported = require(schemaFile);
        imported = imported[fileWithoutExt + "Schema"] === undefined ? imported : imported[fileWithoutExt + "Schema"];
        if (fileWithoutExt !== "index" && imported.mongql.skip !== true){
          Schemas.push(imported);
          imported.mongql.resource = S.capitalize(imported.mongql.resource);
        }
      })
      this.#globalConfigs.Schemas = Schemas;
    } else {
      this.#globalConfigs.Schemas = this.#globalConfigs.Schemas.filter(schema => {
        if (schema.mongql.skip !== true) {
          schema.mongql.resource = S.capitalize(schema.mongql.resource);
          return true;
        }
      })
    }
  }

  getResources = () => this.#globalConfigs.resources;

  #createDefaultGlobalConfigs = () => {
    const temp = this.#globalConfigs;

    populateObjDefaultValue(temp, {
      output: false,
      generate: {
        type: true,
        query:{}
      },
      Typedefs: {
        init: {},
      },
      Resolvers: {
        init: {}
      }
    });

    this.#globalConfigs.generate.query = nestedObjPopulation(this.#globalConfigs.generate.query,generateQueryOptions());

    if (temp.generate.mutation !== false) {
      populateObjDefaultValue(temp.generate, {
        mutation: {
          create: [true, true],
          update: [true, true],
          delete: [true, true],
        }
      });
    }
  }

  #createDefaultSchemaConfigs = (baseSchema) => {
    const { mongql } = baseSchema;
    if (mongql.global_excludePartitions !== undefined) {
      const { base, extra } = mongql.global_excludePartitions;
      mongql.global_excludePartitions = {
        base: base === undefined ? [] : base,
        extra: extra === undefined ? true : extra
      };
    }

    populateObjDefaultValue(mongql, {
      generateInterface: true,
      appendRTypeToEmbedTypesKey: true,
      global_inputs: {
        base: true,
        extra: true
      },
      generate: {
        type: true,
        query:{}
      },
      output: false,
      global_excludePartitions: {
        base: [],
        extra: true
      }
    });

    if (mongql.generate.mutation !== false) {
      populateObjDefaultValue(mongql.generate, {
        mutation: {
          create: [true, true],
          update: [true, true],
          delete: [true, true],
        }
      });
    }
    if(mongql.generate.query === undefined)
      mongql.generate.query = {...this.#globalConfigs.generate.query};
    else
      mongql.generate.query = nestedObjPopulation(mongql.generate.query,generateQueryOptions());
    this.#schemaConfigs[mongql.resource] = mongql;
  };

  #addExtraTypedefsAndResolvers = (TransformedTypedefs, TransformedResolvers) => {

    TransformedTypedefs.obj.External = [...typeDefs, 'scalar Password', 'scalar Username'];
    TransformedTypedefs.arr.push(...typeDefs, 'scalar Password', 'scalar Username');
    TransformedResolvers.obj.External = { ...resolvers, Password, Username };
    TransformedResolvers.arr.push({ ...resolvers, Password, Username });

    TransformedTypedefs.obj.Base = baseTypedefs;
    TransformedTypedefs.arr.push(baseTypedefs);
    const BaseResolver = {
      Query: {},
      Mutation: {}
    };
    TransformedResolvers.obj.Base = BaseResolver;
    TransformedResolvers.arr.push(BaseResolver);
  }

  async generate() {
    const TransformedTypedefs = { obj: {}, arr: [] },
      TransformedResolvers = { obj: {}, arr: [] };
    const {
      Typedefs,
      Resolvers,
      Schemas
    } = this.#globalConfigs;

    let InitTypedefs = null;
    let InitResolvers = null;

    if (typeof Typedefs === 'string') InitTypedefs = loadFiles(Typedefs);
    else InitTypedefs = Typedefs.init;
    if (typeof Resolvers === 'string') InitResolvers = loadFiles(Resolvers);
    else InitResolvers = Resolvers.init;

    await Schemas.forEachAsync(async (Schema) => {
      const {
        mongql
      } = Schema;
      const { resource } = mongql;
      const { typedefsAST, transformedSchema } = await generateTypedefs(
        Schema,
        InitTypedefs[resource],
        this.#globalConfigs
      );
      const output = (!mongql.__undefineds.includes('output') && mongql.output) || (mongql.__undefineds.includes('output') && this.#globalConfigs.output);
      await Mongql.outputSDL(output.SDL || output.dir,typedefsAST, resource)
      TransformedTypedefs.obj[resource] = typedefsAST;
      TransformedTypedefs.arr.push(typedefsAST);
      const resolver = generateResolvers(
        Schema,
        InitResolvers[resource],
        transformedSchema,
      );
      TransformedResolvers.obj[resource] = resolver;
      TransformedResolvers.arr.push(resolver);
    });

    this.#addExtraTypedefsAndResolvers(TransformedTypedefs, TransformedResolvers);

    return {
      TransformedTypedefs,
      TransformedResolvers
    };
  }

  async generateSchema(additionalOptions) {
    const { TransformedTypedefs, TransformedResolvers } = await this.generate();

    return makeExecutableSchema({
      typeDefs: TransformedTypedefs.arr,
      resolvers: TransformedResolvers.arr,
      ...additionalOptions
    });
  }

  static async outputSDL(path,typedefs,resource){
    if(path){
      try {
        await mkdirp(path);
        await fs.writeFile(`${path}\\${resource}.graphql`, documentApi().addSDL(typedefs).toSDLString(), 'UTF-8');
      } catch (err) {
        console.log(err.message)
      }
    }
  }

  generateModels() {
    const res = {};
    this.#globalConfigs.Schemas.forEach((schema) => {
      const { mongql: { resource } } = schema;
      res[resource] = mongoose.model(S.capitalize(resource), schema);
    });
    return res;
  }
}

module.exports = Mongql;
