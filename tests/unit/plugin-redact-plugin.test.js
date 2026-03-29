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
  await import('../../lib/js/plugins/imgtor.redact/index.js');
});

afterAll(() => {
  removeCanvas2dStub();
  vi.restoreAllMocks();
});

class SyncImage {
  onload = null;
  onerror = null;
  naturalWidth = 4;
  naturalHeight = 4;
  width = 4;
  height = 4;
  set src(_v) {
    queueMicrotask(() => this.onload && this.onload());
  }
}

function makeEditor() {
  const toolbarEl = document.createElement('div');
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 8;
  canvasEl.height = 8;
  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#abcdef';
  ctx.fillRect(0, 0, 8, 8);
  const canvas = imgtor.CanvasAdapterNative.createCanvas(canvasEl, { backgroundColor: '#fff' });
  return {
    toolbar: new imgtor.UI.Toolbar(toolbarEl),
    canvas,
    applyTransformation: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('imgtor.redact plugin', () => {
  it('initialize wires buttons and canvas handlers', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, { method: 'pixelate' });
    expect(p._toggleBtn).toBeDefined();
    expect(p._applyBtn).toBeDefined();
    expect(p._clearBtn).toBeDefined();
    p.destroy();
  });

  it('_toggleDraw toggles mode and button active', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    expect(p._mode).toBe(false);
    p._toggleDraw();
    expect(p._mode).toBe(true);
    p._toggleDraw();
    expect(p._mode).toBe(false);
    p.destroy();
  });

  it('_mouseDown in mode starts live rect', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._mode = true;
    p._mouseDown({ e: { clientX: 10, clientY: 10 } });
    expect(p._drawing).toBe(true);
    expect(p._liveRect).toBeTruthy();
    p.destroy();
  });

  it('_mouseMove updates live rect dimensions', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._mode = true;
    ed.canvas.calcOffset();
    p._mouseDown({ e: { clientX: 0, clientY: 0 } });
    p._mouseMove({ e: { clientX: 20, clientY: 15 } });
    expect(p._liveRect.width).toBeGreaterThan(0);
    expect(p._liveRect.height).toBeGreaterThan(0);
    p.destroy();
  });

  it('_mouseUp records region and restores overlays', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._mode = true;
    ed.canvas.calcOffset();
    p._mouseDown({ e: { clientX: 1, clientY: 1 } });
    p._mouseMove({ e: { clientX: 6, clientY: 6 } });
    p._mouseUp();
    expect(p._regions.length).toBe(1);
    expect(p._overlays.length).toBe(1);
    p.destroy();
  });

  it('_mouseUp ignores tiny rect', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._mode = true;
    ed.canvas.calcOffset();
    p._mouseDown({ e: { clientX: 1, clientY: 1 } });
    p._mouseMove({ e: { clientX: 2, clientY: 2 } });
    p._mouseUp();
    expect(p._regions.length).toBe(0);
    p.destroy();
  });

  it('_apply runs transformation and clears regions', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, { method: 'blackout' });
    p._regions = [{ left: 0, top: 0, width: 0.5, height: 0.5 }];
    p._apply();
    expect(ed.applyTransformation).toHaveBeenCalledTimes(1);
    expect(p._regions.length).toBe(0);
    const T = ed.applyTransformation.mock.calls[0][0];
    const next = vi.fn();
    T.applyTransformation(
      {
        getElement: () => ed.canvas.getElement(),
        createLockedImage: (el) => imgtor.CanvasAdapterNative.createLockedImage(el),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        add: vi.fn(),
      },
      {
        getWidth: () => 8,
        getHeight: () => 8,
        remove: vi.fn(),
      },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('_apply does nothing when no regions', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._apply();
    expect(ed.applyTransformation).not.toHaveBeenCalled();
    p.destroy();
  });

  it('RedactTransformation calls next() when regions array is empty', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._regions = [{ left: 0, top: 0, width: 0.25, height: 0.25 }];
    p._apply();
    const T = ed.applyTransformation.mock.calls[0][0];
    const next = vi.fn();
    T.options = { regions: [], method: 'pixelate' };
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 4;
    T.applyTransformation(
      { getElement: () => c },
      { getWidth: () => 4, getHeight: () => 4, remove: vi.fn() },
      next,
    );
    expect(next).toHaveBeenCalled();
    p.destroy();
  });

  it('_clear removes regions and overlays', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._mode = true;
    ed.canvas.calcOffset();
    p._mouseDown({ e: { clientX: 1, clientY: 1 } });
    p._mouseMove({ e: { clientX: 6, clientY: 6 } });
    p._mouseUp();
    p._clear();
    expect(p._regions.length).toBe(0);
    expect(p._overlays.length).toBe(0);
    p.destroy();
  });

  it('destroy detaches listeners and clears', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    const offSpy = vi.spyOn(ed.canvas, 'off');
    p.destroy();
    expect(offSpy).toHaveBeenCalled();
  });

  it('_mouseDown removes previous live rect when drawing again', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.redact(ed, {});
    p._mode = true;
    ed.canvas.calcOffset();
    p._mouseDown({ e: { clientX: 1, clientY: 1 } });
    const first = p._liveRect;
    p._mouseDown({ e: { clientX: 2, clientY: 2 } });
    expect(p._liveRect).not.toBe(first);
    p.destroy();
  });
});

describe('imgtor.redact RedactTransformation edge cases', () => {
  function runWithImageMock(ImageImpl, fn) {
    const Orig = globalThis.Image;
    globalThis.Image = ImageImpl;
    try {
      return fn();
    } finally {
      globalThis.Image = Orig;
    }
  }

  it('calls next when base snapshot image errors', async () => {
    await runWithImageMock(
      vi.fn().mockImplementation(function ErrBase() {
        const self = this;
        self.onload = null;
        self.onerror = null;
        Object.defineProperty(self, 'src', {
          configurable: true,
          set() {
            queueMicrotask(() => self.onerror && self.onerror());
          },
        });
      }),
      async () => {
        const ed = makeEditor();
        const p = new imgtor.plugins.redact(ed, {});
        p._regions = [{ left: 0, top: 0, width: 0.5, height: 0.5 }];
        p._apply();
        const T = ed.applyTransformation.mock.calls[0][0];
        const next = vi.fn();
        T.applyTransformation(
          { getElement: () => ed.canvas.getElement() },
          { getWidth: () => 8, getHeight: () => 8, remove: vi.fn() },
          next,
        );
        await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 1000 });
        p.destroy();
      },
    );
  });

});
