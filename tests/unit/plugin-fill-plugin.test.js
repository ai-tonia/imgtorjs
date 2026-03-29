/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { installCanvas2dStub, removeCanvas2dStub } from '../helpers/mock-canvas-2d.js';

beforeAll(async () => {
  installCanvas2dStub();
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/imgtor.fill/index.js');
});

afterAll(() => {
  removeCanvas2dStub();
  vi.restoreAllMocks();
});

class SyncImage {
  onload = null;
  onerror = null;
  naturalWidth = 2;
  naturalHeight = 2;
  width = 2;
  height = 2;
  set src(_v) {
    queueMicrotask(() => this.onload && this.onload());
  }
}

class FailingImage {
  onload = null;
  onerror = null;
  set src(_v) {
    queueMicrotask(() => this.onerror && this.onerror());
  }
}

class ZeroNaturalImage {
  onload = null;
  naturalWidth = 0;
  naturalHeight = 0;
  width = 0;
  height = 0;
  set src(_v) {
    queueMicrotask(() => this.onload && this.onload());
  }
}

function makeEditor() {
  const toolbarEl = document.createElement('div');
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 2;
  canvasEl.height = 2;
  const canvas = imgtor.CanvasAdapterNative.createCanvas(canvasEl, { backgroundColor: '#000' });
  return {
    toolbar: new imgtor.UI.Toolbar(toolbarEl),
    canvas,
    applyTransformation: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('imgtor.fill plugin', () => {
  it('constructs swatches and bake button', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    expect(p._swatches.length).toBeGreaterThan(0);
    expect(p._bakeBtn).toBeDefined();
    expect(ed.addEventListener).toHaveBeenCalledWith('core:refreshed', expect.any(Function));
    expect(ed.addEventListener).toHaveBeenCalledWith('core:transformation', expect.any(Function));
    p.destroy();
  });

  it('swatch click updates preview via applyFillPreview', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    const origBg = ed.canvas._bg;
    p._swatches[1].el.click();
    expect(ed.canvas._bg).not.toBe(origBg);
    p.destroy();
  });

  it('_syncPreview applies current fill', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    ed.canvas._bg = '#000';
    p._currentFill = [1, 0, 0, 1];
    p._syncPreview();
    expect(ed.canvas._bg).toMatch(/rgba\(255,0,0/);
    p.destroy();
  });

  it('_bake applies FillTransformation with copied fill array', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    p._bake();
    expect(ed.applyTransformation).toHaveBeenCalledTimes(1);
    const T = ed.applyTransformation.mock.calls[0][0];
    expect(T.options.fill).toEqual(p._currentFill);
    expect(T.options.fill).not.toBe(p._currentFill);
    p.destroy();
  });

  it('FillTransformation composites fill and calls next with new image', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;

    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    p._bake();
    const T = ed.applyTransformation.mock.calls[0][0];

    const dataCanvas = document.createElement('canvas');
    dataCanvas.width = 2;
    dataCanvas.height = 2;
    const dctx = dataCanvas.getContext('2d');
    dctx.fillStyle = '#ffffff';
    dctx.fillRect(0, 0, 2, 2);

    const mockCanvas = {
      getElement: () => dataCanvas,
      createLockedImage: (el) => imgtor.CanvasAdapterNative.createLockedImage(el),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      add: vi.fn(),
    };
    const mockImage = { remove: vi.fn() };
    const next = vi.fn();

    T.applyTransformation(mockCanvas, mockImage, next);

    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    expect(mockImage.remove).toHaveBeenCalled();
    expect(mockCanvas.add).toHaveBeenCalled();

    globalThis.Image = Orig;
    p.destroy();
  });

  it('FillTransformation calls next when decoded image has no dimensions', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = ZeroNaturalImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    p._bake();
    const T = ed.applyTransformation.mock.calls[0][0];
    const dataCanvas = document.createElement('canvas');
    dataCanvas.width = 2;
    dataCanvas.height = 2;
    dataCanvas.getContext('2d').fillRect(0, 0, 2, 2);
    const next = vi.fn();
    T.applyTransformation({ getElement: () => dataCanvas }, { remove: vi.fn() }, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 500 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('FillTransformation calls next on image load error', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = FailingImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    p._bake();
    const T = ed.applyTransformation.mock.calls[0][0];
    const dataCanvas = document.createElement('canvas');
    dataCanvas.width = 2;
    dataCanvas.height = 2;
    const dctx = dataCanvas.getContext('2d');
    dctx.fillRect(0, 0, 2, 2);
    const next = vi.fn();
    T.applyTransformation(
      { getElement: () => dataCanvas },
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 500 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('FillTransformation calls next() when canvas dimensions invalid', () => {
    const c = document.createElement('canvas');
    c.width = 0;
    c.height = 0;
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    p._bake();
    const T = ed.applyTransformation.mock.calls[0][0];
    const next = vi.fn();
    T.applyTransformation({ getElement: () => c }, { remove: vi.fn() }, next);
    expect(next).toHaveBeenCalled();
    p.destroy();
  });

  it('destroy restores background, renderAll, and removes listeners', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.fill(ed, {});
    const renderSpy = vi.spyOn(ed.canvas, 'renderAll');
    p.destroy();
    expect(ed.removeEventListener).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
  });
});
