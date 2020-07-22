module.exports = {
	testTimeout: 30000,
	testEnvironment: 'node',
	globalSetup: './tests/globalSetup.js',
	globalTeardown: './tests/globalTeardown.js',
	verbose: true,
	reporters: [
		'default',
		[
			'./node_modules/jest-html-reporter',
			{
				pageTitle: 'Test Suite',
				outputPath: 'test-report/index.html',
				includeFailureMsg: true
			}
		]
	]
};
