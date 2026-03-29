#!/usr/bin/env node
/**
 * Print the CHANGELOG.md section for a release tag (e.g. v5.2.0 -> ## 5.2.0 …).
 * Used by the release workflow for GitHub Release notes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const changelogPath = path.join(root, 'CHANGELOG.md');

const tag = process.argv[2] || '';
const version = tag.replace(/^v/i, '').trim();
if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error('Usage: extract-changelog-release.mjs <tag e.g. v1.2.3>');
  process.exit(1);
}

const text = fs.readFileSync(changelogPath, 'utf8');
const lines = text.split(/\r?\n/);
const headerRe = new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}(\\s|\\(|$)`);

let i = 0;
while (i < lines.length) {
  if (headerRe.test(lines[i])) {
    const body = [];
    i++;
    while (i < lines.length && !/^##\s+/.test(lines[i])) {
      body.push(lines[i]);
      i++;
    }
    const out = body.join('\n').trim();
    process.stdout.write(out || `_See [CHANGELOG.md](https://github.com/ai-tonia/imgtorjs/blob/main/CHANGELOG.md) for ${tag}._`);
    process.exit(0);
  }
  i++;
}

process.stdout.write(
  `Release ${tag}. See [CHANGELOG.md](https://github.com/ai-tonia/imgtorjs/blob/main/CHANGELOG.md) for details.`,
);
