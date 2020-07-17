const pluralize = require('pluralize');
const S = require('String');

module.exports = function (Schema) {
	const { mongql: { resource, generate: { mutation } } } = Schema;

	const capitalizedResource = S(resource).capitalize().s;
	const pluralizedResource = pluralize(resource, 2);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

	let mutationsStr = ``;
	if (mutation || mutation.create[0])
		mutationsStr += `
    "Create a new ${resource}"
    create${capitalizedResource}(data: ${capitalizedResource}Input!): Self${capitalizedResource}Type!
  `;

	if (mutation || mutation.update[0])
		mutationsStr += `
    "Update single ${resource}"
    update${capitalizedResource}(data: ${capitalizedResource}Input!,id: ID!): Self${capitalizedResource}Type!
  `;

	if (mutation || mutation.update[1])
		mutationsStr += `
    "Update multiple ${pluralizedResource}"
    update${pluralizedcapitalizedResource}(data: [${capitalizedResource}Input!],ids: [ID!]!): [Self${capitalizedResource}Type!]!
  `;

	if (mutation || mutation.delete[0])
		mutationsStr += `
    "Delete single ${resource}"
    delete${capitalizedResource}(id: ID!): Self${capitalizedResource}Type!
  `;

	if (mutation || mutation.delete[1])
		mutationsStr += `
    "Delete multiple ${pluralizedResource}"
    delete${pluralizedcapitalizedResource}(ids: [ID!]): [Self${capitalizedResource}Type!]!
  `;
	return `extend type Mutation {\n${mutationsStr}\n}`;
};
