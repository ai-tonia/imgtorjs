# Sub-agent 4: Audit dependencies

**Goal:** Security and upgrade visibility without a single big-bang bump.

## Instructions for the agent

1. After a successful install (may require prior build-tool migration), run `npm audit` and summarize high/critical items.
2. Run `npx npm-check-updates` (or `ncu`) and capture output; group by major vs minor/patch risk.
3. **Do not** `npm update` everything at once. For each meaningful upgrade, one PR or one commit: change `package.json` / lockfile, run `npm install`, run build and tests, document rollback notes.
4. Prefer replacing abandoned packages (e.g. `node-sass` → `sass`) over forcing old native builds.

## Deliverables

- Audit summary in `docs/MODERNIZATION.md`
- Outdated report snapshot (or pointer to CI artifact)
- Incremental upgrade notes per dependency touched

## Base branch

Stack on the branch merged from sub-agent 3.
