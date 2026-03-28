# Sub-agent 1: Assess what you have

**Goal:** Produce a factual inventory of the repository before any changes.

## Instructions for the agent

1. Read `package.json` and list every `dependencies` and `devDependencies` with exact semver ranges from the file.
2. Read `bower.json` if present and note legacy client-side dependencies (e.g. Fabric version).
3. Identify frameworks and patterns:
   - Vanilla browser globals (`window.Darkroom`), IIFE modules, prototype “classes”
   - Backbone-style `extend` helpers (not Backbone itself)
   - Fabric.js for canvas (version in `demo/vendor/fabric.js` or bower)
4. Check Node version requirements: `engines` in `package.json` if present; if absent, state “not specified.”
5. Identify build tooling: Gulp tasks, concat order, SCSS pipeline, SVG sprite injection (from `gulpfile.js`).
6. Output a short markdown summary suitable for `docs/MODERNIZATION.md` § Inventory.

## Deliverables

- Bullet list of dependencies and versions
- Framework/library summary (no guessing beyond file evidence)
- Build tool summary
- Node `engines` status

## Base branch

Work on top of the previous phase branch (or `main` for phase 1).
