module.exports = {
  extends: [
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier',
  ],

  plugins: [],

  rules: {
    'no-console': 'off',
    'import/prefer-default-export': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-promise-executor-return': 'off',
    'consistent-return': 'off',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // naming conventions
    camelcase: 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'snake_case'],
      },
    ],

    // allow test files to use dev deps
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.{test,spec}.ts', 'test/**/*'],
      },
    ],

    // import sorting
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
        moduleDirectory: ['server/'],
      },
    },
  },
}
