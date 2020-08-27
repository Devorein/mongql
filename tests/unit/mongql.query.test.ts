import mongoose from 'mongoose';
import { documentApi } from 'graphql-extra';
import { capitalize, flattenDocumentNode } from '../../dist/utils';
import { IMongqlMongooseSchemaPartial, MutableDocumentNode } from '../../dist';

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

type QueryOpt = {
  field: string,
  excludedQueries: string[],
  query: boolean
};

const queryOpts: QueryOpt[] = [];

const QueryMap: Record<string, string[]> = {
  getAllSelfUsersWhole: ['', '[SelfUserObject!]!'],
  getAllSelfUsersCount: ['', 'NonNegativeInt!'],
  getAllOthersUsersWhole: ['', '[OthersUserObject!]!'],
  getAllOthersUsersCount: ['', 'NonNegativeInt!'],
  getAllMixedUsersWhole: ['', '[MixedUserObject!]!'],
  getAllMixedUsersCount: ['', 'NonNegativeInt!'],
  getPaginatedSelfUsersWhole: ['pagination:PaginationInput!', 'SelfUserPaginationObject!'],
  getPaginatedOthersUsersWhole: ['pagination:PaginationInput!', 'OthersUserPaginationObject!'],
  getPaginatedMixedUsersWhole: ['pagination:PaginationInput!', 'MixedUserPaginationObject!'],
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
  excludedQueries: QueryFields,
  query: false
});

mixObjectProp(flattenObject(QueryOptions)).sort().forEach((excludeQuery: string, index: number) => {
  const query = setNestedFields({}, excludeQuery, false);
  const excludedQueries = matchFlattenedObjProps(excludeQuery, QueryFields);
  queryOpts.push({
    field: excludeQuery,
    query,
    excludedQueries
  });
});

function QueryChecker(target: any, { excludedQueries }: any, type: any) {
  function checker(fields: string[], against: boolean) {
    fields.forEach((field) => {
      const [range, auth, part] = field.split('.');
      const queryname = `get${capitalize(range)}${capitalize(auth)}Users${capitalize(part)}`;
      if (type === 'typedef') {
        expect(target.hasField(queryname)).toBe(against);
        if (against) {
          expect(QueryMap[queryname][0]).toBe(argumentsToString(target.getField(queryname).node.arguments));
          expect(QueryMap[queryname][1]).toBe(outputToString(target.getField(queryname).node.type));
        }
      } else expect(Boolean(target[queryname])).toBe(against);
    });
  }
  if (excludedQueries.length === QueryMapLength) {
    if (type === 'typedef') expect(documentApi().addSDL(target).hasExt('Query')).toBe(false);
    if (type === 'resolver') expect(target.Query).toBeFalsy();
  } else {
    target = type === 'typedef' ? documentApi().addSDL(target).getExt('Query') : target;
    const includedQueries = Arraydiff(QueryFields, excludedQueries);
    checker(excludedQueries, false);
    checker(includedQueries, true);
  }
}

function OperationChecker(OperationNodes: MutableDocumentNode, { excludedQueries }: QueryOpt) {
  const FlattenedDocumentNode = flattenDocumentNode(OperationNodes);
  const includedQueries = Arraydiff(QueryFields, excludedQueries);
  function checker(arr: string[], against: boolean) {
    arr.forEach(query => {
      const [range, auth, part] = query.split('.');
      (part !== "count" ? ['RefsNone', 'ObjectsNone', 'ScalarsOnly'] : ['']).forEach(fragment_name => {
        const opname = `Get${capitalize(range)}${capitalize(auth)}Users${capitalize(part)}${fragment_name ? "_" + fragment_name : ''}`;
        expect(Boolean(FlattenedDocumentNode.OperationDefinition[opname])).toBe(against)
      })
    })
  }
  checker(excludedQueries, false);
  checker(includedQueries, true);
}

describe('Query option checker', () => {
  ['global', 'local'].forEach((partition) => {
    queryOpts.forEach((queryOpt, index) => {
      const { query, field } = queryOpt;
      it(`Should output correct query when ${field} is false in ${partition} config`, async () => {
        const nested_schema = new mongoose.Schema({
          nested: Number
        })
        const Schema = new mongoose.Schema({
          name: String,
          ref: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
          },
          nested: nested_schema
        }) as IMongqlMongooseSchemaPartial;

        Schema.mongql = { resource: 'user' };
        const generate = {
          query
        };
        if (partition === 'local') {
          Schema.mongql.generate = { query };
          const GlobalQueryOtps = queryOpts[index !== queryOpts.length - 1 ? index + 1 : 1];
          generate.query = GlobalQueryOtps.query;
          queryOpt.excludedQueries = Array.from(new Set(queryOpt.excludedQueries.concat(GlobalQueryOtps.excludedQueries)));
        }
        const mongql = new Mongql({
          Schemas: [Schema],
          generate
        });
        const { TransformedTypedefs, TransformedResolvers, OperationNodes } = await mongql.generate();
        QueryChecker(TransformedTypedefs.obj.User, queryOpt, 'typedef');
        QueryChecker(TransformedResolvers.obj.User.Query, queryOpt, 'resolver');
        OperationChecker(OperationNodes, queryOpt);
      });
    });
  });
});
