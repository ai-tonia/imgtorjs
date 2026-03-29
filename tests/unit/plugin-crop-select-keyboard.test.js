/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

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
  globalThis.Darkroom = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  const extendSpy = vi.spyOn(Darkroom.Transformation, 'extend');
  await import('../../lib/js/plugins/darkroom.crop.js');
  extendSpy.mockRestore();
});

function createDarkroomForCrop() {
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
    toolbar: new Darkroom.UI.Toolbar(toolbarHost),
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

function newCropPlugin(darkroom, options = {}) {
  return new Darkroom.plugins.crop(darkroom, options);
}

describe('crop plugin selectZone', () => {
  it('updates zone via _renderCropZone, canvas helpers, and dispatches crop:update', () => {
    const darkroom = createDarkroomForCrop();
    const plugin = newCropPlugin(darkroom, {});
    plugin.requireFocus();

    darkroom.dispatchEvent.mockClear();
    darkroom.canvas.bringToFront.mockClear();
    darkroom.canvas.setActiveObject.mockClear();
    darkroom.canvas.calcOffset.mockClear();
    plugin.cropZone.setCoords.mockClear();

    plugin.selectZone(10, 20, 100, 80);

    expect(plugin.cropZone.left).toBe(10);
    expect(plugin.cropZone.top).toBe(20);
    expect(plugin.cropZone.width).toBe(100);
    expect(plugin.cropZone.height).toBe(80);
    expect(darkroom.canvas.bringToFront).toHaveBeenCalledWith(plugin.cropZone);
    expect(plugin.cropZone.setCoords).toHaveBeenCalled();
    expect(darkroom.canvas.setActiveObject).toHaveBeenCalledWith(plugin.cropZone);
    expect(darkroom.canvas.calcOffset).toHaveBeenCalled();
    expect(darkroom.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('applies forceDimension path with direct set() before canvas updates', () => {
    const darkroom = createDarkroomForCrop();
    const plugin = newCropPlugin(darkroom, {});
    plugin.requireFocus();

    plugin.selectZone(33, 44, 120, 90, true);

    expect(plugin.cropZone.left).toBe(33);
    expect(plugin.cropZone.top).toBe(44);
    expect(plugin.cropZone.width).toBe(120);
    expect(plugin.cropZone.height).toBe(90);
    expect(darkroom.canvas.bringToFront).toHaveBeenCalledWith(plugin.cropZone);
    expect(darkroom.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });
});

describe('crop plugin onKeyUp quick crop', () => {
  it('clears key mode and invokes onMouseUp finalization when quickCropKey matches', () => {
    const darkroom = createDarkroomForCrop();
    const plugin = newCropPlugin(darkroom, { quickCropKey: 71 });
    plugin.requireFocus();
    plugin.isKeyCroping = true;

    const onMouseUpSpy = vi.spyOn(plugin, 'onMouseUp');

    plugin.onKeyUp({ keyCode: 71 });

    expect(plugin.isKeyCroping).toBe(false);
    expect(plugin.startX).toBeNull();
    expect(plugin.startY).toBeNull();
    expect(onMouseUpSpy).toHaveBeenCalledOnce();
    expect(plugin.cropZone.setCoords).toHaveBeenCalled();
    expect(darkroom.canvas.setActiveObject).toHaveBeenCalledWith(plugin.cropZone);
    expect(darkroom.canvas.calcOffset).toHaveBeenCalled();
    onMouseUpSpy.mockRestore();
  });
});

describe('crop plugin cancel button', () => {
  it('releaseFocus via cancel click removes zone and dispatches crop:update', () => {
    const darkroom = createDarkroomForCrop();
    const plugin = newCropPlugin(darkroom, {});
    plugin.requireFocus();
    const zone = plugin.cropZone;
    darkroom.dispatchEvent.mockClear();

    plugin.cancelButton.element.click();

    expect(zone.remove).toHaveBeenCalled();
    expect(plugin.cropZone).toBeUndefined();
    expect(darkroom.canvas.defaultCursor).toBe('default');
    expect(darkroom.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });
});
