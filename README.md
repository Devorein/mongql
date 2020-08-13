# Mongql

A package to convert your mongoose schema to graphql schema

## TOC

- [Mongql](#mongql)
  - [TOC](#toc)
  - [Features](#features)
  - [Motivation](#motivation)
  - [Usage](#usage)
    - [Without initial typedef and resolvers](#without-initial-typedef-and-resolvers)
    - [With initial typedef and resolvers](#with-initial-typedef-and-resolvers)
    - [Output SDL and AST](#output-sdl-and-ast)
    - [Using Schema config typedefs and resolvers](#using-schema-config-typedefs-and-resolvers)
    - [FieldSchema Configs](#fieldschema-configs)
    - [Fine grain Mutation configuration](#fine-grain-mutation-configuration)
    - [Fine grain Query configuration](#fine-grain-query-configuration)
    - [Fine grain Type configuration](#fine-grain-type-configuration)
    - [generating Models](#generating-models)
    - [Using local folders](#using-local-folders)
    - [Controlling nullability](#controlling-nullability)
  - [Concept](#concept)
    - [Generation of Query](#generation-of-query)
    - [Generation of Mutation](#generation-of-mutation)
    - [Generation of Types](#generation-of-types)
  - [API](#api)
  - [TODO](#todo)

## Features

1. Create graphql schema (typedef and resolvers) from mongoose schema
2. Stitch already created typedef and resolvers
3. Easily configurable (any of the typedef and resolvers can be turned off)
4. Output the generated SDL
5. Auto addition of graphql validators with mongoose

## Motivation

1. Creating a graphql SDL is not a difficult task by any means, but things get really cumbersome after a while, especially since a lot of the typedefs and resolvers are being repeated.
2. Automating the schema generation helps to avoid errors regarding forgetting to define something in the schema thats been added to the resolver or vice versa.
3. Creating resolvers for subtypes in a PITA, especially if all of them just refers to the same named key in parent

## Usage

### Without initial typedef and resolvers

``` js
// User.schema.js
const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    mongql: {
      nullable: {
        object: [true]
      } // field level config
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
    Schemas: [UserSchema], // Global level config
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

### With initial typedef and resolvers

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

### Output SDL and AST

``` js
  const mongql = new Mongql({
    Schemas: [],
    output: {
      SDL: path.resolve(__dirname, "./SDL"),
      AST: path.resolve(__dirname, "./AST")
    }
  });

  await mongql.generate()
```

### Using Schema config typedefs and resolvers

``` js
  const UserSchema = new mongoose.model({
    name: String
  });
  UserSchema.mongql = {
    TypeDefs: `type userinfo{
      name: String!
    }`,
    Resolvers: {
      Query: {
        getUserInfo() {}
      }
    }
  }
  const mongql = new Mongql({
    Schemas: [UserSchema],
  });

  await mongql.generate()
```

### FieldSchema Configs

``` js
  const NestedSchema = new mongoose.model({
    nested: Boolean
  });

  NestedSchema.mongql = {
    // FieldSchema configs
  }

  const UserSchema = new mongoose.model({
    name: String,
    nested: NestedSchema
  });

  UserSchema.mongql = {
    TypeDefs: `type userinfo{
      name: String!
    }`,
    Resolvers: {
      Query: {
        getUserInfo() {}
      }
    }
  }
  const mongql = new Mongql({
    Schemas: [UserSchema],
  });

  await mongql.generate()
```

### Fine grain Mutation configuration

``` js
const mongql = new Mongql({
  Schemas: [UserSchema, SettingsSchema],
  generate: {
    mutation: false, // will not generate any mutation typedef and resolver,
    mutation: {
      create: false, // Will not generate any create mutation typedef and resolver,
      update: {
        multi: false // Will not generate any update multi mutation typedef and resolver
      },
      single: false // Will not generate any single mutation typedef and resolver
    }
  }
});
```

### Fine grain Query configuration

``` js
const mongql = new Mongql({
  Schemas: [UserSchema, SettingsSchema],
  generate: {
    query: false,
    query: {
      all: false
    },
    query: {
      paginated: {
        self: false
      }
    },
    query: {
      filtered: {
        others: {
          whole: false
        }
      }
    },
    query: {
      self: false, // remove all self related typedefs and resolvers,
      self: {
        whole: false // remove all selfwhole related typedefs and resolvers,
      },
      count: false, // remove all count related typedefs and resolvers,
    }
  }
});
```

### Fine grain Type configuration

``` js
const mongql = new Mongql({
  Schemas: [UserSchema, SettingsSchema],
  generate: {
    input: {
      update: false
    },
    interface: false,
    enum: false,
    union: false,
    object: {
      self: false
    }
  }
});
```

### generating Models

``` js
const {
  makeExecutableSchema
} = require('@graphql-tools/schema');
const Mongql = require('mongql');
const {
  ApolloServer
} = require('apollo-server');

(async function() {
  const mongql = new Mongql({
    Schemas: [
      /* Your schema array here */
    ],
  });
  const {
    TransformedTypedefs,
    TransformedResolvers
  } = await mongql.generate();
  const server = new ApolloServer({
    schema: makeExecutableSchema({
      typeDefs: TransformedTypedefs.arr,
      resolvers: TransformedResolvers.arr,
    }),
    context: mongql.generateModels()
  });
  await server.listen();
})();
```

### Using local folders

``` js
const Mongql = require('mongql');
const {
  ApolloServer
} = require('apollo-server');

(async function() {
  const mongql = new Mongql({
    Schemas: path.resolve(__dirname, './schemas'),
    output: {
      dir: __dirname + '\\SDL'
    },
    Typedefs: {
      init: path.resolve(__dirname, './typedefs')
    },
    Resolvers: {
      init: path.resolve(__dirname, './resolvers')
    }
  });
  const server = new ApolloServer({
    schema: makeExecutableSchema({
      typeDefs: TransformedTypedefs.arr,
      resolvers: TransformedResolvers.arr,
    }),
    context: mongql.generateModels()
  });
  await server.listen();
})();
```

### Controlling nullability

``` js
const UserSchema = new mongoose.model({
  name: {
    type: String,
    mongql {
      nullable: {
        object: [true]
      } // name: String
    }
  },
  age: {
    type: [Number],
    mongql: {
      nullable: {
        input: [false, true]
      } // age: [Int!]
    }
  }
});
```

Mongql contains 4 levels of configs

1. **Constructor/global level config**: passed to the ctor during Mongql instantiation
2. **Schema level config**: Attached to the schema via mongql key
3. **Field level config**: Attached to the field via mongql key
4. **FieldSchema level config**: Contains both field and schema configs

Precedence of same config option is global < Schema < FieldSchema < field. That is for the same option the one with the highest precedence will be used.

## Concept

During the generation of schema, a few concepts are followed

### Generation of Query

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
       2. Count: get the count of resource

Generated Query Examples: `getSelfSettingsWhole, getOthersSettingsCount` ; 

**NOTE**: Count part is not generate in paginated and id range as for paginated query the user already knows the count and id returns just one

### Generation of Mutation

1. Each resource mutation object type contains 2 parts

   1. Action: One of create|update|delete
   2. Target: resource for targeting single resource, resources for targeting multiple resources

Generated Mutation Examples: `createSetting, updateSettings`

### Generation of Types

1. Each resource types contains the following parts

   1. For each schema (base and nested), based on the permitted auth, object will be created, and based on generate config interface, input and union will be created

## API

All of the methods and configs have been commented along with their types

## TODO

1. Add more well rounded tests
2. Provide ES modules to make the library tree-shakable

**PRS are more than welcome and highly appreciated!!!!**
