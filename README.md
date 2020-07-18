# Mongql

A package to convert your mongoose schema to graphql schema

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

## Basic Usage (Without initial typedef and resolvers)

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

## Intermediate Usage (With initial typedef and resolvers)

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

## Intermediate Usage (Fine grain Mutation configuration)

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

### Global Configs

<table>
 <thead>
  <tr>
  <td>Name</td>
  <td>Description</td>
  <td>Type</td>
  <td>Default Value</td>
  <td>Usage</td>
  <td>Available in</td>
  </tr>
 </thead>
 <tbody>
  <tr>
  <td>output</td>
  <td>Output information</td>
  <td> `boolean | Object` </td>
  <td>false</td>
  <td>
  
 `{output: false}`
 `{output: { dir: process.cwd()}}`
  </td>
  </tr>
  <tr>
  <td>output.dir</td>
  <td>Output directory</td>
  <td>
  
 `string`
   </td>
  <td>
  
 `process.cwd()+"\SDL"`
  </td>
  <td>
  
 `{output: { dir: process.cwd()}}`
  </td>

  </tr>
  <td>Schemas</td>
  <td>Array of schemas generate by mongoose</td>
  <td>
  
 `Schema[]`
  </td>
  <td>
  
 `[]`
  </td>
  <td>
  
 `Schemas: [UserSchema, ...]`
  </td>
  </tr>

  </tr>
  <td>Typedefs</td>
  <td>Typedefs related configuration</td>
  <td>
  
 `Object`
  </td>
  <td>
  
 `{init: undefined}`
  </td>
  <td>
  
 `Typedefs: {init: {User: InitialUserTypedef}}`
  </td>
  </tr>

  </tr>
  <td>Typedefs.init</td>
  <td>Initial typedefs to be attached to resultant typedef</td>
  <td>
  
 `Object`
  </td>
  <td>
  
 `undefined`
  </td>
  <td>
  
 `init: {User: InitialUserTypedef}`
  </td>
  </tr>

  </tr>
  <td>Resolvers</td>
  <td>Typedefs related configuration</td>
  <td>
  
 `Object`
  </td>
  <td>
  
 `{init: undefined}`
  </td>
  <td>
  
 `Resolvers: {init: {User: InitialUserResolvers}}`
  </td>
  </tr>

  </tr>
  <td>Resolvers.init</td>
  <td>Initial resolvers to be attached to resultant resolver</td>
  <td>
  
 `Object`
  </td>
  <td>
  
 `undefined`
  </td>
  <td>
  
 `init: {User: InitialUserResolver}`
  </td>
  </tr>

  <tr>
  <td>appendRTypeToEmbedTypesKey</td>
  <td>Controls whether or not to append the resource type to sub/embed/extra types</td>
  <td>
  
 `boolean`
   </td>
  <td>
  
 `true`
  </td>
  <td>
  
 `appendRTypeToEmbedTypesKey: true`
  </td>
  <td>schema</td>
  </tr>

 </tbody>
</table>

### Schema configs

<table>
 <thead>
  <tr>
  <td>Name</td>
  <td>Description</td>
  <td>Type</td>
  <td>Default Value</td>
  <td>Usage</td>
  </tr>
 </thead>
 <tbody>
  <tr>
  <td>resource</td>
  <td>name of the resource</td>
  <td> `string` </td>
  <td>**Required**</td>
  <td>
  
 `resource: User`
  </tr>

  <tr>
  <td>generate</td>
  <td>Controls generation of type, query and mutations typedefs and resolvers</td>
  <td>
  
 `Object`
   </td>
  <td>
  
 `true`
  </td>
  <td>
  
 `generate: true`
  </td>
  </tr>

  <tr>
  <td>generate.mutation</td>
  <td>Controls generation of mutations typedefs and resolvers</td>
  <td>
  
 `Object`
   </td>
  <td>
  
 `true`
  </td>
  <td>
  
 `generate :{mutation: true}`
  </td>
  </tr>

  <tr>
  <td>generate.mutation.(create|update|delete)</td>
  <td>Controls generation of mutations typedefs and resolvers parts</td>
  <td>
  
`[boolean,boolean] | boolean` , if using tuple first one indicates single resource mutation, and second indicates multi resource mutation.
   </td>
  <td>
  
 `true`
  </td>
  <td>
  
 `generate :{mutation: {create: false, update: [true,false]}}`
 here no create relation mutation will be create, only single resource update resolver and typedef will be created and both single and multi resource will be created for delete
  </td>
  </tr>

  <tr>
  <td>global_excludePartitions</td>
  <td>Controls which auth partition will be excluded in the generated schemas</td>
  <td>
  
 `Object`
   </td>
  <td>
  
 `{base: [], extra: ['Others', 'Mixed']}`
  </td>
  <td>
  
 `global_excludePartitions: {base: [ 'Others', 'Mixed' ]}`
  </td>
  </tr>

  <tr>
  <td>global_excludePartitions.(base|extra)</td>
  <td>Controls which auth partition will be excluded in the types of generated schemas</td>
  <td>
  
 `[] | boolean`
   </td>
  <td>
  
 `{base: [], extra: ['Others', 'Mixed']}`
  </td>
  <td>

 `global_excludePartitions: {base: [ 'Others', 'Mixed' ],extra: ['Self']}`
  </td>
  </tr>

  <tr>
  <td>generateInterface</td>
  <td>Controls whether or not to generate interface from base resource</td>
  <td>
  
 `boolean`
   </td>
  <td>
  
 `true`
  </td>
  <td>
  
 `generateInterface: true`
  </td>
  </

  </tr>
 </tbody>
</table>

### Field configs

<table>
  <thead>
  <tr>
  <td>Name</td>
  <td>Description</td>
  <td>Type</td>
  <td>Default Value</td>
  <td>Usage</td>
  </tr>
 </thead>
  <tbody>

  <tr>
  <td>writable</td>
  <td>Controls whether or not this field is present in generate input</td>
  <td>
  
 `boolean`
   </td>
  <td>
  
 `true`
  </td>
  <td>
  
 `writable: true`
  </td>
  </tr>

  <tr>
  <td>scalar</td>
  <td>Custom graphql scalar to be used (atm all graphql-scalars scalars are included)</td>
  <td>
  
 `string`
   </td>
  <td>
  
 type from mongoose
  </td>
  <td>
  
 `scalar: 'NonNegativeInt'`
  </td>
  </tr>
  </tbody>
</table>

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
