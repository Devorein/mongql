module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
    'jest/globals': true
  },
  parser: '@typescript-eslint/parser',
  extends: ["plugin:@typescript-eslint/recommended"],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018
  },
  plugins: ['prettier', 'jest', "@typescript-eslint"],
  rules: {
    'no-mixed-spaces-and-tabs': 'off',
    'jest/valid-expect': 'error',
    'jest/no-identical-title': 'error',
    'jest/no-standalone-expect': 'error',
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-var-requires": "off"
  }
};
