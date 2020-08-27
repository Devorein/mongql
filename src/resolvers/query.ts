import { TParsedSchemaInfo, AuthEnumString, RangeEnumString, PartEnumString, IMongqlBaseSchemaConfigsFull } from "../types";

import pluralize from 'pluralize';

import { capitalize, parsePagination } from '../utils';

type TExcludedFields = {
  self: string
  others: string
  mixed: string
}

/**
 * Generates query typedefs from a mongoose schema
 * 1. Merges the Intital Mutation typedefs given via GlobalConfig or from the schema
 * 2. Checks the generate.query options to figure out what needs to be generated
 * 3. Generates based on range, auth and part
 * 4. Filters out excluded fields
 * @param Schema Schema to generate query typedefs from
 * @param TypedefAST Initital or Previous DocumentNode to merge to Final AST
 */

export default function (SchemaInfo: TParsedSchemaInfo, InitResolver: Record<string, any>) {
  if (!InitResolver.Query) InitResolver.Query = {};

  const { generate: { query }, resource, operationNameMapper = {} } = Object.values(SchemaInfo.Schemas[0])[0] as IMongqlBaseSchemaConfigsFull;
  const cr = capitalize(resource);

  const ExcludedFields: TExcludedFields = {
    self: '',
    others: '',
    mixed: ''
  }

  SchemaInfo.Fields.forEach((fields) => {
    Object.values(fields).forEach(({ excludedAuthSegments, path }) => {
      const fullpath = path.map(p => p.key).join(".");
      excludedAuthSegments.forEach(excludedAuthSegment => {
        const current_excluded = ExcludedFields[excludedAuthSegment as AuthEnumString];
        ExcludedFields[excludedAuthSegment as AuthEnumString] = (`${current_excluded ? current_excluded + " " : ""}-${fullpath}`)
      })
    })
  });

  const AuthFilters = {
    self: (ctx: any) => ({ user: ctx.user.id }),
    others: (ctx: any) => ({ user: { $ne: ctx.user.id } }),
    mixed: () => ({})
  };

  const pcr = pluralize(cr, 2);
  const QueryResolvers: { [key: string]: any } = InitResolver.Query;

  const Pagination = async (auth: AuthEnumString, args: any, ctx: any) => {
    const model = ctx[cr];
    const { startIndex, endIndex, page, limit, sort, filter } = parsePagination(args.pagination);
    const total = await model.countDocuments();
    const pagination = {
      prev: {},
      next: {}
    };

    if (endIndex < total)
      pagination.next = {
        page: page + 1,
        limit
      };

    if (startIndex > 0)
      pagination.prev = {
        page: page - 1,
        limit
      };

    const data = await ctx[cr].find({ ...filter, ...AuthFilters[auth](ctx) }).sort(sort).skip(startIndex).limit(limit).select(ExcludedFields[auth]);
    const count = await ctx[cr].countDocuments({
      ...filter,
      ...AuthFilters[auth](ctx)
    });
    return {
      count,
      pagination,
      data
    };
  };

  const Filter = async (auth: AuthEnumString, args: any, ctx: any) => {
    const { filter = '{}' } = args;
    return await ctx[cr].find({
      ...JSON.parse(filter),
      ...AuthFilters[auth](ctx)
    }).select(ExcludedFields[auth]);
  };

  const ranges = Object.keys(query) as RangeEnumString[];
  ranges.forEach((range) => {
    const auths = Object.keys(query[range]) as AuthEnumString[];
    auths.forEach((auth) => {
      const parts = Object.keys(query[range][auth]).filter((part) => query[range][auth as AuthEnumString][part as PartEnumString] !== false);
      parts.forEach((part) => {
        let key = `get${capitalize(range)}${capitalize(auth)}${pcr}${capitalize(part)}`;
        key = operationNameMapper[key] || key;
        if (!QueryResolvers[key])
          QueryResolvers[key] = async function (
            parent: any,
            args: any,
            ctx: any
          ) {
            const AuthFilter = AuthFilters[auth](ctx);
            if (part === 'count') {
              if (range === 'all')
                return await ctx[cr].countDocuments({
                  ...AuthFilter
                });
              else if (range === 'filtered')
                return await ctx[cr].countDocuments({
                  ...AuthFilter,
                  ...(args.filter || '{}')
                });
            }

            let res = null;

            if (range === 'all') res = await ctx[cr].find({ ...AuthFilter }).select(ExcludedFields[auth]);
            else if (range === 'paginated') res = await Pagination(auth, args, ctx);
            else if (range === 'filtered') res = await Filter(auth, args, ctx);
            else if (range === 'id')
              res = await ctx[cr].find({
                ...AuthFilter,
                _id: args.id
              });

            return range === 'id' ? res[0] : res;
          };
      });
    });
  });
}
