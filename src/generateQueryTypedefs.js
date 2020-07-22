const pluralize = require('pluralize');
const S = require('voca');

module.exports = function (Schema) {
	const { mongql: { resource, generate: { query } } } = Schema;
	const cResource = S.capitalize(resource);
	const cpResource = pluralize(cResource, 2);
	const res = [];
	const ranges = Object.keys(query).filter((range) => query[range].__original === undefined);
	ranges.forEach((range) => {
		const auths = Object.keys(query[range]).filter((auth) => query[range][auth].__original === undefined);
		auths.forEach((auth) => {
			const parts = Object.keys(query[range][auth]).filter((part) => query[range][auth][part] !== false);
			parts.forEach((part) => {
				const _range = S.capitalize(range);
				const _auth = S.capitalize(auth);
				const _part = S.capitalize(part);
				let input = '',
					output = `[${_auth}${cResource}Type!]!`;
				if (_range === 'Paginated') {
					input = '(pagination: PaginationInput!)';
					if (_part === 'Nameandid') output = '[NameAndId!]!';
				} else if (_range === 'Filtered') {
					input = '(filter: JSON)';
					if (_part === 'Nameandid') output = '[NameAndId!]!';
				} else if (_range === 'Id') {
					input = '(id: ID!)';
					output = `${_auth}${cResource}Type!`;
					if (_part === 'Nameandid') output = 'NameAndId!';
				}
				if (_part === 'Count') output = 'NonNegativeInt!';
				const commonComment = `"Get ${_range.toLowerCase()} ${_auth.toLowerCase()} ${resource.toLowerCase()} ${_part.toLowerCase()}`;
				res.push(`${commonComment}"\n get${_range}${_auth}${cpResource}${_part}${input}: ${output}`);
			});
		});
	});
	return ranges.length > 0 ? `extend type Query {\n${res.join('\n')}\n}` : null;
};
