module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.{test,spec}.ts', 'test/**/*'],
      },
    ],
    'no-console': 'off',
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-promise-executor-return': 'off',
    camelcase: 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'snake_case'],
      },
    ],
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // node built in
          'external', // installed dependencies
          'internal', // baseUrl
          'index', // ./
          'sibling', // ./*
          'parent', // ../*
          'object', // ts only
          'type', // ts only
        ],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts'],
        moduleDirectory: ['node_modules', 'server/'],
      },
    },
  },
}
