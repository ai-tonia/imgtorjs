# Remove Fabric.js — stacked PRs & sub-agent prompts

This document turns the **“Remove Fabric.js”** refactor into **sequential stacked pull requests** and provides **copy-paste prompts** for autonomous agents (Cursor Cloud, etc.). Each prompt assumes the agent has the repo checked out on the **correct base branch** for that step.

**Current state on `main` (do not redo):**

- `lib/js/core/canvas-adapter-native.js` — rotate / history / save subset  
- `build/imgtor-native.js` + `lib/entry-imgtor-native.js` — Fabric-free bundle without crop  
- `lib/js/crop-geometry.js` — pure crop rectangle math  
- Default full bundle still uses **`adapterKind: 'fabric'`** + **`canvas-adapter-fabric.js`** + crop on Fabric  

**End state:** single **`adapterKind: 'native'`** default, **`imgtor.js`** with no Fabric, **`demo/vendor/fabric.js`** deleted, **`canvas-adapter-fabric.js`** deleted.

---

## Merge order (stack)

| # | Branch name (suggested) | Base (merge after) | Delivers |
|---|-------------------------|--------------------|----------|
| 1 | `stack/native-crop-interactive` | `main` | Extended `NativeCanvasWrapper` + `imgtor.CanvasObject` + crop plugin still on Fabric *or* feature-flagged partial wiring |
| 2 | `stack/native-crop-plugin` | PR 1 merged | `imgtor.crop.js` fully off `fabric.*` |
| 3 | `stack/remove-fabric-artifacts` | PR 2 merged | Delete Fabric adapter + vendor; entry + core default + demo + types |
| 4 | `stack/tests-e2e-fabric-gone` | PR 3 merged | Test suite + e2e crop + `fabric` undefined assertion |

You can split **PR 1** into two PRs (interactive canvas first, then crop rewrite) if reviews are easier.

---

## PR 1 — Native canvas: interactive layer + `CanvasObject`

**Goal:** Extend `lib/js/core/canvas-adapter-native.js` so it can support crop **before** deleting Fabric: `_objects[]`, `_activeObject`, mouse bridge, `getPointer` / `calcOffset`, `bringToFront`, `setActiveObject`, `discardActiveObject`, `toDataURL({left,top,width,height})`, `defaultCursor` on the element, resize handles, emit `mouse:*` / `object:moving` / `object:scaling`. Add **`imgtor.CanvasObject`** (or `NativeCropZone` base) with **`extend()`** matching the interface in the plan (left/top/width/height, scale, `containsPoint`, `scaleToWidth`/`Height`, `remove`, `_render`, `callSuper` stub).

**Do not** delete Fabric files in this PR unless crop is fully migrated in the same PR (prefer keeping Fabric for one more step).

**Exit criteria:** `npm run lint`, `npm test`, expanded `tests/unit/core-canvas-adapter-native.test.js` covering the new APIs.

### Sub-agent prompt — PR 1

```
You are working in the imgtorjs repo on branch stack/native-crop-interactive (base: main).

Task: Extend lib/js/core/canvas-adapter-native.js for interactive crop support WITHOUT removing Fabric yet.

Requirements:
1. NativeCanvasWrapper: add _objects[], _activeObject, _dragState, cached _rect from getBoundingClientRect.
2. add() accepts NativeImageWrapper and CanvasObject subclasses; maintain order; bringToFront reorders.
3. Implement getPointer(e), calcOffset(), setActiveObject, discardActiveObject, getActiveObject, bringToFront (no longer no-ops where the crop plugin needs them).
4. defaultCursor: read/write canvas element style.cursor.
5. toDataURL() full canvas; toDataURL({left,top,width,height}) via offscreen drawImage crop.
6. DOM mousedown/mousemove/mouseup on the canvas element: emit fabric-like events {e} for mouse:down/move/up; emit object:moving and object:scaling when dragging active object; support corner resize handles (8 corners, ~6px hit, cornerColor #444).
7. Add imgtor.CanvasObject base + CanvasObject.extend(proto) like Plugin.extend; instances have getLeft/Top/Width/Height, set*, scaleToWidth/Height, containsPoint (AABB), remove(), _render(ctx), callSuper noop.

Tests: expand tests/unit/core-canvas-adapter-native.test.js for active object, getPointer, toDataURL region, at least one mouse-driven move (jsdom/happy-dom may need manual event dispatch).

Do not delete canvas-adapter-fabric.js or demo/vendor/fabric.js in this PR. Do not change default adapterKind yet.

Commit with a clear message; push branch stack/native-crop-interactive.
```

---

## PR 2 — Rewrite `imgtor.crop.js` to native-only APIs

**Goal:** Remove every `fabric.*` usage from `lib/js/plugins/imgtor.crop.js`: `fabric.util.createClass` → `imgtor.CanvasObject.extend`, `new fabric.Image` → `canvas.createLockedImage` (or adapter factory), `fabric.util.addListener` → `document.addEventListener`, `new fabric.Point` → `{x,y}`, `destroy` uses `removeEventListener`.

**Depends on:** PR 1 merged (interactive native canvas + CanvasObject).

**Exit criteria:** `grep -R "fabric\." lib/js/plugins/imgtor.crop.js` is empty; all crop unit tests pass without `fabricStub()`.

### Sub-agent prompt — PR 2

