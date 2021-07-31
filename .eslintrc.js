module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    extends: [
      'prettier',
      'prettier/@typescript-eslint',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:prettier/recommended',
    ],
    env: {
      node: true,
      browser: false,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 1,
      '@typescript-eslint/explicit-function-return-type': 2,
      '@typescript-eslint/explicit-member-accessibility': 2,
      'no-unused-vars': 2,
      semi: [2, 'always', { omitLastInOneLineBlock: true }],
    },
  };
