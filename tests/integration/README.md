Vitest specs that load **multiple modules** or the **full ESM entry** (`lib/entry-imgtor.js`) with stubs.

- **`build-entry.test.js`** — imports the entry bundle chain; asserts `imgtor` + default plugins + icon sprite host.
