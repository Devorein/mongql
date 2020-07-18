<!-- markdownlint-disable MD013 -->

# Mongql

A package to convert your mongoose schema to graphql schema

## TOC

- [Mongql](#mongql)
  - [TOC](#toc)
  - [Features](#features)
  - [Motivation](#motivation)
  - [Usage](#usage)
    - [Basic Usage (Without initial typedef and resolvers)](#basic-usage-without-initial-typedef-and-resolvers)
    - [Intermediate Usage (With initial typedef and resolvers)](#intermediate-usage-with-initial-typedef-and-resolvers)
    - [Intermediate Usage (Fine grain Mutation configuration)](#intermediate-usage-fine-grain-mutation-configuration)
  - [Configs](#configs)
    - [Global Configs](#global-configs)
    - [Schema configs](#schema-configs)
    - [Field configs](#field-configs)
  - [Concept](#concept)
  - [API](#api)
  - [TODO](#todo)

## Features

1. Create graphql schema (typedef and resolvers) from mongoose schema
2. Stitch already created typedef and resolvers
3. Easily configurable (any of the typedef and resolvers can be turned off)
4. View the generated SDL
5. Auto addition of graphql validators with mongoose

## Motivation

1. Creating a graphql SDL is not a difficult task by any means, but things get really cumbersome after a while, especially since a lot of the typedefs and resolvers are being repeated.
2. Automating the schema generation helps to avoid errors regarding forgetting to define something in the schema thats been added to the resolver or vice versa.
3. Creating resolvers for subtypes in a PITA, especially if all of them just refers to the same named key in parent

## Usage

### Basic Usage (Without initial typedef and resolvers)

``` js
// User.schema.js
const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        mongql: {
            writable: false // field level config
        }
    }
});

UserSchema.mongql = {
    resource: 'user'
}; // schema level config

module.exports = UserSchema;
```

``` js
// index.js
const {
    makeExecutableSchema
} = require('@graphql-tools/schema');
const {
    ApolloServer
} = require('apollo-server-express');
const Mongql = require('MonGql');

const UserSchema = require('./User.schema.js');

(async function() {
    const mongql = new Mongql({
        Schemas: [UserSchema],
    });

    // Calling the generate method generates the typedefs and resolvers
    const {
        TransformedResolvers,
        TransformedTypedefs, // Contains both arr and obj representation
    } = await mongql.generate();

    const GRAPHQL_SERVER = new ApolloServer({
        schema: makeExecutableSchema({
            typeDefs: TransformedTypedefs.arr,
            resolvers: TransformedResolvers.arr,
        }),
        context: () => ({
            user: req.user
        })
    });
})();
```

### Intermediate Usage (With initial typedef and resolvers)

``` js
// user.typedef.js
module.exports = gql `
  type BasicUserType{
    name:String!
  }
`;
```

``` js
// user.resolver.js
module.exports = {
    Mutation: {
        updateUserSettings: ...
    }
}
```

``` js
const UserAST = require('./user.typedef.js');
const UserResolver = require('./user.resolver.js');

const PreTransformedTypeDefsASTs = {
    user: UserAST // This has to match with the resource name added in the mongoose schema
}

const PreTransformedResolvers = {
    user: UserResolver
}

const mongql = new Mongql({
    Schemas: [UserSchema, SettingsSchema],
    Typedefs: {
        init: PreTransformedTypeDefsASTs
    },
    Resolvers: {
        init: PreTransformedResolvers
    }
});
```

### Intermediate Usage (Fine grain Mutation configuration)

``` js
const mongql = new Mongql({
    Schemas: [UserSchema, SettingsSchema],
    generate: {
        mutation: false, // will not generate any mutation typedef and resolver,
        mutation: {
            create: false, // Will not generate any create mutation typedef and resolver,
            update: [false, true], // will not generate single update mutation typedef and resolver but multiple will be generated
        }
    }
});
```

Mongql contains 3 level of configs

1. **Constructor/global level config**: passed to the ctor during Mongql instantiation
2. **Schema level config**: Attached to the schema via mongql key
3. **Field level config**: Attached to the field via mongql key

Precedence of same config option is global < Schema < field. That is for the same option the one with the highest precedence will be used.

## Configs

& refers to the complete key declared above.

### Global Configs

| Name  | Description  | Type | Default Value | Usage | Available in |
|---|---|---|---|---|---|---|
| output  | output related configuration | `boolean | Object` | false | `{output: false}`  `{output: { dir: process.cwd()}}` | Schema
| &.dir  | Output directory | `string` | `process.cwd()+"\SDL"` | `{output: { dir: process.cwd()}}` | Schema
| generate  | Controls generation of type, query and mutations typedefs and resolvers | `Object` | `true` | `generate: true` | Schema
| &.mutation  | Controls generation of mutations typedefs and resolvers | `Object` | `true` | `generate :{mutation: true}` | Schema
| &.(create|update|delete)  | Controls generation of mutations typedefs and resolvers parts , if using tuple first one indicates single resource mutation, and second indicates multi resource mutation. | `[boolean,boolean] | boolean` | `true` | `generate :{mutation: {create: false, update: [true,false]}}` here no create relation mutation will be create, only single resource update resolver and typedef will be created and both single and multi resource will be created for delete | Schema
| Schemas  | Array of schemas generate by mongoose | `Schema[]` | `[]` | `Schemas: [UserSchema, ...]` |
| Typedefs  | Typedefs related configuration | `Object` | `{init: undefined}` | `Typedefs: {init: {User: InitialUserTypedef}}` |
| &.init  | Initial typedefs to be attached to resultant typedef | `Object` | `undefined` | `init: {User: InitialUserTypedef}` |
| Resolvers  | Resolvers related configuration | `Object` | `{init: undefined}` | `Resolvers: {init: {User: InitialUserResolvers}}` |
| &.init  | Initial resolvers to be attached to resultant resolver | `Object` | `undefined` | `init: {User: InitialUserResolver}` |
| appendRTypeToEmbedTypesKey  | Controls whether or not to append the resource type to sub/embed/extra types | `boolean` | `true` | `appendRTypeToEmbedTypesKey: true` | Schema

### Schema configs

| Name  | Description  | Type | Default Value | Usage | Available in |
|---|---|---|---|---|---|---|
| resource  | name of the resource  | `string` | **Required** | `resource: User` |
| global_excludePartitions  | Controls which auth partition will be excluded in the generated schemas  | `Object` | `{base: [], extra: ['Others', 'Mixed']}` | `global_excludePartitions: {base: [ 'Others', 'Mixed' ]}` |
| &.(base|extra)  | Controls which auth partition will be excluded in the types of generated schemas  | `[] | boolean` | `{base: [], extra: ['Others', 'Mixed']}` | `global_excludePartitions: {base: [ 'Others', 'Mixed' ],extra: ['Self']}` |
| generateInterface  | Controls whether or not to generate interface from base resource  | `boolean` | `true` |  
`generateInterface: true` |

### Field configs

| Name  | Description  | Type | Default Value | Usage | Available in |
|---|---|---|---|---|---|---|
| writable  | Controls whether or not this field is present in generated input  | `boolean` | `true` | `writable: true` |
| scalar  | Custom graphql scalar to be used (atm all graphql-scalars scalars are included)  | `string` | parsed type from mongoose | `scalar: 'NonNegativeInt'` |

## Concept

During the generation of schema, a few concepts are followed

1. Each Resource query object type contains four parts

   1. Range(Input):

      1. All: Gets all the resource
      2. Paginated : Used to get resource through pagination inpu
      3. Filtered : Used to get resource through filter input
      4. ID: Used to get a resource by id

   2. Auth:

      1. Self: Used to indicate logged in users resource
      2. Others: Used to indicate other users resource (when current user is authenticated)
      3. Mixed: Used to incicate others users resource (when user is unauthenticated)

   3. Resource: Name of the resource (capitalized & pluralized form)

   4. Part(Output):

       1. Whole: Get the whole data along with sub/extra types
       2. NameAndId: get the name and id of the resource
       3. Count: get the count of resource

2. Each resource mutation object type contains 2 parts

   1. Action: One of create|update|delete
   2. Target: resource for targeting single resource, resources for targeting multiple resources

Generated Query Examples: getSelfSettingsWhole, getOthersSettingsNameAndId

Generated Mutation Examples: createSetting, updateSettings

**NOTE**: Count part is not generate in paginated and id range as for paginated query the user already knows the count and id returns just one

## API

1. **`generate()`** : Generate the Typedefs and resolvers from the schemas
2. **`getResources()`** : Gets all the resources collected from all schemas

## TODO

1. Add tests
2. Convert the whole project to TS
3. More enriched API
4. Better documentation :^)

**PRS are more than welcome !!!!**
