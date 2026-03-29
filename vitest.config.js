import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      // `lib/entry-imgtor.js` is import-order only; behavior is covered via
      // `tests/integration/build-entry.test.js` and is omitted here
      // so thresholds reflect executable library code under `lib/js/`.
      include: ['lib/js/**/*.js'],
      exclude: ['lib/js/compat/**'],
      all: true,
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Global floor (~1–2 pts below current all-files totals).
      thresholds: {
        lines: 76,
        branches: 62,
        statements: 74,
        functions: 86,
        // Stronger bar for the four UI-heavy plugin packages (unit-tested in depth).
        'lib/js/plugins/imgtor.fill/**': {
          lines: 100,
          statements: 97,
          branches: 85,
          functions: 100,
        },
        'lib/js/plugins/imgtor.finetune/**': {
          lines: 100,
          statements: 96,
          branches: 80,
          functions: 100,
        },
        'lib/js/plugins/imgtor.frame/**': {
          lines: 98,
          statements: 96,
          branches: 88,
          functions: 100,
        },
        'lib/js/plugins/imgtor.redact/**': {
          lines: 96,
          statements: 93,
          branches: 78,
          functions: 92,
        },
      },
    },
  },
});
