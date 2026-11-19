const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', '.idea/**', '.openai/**'] },
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: js.configs.recommended.rules,
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['netlify/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
    rules: js.configs.recommended.rules,
  },
  {
    files: ['src/scripts/**/*.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
  },
];
