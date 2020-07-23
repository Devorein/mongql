function isPOJO (arg) {
	if (arg == null || typeof arg !== 'object') return false;
	const proto = Object.getPrototypeOf(arg);
	if (proto == null) return true;
	return proto === Object.prototype;
}

const setNestedProps = (object, path, value) => {
	const root = object;
	const pathArray = path.split('.');

	for (let i = 0; i < pathArray.length; i++) {
		const p = pathArray[i];
		if (!isPOJO(object[p])) object[p] = {};
		if (i === pathArray.length - 1) object[p] = value;
		object = object[p];
	}

	return root;
};

function flattenObject (obj) {
	function objectVisitor (obj, parents = []) {
		let res = {};
		Object.entries(obj).forEach(([ key, value ]) => {
			if (!isPOJO(value)) res[`${parents.join('.')}${parents.length > 0 ? '.' : ''}${key}`] = value;
			else res = { ...res, ...objectVisitor(value, parents.concat(key)) };
		});
		return res;
	}
	return objectVisitor(obj);
}

function matchFlattenedObjQuery (flattened_query_prop, flattened_merger_props) {
	const flattened_query_prop_parts = flattened_query_prop.split('.');
	const match_queries = flattened_merger_props.filter((flattened_merger_prop) => {
		const flattened_merger_prop_parts = flattened_merger_prop.split('.');
		let prevIndex = 0;
		for (let i = 0; i < flattened_query_prop_parts.length; i++) {
			const flattened_query_prop_part = flattened_query_prop_parts[i];
			prevIndex = flattened_merger_prop_parts.indexOf(flattened_query_prop_part, prevIndex);
			if (prevIndex === -1) break;
		}
		return prevIndex !== -1;
	});
	return match_queries;
}

function nestedObjPopulation (query, merger) {
	const flattened_merger = flattenObject(merger);
	const flattened_query = flattenObject(query);
	const flattened_query_props = Object.keys(flattened_query);
	const flattened_merger_props = Object.keys(flattened_merger);
	flattened_query_props.forEach((flattened_query_prop) => {
		matchFlattenedObjQuery(flattened_query_prop, flattened_merger_props).forEach(
			(match_query) => (flattened_merger[match_query] = flattened_query[flattened_query_prop])
		);
	});

	Object.entries(flattened_merger).forEach(([ key, value ]) => {
		setNestedProps(flattened_merger, key, value);
		delete flattened_merger[key];
	});
	return flattened_merger;
}

function scrambler (key) {
	const arr = [];
	const keys = key.split('.');

	function wrapper (keys, parent = []) {
		const arr = [];
		const first_key = keys[0];
		if (keys.length > 0) arr.push(keys.join('.'));
		arr.push(first_key);
		for (let i = 1; i < keys.length; i++) {
			let _arr = [];
			if (parent.length > 0) _arr.push(parent);
			_arr.push(first_key, keys[i]);
			arr.push(_arr.join('.'));
		}
		return arr;
	}

	keys.forEach((_, i) => {
		arr.push(...wrapper(keys.slice(i)));
	});

	return arr;
}

function mixObjectProp (obj) {
	const set = new Set();
	Object.entries(obj).forEach(([ key ]) => {
		scrambler(key).forEach((scramble) => set.add(scramble));
	});
	return Array.from(set);
}

function populateObjDefaultValue (obj, fields) {
	if (obj.__undefineds === undefined && isPOJO(obj))
		Object.defineProperty(obj, '__undefineds', {
			value: [],
			enumerable: true,
			writable: false,
			configurable: false
		});
	Object.entries(fields).forEach(([ field, defvalue ]) => {
		if (obj[field] === undefined && isPOJO(obj)) {
			obj[field] = defvalue;
			obj.__undefineds.push(field);
		} else if (isPOJO(defvalue) && isPOJO(obj[field])) obj[field] = { ...defvalue, ...obj[field] };
	});
}

module.exports = {
	setNestedProps,
	mixObjectProp,
	flattenObject,
	matchFlattenedObjQuery,
	nestedObjPopulation,
	populateObjDefaultValue,
	isPOJO
};