```
You are on branch stack/native-crop-plugin rebased on main after PR 1 merged.

Task: Remove all Fabric usage from lib/js/plugins/imgtor.crop.js.

1. Replace fabric.util.createClass(fabric.Rect, ...) with imgtor.CanvasObject.extend({ ... }) preserving _render, _renderOverlay, _renderBorders, _renderGrid logic using CanvasRenderingContext2D (same visual intent).
2. In Crop.applyTransformation, replace new fabric.Image(...) with canvas.createLockedImage(HTMLImageElement) or equivalent from Native adapter.
3. Replace fabric.util.addListener/removeListener on fabric.document with document.addEventListener/removeEventListener; store bound refs for destroy().
4. Replace new fabric.Point(x,y) with plain {x,y} where containsPoint expects it.
5. Ensure destroy() removes document listeners and canvas listeners.

Update tests: plugin-crop-*.test.js — remove fabric global stubs; import native adapter; ensure createEditorForCrop mocks match NativeCanvasWrapper API.

Run npm run lint && npm test && npm run test:e2e.

Commit; push stack/native-crop-plugin.
```

---

## PR 3 — Delete Fabric adapter, vendor, switch default

**Goal:** Delete `lib/js/core/canvas-adapter-fabric.js`, `demo/vendor/fabric.js`. Update `lib/entry-imgtor.js` to only import native adapter. Set `defaults.adapterKind` to `'native'` in `lib/js/core/imgtor.js`. Remove `imgtor.rotate.js` Fabric path if the bundle always uses native rotate — **or** keep a single rotate implementation: merge `imgtor.rotate.native.js` into `imgtor.rotate.js` and delete duplicate. Update `demo/index.html` (remove fabric script). Simplify `vite.config.js` if you no longer need dual build — **decision:** either keep publishing `imgtor-native.js` as alias of `imgtor.js` for one major, or deprecate `imgtor-native.js` in CHANGELOG and drop second Vite build (breaking).

**Types:** `types/imgtor.d.ts` — remove `CanvasAdapterFabric`; document `CanvasObject`; `adapterKind?: 'native'` only or remove if unused.

**History plugin:** change IIFE to `(window, document, imgtor)` with no fabric param.

**Exit criteria:** `rg fabric lib demo` only hits comments/docs you intend to keep; `npm run build` produces working `build/imgtor.js` without Fabric.

### Sub-agent prompt — PR 3

```
You are on branch stack/remove-fabric-artifacts rebased on main after PR 2 merged.

Task: Remove Fabric from the default package.

1. Delete lib/js/core/canvas-adapter-fabric.js and demo/vendor/fabric.js.
2. lib/entry-imgtor.js: import only canvas-adapter-native.js; update file comment.
3. lib/js/core/imgtor.js: default adapterKind 'native'; simplify _initializeDOM if only native exists (remove fabric guard branches if any).
4. Consolidate rotate: single imgtor.rotate.js using native-safe Transformation (merge from imgtor.rotate.native.js if needed); update entry imports; remove duplicate if obsolete.
5. demo/index.html: remove fabric.js script tag; demo must work with npm start.
6. package.json / vite: if imgtor-native.js is redundant, document deprecation or remove second build in a semver-major way; update exports and files[].
7. types/imgtor.d.ts: remove CanvasAdapterFabric; add CanvasObject typings; README.md user-facing “no Fabric” instructions.

Run npm run lint, npm test, npm run test:e2e, npm run build.

Commit; push stack/remove-fabric-artifacts.
```

---

## PR 4 — Tests, e2e crop, coverage

**Goal:** Delete `tests/unit/core-canvas-adapter-fabric.test.js`. Update `tests/integration/build-entry.test.js` (no fabric stub). Add `e2e/core-demo-crop.spec.js` for crop flow on demo. Add to `e2e/core-demo-editor.spec.js`: `expect(await page.evaluate(() => typeof window.fabric)).toBe('undefined')`.

**Exit criteria:** CI green; coverage floors still met or adjusted in `vitest.config.js` with justification in CHANGELOG.

### Sub-agent prompt — PR 4

```
You are on branch stack/tests-e2e-fabric-gone rebased on main after PR 3 merged.

Task: Finalize tests for Fabric removal.

1. Delete tests/unit/core-canvas-adapter-fabric.test.js.
2. Rewrite tests/integration/build-entry.test.js without createMinimalFabricStub; assert imgtor.CanvasAdapterNative and imgtor.CanvasObject.extend exist; default plugins include crop.
3. Update core-imgtor.test.js, core-init.test.js, core-selfdestroy.test.js, core-adapter-kind.test.js, plugin-history.test.js for native-only.
4. e2e/core-demo-editor.spec.js: assert typeof window.fabric === 'undefined'.
5. Add e2e/core-demo-crop.spec.js: open demo, enable crop (or use default), drag selection, apply crop or cancel; no console errors.

Run full CI locally: lint, test, test:coverage, test:e2e.

Update CHANGELOG Unreleased with breaking change note (semver major).

Commit; push stack/tests-e2e-fabric-gone.
```

---

## Release note

After the stack merges, ship **semver major** (e.g. **5.0.0**): breaking for anyone who loaded `imgtor.js` **with** Fabric alongside or depended on `CanvasAdapterFabric`.

---

## Relationship to other docs

- **[MIGRATION_CANVAS_ADAPTER.md](./MIGRATION_CANVAS_ADAPTER.md)** — historical phased plan; this file is the **concrete removal** execution guide.  
- **[FABRIC_UPGRADE.md](./FABRIC_UPGRADE.md)** — **obsolete** once Fabric is removed; keep archived or delete in PR 3 with a one-line pointer in CHANGELOG.

---

## Checklist (human)

- [ ] PR 1 merged  
- [ ] PR 2 merged  
- [ ] PR 3 merged + demo manually smoke-tested  
- [ ] PR 4 merged  
- [ ] Version **5.0.0** (or agreed major), tag, `npm publish`, GitHub Release  
