const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['coverage/', 'node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      // Parâmetros prefixados com "_" são intencionalmente não usados (ex.: `_next` do Express).
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
];
