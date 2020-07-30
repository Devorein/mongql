const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const S = require('voca');

const Mongql = require('../../src/MonGql');

const { setNestedProps, mixObjectProp, flattenObject, matchFlattenedObjProps } = require('../../utils/objManip');
const { query: { options: QueryOptions, fields: QueryFields } } = require('../../utils/generateOptions');
const { argumentsToString, outputToString } = require('../../utils/AST/transformASTToString');

const queryOpts = [];

const QueryArgs = {
  getAllSelfUsersWhole: ['', '[SelfUserObject!]!'],
  getAllSelfUsersNameandid: ['', '[NameAndId!]!'],
  getAllSelfUsersCount: ['', 'NonNegativeInt!'],
  getAllOthersUsersWhole: ['', '[OthersUserObject!]!'],
  getAllOthersUsersNameandid: ['', '[NameAndId!]!'],
  getAllOthersUsersCount: ['', 'NonNegativeInt!'],
  getAllMixedUsersWhole: ['', '[MixedUserObject!]!'],
  getAllMixedUsersNameandid: ['', '[NameAndId!]!'],
  getAllMixedUsersCount: ['', 'NonNegativeInt!'],
  getPaginatedSelfUsersWhole: ['pagination:PaginationInput!', '[SelfUserObject!]!'],
  getPaginatedSelfUsersNameandid: ['pagination:PaginationInput!', '[NameAndId!]!'],
  getPaginatedOthersUsersWhole: ['pagination:PaginationInput!', '[OthersUserObject!]!'],
  getPaginatedOthersUsersNameandid: ['pagination:PaginationInput!', '[NameAndId!]!'],
  getPaginatedMixedUsersWhole: ['pagination:PaginationInput!', '[MixedUserObject!]!'],
  getPaginatedMixedUsersNameandid: ['pagination:PaginationInput!', '[NameAndId!]!'],
  getFilteredSelfUsersWhole: ['filter:JSON', '[SelfUserObject!]!'],
  getFilteredSelfUsersNameandid: ['filter:JSON', '[NameAndId!]!'],
  getFilteredSelfUsersCount: ['filter:JSON', 'NonNegativeInt!'],
  getFilteredOthersUsersWhole: ['filter:JSON', '[OthersUserObject!]!'],
  getFilteredOthersUsersNameandid: ['filter:JSON', '[NameAndId!]!'],
  getFilteredOthersUsersCount: ['filter:JSON', 'NonNegativeInt!'],
  getFilteredMixedUsersWhole: ['filter:JSON', '[MixedUserObject!]!'],
  getFilteredMixedUsersNameandid: ['filter:JSON', '[NameAndId!]!'],
  getFilteredMixedUsersCount: ['filter:JSON', 'NonNegativeInt!'],
  getIdSelfUsersWhole: ['id:ID!', 'SelfUserObject!'],
  getIdSelfUsersNameandid: ['id:ID!', 'NameAndId!'],
  getIdOthersUsersWhole: ['id:ID!', 'OthersUserObject!'],
  getIdOthersUsersNameandid: ['id:ID!', 'NameAndId!'],
  getIdMixedUsersWhole: ['id:ID!', 'MixedUserObject!'],
  getIdMixedUsersNameandid: ['id:ID!', 'NameAndId!']
};

Array.prototype.diff = function (a) {
  return this.filter((i) => a.indexOf(i) < 0);
};

queryOpts.push({
  field: 'query',
  excludedQuery: QueryFields,
  query: false
});

mixObjectProp(flattenObject(QueryOptions)).sort().forEach((excludeQuery) => {
  const query = setNestedProps({}, excludeQuery, false);
  const excludedQuery = matchFlattenedObjProps(excludeQuery, QueryFields);
  queryOpts.push({
    field: excludeQuery,
    query,
    excludedQuery
  });
});

function QueryChecker(target, { field, excludedQuery }, type) {
  function checker(fields, against) {
    fields.forEach((field) => {
      const [range, auth, part] = field.split('.');
      const typename = `get${S.capitalize(range)}${S.capitalize(auth)}Users${S.capitalize(part)}`;
      if (type === 'typedef') {
        expect(target.hasField(typename)).toBe(against);
        if (against) {
          expect(QueryArgs[typename][0]).toBe(argumentsToString(target.getField(typename).node.arguments));
          expect(QueryArgs[typename][1]).toBe(outputToString(target.getField(typename).node.type));
        }
      } else expect(Boolean(target[typename])).toBe(against);
    });
  }
  if (field === 'query' && type === 'typedef') expect(documentApi().addSDL(target).hasExt('Query')).toBe(false);
  else if (field === 'query' && type === 'resolver') expect(target.Query).toBeFalsy();
  else {
    target = type === 'typedef' ? documentApi().addSDL(target).getExt('Query') : target;
    const includedFields = QueryFields.diff(excludedQuery);
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
        });
        Schema.mongql = { resource: 'user' };
        if (partition === 'local') Schema.mongql.generate = { query };
        const mongql = new Mongql({
          Schemas: [Schema],
          generate: {
            query: partition === 'local' ? queryOpts[index !== queryOpts.length - 1 ? index + 1 : 0].query : query
          }
        });
        const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
        QueryChecker(TransformedTypedefs.obj.User, queryOpt, 'typedef');
        QueryChecker(TransformedResolvers.obj.User.Query, queryOpt, 'resolver');
      });
    });
  });
});
