import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');
const linkPath = path.join(root, 'demo', 'build');

if (!fs.existsSync(buildDir)) {
  console.warn('link-demo-build: skip — build/ does not exist yet (run npm run build)');
  process.exit(0);
}

try {
  fs.unlinkSync(linkPath);
} catch {
  /* absent or not a link */
}

const rel = path.relative(path.dirname(linkPath), buildDir);
const type = process.platform === 'win32' ? 'junction' : 'dir';
fs.symlinkSync(rel, linkPath, type);
