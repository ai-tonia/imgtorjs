# Legacy modernization log (ImgTorJS)

This fork continues the discontinued **DarkroomJS** canvas editor under the repository name **ImgTorJS** (`ai-tonia/imgtorjs`). The npm package name in `package.json` is `imgtor` for new publishes.

## 1. Inventory (dependencies & stack)

| Source         | Notes                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `package.json` | Previously: Gulp 3 toolchain, `gulp-sass` → `node-sass`, no runtime npm deps                                          |
| `bower.json`   | Legacy: `fabric` ~1.4.x (globals); demo still loads `demo/vendor/fabric.js`                                           |
| Frameworks     | Vanilla JS + IIFEs, global `window.Darkroom`; Backbone-style `Plugin.extend` / `Transformation.extend` (not Backbone) |
| Canvas         | Fabric.js 1.4.x (vendored in demo)                                                                                    |
| Node `engines` | Now specified: Node **>=22** (see `package.json`)                                                                     |
| Build (legacy) | Gulp: concat JS, inject SVG sprite into `bootstrap.js`, compile SCSS, optional uglify                                 |

## 2. Scope

- **Size:** ~10 library JS modules under `lib/js/`, SCSS under `lib/css/`, static demo under `demo/`.
- **Tests:** No suite existed; Vitest smoke tests added (see `tests/`).
- **Shape:** Browser library + static demo; Node is build-only.
- **Upstream:** Original project is discontinued; this fork is maintained for modernization.

## 3. Node runtime & `npm install` (legacy)

Verified on **Node v22.22.1**, **npm 10.9.4**.

Legacy `npm install` **failed** with:

- `node-sass@3.x` invoked `node-gyp` rebuild.
- **Error:** no Python (`python` / `python2`) in PATH — `node-gyp@3.x` could not configure.
- **Implication:** `node-sass` does not support modern Node; migration to **`sass`** (Dart Sass) + non-Gulp build was required.

## 4. Dependency audit (post-migration)

After replacing Gulp with Vite + `sass`, run:

```bash
npm audit
npx npm-check-updates
```

Sample `npx npm-check-updates` output (2026-03-28, informational only): devDependencies reported newer majors for `@eslint/js`, `eslint`, `globals`, `prettier`, `sass`, `vite`, `vitest`. Bump **one package at a time** and re-run build/tests.

`npm audit` on the current tree: **0** vulnerabilities.

Upgrade **one dependency at a time**; record breaking changes here as you go.

## 5–7. Syntax, build, Fabric

- Library source uses modern `const` / `let` and safer patterns where behavior is unchanged.
- **Build:** Gulp removed; **Vite** emits `build/darkroom.js` (IIFE). **sass** CLI compiles `lib/css/darkroom.scss` → `build/darkroom.css`.
- **Fabric 1.4 → 6.x** is a separate, high-risk effort (API changes); not done in the initial stack.

## 8. Tooling

- ESLint (flat config), Prettier, Vitest — see `package.json` scripts.

## 9. Security

- Run `npm audit fix` when safe; remove unused packages.
- Demo previously included Google Analytics — **removed** in this fork to avoid third-party tracking in the sample page.
- Secret scan: no API keys should live in source; use environment variables in CI only.

## 10. Testing

```bash
npm test
npm run build
```

Manual: open the demo, exercise rotate, crop, undo/redo, save.

## Chained PRs (recommended)

| PR  | Branch suggestion                  | Contents                                          |
| --- | ---------------------------------- | ------------------------------------------------- |
| 1   | `modern/01-inventory-docs`         | Agent prompts + `MODERNIZATION.md` inventory      |
| 2   | `modern/02-scope`                  | Scope section + any size scripts                  |
| 3   | `modern/03-node-engines`           | `engines`, documented install failure             |
| 4   | `modern/04-vite-sass`              | Remove Gulp, add Vite + sass, `npm install` clean |
| 5   | `modern/05-js-syntax`              | `const`/`let`/modern patterns in `lib/js`         |
| 6   | `modern/06-eslint-prettier-vitest` | Lint, format, smoke tests                         |
| 7   | `modern/07-audit-hygiene`          | `npm audit` fixes, dependency pruning             |
| 8   | `modern/08-readme-fork`            | README fork name + Imgtor branding                |

Sub-agent specs live in `docs/agents/*.md`.
