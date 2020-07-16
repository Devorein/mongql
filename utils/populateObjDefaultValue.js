function isPOJO (arg) {
	if (arg == null || typeof arg !== 'object') return false;
	const proto = Object.getPrototypeOf(arg);
	if (proto == null) return true;
	return proto === Object.prototype;
}

module.exports = function (obj, fields) {
	if (obj.__undefineds === undefined)
		Object.defineProperty(obj, '__undefineds', {
			value: [],
			enumerable: true,
			writable: false,
			configurable: false
		});
	Object.entries(fields).forEach(([ field, defvalue ]) => {
		if (obj[field] === undefined) {
			obj[field] = defvalue;
			obj.__undefineds.push(field);
		} else if (isPOJO(defvalue)) obj[field] = { ...defvalue, ...obj[field] };
	});
};
