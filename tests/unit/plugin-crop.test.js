/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

let Crop;

function fabricStub() {
  function Rect() {}
  Rect.prototype = {};
  return {
    document,
    Image: vi.fn(function FabricImageMock(el, opts) {
      this.el = el;
      this.opts = opts;
    }),
    Rect,
    util: {
      createClass(parent, props) {
        function Klass() {
          if (parent) parent.apply(this, arguments);
        }
        Klass.prototype = Object.create(parent?.prototype ?? null);
        Object.assign(Klass.prototype, props);
        Klass.prototype.callSuper = function callSuper(name, ...args) {
          const sup = Object.getPrototypeOf(Object.getPrototypeOf(this));
          const fn = sup?.[name];
          if (typeof fn === 'function') return fn.apply(this, args);
        };
        return Klass;
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };
}

beforeAll(async () => {
  globalThis.fabric = fabricStub();
  globalThis.Darkroom = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  const extendSpy = vi.spyOn(Darkroom.Transformation, 'extend');
  await import('../../lib/js/plugins/darkroom.crop.js');
  Crop = extendSpy.mock.results[0].value;
  extendSpy.mockRestore();
});

describe('crop plugin', () => {
  it('registers on Darkroom.plugins.crop', () => {
    expect(Darkroom.plugins.crop).toBeDefined();
  });

  it('Crop.applyTransformation replaces image from canvas snapshot and calls next', async () => {
    class InstantImage {
      onload = null;
      width = 0;
      height = 0;
      set src(_v) {
        this.width = 24;
        this.height = 16;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', InstantImage);

    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const image = {
      getWidth: vi.fn(() => 100),
      getHeight: vi.fn(() => 80),
      getAngle: vi.fn(() => 0),
      remove: vi.fn(),
    };
    const canvas = {
      toDataURL: vi.fn(() => dataUrl),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      add: vi.fn(),
    };
    const next = vi.fn();

    const instance = new Crop({ left: 0, top: 0, width: 1, height: 1 });
    instance.applyTransformation(canvas, image, next);

    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());
    expect(canvas.toDataURL).toHaveBeenCalledWith({
      left: 0,
      top: 0,
      width: 100,
      height: 80,
    });
    expect(image.remove).toHaveBeenCalledOnce();
    expect(canvas.setWidth).toHaveBeenCalledWith(24);
    expect(canvas.setHeight).toHaveBeenCalledWith(16);
    expect(canvas.add).toHaveBeenCalledOnce();
    const added = canvas.add.mock.calls[0][0];
    expect(added).toBeInstanceOf(fabric.Image);
    vi.unstubAllGlobals();
  });

  it('Crop.applyTransformation does not call next when snapshot has zero size', async () => {
    class ZeroImage {
      onload = null;
      width = 0;
      height = 0;
      set src(_v) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', ZeroImage);

    const image = {
      getWidth: vi.fn(() => 50),
      getHeight: vi.fn(() => 50),
      getAngle: vi.fn(() => 0),
      remove: vi.fn(),
    };
    const canvas = {
      toDataURL: vi.fn(() => 'data:image/png;base64,'),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      add: vi.fn(),
    };
    const next = vi.fn();

    const instance = new Crop({ left: 0, top: 0, width: 0.5, height: 0.5 });
    instance.applyTransformation(canvas, image, next);

    await vi.waitFor(() => expect(image.remove).not.toHaveBeenCalled());
    expect(next).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
