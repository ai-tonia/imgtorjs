/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
});

function baseInstance() {
  const viewportEl = document.createElement('canvas');
  const sourceEl = document.createElement('canvas');
  const d = Object.create(imgtor.prototype);
  d._canvasAdapter = imgtor.CanvasAdapterNative;
  d.options = imgtor.Utils.extend({}, imgtor.prototype.defaults);
  d.transformations = [];
  d.plugins = {};
  d.canvas = imgtor.CanvasAdapterNative.createCanvas(viewportEl, { backgroundColor: '#fff' });
  d.sourceCanvas = imgtor.CanvasAdapterNative.createCanvas(sourceEl, { backgroundColor: '#fff' });
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
    expect(el).toBeInstanceOf(HTMLCanvasElement);
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

  it('_destroyPlugins calls destroy on each plugin instance', () => {
    const d = baseInstance();
    const a = { destroy: vi.fn() };
    const b = { destroy: vi.fn() };
    d.plugins = { a, b };
    d._destroyPlugins();
    expect(a.destroy).toHaveBeenCalledOnce();
    expect(b.destroy).toHaveBeenCalledOnce();
  });

  it('_destroyPlugins skips plugins without destroy function', () => {
    const d = baseInstance();
    d.plugins = { plain: {} };
    expect(() => d._destroyPlugins()).not.toThrow();
  });

  it('_initializePlugins catches failing plugin and continues with the rest', () => {
    const d = baseInstance();
    d.options.plugins = { bad: {}, good: {} };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Bad = vi.fn(function Bad() {
      throw new Error('init fail');
    });
    const Good = vi.fn(function Good() {
      this.tag = 'ok';
    });

    d._initializePlugins({ bad: Bad, good: Good });

    expect(d.plugins.bad).toBeUndefined();
    expect(Good).toHaveBeenCalledTimes(1);
    expect(d.plugins.good).toBeInstanceOf(Good);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('_normalizePluginsOptions array is an ordered whitelist of plugin ids', () => {
    const d = baseInstance();
    d.options.plugins = ['save', 'crop'];
    d._normalizePluginsOptions();
    expect(d.options.plugins).toEqual({ save: {}, crop: {} });
    expect(d._pluginInitOrder).toEqual(['save', 'crop']);

    const Crop = vi.fn(function Crop() {});
    const Save = vi.fn(function Save() {});
    const Rotate = vi.fn(function Rotate() {});

    d._initializePlugins({ crop: Crop, save: Save, rotate: Rotate });

    expect(Save).toHaveBeenCalledBefore(Crop);
    expect(Crop).toHaveBeenCalledTimes(1);
    expect(Save).toHaveBeenCalledTimes(1);
    expect(Rotate).not.toHaveBeenCalled();
    expect(d.plugins.rotate).toBeUndefined();
  });

  it('_normalizePluginsOptions array entries can be { id, ...opts }', () => {
    const d = baseInstance();
    d.options.plugins = [{ id: 'crop', minWidth: 5, ratio: 2 }];
    d._normalizePluginsOptions();
    expect(d.options.plugins).toEqual({ crop: { minWidth: 5, ratio: 2 } });
    expect(d._pluginInitOrder).toEqual(['crop']);

    const Crop = vi.fn(function Crop() {});
    d._initializePlugins({ crop: Crop, save: vi.fn() });
    expect(Crop).toHaveBeenCalledWith(d, { minWidth: 5, ratio: 2 });
    expect(d.plugins.save).toBeUndefined();
  });

  it('_normalizePluginsOptions empty array enables no plugins', () => {
    const d = baseInstance();
    d.options.plugins = [];
    d._normalizePluginsOptions();
    expect(d.options.plugins).toEqual({});
    expect(d._pluginInitOrder).toEqual([]);

    const Any = vi.fn();
    d._initializePlugins({ crop: Any, save: Any });
    expect(Any).not.toHaveBeenCalled();
  });
});

describe('imgtor refresh, _replaceCurrentImage, reinitializeImage, _popTransformation (queue)', () => {
  const OriginalImage = globalThis.Image;

  function lockedImageFromNatural(w, h) {
    const el = document.createElement('img');
    Object.defineProperty(el, 'naturalWidth', { value: w, configurable: true });
    Object.defineProperty(el, 'naturalHeight', { value: h, configurable: true });
    return imgtor.CanvasAdapterNative.createLockedImage(el);
  }

  beforeAll(() => {
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
  });

  it('refresh decodes source data URL then wraps clone and invokes next', async () => {
    const d = baseInstance();
    d.sourceImage.toDataURL.mockReturnValue('data:image/png;base64,xx');
    const next = vi.fn();
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'createLockedImage');

    d.refresh(next);

    await vi.waitFor(() => expect(next).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledTimes(1);
    const clone = spy.mock.calls[0][0];
    expect(clone).toBeInstanceOf(globalThis.Image);
    expect(d.image.selectable).toBe(false);
    spy.mockRestore();
  });

  it('_replaceCurrentImage removes prior image, fits canvas, and centers new image', () => {
    const d = baseInstance();
    const oldImg = d.image;
    oldImg.remove = vi.fn();
    const el = document.createElement('img');
    Object.defineProperty(el, 'naturalWidth', { value: 100, configurable: true });
    Object.defineProperty(el, 'naturalHeight', { value: 80, configurable: true });
    const newImg = imgtor.CanvasAdapterNative.createLockedImage(el);
    newImg.remove = vi.fn();
    newImg.selectable = true;
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(oldImg.remove).toHaveBeenCalledTimes(1);
    expect(d.image).toBe(newImg);
    expect(newImg.selectable).toBe(false);
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls[0];
    expect(args[0]).toBe(d.canvas);
    expect(args[1]).toBe(newImg);
    spy.mockRestore();
  });

  it('_replaceCurrentImage applies maxWidth scaling to canvas dimensions', () => {
    const d = baseInstance();
    d.options.maxWidth = 50;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 80);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][2]).toBe(50);
    expect(spy.mock.calls[0][3]).toBe(40);
    spy.mockRestore();
  });

  it('_replaceCurrentImage applies maxHeight when maxWidth does not bind', () => {
    const d = baseInstance();
    d.options.maxHeight = 40;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 80);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][3]).toBe(40);
    expect(spy.mock.calls[0][2]).toBe(50);
    spy.mockRestore();
  });

  it('_replaceCurrentImage uses min of maxWidth and maxHeight when both bind', () => {
    const d = baseInstance();
    d.options.maxWidth = 50;
    d.options.maxHeight = 30;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 80);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][2]).toBe(37.5);
    expect(spy.mock.calls[0][3]).toBe(30);
    spy.mockRestore();
  });

  it('_replaceCurrentImage applies minWidth upscaling', () => {
    const d = baseInstance();
    d.options.minWidth = 200;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 80);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][2]).toBe(200);
    expect(spy.mock.calls[0][3]).toBe(160);
    spy.mockRestore();
  });

  it('_replaceCurrentImage applies minHeight upscaling when minWidth does not bind', () => {
    const d = baseInstance();
    d.options.minHeight = 160;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 80);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][3]).toBe(160);
    expect(spy.mock.calls[0][2]).toBe(200);
    spy.mockRestore();
  });

  it('_replaceCurrentImage uses max of minWidth and minHeight scales when both bind', () => {
    const d = baseInstance();
    d.options.minWidth = 150;
    d.options.minHeight = 200;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 80);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][3]).toBe(200);
    expect(spy.mock.calls[0][2]).toBe(250);
    spy.mockRestore();
  });

  it('_replaceCurrentImage widens canvas when ratio option makes height the driver', () => {
    const d = baseInstance();
    d.options.ratio = 2;
    d.image = null;
    const newImg = lockedImageFromNatural(100, 100);
    const spy = vi.spyOn(imgtor.CanvasAdapterNative, 'layoutViewportImage');

    d._replaceCurrentImage(newImg);

    expect(spy.mock.calls[0][2]).toBe(200);
    expect(spy.mock.calls[0][3]).toBe(100);
    spy.mockRestore();
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
