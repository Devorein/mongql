const pluralize = require('pluralize');
const S = require('voca');
const { t } = require('graphql-extra');

const ArgumentMap = {
	paginated: [
		{
			name: 'pagination',
			type: 'PaginationInput!',
			description: 'An input consisting of skip,limit,filter and sort'
		}
	],
	nameandid: [],
	filtered: [
		{
			name: 'filter',
			type: 'JSON',
			description: 'An input for filtering using JSON syntax'
		}
	],
	id: [
		{
			name: 'id',
			type: 'ID!',
			description: 'An input selecting resource by id'
		}
	]
};

module.exports = function (Schema) {
	const { mongql: { resource: r, generate: { query } } } = Schema;
	const cr = S.capitalize(r);
	const cpr = pluralize(cr, 2);
	const node = {
		name: 'Mutation',
		description: 'Mutation',
		directives: [],
		interfaces: [],
		fields: []
	};

	const ranges = Object.keys(query);
	ranges.forEach((range) => {
		const auths = Object.keys(query[range]);
		auths.forEach((auth) => {
			const parts = Object.keys(query[range][auth]).filter((part) => query[range][auth][part] !== false);
			parts.forEach((part) => {
				let output = `[${S.capitalize(auth)}${cr}Type!]!`;
				if (range === 'paginated' && part === 'nameandid') output = '[NameAndId!]!';
				else if (range === 'filtered' && part === 'nameandid') output = '[NameAndId!]!';
				else if (range === 'id' && part === 'nameandid') output = 'NameAndId!';
				if (part === 'count') output = 'NonNegativeInt!';
				node.fields.push({
					name: `get${S.capitalize(range)}${S.capitalize(auth)}${cpr}${S.capitalize(part)}`,
					type: output,
					description: `Get ${range} ${auth} ${r} ${part}`,
					arguments: ArgumentMap[`${range}`]
				});
			});
		});
	});
	return node.fields.length > 0 ? t.objectExt(node) : null;
};
