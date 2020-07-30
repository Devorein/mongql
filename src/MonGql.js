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

const { generateGlobalConfigs, generateSchemaConfigs } = require("../utils/generateConfigs");
const loadFiles = require("../utils/loadFiles");
const generateTypedefs = require('./generateTypedefs');
const generateResolvers = require('./generateResolvers');

Array.prototype.forEachAsync = async function (cb) {
  for (let index = 0; index < this.length; index++) {
    await cb(this[index], index, this);
  }
};

const BaseTypeDefs = gql`
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
  #resources = [];

  constructor(options) {
    this.#globalConfigs = {
      ...options,
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
      else this.#resources.push(resource);
      schema.mongql = this.#createDefaultSchemaConfigs(schema.mongql, this.#globalConfigs);
    })
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
        if (fileWithoutExt !== "index" && imported.mongql.skip !== true) {
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

  getResources = () => this.#resources;

  #createDefaultGlobalConfigs = () => this.#globalConfigs = generateGlobalConfigs(this.#globalConfigs)
  #createDefaultSchemaConfigs = (baseSchema) => generateSchemaConfigs(baseSchema, this.#globalConfigs)

  #addExtraTypedefsAndResolvers = (TransformedTypedefs, TransformedResolvers) => {

    TransformedTypedefs.obj.External = [...typeDefs, 'scalar Password', 'scalar Username'];
    TransformedTypedefs.arr.push(...typeDefs, 'scalar Password', 'scalar Username');
    TransformedResolvers.obj.External = { ...resolvers, Password, Username };
    TransformedResolvers.arr.push({ ...resolvers, Password, Username });

    TransformedTypedefs.obj.Base = BaseTypeDefs;
    TransformedTypedefs.arr.push(BaseTypeDefs);
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

    if (typeof Typedefs.init === 'string')
      InitTypedefs = loadFiles(Typedefs.init);
    else InitTypedefs = Typedefs.init;
    if (typeof Resolvers.init === 'string') InitResolvers = loadFiles(Resolvers.init);
    else InitResolvers = Resolvers.init;
    await Schemas.forEachAsync(async (Schema) => {
      const {
        mongql
      } = Schema;
      const { resource, generate, output } = mongql;
      let typedefsAST = InitTypedefs[resource], resolver = InitResolvers[resource];
      if (generate !== false) {
        const generated = await generateTypedefs(
          Schema,
          typedefsAST,
        );
        typedefsAST = generated.typedefsAST;
        await Mongql.outputSDL(output.SDL, typedefsAST, resource);
        if (typeof output.AST === 'string') {
          await mkdirp(output.AST);
          await fs.writeFile(path.join(output.AST, `${Schema.mongql.resource}.json`), JSON.stringify(typedefsAST), 'UTF-8');
        }
        resolver = generateResolvers(
          Schema,
          InitResolvers[resource],
          generated.SchemaInfo,
        );
      }
      TransformedTypedefs.obj[resource] = typedefsAST;
      TransformedTypedefs.arr.push(typedefsAST);
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

  static async outputSDL(path, typedefs, resource) {
    if (path) {
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
