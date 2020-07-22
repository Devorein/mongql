const isPOJO = require('./isPOJO');

function convertToFalse (obj) {
	function objectVisitor (obj) {
		Object.entries(obj).forEach(([ key, value ]) => {
			if (!isPOJO(value)) obj[key] = false;
			else objectVisitor(value);
		});
	}
	objectVisitor(obj);
}

function nestedObjPopulation (obj, merger) {
	function objectVisitor (obj, parents = []) {
		Object.entries(obj).forEach(([ key, value ]) => {
			if (key !== '__original') {
				let temp = {};
				if (value === false) {
					parents.forEach((parent, index) => {
						temp = (index === 0 ? merger : temp)[parent];
					});
					if (parents.length <= 1) {
						temp = (parents.length === 1 ? temp : merger)[key];
						temp.__original = false;
						convertToFalse(temp);
					} else temp[key] = false;
				}
				if (isPOJO(value)) objectVisitor(value, [ ...parents, key ]);
			}
		});
	}

	if (obj === false) {
		Object.keys(merger).forEach((key) => {
			merger[key].__original = false;
		});
		convertToFalse(merger);
	} else objectVisitor(obj);
	return merger;
}

module.exports = nestedObjPopulation;
