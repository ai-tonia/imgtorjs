# ImgTor documentation index

Central entry point for maintainer-facing design and migration notes (not npm package docs; see root **`README.md`** for users).

| Document | Purpose |
| -------- | ------- |
| [**PLUGIN_API.md**](./PLUGIN_API.md) | Plugin registration, **`initialize` / `destroy`**, toolbar options, error isolation, TypeScript surface. |
| [**MIGRATION_CANVAS_ADAPTER.md**](./MIGRATION_CANVAS_ADAPTER.md) | Phased plan to introduce **CanvasAdapter**, decouple from Fabric, optional native path. |
| [**FABRIC_UPGRADE.md**](./FABRIC_UPGRADE.md) | Playbook for upgrading the vendored Fabric.js major version. |
| [**AGENTS_REMOVE_FABRIC.md**](./AGENTS_REMOVE_FABRIC.md) | **Stacked PRs + sub-agent prompts** to remove Fabric entirely (native crop, delete vendor, tests). |

## Suggested PR sequence (architecture work)

1. **Plugin hardening** (lifecycle, isolation, types, tests) — merged as v4.1.x.
2. **Adapter scaffold + core wiring** (Phase A) — `CanvasAdapterFabric` + core use for canvas/image construction; no plugin behavior change.
3. **Rotate / history / save** adapter-agnostic cleanup (Phase B).
4. **Crop** pure-logic extraction (Phase B).
5. **Native adapter** prototype + parity gates (Phase C).
6. **Default switch** only after acceptance criteria (Phase D).
