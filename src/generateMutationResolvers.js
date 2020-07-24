const pluralize = require('pluralize');

const createResource = require('../utils/resource/createResource');
const updateResource = require('../utils/resource/updateResource');
const deleteResource = require('../utils/resource/deleteResource');

module.exports = function (Schema /* transformedSchema */) {
	const { mongql: { resource, generate: { mutation } } } = Schema;

	const capitalizedResource = resource.charAt(0).toUpperCase() + resource.substr(1);
	const pluralizedcapitalizedResource = pluralize(capitalizedResource, 2);

	const MutationResolvers = {};
	const MutationResolversMapper = {
		'create.single': async function (parent, { data }, ctx) {
			return await createResource(ctx[capitalizedResource], ctx.user.id, data);
		},
		'create.multi': async function (parent, { data }, ctx) {
			return await createResource(ctx[capitalizedResource], ctx.user.id, data);
		},
		'update.single': async function (parent, { data, id }, ctx) {
			data.id = id;
			return (await updateResource(ctx[capitalizedResource], [ data ], ctx.user.id, (err) => {
				throw err;
			}))[0];
		},
		'update.multi': async function (parent, { data, ids }, ctx) {
			ids.forEach((id, i) => (data[i].id = id));
			return await updateResource(ctx[capitalizedResource], data, ctx.user.id, (err) => {
				throw err;
			});
		},
		'delete.single': async function (parent, { id }, ctx) {
			return (await deleteResource(ctx[capitalizedResource], [ id ], ctx.user.id))[0];
		},
		'delete.multi': async function (parent, { ids }, ctx) {
			return await deleteResource(ctx[capitalizedResource], ids, ctx.user.id);
		}
	};

	const actions = Object.keys(mutation);
	actions.forEach((action) => {
		const parts = Object.keys(mutation[action]).filter((part) => mutation[action][part]);
		parts.forEach((part) => {
			MutationResolvers[`${action}${part === 'single' ? capitalizedResource : pluralizedcapitalizedResource}`] =
				MutationResolversMapper[`${action}.${part}`];
		});
	});
	return MutationResolvers;
};
