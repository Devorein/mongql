const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const S = require('voca');

const Mongql = require('../../src/MonGql');

const { setNestedProps, mixObjectProp, flattenObject, matchFlattenedObjQuery } = require('../../utils/objManip');

const queryOpts = [];
const allFields = [];

Array.prototype.diff = function (a) {
	return this.filter((i) => a.indexOf(i) < 0);
};

const obj = {};
[ 'all', 'paginated', 'filtered', 'id' ].forEach((range) => {
	obj[range] = {};
	[ 'self', 'others', 'mixed' ].forEach((auth) => {
		obj[range][auth] = {};
		const parts = range.match(/(id|paginated)/) ? [ 'whole', 'nameandid' ] : [ 'whole', 'nameandid', 'count' ];
		parts.forEach((part) => {
			obj[range][auth][part] = true;
			allFields.push(`${range}.${auth}.${part}`);
		});
	});
});

mixObjectProp(flattenObject(obj)).sort().forEach((excludeQuery) => {
	const query = setNestedProps({}, excludeQuery, false);
	const excludedQuery = matchFlattenedObjQuery(excludeQuery, allFields);
	queryOpts.push({
		field: excludeQuery,
		query,
		excludedQuery
	});
});

function typedefQueryChecker (typedefAST, { excludedQuery }) {
	const QueryExt = documentApi().addSDL(typedefAST).getExt('Query');
	function typeChecker (fields, against) {
		fields.forEach((field) => {
			const [ range, auth, part ] = field.split('.');
			const typename = `get${S.capitalize(range)}${S.capitalize(auth)}Users${S.capitalize(part)}`;
			expect(QueryExt.hasField(typename)).toBe(against);
		});
	}

	const includedFields = allFields.diff(excludedQuery);
	typeChecker(excludedQuery, false);
	typeChecker(includedFields, true);
}

function resolverQueryChecker (resolvers, { excludedQuery }) {
	function resolverChecker (fields, against) {
		fields.forEach((field) => {
			const [ range, auth, part ] = field.split('.');
			const typename = `get${S.capitalize(range)}${S.capitalize(auth)}Users${S.capitalize(part)}`;
			expect(Boolean(resolvers[typename])).toBe(against);
		});
	}

	const includedFields = allFields.diff(excludedQuery);
	resolverChecker(excludedQuery, false);
	resolverChecker(includedFields, true);
}

describe('Query option checker', () => {
	it('Should not contain query related typedefs', async () => {
		const Schema = new mongoose.Schema({
			name: String
		});
		Schema.mongql = { resource: 'user' };
		const mongql = new Mongql({
			Schemas: [ Schema ],
			generate: { query: false }
		});
		const { TransformedTypedefs } = await mongql.generate();
		expect(documentApi().addSDL(TransformedTypedefs.obj.User).hasType('Query')).toBe(false);
	});

	queryOpts.forEach(({ query, field, excludedQuery }) => {
		it(`Should output correct query when ${field} is false in global config`, async () => {
			const Schema = new mongoose.Schema({
				name: String
			});
			Schema.mongql = { resource: 'user' };
			const mongql = new Mongql({
				Schemas: [ Schema ],
				generate: { query }
			});
			const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
			typedefQueryChecker(TransformedTypedefs.obj.User, { query, field, excludedQuery });
			resolverQueryChecker(TransformedResolvers.obj.User.Query, { query, field, excludedQuery });
		});
	});

	// ? Making sure that schema level config overrides global config
	queryOpts.forEach((queryOpt, index) => {
		const { query, field } = queryOpt;
		it(`Should output correct query when ${field} is true in local config`, async () => {
			const Schema = new mongoose.Schema({
				name: String
			});
			Schema.mongql = { resource: 'user', generate: { query } };
			const mongql = new Mongql({
				Schemas: [ Schema ],
				generate: { query: queryOpts[index !== queryOpts.length - 1 ? index + 1 : 0].query }
			});
			const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
			typedefQueryChecker(TransformedTypedefs.obj.User, queryOpt);
			resolverQueryChecker(TransformedResolvers.obj.User.Query, queryOpt);
		});
	});
});
