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
  globalThis.imgtor = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  const extendSpy = vi.spyOn(imgtor.Transformation, 'extend');
  await import('../../lib/js/plugins/imgtor.crop.js');
  extendSpy.mockRestore();
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

function newCropPlugin(editor, options = {}) {
  return new imgtor.plugins.crop(editor, options);
}

describe('crop plugin onObjectScaling with fixed ratio', () => {
  it('reverts scale when ratio is set and scaled box exceeds canvas (preventScaling)', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { ratio: 16 / 9 });
    plugin.requireFocus();
    const zone = plugin.cropZone;
    zone.set({ left: 0, top: 0, width: 200, height: 100 });
    zone.setScaleX(1);
    zone.setScaleY(1);

    plugin.onObjectScaling({ target: zone });
    expect(zone.scaleX).toBe(1);
    expect(zone.scaleY).toBe(1);
    expect(plugin.lastScaleX).toBe(1);
    expect(plugin.lastScaleY).toBe(1);

    zone.setScaleX(5);
    zone.setScaleY(5);
    expect(zone.getWidth()).toBe(1000);
    expect(zone.getHeight()).toBe(500);

    plugin.onObjectScaling({ target: zone });

    expect(zone.scaleX).toBe(1);
    expect(zone.scaleY).toBe(1);
    expect(zone.getWidth()).toBe(200);
    expect(zone.getHeight()).toBe(100);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('reverts scale on vertical overflow when ratio is set', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { ratio: 1 });
    plugin.requireFocus();
    const zone = plugin.cropZone;
    zone.set({ left: 0, top: 0, width: 100, height: 400 });
    zone.setScaleX(1);
    zone.setScaleY(1);
    plugin.onObjectScaling({ target: zone });

    zone.setScaleY(2);
    expect(zone.getHeight()).toBe(800);
    expect(zone.getTop() + zone.getHeight()).toBe(800);

    zone.setScaleY(1.6);
    expect(zone.getHeight()).toBeGreaterThan(600);

    plugin.onObjectScaling({ target: zone });

    expect(zone.scaleY).toBe(1);
    expect(zone.getHeight()).toBe(400);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });
});

describe('crop plugin onMouseMoveKeyCrop (quick-crop drag)', () => {
  it('expands zone via _renderCropZone and notifies canvas listeners', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { quickCropKey: 71, ratio: 2 });
    plugin.requireFocus();
    plugin.isKeyCroping = true;

    plugin.cropZone.set({ left: 80, top: 60, width: 120, height: 60 });
    editor.canvas.getPointer.mockReturnValue({ x: 280, y: 200 });

    const renderSpy = vi.spyOn(plugin, '_renderCropZone');

    plugin.onMouseMoveKeyCrop({ e: { type: 'mousemove' } });

    expect(renderSpy).toHaveBeenCalledOnce();
    expect(renderSpy).toHaveBeenCalledWith(80, 60, 280, 200);
    expect(plugin.isKeyLeft).toBe(false);
    expect(plugin.isKeyUp).toBe(false);

    expect(plugin.cropZone.left).toBe(80);
    expect(plugin.cropZone.top).toBe(60);
    expect(plugin.cropZone.width).toBeGreaterThan(0);
    expect(plugin.cropZone.height).toBeGreaterThan(0);
    expect(plugin.cropZone.width / plugin.cropZone.height).toBeCloseTo(2, 5);

    expect(editor.canvas.bringToFront).toHaveBeenCalledWith(plugin.cropZone);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('sets anchor from pointer when zone origin is unset (0,0)', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    plugin.isKeyCroping = true;
    plugin.cropZone.set({ left: 0, top: 0, width: 0, height: 0 });
    editor.canvas.getPointer.mockReturnValue({ x: 42, y: 55 });

    plugin.onMouseMoveKeyCrop({ e: {} });

    // Pointer seeds left/top; _renderCropZone then applies default min 1×1 from that point.
    expect(plugin.cropZone.left).toBe(41);
    expect(plugin.cropZone.top).toBe(54);
    expect(plugin.cropZone.width).toBe(1);
    expect(plugin.cropZone.height).toBe(1);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });
});
