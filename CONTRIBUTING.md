# Contributing

## Project shape

| Area                    | Role                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `lib/js/`               | Browser library (global `Darkroom`, Fabric.js on `window`)                            |
| `lib/css/`              | Styles compiled to `build/darkroom.css`                                               |
| `lib/entry-darkroom.js` | Vite entry: ordered imports for the IIFE bundle                                       |
| `demo/`                 | Static demo; run `npm start` after `npm install` (build + `demo/build` link + server) |
| `tests/`                | Vitest: smoke tests on `build/` + unit tests for pure helpers                         |

Rough size: on the order of **1–2k lines** of first-party JS/SCSS (excluding `demo/vendor/fabric.js`). The project uses **npm** only; legacy Bower metadata has been removed.

### Framework (Fabric.js)

The library is built and tested against **Fabric.js 1.4.x** (`demo/vendor/fabric.js`). ImgTor does **not** declare Fabric as an npm dependency so consumers can pin their own copy.

**Upgrading Fabric (5.x / 6.x, etc.):** treat as a dedicated project: replace or vendor a new build, update every `fabric.*` usage in `lib/js` and the demo, and manually verify crop, rotate, undo/redo, and save. There is no automated visual regression suite yet.

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

TypeScript users can reference **`imgtor`** types via **`types/darkroom.d.ts`** (global `Darkroom`; Fabric remains untyped).

## Pull requests (always **ai-tonia/imgtorjs**)

GitHub’s green **“Compare & pull request”** (and some compare URLs) default the **base** to **upstream** [`MattKetmo/darkroomjs`](https://github.com/MattKetmo/darkroomjs). That is wrong for ImgTor day-to-day work.

### Recommended: GitHub CLI (cannot target upstream by accident)

1. Push your branch: `git push -u origin <branch>`
2. From that branch, run:

```bash
npm run pr:create
```

This runs **`gh pr create --repo ai-tonia/imgtorjs --base main`**, so the PR is always opened **on this fork** into **`main`**. Add flags as needed, e.g. `--title "…" --body "…"` or `--fill` (use commit message).

Requires [GitHub CLI](https://cli.github.com/) (`gh`) and `gh auth login`.

### Web UI (only if you verify the base)

1. Open **[github.com/ai-tonia/imgtorjs/compare](https://github.com/ai-tonia/imgtorjs/compare)** — URL must start with **`github.com/ai-tonia/imgtorjs`**, not `MattKetmo`.
2. Set **base** = **`main`**, **compare** = your branch:  
   `https://github.com/ai-tonia/imgtorjs/compare/main...<your-branch>`
3. On the PR page, **base repository** must be **`ai-tonia/imgtorjs`**. If the PR lists dozens of unrelated files, the base is wrong — edit the PR or close it and use **`npm run pr:create`** instead.

**Suggested migration / test branches** (rebase on latest `main` before each PR; one PR per branch): `migration/pr-03-plugin-save-tests`, then further `migration/pr-NN-…` slices from your local **`migration-plan/`** checklist (gitignored).
