const QueryOptions = {},
	QueryFields = [],
	TypeOptions = {},
	TypeFields = [],
	MutationOptions = {},
	MutationFields = [];

[ 'all', 'paginated', 'filtered', 'id' ].forEach((range) => {
	QueryOptions[range] = {};
	[ 'self', 'others', 'mixed' ].forEach((auth) => {
		QueryOptions[range][auth] = {};
		const parts = range.match(/(id|paginated)/) ? [ 'whole', 'nameandid' ] : [ 'whole', 'nameandid', 'count' ];
		parts.forEach((part) => {
			QueryOptions[range][auth][part] = true;
			QueryFields.push(`${range}.${auth}.${part}`);
		});
	});
});

[ 'interface', 'type', 'input', 'enum' ].forEach((type) => {
	TypeOptions[type] = {};
	[ 'base', 'extra' ].forEach((part) => {
		TypeOptions[type][part] = type === 'interface' && part === 'extra' ? false : true;
		TypeFields.push(`${type}.${part}`);
	});
});

[ 'create', 'update', 'delete' ].forEach((action) => {
	MutationOptions[action] = {};
	[ 'single', 'multi' ].forEach((part) => {
		MutationOptions[action][part] = true;
		MutationFields.push(`${action}.${part}`);
	});
});

const GenerateOptions = {
	query: { options: QueryOptions, fields: QueryFields },
	type: { options: TypeOptions, fields: TypeFields },
	mutation: { options: MutationOptions, fields: MutationFields }
};

module.exports = GenerateOptions;
