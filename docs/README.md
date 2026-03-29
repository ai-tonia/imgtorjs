# ImgTor documentation index

Central entry point for maintainer-facing design notes (not npm package docs; see root **`README.md`** for users).

| Document | Purpose |
| -------- | ------- |
| [**PLUGIN_API.md**](./PLUGIN_API.md) | Plugin registration, **`initialize` / `destroy`**, toolbar options, error isolation, TypeScript surface. |
| [**CANVAS_ADAPTER.md**](./CANVAS_ADAPTER.md) | Canvas wrapper architecture and plugin integration surface. |

## Architecture (current)

- **Runtime:** **`imgtor.CanvasAdapterNative`** — viewport + source canvases, **`imgtor.CanvasObject`** for the crop overlay.
- **Plugins:** built-ins use DOM + canvas wrapper events only.
