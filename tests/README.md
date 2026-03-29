# Tests layout

Vitest and Playwright files use the **`imgtor.*`** filename prefix so they sort together and stay easy to grep.

| Area        | Path                                   | Runner                          | Purpose                                 |
| ----------- | -------------------------------------- | ------------------------------- | --------------------------------------- |
| Namespace   | `tests/imgtor.ns.js`                   | —                               | `imgtor()` helper for `describe()` titles |
| Unit        | `tests/unit/imgtor.*.test.js`          | Vitest (`npm run test:unit`)    | Pure JS, mocked DOM/Fabric where needed |
| Integration | `tests/integration/`                   | Vitest (when specs are added)   | Multiple modules / build + node harness |
| Smoke       | `tests/imgtor.smoke.test.js`           | Vitest (`npm test`)             | Build artefacts exist                   |
| E2E         | `e2e/imgtor.*.spec.js`                 | Playwright (`npm run test:e2e`) | Real browser against demo server        |

Playwright is configured with `testDir: 'e2e'` (repo root). A pointer lives at `tests/e2e/README.md`.
