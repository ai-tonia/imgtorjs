# Integration tests

Vitest specs that load **multiple modules** or the **full ESM entry** (`lib/entry-darkroom.js`) with stubs.

- **`integration-build-entry.test.js`** — imports the entry bundle chain; asserts `Darkroom` + default plugins + bootstrap.
- Naming: **`integration-*.test.js`** under this folder.

Picked up by `vitest.config.js` (`tests/**/*.test.js`). Also run via **`npm run test:unit`** together with `tests/unit/`.
