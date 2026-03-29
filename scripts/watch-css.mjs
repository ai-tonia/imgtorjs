/**
 * Watch `lib/css/imgtor.css` and rebuild `build/imgtor.css`.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'lib', 'css', 'imgtor.css');
const buildScript = path.join(__dirname, 'build-css.mjs');

function runBuild() {
  const child = spawn(process.execPath, [buildScript], { stdio: 'inherit', cwd: root });
  child.on('error', (err) => console.error('build-css:', err));
}

runBuild();
fs.watch(path.dirname(cssPath), { persistent: true }, (_event, filename) => {
  if (filename === 'imgtor.css') runBuild();
});
