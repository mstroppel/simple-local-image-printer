// ESLint v9+ flat config — CommonJS format (no package.json "type":"module" present)
// Globals are inlined to avoid a runtime dependency on the 'globals' npm package,
// which is not installed when ESLint is invoked via `npx --yes eslint`.

/** Minimal set of browser globals needed by app.js */
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  URL: 'readonly',
  Image: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  Blob: 'readonly',
  Array: 'readonly',
  Object: 'readonly',
  String: 'readonly',
  Math: 'readonly',
  Date: 'readonly',
  Promise: 'readonly',
  parseInt: 'readonly',
  parseFloat: 'readonly',
  isNaN: 'readonly',
  isFinite: 'readonly',
  encodeURIComponent: 'readonly',
  decodeURIComponent: 'readonly',
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...browserGlobals,
        // CDN libraries loaded via <script> tags before app.js
        Sortable: 'readonly',
        html2canvas: 'readonly',
        JSZip: 'readonly',
        // i18n.js globals loaded via <script> tag before app.js
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
