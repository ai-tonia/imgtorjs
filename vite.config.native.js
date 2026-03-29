import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { imgtorIconsSpritePlugin } from './vite.icons-plugin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [imgtorIconsSpritePlugin()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/entry-imgtor-native.js'),
      name: 'imgtor',
      formats: ['iife'],
      fileName: () => 'imgtor-native.js',
    },
    outDir: 'build',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {},
  },
});
