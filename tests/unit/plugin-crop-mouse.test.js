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

describe('crop plugin mouse drag', () => {
  it('onMouseDown is a no-op without focus', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});

    plugin.onMouseDown({ e: {} });

    expect(editor.canvas.calcOffset).not.toHaveBeenCalled();
  });

  it('onMouseDown returns when pointer is inside existing crop zone', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    editor.canvas.getPointer.mockReturnValue({ x: 10, y: 10 });
    vi.spyOn(plugin.cropZone, 'containsPoint').mockReturnValue(true);
    plugin.cropZone.set({ left: 0, top: 0, width: 200, height: 200 });

    plugin.onMouseDown({ e: {} });

    expect(editor.canvas.discardActiveObject).not.toHaveBeenCalled();
    expect(plugin.startX).toBeNull();
    expect(plugin.startY).toBeNull();
  });

  it('onMouseDown returns when crop zone is the active object', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    editor.canvas.getActiveObject.mockReturnValue(plugin.cropZone);
    editor.canvas.getPointer.mockReturnValue({ x: 500, y: 500 });

    plugin.onMouseDown({ e: {} });

    expect(editor.canvas.discardActiveObject).not.toHaveBeenCalled();
    expect(plugin.startX).toBeNull();
  });

  it('onMouseDown outside zone resets dimensions and records drag origin', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    plugin.cropZone.set({ left: 20, top: 30, width: 100, height: 80 });
    plugin.cropZone.setScaleX(2);
    plugin.cropZone.setScaleY(1.5);
    editor.canvas.getPointer.mockReturnValue({ x: 5, y: 7 });

    plugin.onMouseDown({ e: {} });

    expect(editor.canvas.discardActiveObject).toHaveBeenCalledOnce();
    expect(plugin.cropZone.width).toBe(0);
    expect(plugin.cropZone.height).toBe(0);
    expect(plugin.cropZone.scaleX).toBe(1);
    expect(plugin.cropZone.scaleY).toBe(1);
    expect(plugin.startX).toBe(5);
    expect(plugin.startY).toBe(7);
    expect(editor.canvas.calcOffset).toHaveBeenCalled();
  });

  it('onMouseMove does nothing when drag was not started', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    const spy = vi.spyOn(plugin, '_renderCropZone');

    plugin.onMouseMove({ e: {} });

    expect(spy).not.toHaveBeenCalled();
  });

  it('onMouseMove updates zone via _renderCropZone while dragging', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    plugin.startX = 10;
    plugin.startY = 20;
    editor.canvas.getPointer.mockReturnValue({ x: 110, y: 90 });

    plugin.onMouseMove({ e: {} });

    expect(plugin.cropZone.left).toBe(10);
    expect(plugin.cropZone.top).toBe(20);
    expect(plugin.cropZone.width).toBe(100);
    expect(plugin.cropZone.height).toBe(70);
    expect(editor.canvas.bringToFront).toHaveBeenCalledWith(plugin.cropZone);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('onMouseMove delegates to key-crop handler when isKeyCroping', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { quickCropKey: 71 });
    plugin.requireFocus();
    plugin.isKeyCroping = true;
    const spy = vi.spyOn(plugin, 'onMouseMoveKeyCrop');

    plugin.onMouseMove({ e: { type: 'mousemove' } });

    expect(spy).toHaveBeenCalledOnce();
  });

  it('onMouseUp is a no-op when no drag is in progress', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();

    plugin.onMouseUp({});

    expect(plugin.cropZone.setCoords).not.toHaveBeenCalled();
    expect(editor.canvas.setActiveObject).not.toHaveBeenCalled();
  });

  it('onMouseUp finalizes drag: coords, active object, clears start', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    plugin.startX = 0;
    plugin.startY = 0;

    plugin.onMouseUp({});

    expect(plugin.cropZone.setCoords).toHaveBeenCalled();
    expect(editor.canvas.setActiveObject).toHaveBeenCalledWith(plugin.cropZone);
    expect(editor.canvas.calcOffset).toHaveBeenCalled();
    expect(plugin.startX).toBeNull();
    expect(plugin.startY).toBeNull();
  });
});

describe('crop plugin _renderCropZone', () => {
  it('clamps rectangle to canvas bounds', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();

    plugin._renderCropZone(-50, -30, 900, 700);

    expect(plugin.cropZone.left).toBe(0);
    expect(plugin.cropZone.top).toBe(0);
    expect(plugin.cropZone.width).toBe(800);
    expect(plugin.cropZone.height).toBe(600);
  });

  it('enforces minimum width and height on a zero-area drag', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { minWidth: 40, minHeight: 25 });
    plugin.requireFocus();

    plugin._renderCropZone(100, 100, 100, 100);

    expect(plugin.cropZone.width).toBe(40);
    expect(plugin.cropZone.height).toBe(25);
    expect(plugin.cropZone.left).toBe(60);
    expect(plugin.cropZone.top).toBe(75);
  });

  it('honors fixed aspect ratio when option is set', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { ratio: 2 });
    plugin.requireFocus();

    plugin._renderCropZone(0, 0, 100, 100);

    const w = plugin.cropZone.width;
    const h = plugin.cropZone.height;
    expect(w / h).toBeCloseTo(2, 5);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });

  it('ratio branch with isKeyCroping uses isKeyLeft / isKeyUp', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { ratio: 2 });
    plugin.requireFocus();
    plugin.isKeyCroping = true;
    plugin.isKeyLeft = true;
    plugin.isKeyUp = true;

    plugin._renderCropZone(200, 200, 400, 400);

    expect(plugin.cropZone.width).toBeGreaterThan(0);
    expect(plugin.cropZone.height).toBeGreaterThan(0);
    expect(plugin.cropZone.width / plugin.cropZone.height).toBeCloseTo(2, 5);
  });

  it('ratio branch clamps when zone exceeds canvas width (maxWidth path)', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { ratio: 1 });
    plugin.requireFocus();

    plugin._renderCropZone(0, 0, 900, 900);

    expect(plugin.cropZone.left).toBeGreaterThanOrEqual(0);
    expect(plugin.cropZone.top).toBeGreaterThanOrEqual(0);
    expect(plugin.cropZone.width).toBeLessThanOrEqual(800);
    expect(plugin.cropZone.height).toBeLessThanOrEqual(600);
    expect(plugin.cropZone.width).toBeCloseTo(plugin.cropZone.height, 5);
  });

  it('ratio branch clamps when zone exceeds canvas height (maxHeight path)', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { ratio: 1 });
    plugin.requireFocus();

    plugin._renderCropZone(0, 0, 700, 700);

    expect(plugin.cropZone.width).toBeLessThanOrEqual(800);
    expect(plugin.cropZone.height).toBeLessThanOrEqual(600);
    expect(plugin.cropZone.width).toBeCloseTo(plugin.cropZone.height, 5);
  });

  it('caps min dimensions by canvas size when options exceed canvas', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { minWidth: 2000, minHeight: 1500 });
    plugin.requireFocus();

    plugin._renderCropZone(400, 300, 400, 300);

    expect(plugin.cropZone.width).toBe(800);
    expect(plugin.cropZone.height).toBe(600);
  });
});

describe('crop plugin Crop (smoke)', () => {
  it('Crop transformation class is available from plugin module', () => {
    expect(Crop).toBeDefined();
    expect(typeof Crop).toBe('function');
  });
});
