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
      include: ['lib/js/**/*.js', 'lib/entry-darkroom.js'],
      all: true,
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Non-regression floor; ~1–2 pts below current all-files totals for CI stability.
      thresholds: {
        lines: 64,
        branches: 50,
        statements: 63,
        functions: 94,
      },
    },
  },
});
