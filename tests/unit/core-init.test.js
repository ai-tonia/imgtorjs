/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

class NoopPlugin {
  constructor(dr) {
    this.darkroom = dr;
  }
  initialize() {}
}

const OriginalImage = globalThis.Image;
/** @type {typeof globalThis.fabric | undefined} */
let originalFabric;
/** @type {unknown} */
let originalDarkroomPlugins;

beforeAll(async () => {
  globalThis.Darkroom = {};
  await import('../../lib/js/core/darkroom.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');

  originalDarkroomPlugins = Darkroom.plugins;
  Darkroom.plugins = {
    noop: NoopPlugin,
  };

  originalFabric = globalThis.fabric;
  globalThis.fabric = {
    Image: vi.fn(function FabricImageMock() {
      this.getWidth = vi.fn(() => 100);
      this.getHeight = vi.fn(() => 80);
      this.getAngle = vi.fn(() => 0);
      this.setScaleX = vi.fn();
      this.setScaleY = vi.fn();
      this.setCoords = vi.fn();
      this.remove = vi.fn();
      this.selectable = true;
      this.toDataURL = vi.fn(() => 'data:image/png;base64,AAAA');
    }),
    Canvas: vi.fn(function FabricCanvasMock(canvasElement) {
      this.add = vi.fn();
      this.setWidth = vi.fn();
      this.setHeight = vi.fn();
      this.centerObject = vi.fn();
      this.getElement = vi.fn(() => canvasElement);
    }),
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
  Darkroom.plugins = originalDarkroomPlugins;
  globalThis.Image = OriginalImage;
  if (originalFabric === undefined) {
    delete globalThis.fabric;
  } else {
    globalThis.fabric = originalFabric;
  }
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

describe('Darkroom constructor', () => {
  it('returns early without throwing when element is null', () => {
    expect(() => new Darkroom(null)).not.toThrow();
    const dr = new Darkroom(null);
    expect(dr.containerElement).toBeNull();
  });

  it('returns early without throwing when selector matches nothing', () => {
    expect(() => new Darkroom('#__darkroom_init_missing__')).not.toThrow();
    const dr = new Darkroom('#__darkroom_init_missing__');
    expect(dr.containerElement).toBeNull();
  });

  it('initializes from CSS selector: initialize callback, DOM, canvases, plugins', async () => {
    const { wrap, img } = mountImg('darkroom-init-sel');
    const initialize = vi.fn();

    const dr = new Darkroom('#darkroom-init-sel', { initialize });

    await vi.waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
    expect(initialize).toHaveBeenCalledWith();

    expect(dr.containerElement).toBeTruthy();
    expect(dr.containerElement.className).toBe('darkroom-container');
    expect(dr.originalImageElement).toBe(img);
    expect(dr.canvas).toBeDefined();
    expect(dr.sourceCanvas).toBeDefined();
    expect(globalThis.fabric.Canvas).toHaveBeenCalled();
    expect(dr.plugins.noop).toBeInstanceOf(NoopPlugin);
    expect(dr.plugins.noop.darkroom).toBe(dr);

    wrap.remove();
  });

  it('initializes from img element reference the same way', async () => {
    const { wrap, img } = mountImg('darkroom-init-el');
    const initialize = vi.fn();

    const dr = new Darkroom(img, { initialize });

    await vi.waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));

    expect(dr.containerElement).toBeTruthy();
    expect(dr.canvas).toBeDefined();
    expect(dr.sourceCanvas).toBeDefined();
    expect(dr.plugins.noop).toBeInstanceOf(NoopPlugin);

    wrap.remove();
  });
});
