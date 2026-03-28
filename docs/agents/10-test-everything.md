# Sub-agent 10: Test everything

**Goal:** Safety net before and after modernization.

## Instructions for the agent

1. If tests existed: run them after each major phase; fix regressions before proceeding.
2. If no tests: add **smoke tests** first (build output, minimal behavior), then run `npm test` in CI or locally after each phase.
3. Manually smoke the **demo** (`npm run dev` / open demo page): crop, rotate, undo/redo, save.
4. Document test commands in README.

## Deliverables

- Green test run
- Manual checklist or automated coverage of critical paths
- README testing section updated

## Base branch

Stack on the branch merged from sub-agent 9.
