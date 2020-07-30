const pluralize = require('pluralize');
const S = require('voca');
const { difference } = require('lodash');

const parsePagination = require('../utils/query/parsePagination');

module.exports = function (Schema, transformedSchema) {
  const cr = S.capitalize(Schema.mongql.resource);
  const selfFields = [],
    mixedFields = [],
    othersFields = [];
  const { mongql: { generate: { query } } } = Schema;

  Object.entries(transformedSchema.Fields[0]).forEach(([key, { excludedAuthSegments }]) => {
    if (!excludedAuthSegments.includes('Mixed')) mixedFields.push(key);
    if (!excludedAuthSegments.includes('Others')) othersFields.push(key);
    if (!excludedAuthSegments.includes('Self')) selfFields.push(key);
  });

  const exlcudedMixedFields = difference(selfFields, mixedFields);
  const exlcudedOthersFields = difference(selfFields, othersFields);
  const exlcudedMixedFieldsStr = exlcudedMixedFields.map((item) => `-${item}`).join(' ');
  const exlcudedOthersFieldsStr = exlcudedOthersFields.map((item) => `-${item}`).join(' ');

  const AuthSelection = {
    Self: '',
    Others: exlcudedOthersFieldsStr,
    Mixed: exlcudedMixedFieldsStr
  };

  const Selection = (auth, part) => {
    if (part === 'NameAndId') return 'name';
    else if (part === 'Whole') return AuthSelection[auth];
  };

  const AuthFilters = {
    Self: (ctx) => ({ user: ctx.user.id }),
    Others: (ctx) => ({ user: { $ne: ctx.user.id } }),
    Mixed: () => ({})
  };

  const pcr = pluralize(cr, 2);
  const QueryResolvers = {};

  const Pagination = async (auth, args, ctx) => {
    const { page, limit, sort, filter } = parsePagination(args.pagination);
    return ctx[cr].find({ ...filter, ...AuthFilters[auth](ctx) }).sort(sort).skip(page).limit(limit);
  };

  const Filter = async (auth, args, ctx) => {
    const { filter = '{}' } = args;
    return ctx[cr].find({
      ...JSON.parse(filter),
      ...AuthFilters[auth](ctx)
    });
  };

  if (query !== false) {
    const ranges = Object.keys(query);
    ranges.forEach((range) => {
      const auths = Object.keys(query[range]);
      auths.forEach((auth) => {
        const parts = Object.keys(query[range][auth]).filter((part) => query[range][auth][part] !== false);
        parts.forEach((part) => {
          const _range = S.capitalize(range);
          const _auth = S.capitalize(auth);
          const _part = S.capitalize(part);
          QueryResolvers[`get${_range}${_auth}${pcr}${_part}`] = async function (
            parent,
            args,
            ctx
          ) {
            const AuthFilter = AuthFilters[_auth](ctx);
            if (_part === 'Count') {
              if (_range === 'All')
                return await ctx[cr].countDocuments({
                  ...AuthFilter
                });
              else if (_range === 'Filtered')
                return await ctx[cr].countDocuments({
                  ...AuthFilter,
                  ...(args.filter || '{}')
                });
            }

            let query = null;

            if (_range === 'All') query = ctx[cr].find({ ...AuthFilter });
            else if (_range === 'Paginated') query = Pagination(_auth, args, ctx);
            else if (_range === 'Filter') query = Filter(_auth, args, ctx);
            else if (_range === 'Id')
              query = ctx[cr].find({
                ...AuthFilter,
                _id: args.id
              });

            query = query.select(Selection(_auth, _part));
            const res = await query;
            return _range === 'Id' ? res[0] : res;
          };
        });
      });
    });
  }

  return QueryResolvers;
};
