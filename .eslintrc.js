module.exports = {
	env: {
		browser: false,
		commonjs: true,
		es6: true,
		node: true
	},
	parser: 'babel-eslint',
	extends: [ 'eslint:recommended' ],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly'
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2018
	},
	plugins: [ 'prettier' ],
	rules: {
		'no-mixed-spaces-and-tabs': 'off'
	}
};
