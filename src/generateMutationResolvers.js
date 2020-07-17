const pluralize = require('pluralize');

const createResource = require('../utils/resource/createResource');
const updateResource = require('../utils/resource/updateResource');
const deleteResource = require('../utils/resource/deleteResource');

module.exports = function (Schema /* transformedSchema */) {
	const { mongql: { resource, generate: { mutation } } } = Schema;

	const capitalizedResource = resource.charAt(0).toUpperCase() + resource.substr(1);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

	const MutationResolvers = {};

	if (mutation === true || mutation.create === true || mutation.create[0])
		MutationResolvers[`create${capitalizedResource}`] = async function (parent, { data }, ctx) {
			return await createResource(ctx[capitalizedResource], ctx.user.id, data);
		};
	if (mutation === true || mutation.create === true || mutation.create[1])
		MutationResolvers[`create${pluralizedcapitalizedResource}`] = async function (parent, { data }, ctx) {
			return await createResource(ctx[capitalizedResource], ctx.user.id, data);
		};
	if (mutation === true || mutation.update === true || mutation.update[0])
		MutationResolvers[`update${capitalizedResource}`] = async function (parent, { data, id }, ctx) {
			data.id = id;
			return (await updateResource(ctx[capitalizedResource], [ data ], ctx.user.id, (err) => {
				throw err;
			}))[0];
		};
	if (mutation === true || mutation.update === true || mutation.update[1])
		MutationResolvers[`update${pluralizedcapitalizedResource}`] = async function (parent, { data, ids }, ctx) {
			ids.forEach((id, i) => (data[i].id = id));
			return await updateResource(ctx[capitalizedResource], data, ctx.user.id, (err) => {
				throw err;
			});
		};
	if (mutation === true || mutation.delete === true || mutation.delete[0])
		MutationResolvers[`delete${capitalizedResource}`] = async function (parent, { id }, ctx) {
			return (await deleteResource(ctx[capitalizedResource], [ id ], ctx.user.id))[0];
		};
	if (mutation === true || mutation.delete === true || mutation.delete[1])
		MutationResolvers[`delete${pluralizedcapitalizedResource}`] = async function (parent, { ids }, ctx) {
			return await deleteResource(ctx[capitalizedResource], ids, ctx.user.id);
		};

	return MutationResolvers;
};
