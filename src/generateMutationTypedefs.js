const pluralize = require('pluralize');
const S = require('voca');

module.exports = function (Schema) {
	const { mongql: { resource, generate: { mutation } } } = Schema;

	const capitalizedResource = S.capitalize(resource);
	const pluralizedResource = pluralize(resource, 2);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);
	const res = [],
		actions = Object.keys(mutation);

	actions.forEach((action) => {
		const parts = Object.keys(mutation[action]).filter((part) => mutation[action][part]);
		parts.forEach((part) => {
			if (part === 'single')
				res.push(
					`"${S.capitalize(
						action
					)} single ${resource}"\n${action}${capitalizedResource}(data: ${capitalizedResource}Input!): Self${capitalizedResource}Type!`
				);
			else if (part === 'multi')
				res.push(
					`"${S.capitalize(
						action
					)} multiple ${pluralizedResource}"\n${action}${pluralizedcapitalizedResource}(data: ${capitalizedResource}Input!): [Self${capitalizedResource}Type!]!`
				);
		});
	});
	return res.length > 0 ? `extend type Mutation {\n${res.join('\n')}\n}` : null;
};
