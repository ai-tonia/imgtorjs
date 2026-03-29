/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

class NoopPlugin {
  constructor(dr) {
    this.imgtor = dr;
  }
  initialize() {}
}

const OriginalImage = globalThis.Image;
/** @type {unknown} */
let originalImgtorPlugins;

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');

  originalImgtorPlugins = imgtor.plugins;
  imgtor.plugins = {
    noop: NoopPlugin,
  };

  globalThis.Image = function MockHTMLImage() {
    this.onload = null;
    const self = this;
    let _src = '';
    Object.defineProperty(this, 'src', {
      configurable: true,
      enumerable: true,
      set(v) {
        _src = v;
        queueMicrotask(() => {
          if (self.onload) self.onload();
        });
      },
      get() {
        return _src;
      },
    });
  };
});

afterAll(() => {
  imgtor.plugins = originalImgtorPlugins;
  globalThis.Image = OriginalImage;
});

function mountImg(id) {
  const wrap = document.createElement('div');
  document.body.appendChild(wrap);
  const img = document.createElement('img');
  img.id = id;
  img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  wrap.appendChild(img);
  return { wrap, img };
}

describe('imgtor constructor', () => {
  it('returns early without throwing when element is null', () => {
    expect(() => new imgtor(null)).not.toThrow();
    const dr = new imgtor(null);
    expect(dr.containerElement).toBeNull();
  });

  it('returns early without throwing when selector matches nothing', () => {
    expect(() => new imgtor('#__imgtor_init_missing__')).not.toThrow();
    const dr = new imgtor('#__imgtor_init_missing__');
    expect(dr.containerElement).toBeNull();
  });

  it('initializes from CSS selector: initialize callback, DOM, canvases, plugins', async () => {
    const { wrap, img } = mountImg('imgtor-init-sel');
    const initialize = vi.fn();

    const dr = new imgtor('#imgtor-init-sel', { initialize });

    await vi.waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
    expect(initialize).toHaveBeenCalledWith();

    expect(dr.containerElement).toBeTruthy();
    expect(dr.containerElement.className).toBe('imgtor-container');
    expect(dr.originalImageElement).toBe(img);
    expect(dr.canvas).toBeDefined();
    expect(dr.sourceCanvas).toBeDefined();
    expect(dr.canvas.getElement()).toBeInstanceOf(HTMLCanvasElement);
    expect(dr.plugins.noop).toBeInstanceOf(NoopPlugin);
    expect(dr.plugins.noop.imgtor).toBe(dr);

    wrap.remove();
  });

  it('initializes from img element reference the same way', async () => {
    const { wrap, img } = mountImg('imgtor-init-el');
    const initialize = vi.fn();

    const dr = new imgtor(img, { initialize });

    await vi.waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));

    expect(dr.containerElement).toBeTruthy();
    expect(dr.canvas).toBeDefined();
    expect(dr.sourceCanvas).toBeDefined();
    expect(dr.plugins.noop).toBeInstanceOf(NoopPlugin);

    wrap.remove();
  });
});
