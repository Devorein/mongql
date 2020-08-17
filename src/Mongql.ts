import { resolvers, typeDefs } from 'graphql-scalars';
import colors from 'colors';
import { documentApi } from "graphql-extra";
import mkdirp from 'mkdirp';
import fs, { mkdirpSync } from 'fs-extra';
import path from 'path';
import S from 'voca';
import gql from "graphql-tag"
import { Model, model, connect } from "mongoose";

import { DocumentNode } from "graphql";

import Password from "./utils/gql-types/password"
import Username from "./utils/gql-types/username"

import { IMongqlGlobalConfigsPartial, IMongqlGlobalConfigsFull, IMongqlMongooseSchemaFull, IMongqlMongooseSchemaPartial, TParsedSchemaInfo, IOutputFull, MutableDocumentNode, ITransformedASTPart, ITransformedResolverPart } from "./types";
import generateTypedefs from './typedefs';
import generateResolvers from './resolvers';
import { generateFragments, generateOperations, sortNodes, sortFields, operationAstToJS, AsyncForEach, generateGlobalConfigs, generateBaseSchemaConfigs, loadFiles, convertToDocumentNodes } from "./utils";

const BaseTypeDefs = gql`
  type Query {
		_empty: Boolean
	}

	type Mutation {
		_empty: Boolean
	}

  input PaginationInput {
		page: Int!
		limit: Int!
		sort: String
		filter: JSON
	}
`;

class Mongql {
  #resources: string[] = [];
  #globalConfigs: IMongqlGlobalConfigsFull;

