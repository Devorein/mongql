import { resolvers, typeDefs } from 'graphql-scalars';
import colors from 'colors';
import { documentApi } from "graphql-extra";
import mkdirp from 'mkdirp';
import fs from 'fs-extra';
import path from 'path';
import S from 'voca';
import { makeExecutableSchema, IExecutableSchemaDefinition } from '@graphql-tools/schema';
import gql from "graphql-tag"
import { Model, model } from "mongoose"
import { DocumentNode } from "graphql";

import Password from "./utils/gql-types/password"
import Username from "./utils/gql-types/username"

import { IMongqlGlobalConfigsPartial, ITransformedPart, IMongqlGlobalConfigsFull, IMongqlMongooseSchemaFull, IMongqlMongooseSchemaPartial, IResolverPartial } from "./types";

import { generateGlobalConfigs, generateSchemaConfigs } from "./utils/generate/configs";
import generateTypedefs from './typedefs';
import generateResolvers from './resolvers';
import loadFiles from "./utils/loadFiles";

async function AsyncForEach<T>(arr: readonly T[], cb: any) {
  for (let index = 0; index < arr.length; index++)
    await cb(arr[index] as T, index, arr);
}

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
  #globalConfigs: IMongqlGlobalConfigsPartial = { Schemas: [] };
  #resources: string[] = [];
  #models: { [key: string]: Model<any> } = {}

  constructor(options: IMongqlGlobalConfigsPartial) {
    this.#globalConfigs = generateGlobalConfigs(options);
    this.#globalConfigs.Schemas = this.#populateAndFilterSchemas(options);
    this.#globalConfigs.Schemas.forEach((schema) => {
      if (schema.mongql === undefined)
        throw new Error(
          colors.red.bold(`Resource doesnt have a mongql key on the schema`)
        )
      const { resource } = schema.mongql;
      if (resource === undefined)
        throw new Error(colors.red.bold(`Provide the mongoose schema resource key for mongql`));
      else this.#resources.push(resource);
      schema.mongql = generateSchemaConfigs(schema.mongql, this.#globalConfigs as IMongqlGlobalConfigsFull);
    });
  }

  /**
   * Populates the schemas inside global configs
   * 1. **if** Checks if the schema is a path, 
   *    Get all the Schemas from the path
   *    Filters all the Schemas using mongql.skip
   * 2. **else** just filters the Schemas using mongql.skip
   * @param {IMongqlGlobalConfigsPartial} options User given partial Mongql Global config
   * @returns {IMongqlMongooseSchemaPartial[]} An array of partial Mongoose Schema
   */
  #populateAndFilterSchemas = (options: IMongqlGlobalConfigsPartial): IMongqlMongooseSchemaPartial[] => {
    let imported_schemas: IMongqlMongooseSchemaPartial[] = [];
    if (typeof options.Schemas === 'string') {
      const schemaPath = options.Schemas;
      const files = fs.readdirSync(schemaPath);
      files.forEach(file => {
        const schemaFile = path.join(schemaPath, file);
        const fileWithoutExt = path.basename(file, path.extname(file));
        let imported = require(schemaFile);
        imported = imported[fileWithoutExt + "Schema"] === undefined ? imported : imported[fileWithoutExt + "Schema"];
        if (fileWithoutExt !== "index" && imported.mongql.skip !== true) {
          imported_schemas.push(imported);
          imported.mongql.resource = S.capitalize(imported.mongql.resource);
          if (imported.mongql.TypeDefs && typeof imported.mongql.TypeDefs === 'string') imported.mongql.TypeDefs = gql(imported.mongql.TypeDefs);
        }
      });
    }
    else
      imported_schemas = (options.Schemas).filter(schema => {
        if (schema.mongql.skip !== true) {
          schema.mongql.resource = S.capitalize(schema.mongql.resource);
          if (schema.mongql.TypeDefs && typeof schema.mongql.TypeDefs === 'string') schema.mongql.TypeDefs = gql(schema.mongql.TypeDefs);
          return true;
        }
      })

    delete options.Schemas;
    return imported_schemas;
  }

  /**
   * Returns all the Resources obtained from the Schemas
   */
  getResources = () => this.#resources;

  /**
   * Injects additional typedefs and resolvers to TransformedTypedefs and TransformedResolvers
   * @param TransformedTypedefs Generated Typedefs
   * @param TransformedResolvers Generated Resolvers
   */
  #addExtraTypedefsAndResolvers = (TransformedTypedefs: ITransformedPart, TransformedResolvers: ITransformedPart) => {

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

  /**
   * Generates the Typedefs and Resolvers using Global Configs and individual schema
   * 1. Generates the typedefs (type, query & mutation)
   * 2. Generates the resolvers (type, query & mutation)
   * 3. Injects additional typedefs and resolvers
   */
  async generate() {
    const TransformedTypedefs: ITransformedPart = { obj: {}, arr: [] },
      TransformedResolvers: ITransformedPart = { obj: {}, arr: [] };
    const {
      Typedefs,
      Resolvers,
      Schemas
    } = this.#globalConfigs as IMongqlGlobalConfigsFull;
    const InitTypedefs: { [key: string]: DocumentNode } = typeof Typedefs.init === 'string' ? loadFiles(Typedefs.init) : Typedefs.init;
    const InitResolvers: { [key: string]: IResolverPartial } = typeof Resolvers.init === 'string' ? loadFiles(Resolvers.init) : Resolvers.init;

    await AsyncForEach(Schemas, async (Schema: IMongqlMongooseSchemaFull) => {
      const {
        mongql
      } = Schema;
      const { resource, output } = mongql;
      let typedefsAST: undefined | DocumentNode = mongql.TypeDefs || InitTypedefs[resource], resolver: undefined | IResolverPartial = mongql.Resolvers || InitResolvers[resource];
      const generated = await generateTypedefs(
        Schema,
        typedefsAST,
      );
      typedefsAST = generated.typedefsAST;
      if (output.SDL && typedefsAST)
        await Mongql.outputSDL(output.SDL, typedefsAST, resource);
      if (typeof output.AST as any === 'string') {
        await mkdirp(output.AST as string);
        await fs.writeFile(path.join(output.AST as string, `${Schema.mongql.resource}.json`), JSON.stringify(typedefsAST), 'UTF-8');
      }
      resolver = generateResolvers(
        Schema,
        resolver,
        generated.SchemaInfo,
      );
      TransformedTypedefs.obj[resource] = typedefsAST;
      TransformedTypedefs.arr.push(typedefsAST);
      TransformedResolvers.obj[resource] = resolver;
      TransformedResolvers.arr.push(resolver);
      // delete Schema.mongql;
    });

    this.#addExtraTypedefsAndResolvers(TransformedTypedefs, TransformedResolvers);

    return {
      TransformedTypedefs,
      TransformedResolvers
    };
  }

  async generateSchema(additionalOptions: IExecutableSchemaDefinition) {
    const { TransformedTypedefs, TransformedResolvers } = await this.generate();
    return makeExecutableSchema({
      ...additionalOptions,
      typeDefs: TransformedTypedefs.arr,
      resolvers: TransformedResolvers.arr,
    });
  }

  /**
   * Outputs the SDL by converting the TypedefsAST
   * @param path Output path
   * @param TypedefsAST The AST to convert to SDL
   * @param resource Name of the resource
   */
  static async outputSDL(path: string, TypedefsAST: DocumentNode, resource: string) {
    if (path) {
      try {
        await mkdirp(path);
        await fs.writeFile(`${path}\\${resource}.graphql`, documentApi().addSDL(TypedefsAST).toSDLString(), 'UTF-8');
      } catch (err) {
        console.log(err.message)
      }
    }
  }

  /**
   * Generates models from the Schemas passed to Global Configs
   */
  generateModels() {
    const res: { [key: string]: Model<any> } = {};
    this.#globalConfigs.Schemas.forEach((schema) => {
      const { mongql: { resource } } = schema;
      res[resource] = model(S.capitalize(resource), schema);
    });
    return res;
  }
}

export default Mongql;
