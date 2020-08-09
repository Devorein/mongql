const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const S = require('voca');

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

const queryOpts = [];

const QueryMap = {
	getAllSelfUsersWhole: [ '', '[SelfUserObject!]!' ],
	getAllSelfUsersNameandid: [ '', '[NameAndId!]!' ],
	getAllSelfUsersCount: [ '', 'NonNegativeInt!' ],
	getAllOthersUsersWhole: [ '', '[OthersUserObject!]!' ],
	getAllOthersUsersNameandid: [ '', '[NameAndId!]!' ],
	getAllOthersUsersCount: [ '', 'NonNegativeInt!' ],
	getAllMixedUsersWhole: [ '', '[MixedUserObject!]!' ],
	getAllMixedUsersNameandid: [ '', '[NameAndId!]!' ],
	getAllMixedUsersCount: [ '', 'NonNegativeInt!' ],
	getPaginatedSelfUsersWhole: [ 'pagination:PaginationInput!', '[SelfUserObject!]!' ],
	getPaginatedSelfUsersNameandid: [ 'pagination:PaginationInput!', '[NameAndId!]!' ],
	getPaginatedOthersUsersWhole: [ 'pagination:PaginationInput!', '[OthersUserObject!]!' ],
	getPaginatedOthersUsersNameandid: [ 'pagination:PaginationInput!', '[NameAndId!]!' ],
	getPaginatedMixedUsersWhole: [ 'pagination:PaginationInput!', '[MixedUserObject!]!' ],
	getPaginatedMixedUsersNameandid: [ 'pagination:PaginationInput!', '[NameAndId!]!' ],
	getFilteredSelfUsersWhole: [ 'filter:JSON', '[SelfUserObject!]!' ],
	getFilteredSelfUsersNameandid: [ 'filter:JSON', '[NameAndId!]!' ],
	getFilteredSelfUsersCount: [ 'filter:JSON', 'NonNegativeInt!' ],
	getFilteredOthersUsersWhole: [ 'filter:JSON', '[OthersUserObject!]!' ],
	getFilteredOthersUsersNameandid: [ 'filter:JSON', '[NameAndId!]!' ],
	getFilteredOthersUsersCount: [ 'filter:JSON', 'NonNegativeInt!' ],
	getFilteredMixedUsersWhole: [ 'filter:JSON', '[MixedUserObject!]!' ],
	getFilteredMixedUsersNameandid: [ 'filter:JSON', '[NameAndId!]!' ],
	getFilteredMixedUsersCount: [ 'filter:JSON', 'NonNegativeInt!' ],
	getIdSelfUsersWhole: [ 'id:ID!', 'SelfUserObject!' ],
	getIdSelfUsersNameandid: [ 'id:ID!', 'NameAndId!' ],
	getIdOthersUsersWhole: [ 'id:ID!', 'OthersUserObject!' ],
	getIdOthersUsersNameandid: [ 'id:ID!', 'NameAndId!' ],
	getIdMixedUsersWhole: [ 'id:ID!', 'MixedUserObject!' ],
	getIdMixedUsersNameandid: [ 'id:ID!', 'NameAndId!' ]
};

const QueryMapLength = Object.keys(QueryMap).length;

Array.prototype.diff = function (a) {
	return this.filter((i) => a.indexOf(i) < 0);
};

queryOpts.push({
	field: 'query',
	excludedQuery: QueryFields,
	query: false
});

mixObjectProp(flattenObject(QueryOptions)).sort().forEach((excludeQuery) => {
	const query = setNestedFields({}, excludeQuery, false);
	const excludedQuery = matchFlattenedObjProps(excludeQuery, QueryFields);
	queryOpts.push({
		field: excludeQuery,
		query,
		excludedQuery
	});
});

function QueryChecker (target, { excludedQuery }, type) {
	function checker (fields, against) {
		fields.forEach((field) => {
			const [ range, auth, part ] = field.split('.');
			const typename = `get${S.capitalize(range)}${S.capitalize(auth)}Users${S.capitalize(part)}`;
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
		const includedFields = QueryFields.diff(excludedQuery);
		checker(excludedQuery, false);
		checker(includedFields, true);
	}
}

describe('Query option checker', () => {
	[ 'global', 'local' ].forEach((partition) => {
		queryOpts.forEach((queryOpt, index) => {
			const { query, field } = queryOpt;
			it(`Should output correct query when ${field} is false in ${partition} config`, async () => {
				const Schema = new mongoose.Schema({
					name: String
				});
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
					Schemas: [ Schema ],
					generate
				});
				const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
				QueryChecker(TransformedTypedefs.obj.User, queryOpt, 'typedef');
				QueryChecker(TransformedResolvers.obj.User.Query, queryOpt, 'resolver');
			});
		});
	});
});
