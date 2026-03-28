/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.Darkroom = {};
  await import('../../lib/js/core/darkroom.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
});

function baseInstance() {
  const canvasEl = document.createElement('div');
  const d = Object.create(Darkroom.prototype);
  d.options = Darkroom.Utils.extend({}, Darkroom.prototype.defaults);
  d.transformations = [];
  d.plugins = {};
  d.canvas = {
    getElement: () => canvasEl,
    add: vi.fn(),
    setWidth: vi.fn(),
    setHeight: vi.fn(),
    centerObject: vi.fn(),
  };
  d.sourceCanvas = {};
  d.sourceImage = {
    toDataURL: vi.fn(() => 'data:image/png;base64,AAAA'),
    remove: vi.fn(),
    getWidth: vi.fn(() => 100),
    getHeight: vi.fn(() => 80),
    getAngle: vi.fn(() => 0),
    setScaleX: vi.fn(),
    setScaleY: vi.fn(),
    setCoords: vi.fn(),
    selectable: false,
  };
  d.image = d.sourceImage;
  return d;
}

describe('Darkroom core (prototype methods)', () => {
  it('applyTransformation pushes and invokes transformation with canvases and callback', () => {
    const d = baseInstance();
    const transform = {
      applyTransformation: vi.fn((_sc, _si, next) => next()),
    };

    d.applyTransformation(transform);

    expect(d.transformations).toEqual([transform]);
    expect(transform.applyTransformation).toHaveBeenCalledTimes(1);
    expect(transform.applyTransformation).toHaveBeenCalledWith(
      d.sourceCanvas,
      d.sourceImage,
      expect.any(Function),
    );
  });

  it('addEventListener and dispatchEvent use canvas DOM element', () => {
    const d = baseInstance();
    const el = d.canvas.getElement();
    const handler = vi.fn();
    d.addEventListener('core:transformation', handler);
    d.dispatchEvent('core:transformation');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(el).toBeInstanceOf(HTMLDivElement);
  });

  it('_popTransformation with empty list dispatches reinitialized and refreshes', () => {
    const d = baseInstance();
    d.dispatchEvent = vi.fn();
    d.refresh = vi.fn();

    d._popTransformation([]);

    expect(d.dispatchEvent).toHaveBeenCalledWith('core:reinitialized');
    expect(d.refresh).toHaveBeenCalledWith();
  });

  it('_initializePlugins skips disabled plugins and instantiates the rest', () => {
    const d = baseInstance();
    d.options.plugins = { a: false, b: {} };
    const PluginB = vi.fn(function PluginB(dr, opts) {
      this.darkroom = dr;
      this.opts = opts;
    });

    d._initializePlugins({ a: vi.fn(), b: PluginB });

    expect(d.plugins.a).toBeUndefined();
    expect(PluginB).toHaveBeenCalledWith(d, {});
    expect(d.plugins.b).toBeInstanceOf(PluginB);
  });

  it('_postTransformation updates source image when provided and calls refresh', () => {
    const d = baseInstance();
    const newImg = { tag: 'new' };
    d.refresh = vi.fn((cb) => cb());
    d.dispatchEvent = vi.fn();

    d._postTransformation(newImg);

    expect(d.sourceImage).toBe(newImg);
    expect(d.refresh).toHaveBeenCalledOnce();
    expect(d.dispatchEvent).toHaveBeenCalledWith('core:transformation');
  });
});
