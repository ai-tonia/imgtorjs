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
      exclude: [
        'lib/js/compat/**',
        // Namespaced plugin folders: covered by focused unit tests in tests/unit; excluded so
        // global thresholds still reflect core + flat plugins only.
        'lib/js/plugins/imgtor.filter/**',
        'lib/js/plugins/imgtor.finetune/**',
        'lib/js/plugins/imgtor.resize/**',
        'lib/js/plugins/imgtor.frame/**',
        'lib/js/plugins/imgtor.fill/**',
        'lib/js/plugins/imgtor.redact/**',
        'lib/js/plugins/imgtor.annotate/**',
        'lib/js/plugins/imgtor.decorate/**',
        'lib/js/plugins/imgtor.retouch/**',
      ],
      all: true,
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Non-regression floor; ~1–2 pts below current all-files totals for CI stability.
      thresholds: {
        lines: 79,
        branches: 67,
        statements: 78,
        functions: 90,
      },
    },
  },
});
