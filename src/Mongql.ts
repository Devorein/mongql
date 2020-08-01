import { resolvers, typeDefs } from 'graphql-scalars';
import colors from 'colors';
import { documentApi } from "graphql-extra";
import mkdirp from 'mkdirp';
import fs from 'fs-extra';
import path from 'path';
import S from 'voca';
import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from "graphql-tag"
import mongoose from 'mongoose';
import { Schema, Model } from "mongoose"
import { DocumentNode } from "graphql";

import Password from "./utils/gql-types/password"
import Username from "./utils/gql-types/username"

import { IMongqlGlobalConfigsOption, MongqlMongooseSchema, ITransformedPart, IMongqlGlobalConfigs, IMongqlSchemaConfigs } from "./types";

import { generateGlobalConfigs, generateSchemaConfigs } from "./utils/generate/configs";
import generateTypedefs from './typedefs';
import generateResolvers from './resolvers';
import loadFiles from "./utils/loadFiles";

const AsyncForEach = async (arr: readonly any[], cb: Function) => {
  for (let index = 0; index < arr.length; index++) {
    await cb(arr[index], index, arr);
  }
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
  private globalConfigs: IMongqlGlobalConfigs;
  private resources: string[] = [];

  constructor(options: IMongqlGlobalConfigsOption) {
    this.checkSchemaPath(options);
    this.globalConfigs = this.createDefaultGlobalConfigs(options);

    this.globalConfigs.Schemas.forEach((schema) => {
      if (schema.mongql === undefined)
        throw new Error(
          colors.red.bold(`Resource doesnt have a mongql key on the schema`)
        )
      const { resource } = schema.mongql;
      if (resource === undefined)
        throw new Error(colors.red.bold(`Provide the mongoose schema resource key for mongql`));
      else this.resources.push(resource);
      schema.mongql = this.createDefaultSchemaConfigs(schema.mongql);
    })
  }

  private checkSchemaPath(options: IMongqlGlobalConfigsOption) {
    let { Schemas } = options;
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
          (Schemas as MongqlMongooseSchema[]).push(imported);
          imported.mongql.resource = S.capitalize(imported.mongql.resource);
        }
      })
      this.globalConfigs.Schemas = Schemas;
    }
    else {
      this.globalConfigs.Schemas = this.globalConfigs.Schemas.filter(schema => {
        if (schema.mongql.skip !== true) {
          schema.mongql.resource = S.capitalize(schema.mongql.resource);
          return true;
        }
      })
    }
  }

  getResources = () => this.resources;

  private createDefaultGlobalConfigs(options: IMongqlGlobalConfigsOption): IMongqlGlobalConfigs {
    return generateGlobalConfigs(options)
  };

  private createDefaultSchemaConfigs(baseSchema: IMongqlSchemaConfigs): IMongqlSchemaConfigs {
    return generateSchemaConfigs(baseSchema, this.globalConfigs)
  };

  private addExtraTypedefsAndResolvers(TransformedTypedefs: ITransformedPart, TransformedResolvers: ITransformedPart) {

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
    const TransformedTypedefs: ITransformedPart = { obj: {}, arr: [] },
      TransformedResolvers: ITransformedPart = { obj: {}, arr: [] };
    const {
      Typedefs,
      Resolvers,
      Schemas
    } = this.globalConfigs;

    const InitTypedefs: { [key: string]: DocumentNode } = typeof Typedefs.init === 'string' ? loadFiles(Typedefs.init) : Typedefs.init;
    const InitResolvers: { [key: string]: Object } = typeof Resolvers.init === 'string' ? loadFiles(Resolvers.init) : Resolvers.init;

    await AsyncForEach(Schemas, async (Schema: MongqlMongooseSchema) => {
      const {
        mongql
      } = Schema;
      const { resource, generate, output } = mongql;
      let typedefsAST: undefined | DocumentNode = InitTypedefs[resource], resolver: undefined | Object = InitResolvers[resource];
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
    });

    this.addExtraTypedefsAndResolvers(TransformedTypedefs, TransformedResolvers);

    return {
      TransformedTypedefs,
      TransformedResolvers
    };
  }

  // async generateSchema(additionalOptions) {
  //   const { TransformedTypedefs, TransformedResolvers } = await this.generate();

  //   return makeExecutableSchema({
  //     typeDefs: TransformedTypedefs.arr,
  //     resolvers: TransformedResolvers.arr,
  //     ...additionalOptions
  //   });
  // }

  static async outputSDL(path: string, typedefs: DocumentNode, resource: string) {
    if (path) {
      try {
        await mkdirp(path);
        await fs.writeFile(`${path}\\${resource}.graphql`, documentApi().addSDL(typedefs).toSDLString(), 'UTF-8');
      } catch (err) {
        console.log(err.message)
      }
    }
  }

  generateModels(): { [key: string]: Model<any> } {
    const res: { [key: string]: Model<any> } = {};
    this.globalConfigs.Schemas.forEach((schema) => {
      const { mongql: { resource } } = schema;
      res[resource] = mongoose.model(S.capitalize(resource), schema);
    });
    return res;
  }
}

export default Mongql;
