import { TParsedSchemaInfo, AuthEnumString, RangeEnumString, PartEnumString, IMongqlBaseSchemaConfigsFull } from "../types";

import pluralize from 'pluralize';
import S from 'voca';

import parsePagination from '../utils/query/parsePagination';

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

  const { generate: { query }, resource } = Object.values(SchemaInfo.Schemas[0])[0] as IMongqlBaseSchemaConfigsFull;
  const cr = S.capitalize(resource);

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


  const Selection = (auth: AuthEnumString, part: string) => {
    if (part === 'nameandind') return 'name';
    else if (part === 'whole') return ExcludedFields[auth];
  };

  const AuthFilters = {
    self: (ctx: any) => ({ user: ctx.user.id }),
    others: (ctx: any) => ({ user: { $ne: ctx.user.id } }),
    mixed: () => ({})
  };

  const pcr = pluralize(cr, 2);
  const QueryResolvers: { [key: string]: any } = InitResolver.Query;

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

  const ranges = Object.keys(query) as RangeEnumString[];
  ranges.forEach((range) => {
    const auths = Object.keys(query[range]) as AuthEnumString[];
    auths.forEach((auth) => {
      const parts = Object.keys(query[range][auth]).filter((part) => query[range][auth as AuthEnumString][part as PartEnumString] !== false);
      parts.forEach((part) => {
        const key = `get${S.capitalize(range)}${S.capitalize(auth)}${pcr}${S.capitalize(part)}`;
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

            let query = null;

            if (range === 'all') query = ctx[cr].find({ ...AuthFilter });
            else if (range === 'paginated') query = Pagination(auth, args, ctx);
            else if (range === 'filtered') query = Filter(auth, args, ctx);
            else if (range === 'id')
              query = ctx[cr].find({
                ...AuthFilter,
                _id: args.id
              });

            const res = await query.select(Selection(auth, part));
            return range === 'id' ? res[0] : res;
          };
      });
    });
  });
}
