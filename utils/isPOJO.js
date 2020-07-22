function isPOJO (arg) {
	if (arg == null || typeof arg !== 'object') return false;
	const proto = Object.getPrototypeOf(arg);
	if (proto == null) return true;
	return proto === Object.prototype;
}

module.exports = isPOJO;
