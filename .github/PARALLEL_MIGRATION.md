# Parallel migration work (subagents & stacked PRs)

Use this when splitting work across **multiple agents** and **multiple PRs** into **`ai-tonia/imgtorjs`** `main`.

## Rules (avoid conflicts)

| Lane | Owns | Do not touch |
|------|------|----------------|
| Agent A | One branch + one test file (e.g. `tests/unit/plugin-history.test.js`) | Other agents’ test files or `package.json` unless agreed |
| Agent B | Another test file only | Same |
| Infra | `package.json`, `vitest.config.js`, CI | Reserve for a single agent per batch |

## Open every PR on the fork

```bash
npm run pr:create -- --title "your title" --fill
```

Or compare: `https://github.com/ai-tonia/imgtorjs/compare/main...<branch>` only.

## Suggested branch queue (tests)

1. `migration/pr-04-plugin-history-tests` — `plugin-history.test.js`
2. `migration/pr-05-plugin-rotate-tests` — `plugin-rotate.test.js` (open **after** PR 4 merges; branch from updated `main`)
3. Later: crop plugin (heavy Fabric mocks) — `migration/pr-06-plugin-crop-tests`, one agent only

## Subagent prompt template

> You may **only** add or edit `tests/unit/<one-file>.test.js`. Match `plugin-save.test.js` / `plugin-history.test.js` patterns. Do not change `package.json`. Return the file path and test count.

Merge **bottom-up**: merge PR 4 → pull `main` → branch PR 5 from `main`.
