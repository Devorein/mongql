const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const S = require('voca');

const Mongql = require('../../src/MonGql');

Array.prototype.diff = function (a) {
	return this.filter((i) => a.indexOf(i) < 0);
};

const queryOpts = [];
const allFields = [];

const ranges = [ 'all', 'paginated', 'filtered', 'id' ];
ranges.forEach((range) => {
	const auths = [ 'self', 'others', 'mixed' ];
	const parts = range.match(/(id|paginated)/) ? [ 'whole', 'nameandid' ] : [ 'whole', 'nameandid', 'count' ];
	let field = range;
	let excludedFields = [];
	auths.forEach((auth) => {
		parts.forEach((part) => {
			excludedFields.push(`${range}.${auth}.${part}`);
		});
	});
	queryOpts.push({ query: { [range]: false }, field, excludedFields });

	auths.forEach((auth) => {
		field = `${range}.${auth}`;
		let excludedFields = [];
		parts.forEach((part) => {
			excludedFields.push(`${range}.${auth}.${part}`);
		});

		queryOpts.push({
			query: {
				[range]: {
					[auth]: false
				}
			},
			field,
			excludedFields
		});

		parts.forEach((part) => {
			field = `${range}.${auth}.${part}`;
			queryOpts.push({
				query: {
					[range]: {
						[auth]: {
							[part]: false
						}
					}
				},
				field,
				excludedFields: [ field ]
			});
			allFields.push(field);
		});
	});
});

function typedefQueryChecker (typedefAST, { excludedFields }) {
	const QueryExt = documentApi().addSDL(typedefAST).getExt('Query');
	function typeChecker (fields, against) {
		fields.forEach((field) => {
			const [ range, auth, part ] = field.split('.');
			const typename = `get${S.capitalize(range)}${S.capitalize(auth)}Users${S.capitalize(part)}`;
			expect(QueryExt.hasField(typename)).toBe(against);
		});
	}

	const includedFields = allFields.diff(excludedFields);
	typeChecker(excludedFields, false);
	typeChecker(includedFields, true);
}

function resolverQueryChecker (resolvers, { excludedFields }) {
	function resolverChecker (fields, against) {
		fields.forEach((field) => {
			const [ range, auth, part ] = field.split('.');
			const typename = `get${S.capitalize(range)}${S.capitalize(auth)}Users${S.capitalize(part)}`;
			expect(Boolean(resolvers[typename])).toBe(against);
		});
	}

	const includedFields = allFields.diff(excludedFields);
	resolverChecker(excludedFields, false);
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

	queryOpts.forEach(({ query, field, excludedFields }) => {
		it(`Should output correct query when ${field} is false`, async () => {
			const Schema = new mongoose.Schema({
				name: String
			});
			Schema.mongql = { resource: 'user' };
			const mongql = new Mongql({
				Schemas: [ Schema ],
				generate: { query }
			});
			const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
			typedefQueryChecker(TransformedTypedefs.obj.User, { query, field, excludedFields });
			resolverQueryChecker(TransformedResolvers.obj.User.Query, { query, field, excludedFields });
		});
	});
});
