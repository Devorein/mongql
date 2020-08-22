import mongoose from 'mongoose';
import { documentApi } from 'graphql-extra';
import { capitalize } from '../../dist/utils';
import { IMongqlMongooseSchemaPartial } from '../../dist';

const {
  generateOptions,
  Mongql,
  argumentsToString,
  outputToString,
  setNestedFields,
  mixObjectProp,
  flattenObject,
  matchFlattenedObjProps
} = require('../../dist/index');

const { query: { options: QueryOptions, fields: QueryFields } } = generateOptions();

const queryOpts: {
  field: string,
  excludedQuery: string[],
  query: boolean
}[] = [];

const QueryMap: Record<string, string[]> = {
  getAllSelfUsersWhole: ['', '[SelfUserObject!]!'],
  getAllSelfUsersCount: ['', 'NonNegativeInt!'],
  getAllOthersUsersWhole: ['', '[OthersUserObject!]!'],
  getAllOthersUsersCount: ['', 'NonNegativeInt!'],
  getAllMixedUsersWhole: ['', '[MixedUserObject!]!'],
  getAllMixedUsersCount: ['', 'NonNegativeInt!'],
  getPaginatedSelfUsersWhole: ['pagination:PaginationInput!', '[SelfUserObject!]!'],
  getPaginatedOthersUsersWhole: ['pagination:PaginationInput!', '[OthersUserObject!]!'],
  getPaginatedMixedUsersWhole: ['pagination:PaginationInput!', '[MixedUserObject!]!'],
  getFilteredSelfUsersWhole: ['filter:JSON', '[SelfUserObject!]!'],
  getFilteredSelfUsersCount: ['filter:JSON', 'NonNegativeInt!'],
  getFilteredOthersUsersWhole: ['filter:JSON', '[OthersUserObject!]!'],
  getFilteredOthersUsersCount: ['filter:JSON', 'NonNegativeInt!'],
  getFilteredMixedUsersWhole: ['filter:JSON', '[MixedUserObject!]!'],
  getFilteredMixedUsersCount: ['filter:JSON', 'NonNegativeInt!'],
  getIdSelfUsersWhole: ['id:ID!', 'SelfUserObject!'],
  getIdOthersUsersWhole: ['id:ID!', 'OthersUserObject!'],
  getIdMixedUsersWhole: ['id:ID!', 'MixedUserObject!']
};

const QueryMapLength = Object.keys(QueryMap).length;

const Arraydiff = (target: any[], a: any) => {
  return target.filter((i: any) => a.indexOf(i) < 0);
};

queryOpts.push({
  field: 'query',
  excludedQuery: QueryFields,
  query: false
});

mixObjectProp(flattenObject(QueryOptions)).sort().forEach((excludeQuery: string) => {
  const query = setNestedFields({}, excludeQuery, false);
  const excludedQuery = matchFlattenedObjProps(excludeQuery, QueryFields);
  queryOpts.push({
    field: excludeQuery,
    query,
    excludedQuery
  });
});

function QueryChecker(target: any, { excludedQuery }: any, type: any) {
  function checker(fields: string[], against: boolean) {
    fields.forEach((field) => {
      const [range, auth, part] = field.split('.');
      const typename = `get${capitalize(range)}${capitalize(auth)}Users${capitalize(part)}`;
      if (type === 'typedef') {
        expect(target.hasField(typename)).toBe(against);
        if (against) {
          expect(QueryMap[typename][0]).toBe(argumentsToString(target.getField(typename).node.arguments));
          expect(QueryMap[typename][1]).toBe(outputToString(target.getField(typename).node.type));
        }
      } else expect(Boolean(target[typename])).toBe(against);
    });
  }
  if (excludedQuery.length === QueryMapLength) {
    if (type === 'typedef') expect(documentApi().addSDL(target).hasExt('Query')).toBe(false);
    if (type === 'resolver') expect(target.Query).toBeFalsy();
  } else {
    target = type === 'typedef' ? documentApi().addSDL(target).getExt('Query') : target;
    const includedFields = Arraydiff(QueryFields, excludedQuery);
    checker(excludedQuery, false);
    checker(includedFields, true);
  }
}

describe('Query option checker', () => {
  ['global', 'local'].forEach((partition) => {
    queryOpts.forEach((queryOpt, index) => {
      const { query, field } = queryOpt;
      it(`Should output correct query when ${field} is false in ${partition} config`, async () => {
        const Schema = new mongoose.Schema({
          name: String
        }) as IMongqlMongooseSchemaPartial;
        Schema.mongql = { resource: 'user' };
        const generate = {
          query
        };
        if (partition === 'local') {
          Schema.mongql.generate = { query };
          const GlobalQueryOtps = queryOpts[index !== queryOpts.length - 1 ? index + 1 : 1];
          generate.query = GlobalQueryOtps.query;
          queryOpt.excludedQuery = Array.from(new Set(queryOpt.excludedQuery.concat(GlobalQueryOtps.excludedQuery)));
        }
        const mongql = new Mongql({
          Schemas: [Schema],
          generate
        });
        const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
        QueryChecker(TransformedTypedefs.obj.User, queryOpt, 'typedef');
        QueryChecker(TransformedResolvers.obj.User.Query, queryOpt, 'resolver');
      });
    });
  });
});
