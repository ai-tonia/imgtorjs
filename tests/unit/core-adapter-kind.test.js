/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-fabric.js');
  await import('../../lib/js/core/canvas-adapter-native-stub.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
});

afterEach(() => {
  delete globalThis.__adapterKindErr;
  delete globalThis.fabric;
  globalThis.imgtor.plugins = [];
});

describe('adapterKind option', () => {
  it('throws when adapterKind is native during async image load', async () => {
    const OriginalImage = globalThis.Image;
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
            try {
              if (self.onload) self.onload.call(self);
            } catch (e) {
              globalThis.__adapterKindErr = e;
            }
          });
        },
        get() {
          return _src;
        },
      });
    };

    const wrap = document.createElement('div');
    const img = document.createElement('img');
    img.id = 'adapter-kind-native';
    img.src =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    wrap.appendChild(img);
    document.body.appendChild(wrap);

    new imgtor('#adapter-kind-native', { adapterKind: 'native' });

    await vi.waitFor(() => expect(globalThis.__adapterKindErr).toBeDefined());
    expect(globalThis.__adapterKindErr.message).toMatch(/not yet supported/);

    wrap.remove();
    globalThis.Image = OriginalImage;
  });
});

describe('imgtor.CanvasAdapterNative', () => {
  it('throws on createCanvas', () => {
    expect(() => imgtor.CanvasAdapterNative.createCanvas()).toThrow(/not implemented/);
  });
});
