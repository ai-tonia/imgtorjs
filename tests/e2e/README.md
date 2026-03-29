# End-to-end tests

Browser E2E specs live in the repo root **`e2e/`** directory (see `playwright.config.js` → `testDir: 'e2e'`). Files are named **`imgtor.*.spec.js`** for a consistent namespace.

Run: `npm run test:e2e`

This folder is only a **documentation pointer** so the layout matches _unit / integration / e2e_ mentally without moving Playwright’s config.
