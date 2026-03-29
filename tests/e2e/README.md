# End-to-end tests

Browser E2E specs live in the repo root **`e2e/`** directory (see `playwright.config.js` → `testDir: 'e2e'`). Files are named **`core-demo-*.spec.js`** (demo smoke, toolbar, editor, history). Visual baselines live under **`e2e/__snapshots__/`** (toolbar PNG).

Run: `npm run test:e2e`

This folder is only a **documentation pointer** so the layout matches _unit / integration / e2e_ mentally without moving Playwright’s config.
