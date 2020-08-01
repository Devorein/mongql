import { ISchemaInfo, MongqlMongooseSchema, AuthEnumString, RangeEnumString, PartEnumString } from "../types";

import pluralize from 'pluralize';
import S from 'voca';
const { difference } = require('lodash');

const parsePagination = require('../utils/query/parsePagination');

export default function (Schema: MongqlMongooseSchema, SchemaInfo: ISchemaInfo) {
  const cr = S.capitalize(Schema.mongql.resource);
  const selfFields: string[] = [],
    mixedFields: string[] = [],
    othersFields: string[] = [];
  const { mongql: { generate: { query } } } = Schema;

  Object.entries(SchemaInfo.Fields[0]).forEach(([key, { excludedAuthSegments }]) => {
    if (!excludedAuthSegments.includes('mixed')) mixedFields.push(key);
    if (!excludedAuthSegments.includes('others')) othersFields.push(key);
    if (!excludedAuthSegments.includes('self')) selfFields.push(key);
  });

  const exlcudedMixedFields: string[] = difference(selfFields, mixedFields);
  const exlcudedOthersFields: string[] = difference(selfFields, othersFields);
  const exlcudedMixedFieldsStr: string = exlcudedMixedFields.map((item: string) => `-${item}`).join(' ');
  const exlcudedOthersFieldsStr: string = exlcudedOthersFields.map((item: string) => `-${item}`).join(' ');

  const AuthSelection = {
    self: '',
    others: exlcudedOthersFieldsStr,
    mixed: exlcudedMixedFieldsStr
  };

  const Selection = (auth: AuthEnumString, part: string) => {
    if (part === 'nameandind') return 'name';
    else if (part === 'whole') return AuthSelection[auth];
  };

  const AuthFilters = {
    self: (ctx: any) => ({ user: ctx.user.id }),
    others: (ctx: any) => ({ user: { $ne: ctx.user.id } }),
    mixed: () => ({})
  };

  const pcr = pluralize(cr, 2);
  const QueryResolvers: { [key: string]: any } = {};

  const Pagination = async (auth: AuthEnumString, args: any, ctx: any) => {
    const { page, limit, sort, filter } = parsePagination(args.pagination);
    return ctx[cr].find({ ...filter, ...AuthFilters[auth](ctx) }).sort(sort).skip(page).limit(limit);
  };

  const Filter = async (auth: AuthEnumString, args: any, ctx: any) => {
    const { filter = '{}' } = args;
    return ctx[cr].find({
      ...JSON.parse(filter),
      ...AuthFilters[auth](ctx)
    });
  };

  const ranges = Object.keys(query);
  ranges.forEach((range) => {
    const auths = Object.keys(query[range as RangeEnumString]);
    auths.forEach((auth) => {
      const parts = Object.keys(query[range as RangeEnumString][auth as AuthEnumString]).filter((part) => query[range as RangeEnumString][auth as AuthEnumString][part as PartEnumString] !== false);
      parts.forEach((part) => {
        QueryResolvers[`get${S.capitalize(range)}${S.capitalize(auth)}${pcr}${S.capitalize(part)}`] = async function (
          parent: any,
          args: any,
          ctx: any
        ) {
          const AuthFilter = AuthFilters[auth as AuthEnumString](ctx);
          if (part === 'Count') {
            if (range === 'All')
              return await ctx[cr].countDocuments({
                ...AuthFilter
              });
            else if (range === 'Filtered')
              return await ctx[cr].countDocuments({
                ...AuthFilter,
                ...(args.filter || '{}')
              });
          }

          let query = null;

          if (range === 'All') query = ctx[cr].find({ ...AuthFilter });
          else if (range === 'Paginated') query = Pagination(auth as AuthEnumString, args, ctx);
          else if (range === 'Filter') query = Filter(auth as AuthEnumString, args, ctx);
          else if (range === 'Id')
            query = ctx[cr].find({
              ...AuthFilter,
              _id: args.id
            });

          query = query.select(Selection(auth as AuthEnumString, part));
          const res = await query;
          return range === 'Id' ? res[0] : res;
        };
      });
    });
  });

  return QueryResolvers;
};
