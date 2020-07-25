const pluralize = require('pluralize');
const S = require('voca');
const { t } = require('graphql-extra');

const ArgumentMap = {
	'create.single': ({ r, cr }) => [
		{
			name: `data`,
			type: `${cr}Input!`,
			description: `input to create single ${r}`
		}
	],
	'create.multi': ({ pr, cr }) => [
		{
			name: `data`,
			type: `[${cr}Input!]!`,
			description: `input to create multiple ${pr}`
		}
	],
	'update.single': ({ r, pr, cr }) => [
		{
			name: `data`,
			type: `${cr}Input!`,
			description: `input to update single ${pr}`
		},
		{
			name: 'id',
			type: 'ID!',
			description: `id of the single ${r} to update`
		}
	],
	'update.multi': ({ pr, cr }) => [
		{
			name: `data`,
			type: `[${cr}Input!]!`,
			description: `input to update multiple ${pr}`
		},
		{
			name: 'ids',
			type: '[ID!]!',
			description: `ids of the multiple ${pr} to update`
		}
	],
	'delete.single': ({ r }) => [
		{
			name: `id`,
			type: `ID!`,
			description: `id of the single ${r} to delete`
		}
	],
	'delete.multi': ({ pr }) => [
		{
			name: `ids`,
			type: `[ID!]!`,
			description: `ids of the multiple ${pr} to delete`
		}
	]
};

module.exports = function (Schema) {
	const { mongql: { resource: r, generate: { mutation } } } = Schema;

	const cr = S.capitalize(r);
	const pr = pluralize(r, 2);
	const cpr = pluralize(cr, 2);
	const actions = Object.keys(mutation);
	const node = {
		name: 'Mutation',
		description: 'Mutation',
		directives: [],
		interfaces: [],
		fields: []
	};

	actions.forEach((action) => {
		const parts = Object.keys(mutation[action]).filter((part) => mutation[action][part]);
		parts.forEach((part) => {
			if (part === 'single')
				node.fields.push({
					name: `${action}${cr}`,
					type: `Self${cr}Type!`,
					description: `${S.capitalize(action)} single ${r}`,
					arguments: ArgumentMap[`${action}.${part}`]({ r, pr, cr, cpr })
				});
			else if (part === 'multi')
				node.fields.push({
					name: `${action}${cpr}`,
					type: `[Self${cr}Type!]!`,
					description: `${S.capitalize(action)} multiple ${r}`,
					arguments: ArgumentMap[`${action}.${part}`]({ r, pr, cr, cpr })
				});
		});
	});
	return node.fields.length > 0 ? t.objectExt(node) : null;
};
