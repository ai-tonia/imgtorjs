# Sub-agent 9: Fix security issues

**Goal:** Reduce audit noise and remove risk surface.

## Instructions for the agent

1. Run `npm audit fix` where safe; for breaking fixes, document and apply in a dedicated commit.
2. Remove unused dependencies and dead scripts.
3. Scan for secrets: `grep`-style search for `api_key`, `secret`, `BEGIN PRIVATE KEY`, high-entropy tokens; remove or rotate if found (use env vars for CI secrets only).
4. Remove or replace abandoned server deps from old dev servers (e.g. legacy `connect` stack pulled in by old Gulp plugins)—should be gone after build migration.

## Deliverables

- Improved `npm audit` outcome (or documented accepted risk)
- Pruned `package.json`
- Notes on any removed tracking/third-party scripts from demos

## Base branch

Stack on the branch merged from sub-agent 8.
