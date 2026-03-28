# Sub-agent 8: Add or modernise tooling

**Goal:** ESLint, Prettier, optional TypeScript, test runner.

## Instructions for the agent

1. Add **ESLint** flat config (`eslint.config.js`) targeting modern ECMAScript; lint `lib/js` and build config; exclude `demo/vendor` and `build/`.
2. Add **Prettier** with minimal config; add `format` script.
3. **TypeScript:** Only if the team wants types; this codebase is small—JSDoc or `.d.ts` for `Darkroom` may suffice instead of full migration.
4. Add **Vitest** (or Jest) with at least smoke tests: build artifacts exist, or a minimal unit test for a pure helper.

## Deliverables

- ESLint + Prettier configs and npm scripts
- Test script wired in CI or documented locally
- Short “how to run” in README

## Base branch

Stack on the branch merged from sub-agent 7.
