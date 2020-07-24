const { isPOJO } = require('../objManip');

function traverseType (type) {
	const types = [];
	function _wrapper (ast) {
		if (ast !== undefined) {
			const { type, kind, name } = ast;
			if (kind !== 'NamedType') types.push(_wrapper(type));
			return { type, kind, name };
		} else return undefined;
	}
	types.push(_wrapper(type));
	return types;
}

function convertToString (args) {
	const name = args[0].name.value;
	let res = name;
	for (let i = 1; i < args.length; i++) {
		const arg = args[i];
		if (arg.kind === 'NonNullType') res = `${res}!`;
		else if (arg.kind === 'ListType') res = `[${res}]`;
	}
	return res;
}

module.exports = {
	argumentsToString (argAst) {
		const args = [];
		if (argAst)
			argAst.forEach((arg) => {
				let name = arg.name.value;
				name = isPOJO(name) ? name.name : name;
				const argStr = convertToString(traverseType(arg.type));
				args.push(`${name}:${argStr}`);
			});
		return args.join(',');
	},
	outputToString (outputAst) {
		return convertToString(traverseType(outputAst));
	}
};
