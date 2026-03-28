# Stacked (chained) pull requests

Each numbered sub-agent in `docs/agents/` is meant to ship as its **own** PR, with **PR N+1 targeting the branch from PR N** (not `main`), until the stack merges in order.

## Suggested branch names

| Order | Branch                   | Agent doc                    | Typical contents                                           |
| ----- | ------------------------ | ---------------------------- | ---------------------------------------------------------- |
| 1     | `modern/01-assess`       | `01-assess-what-you-have.md` | Inventory only (can merge docs + `MODERNIZATION.md` start) |
| 2     | `modern/02-scope`        | `02-understand-the-scope.md` | Scope metrics, test discovery                              |
| 3     | `modern/03-node-runtime` | `03-update-runtime-first.md` | `engines`, install failure log                             |
| 4     | `modern/04-deps-audit`   | `04-audit-dependencies.md`   | Audit / ncu snapshots                                      |
| 5     | `modern/05-js-syntax`    | `05-modernise-js-syntax.md`  | `lib/js` syntax pass                                       |
| 6     | `modern/06-vite-build`   | `06-replace-build-tool.md`   | Gulp → Vite, `sass` CLI                                    |
| 7     | `modern/07-fabric`       | `07-update-framework.md`     | Fabric decision or migration                               |
| 8     | `modern/08-tooling`      | `08-add-modern-tooling.md`   | ESLint, Prettier, Vitest                                   |
| 9     | `modern/09-security`     | `09-fix-security-issues.md`  | Audit fixes, cleanup                                       |
| 10    | `modern/10-tests`        | `10-test-everything.md`      | Test hardening, manual checklist                           |

## How to stack in GitHub

1. Open PR A: `modern/01-assess` → `main`.
2. After A merges, branch `modern/02-scope` from updated `main` (or use merge queue).
3. Alternatively, open PR B with **base** = `modern/01-assess` and **merge** in sequence (B into A, then A into `main`).

This repository’s active work may combine several phases on one branch for velocity; split commits or branches using the table above when you need strict separation.
