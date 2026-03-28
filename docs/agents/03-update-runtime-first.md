# Sub-agent 3: Update the runtime first

**Goal:** Standardize on a supported Node.js LTS and capture install failures.

## Instructions for the agent

1. Target **Node.js 22 LTS** (or current project standard). Add or update `"engines": { "node": ">=22" }` in `package.json` when policy allows.
2. Run `node --version` and `npm --version`; record output in `docs/MODERNIZATION.md`.
3. Run `npm install` on the **legacy** lockfile/deps before modernization; capture **every** error and warning relevant to failure (e.g. `node-sass` / `node-gyp`, missing Python).
4. Do not “fix” yet beyond documentation unless this phase also owns the first dependency swap (coordinate with phase 4/6).

## Deliverables

- `engines` field update (if approved)
- Logged versions
- Documented `npm install` failure modes

## Base branch

Stack on the branch merged from sub-agent 2.
