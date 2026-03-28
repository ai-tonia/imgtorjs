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

The demo still ships **Fabric.js 1.4.x** (`demo/vendor/fabric.js`). Upgrading to current Fabric is a **large, breaking** migration and is tracked as maintainers’ work, not part of the default PR flow.

### Local sub-agent prompts (optional)

If you use phased modernization checklists, run **`npm run seed:agents`** to create **`docs/agents/*.md`** locally. That directory is **gitignored** so prompts are not published with the repo.

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
- `npm start` — build, link `demo/build` → `../build`, serve demo on port 2222

## Pull requests

Keep changes focused; match existing formatting (`npm run format`). For dependency upgrades, prefer one logical bump per commit when possible.
