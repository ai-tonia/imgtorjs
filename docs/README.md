# ImgTor documentation index

Central entry point for maintainer-facing design notes (not npm package docs; see root **`README.md`** for users).

| Document | Purpose |
| -------- | ------- |
| [**PLUGIN_API.md**](./PLUGIN_API.md) | Plugin registration, **`initialize` / `destroy`**, toolbar options, error isolation, TypeScript surface. |
| [**CANVAS_ADAPTER.md**](./CANVAS_ADAPTER.md) | Canvas wrapper architecture and plugin integration surface. |

## Architecture (current)

- **Runtime:** **`imgtor.CanvasAdapterNative`** — viewport + source canvases, **`imgtor.CanvasObject`** for the crop overlay.
- **Plugins:** built-ins use DOM + canvas wrapper events only.

## Bundled plugins (flat `imgtor.plugins` registry)

| id | Folder | Role |
| --- | --- | --- |
| `history` | `imgtor.history.js` | Undo / redo |
| `rotate` | `imgtor.rotate.js` | Rotate |
| `crop` | `imgtor.crop.js` | Crop |
| `save` | `imgtor.save.js` | Save |
| `filter` | `imgtor.filter/` | Colour matrix filters |
| `finetune` | `imgtor.finetune/` | Sliders (brightness, contrast, …) |
| `resize` | `imgtor.resize/` | Target dimensions |
| `frame` | `imgtor.frame/` | Viewport frame overlay + bake |
| `fill` | `imgtor.fill/` | Background fill preview + bake |
| `redact` | `imgtor.redact/` | Region redaction |
| `annotate` | `imgtor.annotate/` | Image-space rectangles (minimal) |
| `decorate` | `imgtor.decorate/` | Viewport-space rectangles (minimal) |
| `retouch` | `imgtor.retouch/` | Selection + `onSelectionComplete` hook |

Disable any plugin with **`options.plugins.<id> = false`**. See **`PLUGIN_API.md`** for **`core:refreshed`** and namespaced modules.
