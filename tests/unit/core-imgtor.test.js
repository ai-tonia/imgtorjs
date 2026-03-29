/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
});

function baseInstance() {
  const canvasEl = document.createElement('div');
  const d = Object.create(imgtor.prototype);
  d.options = imgtor.Utils.extend({}, imgtor.prototype.defaults);
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

describe('imgtor core (prototype methods)', () => {
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
      this.imgtor = dr;
      this.opts = opts;
    });

    d._initializePlugins({ a: vi.fn(), b: PluginB });

    expect(d.plugins.a).toBeUndefined();
    expect(PluginB).toHaveBeenCalledWith(d, {});
    expect(d.plugins.b).toBeInstanceOf(PluginB);
  });

  it('_initializePlugins skips inherited (non-own) keys on the plugins object', () => {
    const d = baseInstance();
    d.options.plugins = { own: {}, inherited: {} };
    const Own = vi.fn(function Own() {});
    const Inherited = vi.fn(function Inherited() {});
    const plugins = Object.create({ inherited: Inherited });
    plugins.own = Own;

    d._initializePlugins(plugins);

    expect(Inherited).not.toHaveBeenCalled();
    expect(Own).toHaveBeenCalledTimes(1);
    expect(d.plugins.inherited).toBeUndefined();
    expect(d.plugins.own).toBeInstanceOf(Own);
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

describe('imgtor refresh, _replaceCurrentImage, reinitializeImage, _popTransformation (queue)', () => {
  const OriginalImage = globalThis.Image;
  /** @type {typeof globalThis.fabric | undefined} */
  let originalFabric;

  beforeAll(() => {
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
      }),
      Canvas: vi.fn(function FabricCanvasMock() {
        this.add = vi.fn();
        this.setWidth = vi.fn();
        this.setHeight = vi.fn();
        this.centerObject = vi.fn();
        this.getElement = vi.fn(() => document.createElement('div'));
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
    globalThis.Image = OriginalImage;
    if (originalFabric === undefined) {
      delete globalThis.fabric;
    } else {
      globalThis.fabric = originalFabric;
    }
  });

  it('refresh decodes source data URL then replaces fabric image and invokes next', async () => {
    const d = baseInstance();
    d.sourceImage.toDataURL.mockReturnValue('data:image/png;base64,xx');
    const next = vi.fn();

    d.refresh(next);

    await vi.waitFor(() => expect(next).toHaveBeenCalledTimes(1));
    expect(globalThis.fabric.Image).toHaveBeenCalledTimes(1);
    const clone = globalThis.fabric.Image.mock.calls[0][0];
    expect(clone).toBeInstanceOf(globalThis.Image);
    expect(d.canvas.add).toHaveBeenCalledWith(d.image);
    expect(d.image.selectable).toBe(false);
  });

  it('_replaceCurrentImage removes prior image, fits canvas, and centers new image', () => {
    const d = baseInstance();
    const oldImg = d.image;
    oldImg.remove = vi.fn();
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
      remove: vi.fn(),
      selectable: true,
    };

    d._replaceCurrentImage(newImg);

    expect(oldImg.remove).toHaveBeenCalledTimes(1);
    expect(d.image).toBe(newImg);
    expect(newImg.selectable).toBe(false);
    expect(d.canvas.add).toHaveBeenCalledWith(newImg);
    expect(d.canvas.setWidth).toHaveBeenCalled();
    expect(d.canvas.setHeight).toHaveBeenCalled();
    expect(d.canvas.centerObject).toHaveBeenCalledWith(newImg);
    expect(newImg.setCoords).toHaveBeenCalledTimes(1);
  });

  it('_replaceCurrentImage applies maxWidth scaling to canvas dimensions', () => {
    const d = baseInstance();
    d.options.maxWidth = 50;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(50);
    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(40);
  });

  it('_replaceCurrentImage applies maxHeight when maxWidth does not bind', () => {
    const d = baseInstance();
    d.options.maxHeight = 40;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(40);
    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(50);
  });

  it('_replaceCurrentImage uses min of maxWidth and maxHeight when both bind', () => {
    const d = baseInstance();
    d.options.maxWidth = 50;
    d.options.maxHeight = 30;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(37.5);
    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(30);
  });

  it('_replaceCurrentImage applies minWidth upscaling', () => {
    const d = baseInstance();
    d.options.minWidth = 200;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(200);
    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(160);
  });

  it('_replaceCurrentImage applies minHeight upscaling when minWidth does not bind', () => {
    const d = baseInstance();
    d.options.minHeight = 160;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(160);
    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(200);
  });

  it('_replaceCurrentImage uses max of minWidth and minHeight scales when both bind', () => {
    const d = baseInstance();
    d.options.minWidth = 150;
    d.options.minHeight = 200;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 80,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(200);
    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(250);
  });

  it('_replaceCurrentImage widens canvas when ratio option makes height the driver', () => {
    const d = baseInstance();
    d.options.ratio = 2;
    d.image = null;
    const newImg = {
      getWidth: () => 100,
      getHeight: () => 100,
      getAngle: () => 0,
      setScaleX: vi.fn(),
      setScaleY: vi.fn(),
      setCoords: vi.fn(),
    };

    d._replaceCurrentImage(newImg);

    expect(d.canvas.setWidth.mock.calls[0][0]).toBe(200);
    expect(d.canvas.setHeight.mock.calls[0][0]).toBe(100);
  });

  it('reinitializeImage removes source, re-initializes, and passes a slice of transformations to _popTransformation', () => {
    const d = baseInstance();
    d.originalImageElement = document.createElement('img');
    const removeSpy = vi.fn();
    d.sourceImage = {
      ...d.sourceImage,
      remove: removeSpy,
    };
    const t = { applyTransformation: vi.fn() };
    d.transformations = [t];
    const initSpy = vi.spyOn(d, '_initializeImage').mockImplementation(() => {
      d.sourceImage = { tag: 'fresh' };
    });
    const popSpy = vi.spyOn(d, '_popTransformation').mockImplementation(() => {});

    d.reinitializeImage();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(popSpy).toHaveBeenCalledTimes(1);
    const popped = popSpy.mock.calls[0][0];
    expect(popped).toEqual([t]);
    expect(popped).not.toBe(d.transformations);

    initSpy.mockRestore();
    popSpy.mockRestore();
  });

  it('_popTransformation with a non-empty queue chains applyTransformation then reinitializes', () => {
    const d = baseInstance();
    d.dispatchEvent = vi.fn();
    d.refresh = vi.fn();
    const imgA = { tag: 'a' };
    const t1 = {
      applyTransformation: vi.fn((_sc, si, next) => {
        expect(si).toBe(d.sourceImage);
        next(imgA);
      }),
    };
    const t2 = {
      applyTransformation: vi.fn((_sc, si, next) => {
        expect(si).toBe(imgA);
        next();
      }),
    };
    const initialSource = { initial: true };
    d.sourceImage = initialSource;

    d._popTransformation([t1, t2]);

    expect(t1.applyTransformation).toHaveBeenCalledTimes(1);
    const t1Args = t1.applyTransformation.mock.calls[0];
    expect(t1Args[0]).toBe(d.sourceCanvas);
    expect(t1Args[1]).toBe(initialSource);
    expect(typeof t1Args[2]).toBe('function');

    expect(t2.applyTransformation).toHaveBeenCalledTimes(1);
    const t2Args = t2.applyTransformation.mock.calls[0];
    expect(t2Args[0]).toBe(d.sourceCanvas);
    expect(t2Args[1]).toBe(imgA);
    expect(typeof t2Args[2]).toBe('function');
    expect(d.sourceImage).toBe(imgA);
    expect(d.dispatchEvent).toHaveBeenCalledWith('core:reinitialized');
    expect(d.refresh).toHaveBeenCalledWith();
  });
});
