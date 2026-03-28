/**
 * Writes sub-agent prompt files into docs/agents/ (gitignored).
 * Run: node scripts/seed-docs-agents.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'docs', 'agents');

const files = {
  '01-assess-what-you-have.md': `# Sub-agent 1: Assess what you have

**Goal:** Inventory the repository before changes.

## Tasks

1. Read \`package.json\`: list \`dependencies\` and \`devDependencies\` with semver ranges.
2. Read \`bower.json\` if present; note legacy client deps (e.g. Fabric).
3. Identify patterns: globals (\`window.Darkroom\`), IIFEs, build entry (\`lib/entry-darkroom.js\`), Fabric version in \`demo/vendor/\`.
4. Note \`engines\` in \`package.json\` or state "not specified."
5. Document build: Vite (\`vite.config.js\`), Sass CLI, output \`build/\`.

## Output

Short bullet summary (for your own notes; this folder is gitignored).
`,
  '02-understand-the-scope.md': `# Sub-agent 2: Understand the scope

**Goal:** Size and classify the project.

## Tasks

1. Count first-party files under \`lib/js\`, \`lib/css\`; exclude \`demo/vendor\`.
2. Confirm test layout: \`tests/smoke.test.js\`, \`tests/unit/\`.
3. Classify: browser library + static demo; Node for build only.
4. Read \`CONTRIBUTING.md\` for maintainer-facing shape (committed).

## Output

Brief scope note for planning.
`,
  '03-update-runtime-first.md': `# Sub-agent 3: Update the runtime first

**Goal:** Standardize on supported Node and capture install failures.

## Tasks

1. Target Node **22 LTS**; ensure \`package.json\` has \`"engines": { "node": ">=22" }\`.
2. Run \`node --version\` and \`npm --version\`; log if anything fails.
3. Clean \`node_modules\`, run \`npm install\`; document errors (e.g. native addons).

## Output

Versions + any failure log.
`,
  '04-audit-dependencies.md': `# Sub-agent 4: Audit dependencies

**Goal:** Security and upgrade visibility; bump incrementally.

## Tasks

1. Run \`npm audit\`; run \`npm run audit\` if scripted.
2. Run \`npx npm-check-updates\`; group by risk (major vs patch).
3. Upgrade **one dependency (or one logical group)** per change; run \`npm test\` after each.
4. Do not bulk \`ncu -u\` without verification.

## Output

Audit summary + what was bumped.
`,
  '05-modernise-js-syntax.md': `# Sub-agent 5: Modernise the JS syntax

**Goal:** Modern ES in library sources without breaking \`window.Darkroom\`.

## Tasks

1. In \`lib/js/**/*.js\`: prefer \`const\`/\`let\`, safe \`hasOwnProperty\` usage.
2. Extract **pure** helpers to ESM modules testable in Node (e.g. \`lib/js/extend-object.js\`).
3. Keep IIFE + global export for the browser bundle unless doing a dedicated ESM-consumer release.

## Output

List of files touched; note any intentional IE-era code left in place.
`,
  '06-replace-build-tool.md': `# Sub-agent 6: Replace or remove the build tool

**Goal:** Modern, reproducible build.

## Tasks

1. Confirm Vite produces \`build/darkroom.js\` (IIFE) and Sass produces \`build/darkroom.css\`.
2. Ensure \`npm run build\` has no deprecation warnings where fixable (e.g. Sass \`@use\`).
3. Demo: \`npm start\` = build + \`link:demo\` + preview server.

## Output

Confirm scripts in \`package.json\`; note any follow-ups (symlink vs \`../build\` paths).
`,
  '07-update-framework.md': `# Sub-agent 7: Update or replace the framework

**Goal:** Align Fabric.js strategy with effort.

## Tasks

1. **Default:** Document that demo uses **Fabric 1.4.x** vendored; upgrading to Fabric 5+/6+ is a **separate, large** migration (API + visual regression).
2. If migrating: dedicated branch, update vendor or npm dep, fix all APIs, manual demo pass (crop, rotate, undo, save).

## Output

Decision: stay on 1.x vs migration plan.
`,
  '08-add-modern-tooling.md': `# Sub-agent 8: Add or modernise tooling

**Goal:** Lint, format, test runner current.

## Tasks

1. ESLint flat config; Prettier; align with current ESLint major.
2. Vitest: smoke tests on build output + unit tests for pure modules (\`tests/unit/\`).
3. TypeScript: optional; this repo is small — add only if you want published types.

## Output

Scripts: \`lint\`, \`format\`, \`test\`, \`test:unit\`.
`,
  '09-fix-security-issues.md': `# Sub-agent 9: Fix security issues

**Goal:** Reduce risk surface.

## Tasks

1. \`npm audit\` / \`npm audit fix\` where safe; document accepted risk.
2. Remove unused dependencies.
3. Grep for secrets (\`api_key\`, \`BEGIN PRIVATE KEY\`, etc.); never commit \`.env\`.
4. Avoid third-party tracking in demo unless explicitly desired.

## Output

Audit result + any removals.
`,
  '10-test-everything.md': `# Sub-agent 10: Test everything

**Goal:** Automated safety net.

## Tasks

1. After each major change: \`npm test\` and \`npm run lint\`.
2. Add unit tests for **pure** logic (\`extend-object\` pattern); keep smoke tests for \`build/\` artifacts.
3. Manual: \`npm start\`, exercise crop / rotate / undo / redo / save on demo.

## Output

Green CI or local commands; note manual checklist.
`,
};

fs.mkdirSync(dir, { recursive: true });
for (const [name, body] of Object.entries(files)) {
  const fp = path.join(dir, name);
  fs.writeFileSync(fp, body.trim() + '\n', 'utf8');
  console.log('wrote', path.relative(root, fp));
}
console.log('Done. docs/agents/ is gitignored — prompts stay local.');
