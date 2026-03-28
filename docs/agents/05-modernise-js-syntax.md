# Sub-agent 5: Modernise the JS syntax

**Goal:** ES5+ patterns → modern ES without changing public behavior.

## Instructions for the agent

1. In `lib/js/**/*.js` (not vendored `demo/vendor`): replace `var` with `const`/`let` where scope allows; use arrow functions when `this` binding is unchanged or already bound; use template literals for string concat; use destructuring where it improves clarity.
2. Prefer `async`/`await` only where Promise-based APIs already exist; do not rewrite Fabric callbacks blindly if that risks behavior change.
3. **Browser library note:** Keep global `window.Darkroom` unless a separate phase migrates to ESM bundles with explicit exports.
4. Optional follow-up: plan ESM migration for **source** while still emitting an IIFE bundle for `<script>` tags (Vite/Rollup).

## Deliverables

- Consistent modern syntax in library sources
- No intentional API breaks
- Short note in `docs/MODERNIZATION.md` on what was intentionally not converted (e.g. IE-era event fallbacks)

## Base branch

Stack on the branch merged from sub-agent 4.
