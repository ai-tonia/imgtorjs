# Tests layout

Test files use a **prefix by area** so related specs group together in the file tree:

| Prefix        | Examples                          | What it covers                          |
| ------------- | --------------------------------- | --------------------------------------- |
| **`core-`**   | `core-imgtor.test.js`, `core-canvas-adapter-fabric.test.js`, `core-canvas-adapter-native.test.js`, `core-adapter-kind.test.js`, `core-init.test.js`, `core-icon-sprite.test.js` | imgtor core, adapters, icon sprite, UI |
| **`plugin-`** | `plugin-crop-core.test.js`, `plugin-history.test.js` | Plugins (crop, history, rotate, save)   |
| **`util-`**   | `util-extend-object.test.js`, `util-crop-geometry.test.js` | Pure helpers shared by the library      |
| **`core-build-`** | `core-build-smoke.test.js`    | Build artefacts exist (`npm test`)      |

| Area        | Path                     | Runner                          |
| ----------- | ------------------------ | ------------------------------- |
| Unit        | `tests/unit/*.test.js`   | Vitest (`npm run test:unit`)   |
| Integration | `tests/integration/*.test.js` | Vitest (`npm run test:unit` includes **`tests/integration/`**) |
| Smoke       | `tests/core-build-smoke.test.js` | Vitest (`npm test`)      |
| E2E         | `e2e/core-demo-*.spec.js` | Playwright (`npm run test:e2e`) |

Integration specs use the **same `*.test.js` naming as unit tests**; living under **`tests/integration/`** is what marks them as integration-level.

Playwright `testDir` is **`e2e/`** (repo root). See `tests/e2e/README.md`.
