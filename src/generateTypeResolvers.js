module.exports = function (Schema, transformedSchema) {
	let target = transformedSchema;
	target = {
		...target.types.base,
		...target.types.extra
	};

	const result = {};
	Object.entries(target).forEach(([ basekey, value ]) => {
		result[basekey] = {};
		Object.entries(value).forEach(([ key, { /* value, */ variant, baseType /* excludePartitions */ } ]) => {
			if (variant.match(/(ref|refs)/)) {
				result[basekey][key] = async function (parent, args, ctx) {
					const model = ctx[baseType];
					// const auth_level = basekey.replace(resource, '');
					const ids = parent[key];
					const resources = [];
					for (let i = 0; i < ids.length; i++) {
						const [ resource ] = await model.find({ _id: ids[i] }).select('name');
						resources.push(resource);
					}
					return resources;
				};
			} else if (variant.match(/(enum|type)/)) {
				result[basekey][key] = (parent) => parent[key];
			}
		});
	});
	return result;
};
