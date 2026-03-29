/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

let Crop;

function fabricStub() {
  function Rect() {
    this.width = 0;
    this.height = 0;
    this.left = 0;
    this.top = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.flipX = false;
    this.flipY = false;
  }
  Rect.prototype.containsPoint = () => false;
  Rect.prototype.setWidth = function setWidth(w) {
    this.width = w;
  };
  Rect.prototype.setHeight = function setHeight(h) {
    this.height = h;
  };
  Rect.prototype.setScaleX = function setScaleX(s) {
    this.scaleX = s;
  };
  Rect.prototype.setScaleY = function setScaleY(s) {
    this.scaleY = s;
  };
  Rect.prototype.setLeft = function setLeft(v) {
    this.left = v;
  };
  Rect.prototype.setTop = function setTop(v) {
    this.top = v;
  };
  Rect.prototype.getWidth = function getWidth() {
    return this.width * this.scaleX;
  };
  Rect.prototype.getHeight = function getHeight() {
    return this.height * this.scaleY;
  };
  Rect.prototype.getLeft = function getLeft() {
    return this.left;
  };
  Rect.prototype.getTop = function getTop() {
    return this.top;
  };
  Rect.prototype.setCoords = vi.fn();
  Rect.prototype.remove = vi.fn();
  Rect.prototype.set = function set(keyOrProps, value) {
    if (typeof keyOrProps === 'string') this[keyOrProps] = value;
    else Object.assign(this, keyOrProps);
  };
  Rect.prototype.scaleToWidth = function scaleToWidth(w) {
    const ratio = w / this.getWidth();
    this.setScaleX(this.scaleX * ratio);
  };
  Rect.prototype.scaleToHeight = function scaleToHeight(h) {
    const ratio = h / this.getHeight();
    this.setScaleY(this.scaleY * ratio);
  };
  Rect.prototype.getScaleX = function getScaleX() {
    return this.scaleX;
  };
  Rect.prototype.getScaleY = function getScaleY() {
    return this.scaleY;
  };

  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }

  return {
    document,
    Point,
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
  globalThis.imgtor = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  const extendSpy = vi.spyOn(imgtor.Transformation, 'extend');
  await import('../../lib/js/plugins/imgtor.crop.js');
  Crop = extendSpy.mock.results[0].value;
  extendSpy.mockRestore();
});

describe('crop plugin', () => {
  it('registers on imgtor.plugins.crop', () => {
    expect(imgtor.plugins.crop).toBeDefined();
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

function createEditorForCrop() {
  const toolbarHost = document.createElement('div');
  const canvasHost = document.createElement('div');
  const handlers = new Map();
  const canvas = {
    getElement: () => canvasHost,
    handlers,
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(fn);
    },
    getPointer: vi.fn(() => ({ x: 50, y: 40 })),
    calcOffset: vi.fn(),
    discardActiveObject: vi.fn(),
    setActiveObject: vi.fn(),
    bringToFront: vi.fn(),
    add: vi.fn(),
    getActiveObject: vi.fn(() => null),
    getWidth: vi.fn(() => 800),
    getHeight: vi.fn(() => 600),
    defaultCursor: 'default',
  };
  return {
    toolbar: new imgtor.UI.Toolbar(toolbarHost),
    image: {
      getTop: vi.fn(() => 0),
      getLeft: vi.fn(() => 0),
      getWidth: vi.fn(() => 400),
      getHeight: vi.fn(() => 300),
    },
    canvas,
    applyTransformation: vi.fn(),
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('crop plugin interaction', () => {
  it('crop button toggles focus: require then release', () => {
    const editor = createEditorForCrop();
    const plugin = new imgtor.plugins.crop(editor, {});

    expect(plugin.hasFocus()).toBe(false);

    plugin.cropButton.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(plugin.hasFocus()).toBe(true);
    expect(editor.canvas.add).toHaveBeenCalled();
    expect(editor.canvas.defaultCursor).toBe('crosshair');

    plugin.cropButton.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(plugin.hasFocus()).toBe(false);
    expect(plugin.cropZone).toBeUndefined();
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('cropCurrentZone applies Crop transformation with normalized fractions', () => {
    const editor = createEditorForCrop();
    const plugin = new imgtor.plugins.crop(editor, {});
    plugin.cropZone = {
      width: 100,
      height: 50,
      getTop: () => 0,
      getLeft: () => 0,
      getWidth: () => 100,
      getHeight: () => 50,
    };

    plugin.cropCurrentZone();

    expect(editor.applyTransformation).toHaveBeenCalledOnce();
    const arg = editor.applyTransformation.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Crop);
    expect(arg.options).toMatchObject({
      top: 0,
      left: 0,
      width: 100 / 400,
      height: 50 / 300,
    });
  });

  it('cropCurrentZone is a no-op when zone is too small', () => {
    const editor = createEditorForCrop();
    const plugin = new imgtor.plugins.crop(editor, {});
    plugin.cropZone = {
      width: 0,
      height: 0,
      getTop: () => 0,
      getLeft: () => 0,
      getWidth: () => 0,
      getHeight: () => 0,
    };

    plugin.cropCurrentZone();

    expect(editor.applyTransformation).not.toHaveBeenCalled();
  });

  it('onObjectMoving clamps crop zone inside canvas', () => {
    const editor = createEditorForCrop();
    const plugin = new imgtor.plugins.crop(editor, {});
    plugin.requireFocus();
    const zone = plugin.cropZone;
    zone.set('left', -10);
    zone.set('top', 500);
    zone.set({ width: 100, height: 100 });
    vi.spyOn(zone, 'getWidth').mockReturnValue(100);
    vi.spyOn(zone, 'getHeight').mockReturnValue(100);

    plugin.onObjectMoving({ target: zone });

    expect(zone.left).toBe(0);
    expect(zone.top).toBe(500);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('onKeyDown with quickCropKey resets zone and sets key mode', () => {
    const editor = createEditorForCrop();
    const plugin = new imgtor.plugins.crop(editor, { quickCropKey: 71 });
    plugin.requireFocus();
    plugin.cropZone.set({ left: 40, top: 40, width: 20, height: 20 });

    plugin.onKeyDown({ keyCode: 71 });

    expect(plugin.isKeyCroping).toBe(true);
    expect(plugin.cropZone.width).toBe(0);
    expect(plugin.cropZone.height).toBe(0);
    expect(editor.canvas.discardActiveObject).toHaveBeenCalled();
  });
});
