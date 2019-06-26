'use strict';

module.exports = {
  extends: 'airbnb-base',
  parser: 'babel-eslint',
  overrides: [
    {
      files: ['*.js'],
      parserOptions: { sourceType: 'script' },
    },
  ],
  globals: {
    'BigInt': false,
  },
  rules: {
    'quote-props': ['error', 'consistent'],
    'strict': ['error', 'global'],
    'prefer-destructuring': 'off',
    'no-multiple-empty-lines': ['error', { maxBOF: 0, max: 2 }],
    'arrow-parens': ['error', 'always'],
    'lines-between-class-members': 'off',
    'max-len': 'off',
    'camelcase': 'off',
    'class-methods-use-this': 'off',
    'no-constant-condition': 'off',
    'no-else-return': 'off',
    'no-lonely-if': 'off',
    'no-param-reassign': 'off',
    'no-restricted-syntax': 'off',
    'no-use-before-define': 'off',
    'no-continue': 'off',
    'import/no-cycle': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-mutable-exports': 'off',
    'global-require': 'off',
  },
};
