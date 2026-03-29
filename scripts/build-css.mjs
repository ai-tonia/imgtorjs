/**
 * Minify `lib/css/darkroom.css` → `build/darkroom.css` via Lightning CSS (Rust).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inPath = path.join(root, 'lib', 'css', 'darkroom.css');
const outPath = path.join(root, 'build', 'darkroom.css');

const source = fs.readFileSync(inPath);
const { code } = transform({
  filename: inPath,
  code: source,
  minify: true,
  sourceMap: false,
  targets: {
    safari: (14 << 16) | (1 << 8),
    chrome: 90 << 16,
    firefox: 88 << 16,
  },
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, code);
