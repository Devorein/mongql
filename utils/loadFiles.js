const fs = require('fs');
const path = require('path');
const S = require('voca');

module.exports = function (_path) {
	const res = {};
	fs.readdirSync(_path).forEach((file) => {
		const filename = path.basename(file, path.extname(file));
		if (filename !== 'index') res[S.capitalize(filename)] = require(path.join(_path, file));
	});
	return res;
};
