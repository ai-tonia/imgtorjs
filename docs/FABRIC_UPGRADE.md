# Fabric.js major upgrade (5.x / 6.x)

ImgTor is validated against **Fabric 1.4.x** (`demo/vendor/fabric.js`). Moving to current Fabric is a **separate release line**, not a routine PR.

## Preconditions

- Branch from `main` with a green **`npm run test:coverage`** and **`npm run test:e2e`**.
- Decide target Fabric major and lock the version in `package.json` or a pinned vendor file.

## Work breakdown

1. **Replace the runtime** — npm dependency or vendored bundle; ensure a single Fabric version loads in the demo and in docs.
2. **API pass** — update every `fabric.*` usage in `lib/js/plugins/*.js` and `lib/js/core/darkroom.js` (Canvas, Image, util helpers, events).
3. **Typings** — extend or replace `types/darkroom.d.ts` with accurate `fabric` types or narrow `any` gradually.
4. **Tests** — fix Vitest mocks to match new constructors; expand unit tests where behavior changed.
5. **Manual QA** — crop, rotate, undo/redo, save, keyboard crop if enabled; compare with Fabric 1.4 baseline or screenshots.
6. **Semver** — ship as **major** (e.g. ImgTor 4.0.0) with migration notes in CHANGELOG.

## Out of scope for “small” PRs

Do not mix this with CSS pipeline or test renames; keep the diff reviewable.
