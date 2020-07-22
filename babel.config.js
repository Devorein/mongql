module.exports = {
	presets: [
		[
			'@babel/env',
			{
				corejs: 3,
				useBuiltIns: 'usage'
			}
		],
		'@babel/preset-typescript',
		'minify'
	],
	plugins: [
		[ '@babel/plugin-transform-runtime', { corejs: 3, useESModules: false } ],
		'@babel/plugin-proposal-class-properties'
	],
	env: {
		test: {
			presets: [ '@babel/env' ]
		}
	},
	sourceMaps: false
};
