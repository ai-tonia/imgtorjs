# Sub-agent 2: Understand the scope

**Goal:** Size and characterize the project for planning.

## Instructions for the agent

1. Measure codebase size: count source files under `lib/`, `demo/` (excluding `node_modules`, vendor bundles if counted separately).
2. Use `cloc` or line counts on `lib/js/**/*.js` and `lib/css/**/*.scss`.
3. Search for test runners (`jest`, `mocha`, `vitest`, `karma`, `test/` directories) and report whether an automated test suite exists.
4. Classify the project: browser library + static demo, Node build scripts only, etc.
5. From `README.md` and `CHANGELOG.md`, note maintenance status (discontinued, production fork, etc.).

## Deliverables

- File/line estimates
- “Tests: yes/no” with evidence
- Architecture classification (frontend lib, demo, build)
- Maintenance / fork context

## Base branch

Stack on the branch merged from sub-agent 1.