  constructor(options: IMongqlGlobalConfigsPartial) {
    this.#globalConfigs = generateGlobalConfigs(options);
    this.#globalConfigs.Schemas = this.#populateAndFilterSchemas(options);
    this.#globalConfigs.Typedefs.init = typeof this.#globalConfigs.Typedefs.init === 'string' ? loadFiles(this.#globalConfigs.Typedefs.init) : convertToDocumentNodes(this.#globalConfigs.Typedefs.init);
    if (typeof this.#globalConfigs.Resolvers.init === 'string')
      this.#globalConfigs.Resolvers.init = loadFiles(this.#globalConfigs.Resolvers.init)
  }

  /**
   * Populates the schemas inside global configs and generated appropriate BaseConfig for each schema
   * 1. **if** Checks if the schema is a path, 
   *    Get all the Schemas from the path
   *    Filters all the Schemas using mongql.skip
   * 2. **else** just filters the Schemas using mongql.skip
   * 3. Generates base configs for each imported schema
   * @param options User given partial Mongql Global config
   * @returns An array of partial Mongoose Schema
   */
  #populateAndFilterSchemas = (options: IMongqlGlobalConfigsPartial) => {
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
    if (imported_schemas.length === 0)
      throw new Error(
        colors.red.bold(`No schemas provided`)
      )
    return imported_schemas.map((schema) => {
      if (schema.mongql === undefined)
        throw new Error(
          colors.red.bold(`Resource doesnt have a mongql key on the schema`)
        )
      const { resource } = schema.mongql;
      if (resource === undefined)
        throw new Error(colors.red.bold(`Provide the mongoose schema resource key for mongql`));
      else this.#resources.push(resource);
      schema.mongql = generateBaseSchemaConfigs(schema.mongql, this.#globalConfigs as IMongqlGlobalConfigsFull);
      return schema as IMongqlMongooseSchemaFull
    });
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
  #addExtraTypedefsAndResolvers = (TransformedTypedefs: ITransformedASTPart, TransformedResolvers: ITransformedResolverPart) => {

    TransformedTypedefs.obj.External = [...typeDefs, 'scalar Password', 'scalar Username'];
    typeDefs.push('scalar Password', 'scalar Username');
    TransformedTypedefs.DocumentNode.definitions.push(...gql(typeDefs.join("\n")).definitions);

    TransformedResolvers.obj.External = { ...resolvers, Password, Username };
    TransformedResolvers.arr.push({ ...resolvers, Password, Username });

    TransformedTypedefs.obj.Base = BaseTypeDefs;
    TransformedTypedefs.DocumentNode.definitions.push(...BaseTypeDefs.definitions);
    const BaseResolver = {
      Query: {},
      Mutation: {}
    };
    TransformedResolvers.obj.Base = BaseResolver;
    TransformedResolvers.arr.push(BaseResolver);
  }

  #schemaLooper = (Schema: IMongqlMongooseSchemaFull, { InitTypedefs, InitResolvers, TransformedResolvers, TransformedTypedefs, SchemasInfo }: any) => {
    const {
      mongql
    } = Schema;
    const { resource } = mongql;
    const InitTypeDefAst = (mongql.TypeDefs || InitTypedefs[resource]) as MutableDocumentNode, InitResolver = mongql.Resolvers || InitResolvers[resource];
    const { GeneratedDocumentNode, SchemaInfo } = generateTypedefs(
      Schema,
      InitTypeDefAst,
    );

    if (mongql.sort.fields)
      sortFields(GeneratedDocumentNode);
    if (mongql.sort.nodes)
      sortNodes(GeneratedDocumentNode);

    const GeneratedResolver = generateResolvers(
      InitResolver,
      SchemaInfo,
    );
    TransformedTypedefs.obj[resource] = GeneratedDocumentNode;
    TransformedTypedefs.DocumentNode.definitions.push(...GeneratedDocumentNode.definitions);
    TransformedResolvers.obj[resource] = GeneratedResolver;
    TransformedResolvers.arr.push(GeneratedResolver);
    SchemasInfo[resource] = SchemaInfo;
    return GeneratedDocumentNode;
  }
  /**
   * Generates the Typedefs and Resolvers using Global Configs and individual schema
   * 1. Generates the typedefs (type, query & mutation)
   * 2. Generates the resolvers (type, query & mutation)
   * 3. Injects additional typedefs and resolvers
   */
  async generate() {
    const ResDocumentNode: MutableDocumentNode = {
      kind: "Document",
      definitions: []
    };

    const TransformedTypedefs: ITransformedASTPart = { obj: {}, DocumentNode: ResDocumentNode },
      TransformedResolvers: ITransformedResolverPart = { obj: {}, arr: [] };
    const {
      Typedefs,
      Resolvers,
      Schemas,
      output
    } = this.#globalConfigs;
    const OperationNodes: MutableDocumentNode = {
      kind: "Document",
      definitions: []
    };
    const InitTypedefs = Typedefs.init || {};
    const InitResolvers = Resolvers.init || {};
    const SchemasInfo: Record<string, TParsedSchemaInfo> = {};
    await AsyncForEach(Schemas, async (Schema: IMongqlMongooseSchemaFull) => {
      const GeneratedDocumentNode = this.#schemaLooper(Schema, { InitTypedefs, InitResolvers, TransformedResolvers, TransformedTypedefs, SchemasInfo });
      await this.#output(Schema.mongql.output, GeneratedDocumentNode, Schema.mongql.resource);
    });
    if (Typedefs.base) {
      const BaseTypedefsContent = typeof Typedefs.base === 'string' ? await fs.readFile(Typedefs.base, 'UTF-8') : Typedefs.base;
      const BaseTypeDefs = (BaseTypedefsContent as DocumentNode).kind === "Document" ? BaseTypedefsContent as DocumentNode : BaseTypedefsContent ? gql(BaseTypedefsContent as string) : undefined;
      if (BaseTypeDefs)
        TransformedTypedefs.DocumentNode.definitions.push(...BaseTypeDefs.definitions);
    }

    this.#addExtraTypedefsAndResolvers(TransformedTypedefs, TransformedResolvers);
    const GeneratedFragmentsMap = generateFragments(OperationNodes, TransformedTypedefs.DocumentNode, SchemasInfo);
    generateOperations(OperationNodes, TransformedTypedefs.DocumentNode, GeneratedFragmentsMap);

    if (output.Operation)
      await this.#cleanAndOutput(output.Operation, operationAstToJS(OperationNodes, this.#globalConfigs.Operations.module), 'Operations.js');

    return {
      TransformedTypedefs,
      TransformedResolvers,
      SchemasInfo
    };
  }

