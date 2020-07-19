const fs = require('fs');
const path = require('path');
const S = require('string');

module.exports = function (_path) {
	const res = {};
	fs.readdirSync(_path).forEach((file) => {
		const filename = path.basename(file, path.extname(file));
		if (filename !== 'index') res[S(filename).capitalize().s] = require(path.join(_path, file));
	});
	return res;
};
