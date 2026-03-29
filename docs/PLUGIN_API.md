# Plugin API (ImgTor)

This document describes how **first-party and third-party plugins** integrate with **`imgtor`**. The design keeps the historical **Backbone-style `extend`** pattern while adding explicit **lifecycle** and **failure isolation** so the editor stays stable as plugins grow.

## Registration

1. **Constructor map** — `imgtor.plugins` is a plain object mapping **plugin id** → **constructor**:

   ```js
   imgtor.plugins['myplugin'] = imgtor.Plugin.extend({ /* prototype */ });
   ```

2. **Enablement** — The core reads `options.plugins[pluginId]`. If the value is **`false`**, that plugin is skipped. Otherwise the value is passed as the second argument to the plugin constructor (merged with `defaults` on the prototype).

3. **Instantiation order** — `_initializePlugins` walks the **enumeration order** of the object passed in (by default `imgtor.plugins`). Registration order in source files therefore matters unless you pass a custom plugin map in the future.

## Constructor

```js
function Plugin(editor, options) {
  this.imgtor = editor;   // imgtor instance
  this.options = imgtor.Utils.extend(options, this.defaults);
  this.initialize();      // called synchronously before returning
}
```

- **`this.imgtor`** — Use for canvas, toolbar (`this.imgtor.toolbar`), `applyTransformation`, `addEventListener` / `removeEventListener`, `dispatchEvent`, etc.
- **`this.options`** — Merged options; set **`defaults`** on the extended prototype for built-in values.

## Lifecycle

### `initialize()`

Runs once when the plugin instance is created. Attach DOM listeners, Fabric canvas listeners, timers, etc. **Store stable references** to bound handlers (e.g. `this._onFoo = this.onFoo.bind(this)`) so `destroy()` can remove them with the same function reference.

### `destroy()`

- Base **`imgtor.Plugin.prototype.destroy`** is a **no-op** (safe to call).
- Implement **`destroy`** on your extended plugin to:
  - Remove **DOM** listeners from toolbar buttons.
  - Remove **canvas** listeners (`canvas.off(...)` for Fabric).
  - Remove **document** listeners if you used `fabric.util.addListener`.
  - Call **`this.imgtor.removeEventListener(...)`** for any core events you subscribed to.
  - Release focus or temporary UI state if needed (e.g. crop plugin calls `releaseFocus()`).

The core calls **`_destroyPlugins()`** from **`selfDestroy()`** **before** replacing the container DOM, so plugins can still access `this.imgtor` and the canvas during teardown.

## Error isolation

If **`new PluginConstructor(editor, options)`** throws, the core **logs a warning** and **continues** with other plugins. A single broken plugin must not prevent the rest of the editor from loading.

## Toolbar: button groups

- **`toolbar.createButtonGroup(options?)`** — Optional **`position`**: **`'append'`** (default) or **`'prepend'`**, controlling where the new group is inserted relative to existing groups.
- **`buttonGroup.createButton(options)`** — Options include **`image`**, **`type`**, **`group`**, **`hide`**, **`disabled`** (see **`types/imgtor.d.ts`**).

## Transformations

Heavy image changes go through **`imgtor.Transformation.extend`** and **`applyTransformation`**, not through ad hoc canvas writes, so history and refresh stay consistent.

## TypeScript

Ambient types live in **`types/imgtor.d.ts`**: **`imgtor.Plugin`**, **`destroy()`**, **`ButtonOptions`**, **`ButtonGroupOptions`**, and **`imgtor.plugins`** as a **`Record`** of constructors.
