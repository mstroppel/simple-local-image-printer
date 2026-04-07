import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // CDN libraries loaded before app.js via <script> tags
        Sortable: 'readonly',
        html2canvas: 'readonly',
        JSZip: 'readonly',
        // i18n.js globals loaded before app.js
        lang: 'readonly',
        t: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'eqeqeq': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'semi': ['error', 'always'],
    },
  },
];
