# Canvas adapter architecture

**Current (v5+):** ImgTor uses **`imgtor.CanvasAdapterNative`** only — HTML Canvas 2D for viewport and source surfaces, plus **`imgtor.CanvasObject`** for interactive overlays (crop).

## Design goals

- Keep **plugins** talking to **`this.imgtor`** and the **canvas wrapper API** (`on` / `off`, `getPointer`, `toDataURL`, etc.), not raw engine globals.
- **Crop geometry** lives in **`lib/js/crop-geometry.js`** (`imgtor.Utils.computeCropRectFromDrag`) so layout math stays testable without the renderer.

## Canvas wrapper surface

Plugins and core expect roughly this shape on **`this.imgtor.canvas`**:

- Dimensions: **`getWidth`**, **`getHeight`**, **`setWidth`**, **`setHeight`**
- Objects: **`add`**, **`bringToFront`**, **`createLockedImage`**
- Interaction: **`on`**, **`off`**, **`getPointer`**, **`calcOffset`**, **`setActiveObject`**, **`discardActiveObject`**, **`getActiveObject`**, **`defaultCursor`**
- Export: **`toDataURL()`** full canvas or **`toDataURL({ left, top, width, height })`** for regions

## Relation to plugins

Third-party plugins should use **`this.imgtor`**, **`this.imgtor.canvas`**, and documented **`imgtor.*`** APIs only.

See [**PLUGIN_API.md**](./PLUGIN_API.md) for registration, lifecycle, and teardown.
