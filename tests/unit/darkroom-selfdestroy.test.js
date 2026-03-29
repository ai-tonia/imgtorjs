/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.Darkroom = {};
  await import('../../lib/js/core/darkroom.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
});

describe('Darkroom.prototype.selfDestroy', () => {
  const OriginalImage = globalThis.Image;

  beforeAll(() => {
    globalThis.Image = function MockImage() {
      const img = document.createElement('img');
      let onloadHandler = null;
      Object.defineProperty(img, 'onload', {
        configurable: true,
        enumerable: true,
        get() {
          return onloadHandler;
        },
        set(fn) {
          onloadHandler = fn;
        },
      });
      let _src = '';
      Object.defineProperty(img, 'src', {
        configurable: true,
        enumerable: true,
        get() {
          return _src;
        },
        set(v) {
          _src = v;
          img.setAttribute('src', v);
          queueMicrotask(() => {
            if (typeof onloadHandler === 'function') {
              onloadHandler.call(img);
            }
          });
        },
      });
      return img;
    };
  });

  afterAll(() => {
    globalThis.Image = OriginalImage;
  });

  it('replaceChild receives an HTMLImageElement whose src matches toDataURL()', async () => {
    const dataUrl = 'data:image/png;base64,SELF';
    const parent = document.createElement('div');
    const container = document.createElement('div');
    parent.appendChild(container);
    const replaceChildSpy = vi.spyOn(parent, 'replaceChild');

    const d = Object.create(Darkroom.prototype);
    d.containerElement = container;
    d.sourceImage = {
      toDataURL: vi.fn(() => dataUrl),
    };

    d.selfDestroy();

    await vi.waitFor(() => {
      expect(replaceChildSpy).toHaveBeenCalledTimes(1);
    });

    const [newNode, oldNode] = replaceChildSpy.mock.calls[0];
    expect(newNode).toBeInstanceOf(HTMLImageElement);
    expect(oldNode).toBe(container);
    expect(newNode.src).toBe(dataUrl);
    expect(d.sourceImage.toDataURL).toHaveBeenCalledTimes(1);
  });
});
