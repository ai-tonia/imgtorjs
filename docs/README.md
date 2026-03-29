# ImgTor documentation index

Central entry point for maintainer-facing design and migration notes (not npm package docs; see root **`README.md`** for users).

| Document | Purpose |
| -------- | ------- |
| [**PLUGIN_API.md**](./PLUGIN_API.md) | Plugin registration, **`initialize` / `destroy`**, toolbar options, error isolation, TypeScript surface. |
| [**MIGRATION_CANVAS_ADAPTER.md**](./MIGRATION_CANVAS_ADAPTER.md) | Historical phased plan (Fabric → adapter); v5 completes the native default. |
| [**FABRIC_UPGRADE.md**](./FABRIC_UPGRADE.md) | Historical note — Fabric is not used in v5+. |

## Architecture (current)

- **Runtime:** **`imgtor.CanvasAdapterNative`** — viewport + source canvases, **`imgtor.CanvasObject`** for the crop overlay.
- **Plugins:** same registration model as before; built-ins use DOM + canvas wrapper events only.
