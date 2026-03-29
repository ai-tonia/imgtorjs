# Contributing

## Project shape

| Area                    | Role                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `lib/js/`               | Browser library (global `imgtor`, Canvas 2D adapter)                                |
| `lib/css/`              | Styles compiled to `build/imgtor.css`                                                 |
| `lib/entry-imgtor.js`   | Vite entry: ordered imports for the IIFE bundle                                       |
| `demo/`                 | Static demo; run `npm start` after `npm install` (build + `demo/build` link + server) |
| `tests/`                | Vitest: smoke tests on `build/` + unit tests for pure helpers                         |

Rough size: on the order of **1–2k lines** of first-party JS/CSS. The project uses **npm** only; legacy Bower metadata has been removed.

### Canvas runtime

The editor uses **`imgtor.CanvasAdapterNative`** (HTML Canvas 2D). Playwright includes **toolbar screenshot** baselines under `e2e/__snapshots__/`; update with `npx playwright test --update-snapshots` when UI intentionally changes.

## Tests

There is **no** legacy unit/integration suite. CI-style checks are:

```bash
npm test            # build + Vitest (smoke + unit)
npm run test:coverage   # build + Vitest with coverage (same as CI unit step)
npm run test:unit     # unit tests only (no build required)
npm run test:e2e      # Playwright: build + sync:demo + demo smoke (needs: npx playwright install chromium)
npm run lint
npm run audit
```

## Local setup

- **Node.js 22+**
- `npm install`
- `npm run build` — writes `build/` (ignored by git)
- `npm start` — build, `sync:demo` (copy `build/` → `demo/build/`), serve demo on port 2222

## CI

GitHub Actions runs **`npm ci`**, Playwright browser install, **`npm run lint`**, **`npm run test:coverage`** (with a **`coverage/`** artifact), **`npm run test:e2e`**, and **`npm run audit`** on pushes and pull requests to `main` (see `.github/workflows/ci.yml`).

**Dependabot** opens weekly grouped PRs for npm devDependencies (see `.github/dependabot.yml`).

TypeScript users can reference **`imgtor`** types via **`types/imgtor.d.ts`** (global `imgtor`).

Plugin lifecycle and extension points are summarized in **`docs/PLUGIN_API.md`**; see **`docs/README.md`** for the full docs index (including **`docs/CANVAS_ADAPTER.md`**).
