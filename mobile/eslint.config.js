const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  ...expoConfig,
  {
    plugins: {
      'react-native': reactNative,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': ['warn', { skip: ['Button'] }],
      'react-native/no-single-element-style-arrays': 'warn',
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  prettier,
]);
