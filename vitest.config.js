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
      // Non-regression floor; raise toward 80% / 70% as the suite grows.
      thresholds: {
        lines: 14,
        branches: 8,
        statements: 14,
        functions: 31,
      },
    },
  },
});
