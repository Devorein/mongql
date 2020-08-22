module.exports = {
	testTimeout: 30000,
	testEnvironment: 'node',
	globalSetup: './tests/globalSetup.js',
	globalTeardown: './tests/globalTeardown.js',
	verbose: true,
	testPathIgnorePatterns: [ '<rootDir>/node_modules', '<rootDir>/dist' ],
	modulePathIgnorePatterns: [ '<rootDir>/dist' ],
	roots: [ '<rootDir>/tests' ],
	testMatch: [ '<rootDir>/tests/**/*.ts' ],
	transform: {
		'^.+\\.(ts)$': 'ts-jest'
	}
};
