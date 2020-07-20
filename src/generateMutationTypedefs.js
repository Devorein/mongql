const pluralize = require('pluralize');
const S = require('voca');

module.exports = function (Schema) {
	const { mongql: { resource, generate: { mutation } } } = Schema;

	const capitalizedResource = S.capitalize(resource);
	const pluralizedResource = pluralize(resource, 2);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

	let mutationsStr = ``;

	[ 'create', 'update', 'delete' ].forEach((action) => {
		if (Schema.mongql.generate === true || mutation === true || mutation[action] === true || mutation[action][0])
			mutationsStr += `
        "${S.capitalize(action)} single ${resource}"
        ${action}${capitalizedResource}(data: ${capitalizedResource}Input!): Self${capitalizedResource}Type!
      `;

		if (Schema.mongql.generate === true || mutation === true || mutation[action] === true || mutation[action][1])
			mutationsStr += `
      "${S.capitalize(action)} multiple ${pluralizedResource}"
      ${action}${pluralizedcapitalizedResource}(data: ${capitalizedResource}Input!): [Self${capitalizedResource}Type!]!
    `;
	});
	return `extend type Mutation {\n${mutationsStr}\n}`;
};
