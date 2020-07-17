const pluralize = require('pluralize');
const S = require('String');

module.exports = function (Schema) {
	const { mongql: { resource, generate: { mutation } } } = Schema;

	const capitalizedResource = S(resource).capitalize().s;
	const pluralizedResource = pluralize(resource, 2);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

	let mutationsStr = ``;

	[ 'create', 'update', 'delete' ].forEach((action) => {
		if (mutation === true || mutation[action] === true || mutation[action][0])
			mutationsStr += `
        "${S(action).capitalize().s} single ${resource}"
        ${action}${capitalizedResource}(data: ${capitalizedResource}Input!): Self${capitalizedResource}Type!
      `;

		if (mutation === true || mutation[action] === true || mutation[action][1])
			mutationsStr += `
      "${S(action).capitalize().s} multiple ${pluralizedResource}"
      ${action}${pluralizedcapitalizedResource}(data: ${capitalizedResource}Input!): [Self${capitalizedResource}Type!]!
    `;
	});
	return `extend type Mutation {\n${mutationsStr}\n}`;
};
