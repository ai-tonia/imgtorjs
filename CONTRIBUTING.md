# Contributing

## Project shape

| Area                    | Role                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `lib/js/`               | Browser library (global `Darkroom`, Fabric.js on `window`)                            |
| `lib/css/`              | Styles compiled to `build/darkroom.css`                                               |
| `lib/entry-darkroom.js` | Vite entry: ordered imports for the IIFE bundle                                       |
| `demo/`                 | Static demo; run `npm start` after `npm install` (build + `demo/build` link + server) |
| `tests/`                | Vitest smoke tests (assert built artifacts exist)                                     |

Rough size: on the order of **1–2k lines** of first-party JS/SCSS (excluding `demo/vendor/fabric.js`).

## Tests

There is **no** legacy unit/integration suite. CI-style checks are:

```bash
npm test    # build + Vitest
npm run lint
```

## Local setup

- **Node.js 22+**
- `npm install`
- `npm run build` — writes `build/` (ignored by git)
- `npm start` — build, link `demo/build` → `../build`, serve demo on port 2222

## Pull requests

Keep changes focused; match existing formatting (`npm run format`). For dependency upgrades, prefer one logical bump per commit when possible.
