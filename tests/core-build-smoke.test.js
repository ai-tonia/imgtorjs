import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

describe('build outputs', () => {
  it('emits imgtor.js with imgtor global', () => {
    const jsPath = path.join(root, 'build', 'imgtor.js');
    expect(existsSync(jsPath)).toBe(true);
    const src = readFileSync(jsPath, 'utf8');
    expect(src.length).toBeGreaterThan(500);
    expect(src).toMatch(/imgtor/);
  });

  it('emits imgtor.css', () => {
    const cssPath = path.join(root, 'build', 'imgtor.css');
    expect(existsSync(cssPath)).toBe(true);
    const src = readFileSync(cssPath, 'utf8');
    expect(src).toMatch(/imgtor/);
  });
});
