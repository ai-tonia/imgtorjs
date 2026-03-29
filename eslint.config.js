import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    ignores: ['build/**', 'demo/build/**', 'node_modules/**', 'types/**'],
  },
  {
    files: [
      'scripts/**/*.mjs',
      'playwright.config.js',
      'vite.config.js',
      'vite.demo.config.js',
      'vite.icons-plugin.js',
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['e2e/**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        imgtor: 'readonly',
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        imgtor: 'writable',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
