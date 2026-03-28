# Contributing

## Project shape

| Area                    | Role                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `lib/js/`               | Browser library (global `Darkroom`, Fabric.js on `window`)                            |
| `lib/css/`              | Styles compiled to `build/darkroom.css`                                               |
| `lib/entry-darkroom.js` | Vite entry: ordered imports for the IIFE bundle                                       |
| `demo/`                 | Static demo; run `npm start` after `npm install` (build + `demo/build` link + server) |
| `tests/`                | Vitest: smoke tests on `build/` + unit tests for pure helpers                         |

Rough size: on the order of **1–2k lines** of first-party JS/SCSS (excluding `demo/vendor/fabric.js`).

### Framework (Fabric.js)

The library is built and tested against **Fabric.js 1.4.x** (`demo/vendor/fabric.js`). ImgTor does **not** declare Fabric as an npm dependency so consumers can pin their own copy.

**Upgrading Fabric (5.x / 6.x, etc.):** treat as a dedicated project: replace or vendor a new build, update every `fabric.*` usage in `lib/js` and the demo, and manually verify crop, rotate, undo/redo, and save. There is no automated visual regression suite yet.

## Tests

There is **no** legacy unit/integration suite. CI-style checks are:

```bash
npm test       # build + Vitest (smoke + unit)
npm run test:unit   # unit tests only (no build required)
npm run lint
npm run audit
```

## Local setup

- **Node.js 22+**
- `npm install`
- `npm run build` — writes `build/` (ignored by git)
- `npm start` — build, `sync:demo` (copy `build/` → `demo/build/`), serve demo on port 2222

## CI

GitHub Actions runs **`npm ci`**, **`npm run lint`**, **`npm test`**, and **`npm run audit`** on pushes and pull requests to `main` (see `.github/workflows/ci.yml`).

## Pull requests

Keep changes focused; match existing formatting (`npm run format`). For dependency upgrades, prefer one logical bump per commit when possible.
