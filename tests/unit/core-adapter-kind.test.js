/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-fabric.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
});

afterEach(() => {
  delete globalThis.fabric;
  globalThis.imgtor.plugins = [];
});

describe('adapterKind option', () => {
  it('initializes with native adapter when fabric is absent', async () => {
    const OriginalImage = globalThis.Image;
    globalThis.fabric = undefined;

    globalThis.Image = function MockImage() {
      this.onload = null;
      const self = this;
      let _src = '';
      Object.defineProperty(this, 'src', {
        configurable: true,
        enumerable: true,
        set() {
          _src = 'x';
          queueMicrotask(() => {
            if (self.onload) self.onload.call(self);
          });
        },
        get() {
          return _src;
        },
      });
    };

    const wrap = document.createElement('div');
    const img = document.createElement('img');
    img.id = 'adapter-kind-native-ok';
    img.src =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    wrap.appendChild(img);
    document.body.appendChild(wrap);

    const dr = new imgtor('#adapter-kind-native-ok', {
      adapterKind: 'native',
      plugins: { crop: false, history: false, rotate: false, save: false },
    });

    await vi.waitFor(() => expect(dr.containerElement).toBeTruthy());
    expect(dr.containerElement.className).toBe('imgtor-container');
    expect(dr.canvas).toBeDefined();
    expect(dr.sourceCanvas).toBeDefined();

    wrap.remove();
    globalThis.Image = OriginalImage;
  });
});
