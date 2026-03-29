# Change Log

All notable changes to this project will be documented in this file.

## Unreleased

## 4.3.0 (2026-03-29)

- **Adapter:** **`layoutSourceImage`** and **`layoutViewportImage`** on **`CanvasAdapterFabric`**; core **`_initializeImage`** / **`_replaceCurrentImage`** delegate layout to the adapter

## 4.2.0 (2026-03-29)

- **Architecture (Phase A):** **`lib/js/core/canvas-adapter-fabric.js`** — **`imgtor.CanvasAdapterFabric.createCanvas` / `createLockedImage`**; core uses it for viewport + source canvases, source image, and **`refresh()`** image clones (behavior unchanged; Fabric still required globally)
- **Entry:** **`lib/entry-imgtor.js`** loads **`imgtor.js`** then **`canvas-adapter-fabric.js`** (global **`imgtor`** must exist before the adapter attaches)
- **Tests:** **`core-canvas-adapter-fabric.test.js`**; unit imports that load **`imgtor.js`** directly also import the adapter module
- **Docs:** **`MIGRATION_CANVAS_ADAPTER.md`** Phase A progress note

## 4.1.0 (2026-03-29)

- **Plugins:** **`destroy()`** on **`imgtor.Plugin`**; built-in plugins detach listeners; **`selfDestroy()`** runs **`_destroyPlugins()`** first
- **Core:** **`_initializePlugins`** try/catch per plugin with **`console.warn`**; **`removeEventListener`** mirrors **`addEventListener`**
- **UI:** **`createButtonGroup({ position: 'append' | 'prepend' })`**
- **Types:** **`ButtonOptions`**, **`ButtonGroupOptions`**; **`imgtor.plugins`** as constructor **`Record`**; **`Plugin.destroy`**
- **Docs:** **`docs/PLUGIN_API.md`**, **`docs/MIGRATION_CANVAS_ADAPTER.md`**, **`docs/README.md`** (index)
- **Tests:** integration **`build-entry.test.js`**; destroy + init-isolation coverage; **`tests/README.md`** layout table

## 4.0.0 (2026-03-28)

- **Breaking:** Global constructor is **`imgtor`** (lowercase); **`ImgTor`** remains on `window` for older snippets
- **Build:** **`build/imgtor.js`**, **`build/imgtor.css`**; Vite entry **`lib/entry-imgtor.js`**; source CSS **`lib/css/imgtor.css`**
- **CSS / DOM:** class names and icon host id use **`imgtor-*`** / **`imgtor-icons`**; plugins reference **`this.imgtor`**
- **Types:** **`types/imgtor.d.ts`** (replaces prior `*.d.ts` entry point)
- **Plugins:** filenames **`imgtor.*.js`** under **`lib/js/plugins/`**

## 3.2.0 (2026-03-29)

- **API:** global **`ImgTor`** (alias of the legacy global constructor) for new code; demo uses **`ImgTor`**
- **CSS:** plain source CSS + **Lightning CSS** minify (`scripts/build-css.mjs`); **Dart Sass / SCSS removed**
- **compat:** optional **`lib/js/compat/legacy-html5.js`** (`requestAnimationFrame` shims); comment in demo HTML
- **e2e:** history/undo spec; toolbar **visual snapshot** (`e2e/__snapshots__/`); specs assert **`ImgTor`**
- **types:** **`ImgTor`** ambient typings file
- **docs:** remove Pintura; **`docs/FABRIC_UPGRADE.md`** playbook; README / CONTRIBUTING updates
- **tests:** **`core-` / `plugin-` / `util-` / `core-build-`** file prefixes; extra viewport scaling + crop ratio coverage; integration entry spec; **`test:unit`** includes **`tests/integration`**
- **tooling:** ESLint globals for Playwright **`ImgTor`**

## 3.1.2 (2026-03-28)

- **npm:** `keywords` and `bugs` URL for discoverability
- **e2e:** Playwright **`demo.toolbar.spec.js`** — toolbar visible, four button groups, eight visible buttons (demo enables crop focus on load)

## 3.1.1 (2026-03-28)

- Include **RELEASING.md** in the npm package `files` list (next to SECURITY.md)

## 3.1.0 (2026-03-28)

- Add **SECURITY.md** (responsible disclosure) and **RELEASING.md** (maintainer checklist)
- Add **Playwright** demo smoke test (`npm run test:e2e`) and run it in CI with Chromium
- Publish **SECURITY.md** in the npm package `files` list for discoverability

## 3.0.0 (2026-03-28)

- **Breaking (fork):** npm **`imgtor`** v3 — ImgTor modernization (Node 22+, Vite, Vitest, GitHub Actions CI)
- TypeScript **ambient types** for the global constructor; **`exports`** and **`types`** in `package.json`
- **Dependabot** weekly npm updates (grouped devDependencies)
- Demo and docs: ImgTor / **ai-tonia/imgtorjs**; README CI badge and `npm install imgtor`
- npm **`main`**, **`style`**, **`files`**, **`prepublishOnly`** for publishing built assets
- **`sync:demo`**: copy `build/` → `demo/build/` (no symlink)
- Remove **Bower**; shared **`extendObject`** and viewport math with unit tests
- Modern DOM APIs (`addEventListener` / `Event`)
- Add type **button** to avoid HTML5 submit validation (#24)

## 2.0.0 (2015-08-01)

- Use of **Gulp** for the build process
- Replace the webfont by **SVG symbols** (which are direclty included in the compiled javascript)
- Ability to change **canvas ratio**
- Original image is kept and changes are done on a clone

## 1.0.x (2014)

Initial release.

- Create canvas with FabricJS from an image element
- Plugins: Crop, History, Rotate, Save
- Build process via Grunt
- Build webfont from SVG files to display the icons