  generateSync() {
    const ResDocumentNode: MutableDocumentNode = {
      kind: "Document",
      definitions: []
    };

    const TransformedTypedefs: ITransformedASTPart = { obj: {}, DocumentNode: ResDocumentNode },
      TransformedResolvers: ITransformedResolverPart = { obj: {}, arr: [] };
    const {
      Typedefs,
      Resolvers,
      Schemas,
      output
    } = this.#globalConfigs;
    const OperationNodes: MutableDocumentNode = {
      kind: "Document",
      definitions: []
    };
    const InitTypedefs = Typedefs.init || {};
    const InitResolvers = Resolvers.init || {};
    const SchemasInfo: Record<string, TParsedSchemaInfo> = {};
    Schemas.forEach((Schema: IMongqlMongooseSchemaFull) => {
      const GeneratedDocumentNode = this.#schemaLooper(Schema, { InitTypedefs, InitResolvers, TransformedResolvers, OperationNodes, TransformedTypedefs, SchemasInfo });
      this.#outputSync(Schema.mongql.output, GeneratedDocumentNode, Schema.mongql.resource);
    });
    if (Typedefs.base) {
      const BaseTypedefsContent = typeof Typedefs.base === 'string' ? fs.readFileSync(Typedefs.base, 'utf-8') : Typedefs.base;
      const BaseTypeDefs = (BaseTypedefsContent as DocumentNode).kind === "Document" ? BaseTypedefsContent as DocumentNode : BaseTypedefsContent ? gql(BaseTypedefsContent as string) : undefined;
      if (BaseTypeDefs)
        TransformedTypedefs.DocumentNode.definitions.push(...BaseTypeDefs.definitions);
    }

    this.#addExtraTypedefsAndResolvers(TransformedTypedefs, TransformedResolvers);
    const GeneratedFragmentsMap = generateFragments(OperationNodes, TransformedTypedefs.DocumentNode, SchemasInfo);
    generateOperations(OperationNodes, TransformedTypedefs.DocumentNode, GeneratedFragmentsMap);

    if (output.Operation)
      this.#cleanAndOutputSync(output.Operation, operationAstToJS(OperationNodes, this.#globalConfigs.Operations.module), 'Operations.js');

    return {
      TransformedTypedefs,
      TransformedResolvers,
      SchemasInfo
    };
  }

  #output = async (output: IOutputFull, typedefsAST: DocumentNode, resource: string) => {
    if (typeof output.SDL === 'string' && typedefsAST)
      await this.#cleanAndOutput(output.SDL, documentApi().addSDL(typedefsAST).toSDLString(), resource + ".graphql")
    if (typeof output.AST === 'string')
      await this.#cleanAndOutput(output.AST, JSON.stringify(typedefsAST), `${resource}.json`);
  }

  #outputSync = (output: IOutputFull, typedefsAST: DocumentNode, resource: string) => {
    if (typeof output.SDL === 'string' && typedefsAST)
      this.#cleanAndOutputSync(output.SDL, documentApi().addSDL(typedefsAST).toSDLString(), resource + ".graphql")
    if (typeof output.AST === 'string')
      this.#cleanAndOutputSync(output.AST, JSON.stringify(typedefsAST), `${resource}.json`)
  }
  /**
   * Clean the directory and creates output file
   * @param path Output path
   * @param TypedefsAST The AST to convert to SDL
   * @param resource Name of the resource
   */
  #cleanAndOutput = async (path: string, content: string, resource: string) => {
    if (path) {
      try {
        await mkdirp(path);
        await fs.writeFile(`${path}\\${resource}`, content, 'UTF-8');
      } catch (err) {
        console.log(err.message)
      }
    }
  }

  #cleanAndOutputSync = (path: string, content: string, resource: string) => {
    if (path) {
      try {
        mkdirpSync(path);
        fs.writeFileSync(`${path}\\${resource}`, content, 'UTF-8');
      } catch (err) {
        console.log(err.message)
      }
    }
  }

  /**
   * Generates models from the Schemas passed to Global Configs
   */
  async generateModels() {
    const conn = await connect(process.env.MONGO_URI as string, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`.green.underline.bold);
    const res: { [key: string]: Model<any> } = {};
    this.#globalConfigs.Schemas.forEach((schema: IMongqlMongooseSchemaFull) => {
      const { mongql: { resource } } = schema;
      res[resource] = model(S.capitalize(resource), schema);
    });
    return res;
  }
}

export default Mongql;
