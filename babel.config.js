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
    ['@babel/plugin-transform-runtime', { corejs: 3, useESModules: true, noInterop: true }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator'
  ],
  env: {
    test: {
      presets: ['@babel/env']
    }
  },
  sourceMaps: false,
  comments: false,
  "ignore": [
    "./src/types.ts"
  ]
};
