/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
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
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

function newCropPlugin(editor, options = {}) {
  return new imgtor.plugins.crop(editor, options);
}

describe('crop plugin selectZone', () => {
  it('updates zone via _renderCropZone, canvas helpers, and dispatches crop:update', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();

    editor.dispatchEvent.mockClear();
    editor.canvas.bringToFront.mockClear();
    editor.canvas.setActiveObject.mockClear();
    editor.canvas.calcOffset.mockClear();
    const coordsSpy = vi.spyOn(plugin.cropZone, 'setCoords');

    plugin.selectZone(10, 20, 100, 80);

    expect(plugin.cropZone.left).toBe(10);
    expect(plugin.cropZone.top).toBe(20);
    expect(plugin.cropZone.width).toBe(100);
    expect(plugin.cropZone.height).toBe(80);
    expect(editor.canvas.bringToFront).toHaveBeenCalledWith(plugin.cropZone);
    expect(coordsSpy).toHaveBeenCalled();
    coordsSpy.mockRestore();
    expect(editor.canvas.setActiveObject).toHaveBeenCalledWith(plugin.cropZone);
    expect(editor.canvas.calcOffset).toHaveBeenCalled();
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });

  it('applies forceDimension path with direct set() before canvas updates', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();

    plugin.selectZone(33, 44, 120, 90, true);

    expect(plugin.cropZone.left).toBe(33);
    expect(plugin.cropZone.top).toBe(44);
    expect(plugin.cropZone.width).toBe(120);
    expect(plugin.cropZone.height).toBe(90);
    expect(editor.canvas.bringToFront).toHaveBeenCalledWith(plugin.cropZone);
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });
});

describe('crop plugin onKeyUp quick crop', () => {
  it('clears key mode and invokes onMouseUp finalization when quickCropKey matches', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, { quickCropKey: 71 });
    plugin.requireFocus();
    plugin.isKeyCroping = true;

    const onMouseUpSpy = vi.spyOn(plugin, 'onMouseUp');
    const coordsSpy = vi.spyOn(plugin.cropZone, 'setCoords');

    plugin.onKeyUp({ keyCode: 71 });

    expect(plugin.isKeyCroping).toBe(false);
    expect(plugin.startX).toBeNull();
    expect(plugin.startY).toBeNull();
    expect(onMouseUpSpy).toHaveBeenCalledOnce();
    expect(coordsSpy).toHaveBeenCalled();
    coordsSpy.mockRestore();
    expect(editor.canvas.setActiveObject).toHaveBeenCalledWith(plugin.cropZone);
    expect(editor.canvas.calcOffset).toHaveBeenCalled();
    onMouseUpSpy.mockRestore();
  });
});

describe('crop plugin cancel button', () => {
  it('releaseFocus via cancel click removes zone and dispatches crop:update', () => {
    const editor = createEditorForCrop();
    const plugin = newCropPlugin(editor, {});
    plugin.requireFocus();
    const zone = plugin.cropZone;
    const removeSpy = vi.spyOn(zone, 'remove');
    editor.dispatchEvent.mockClear();

    plugin.cancelButton.element.click();

    expect(removeSpy).toHaveBeenCalled();
    removeSpy.mockRestore();
    expect(plugin.cropZone).toBeUndefined();
    expect(editor.canvas.defaultCursor).toBe('default');
    expect(editor.dispatchEvent).toHaveBeenCalledWith('crop:update');
  });
});
