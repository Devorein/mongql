const pluralize = require('pluralize');

const createResource = require('../utils/resource/createResource');
const updateResource = require('../utils/resource/updateResource');
const deleteResource = require('../utils/resource/deleteResource');

module.exports = function (resource, transformedSchema) {
	const capitalizedResource = resource.charAt(0).toUpperCase() + resource.substr(1);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

	const { mongql: { generate: { mutation } } } = transformedSchema;

	const MutationResolvers = {};
	if (mutation.create[0])
		MutationResolvers[`create${capitalizedResource}`] = async function (parent, { data }, ctx) {
			return await createResource(ctx[capitalizedResource], ctx.user.id, data);
		};
	if (mutation.update[0])
		MutationResolvers[`update${capitalizedResource}`] = async function (parent, { data, id }, ctx) {
			data.id = id;
			return (await updateResource(ctx[capitalizedResource], [ data ], ctx.user.id, (err) => {
				throw err;
			}))[0];
		};
	if (mutation.update[1])
		MutationResolvers[`update${pluralizedcapitalizedResource}`] = async function (parent, { data, ids }, ctx) {
			ids.forEach((id, i) => (data[i].id = id));
			return await updateResource(ctx[capitalizedResource], data, ctx.user.id, (err) => {
				throw err;
			});
		};
	if (mutation.delete[0])
		MutationResolvers[`delete${capitalizedResource}`] = async function (parent, { id }, ctx) {
			return (await deleteResource(ctx[capitalizedResource], [ id ], ctx.user.id))[0];
		};
	if (mutation.delete[1])
		MutationResolvers[`delete${pluralizedcapitalizedResource}`] = async function (parent, { ids }, ctx) {
			return await deleteResource(ctx[capitalizedResource], ids, ctx.user.id);
		};
	let extraResolvers = {};
	extraResolvers = extraResolvers !== undefined ? extraResolvers : {};
	Object.entries(extraResolvers).forEach(([ key, resolver ]) => {
		MutationResolvers[key] = resolver;
	});

	return MutationResolvers;
};
