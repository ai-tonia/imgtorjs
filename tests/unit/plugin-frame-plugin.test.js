/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { defaultFrameStyles } from '../../lib/js/plugins/imgtor.frame/styles.js';
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
  await import('../../lib/js/plugins/imgtor.frame/index.js');
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
  canvasEl.width = 4;
  canvasEl.height = 4;
  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, 4, 4);
  const canvas = imgtor.CanvasAdapterNative.createCanvas(canvasEl, { backgroundColor: '#fff' });
  return {
    toolbar: new imgtor.UI.Toolbar(toolbarEl),
    canvas,
    applyTransformation: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('imgtor.frame plugin', () => {
  it('initialize creates style buttons and bake', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    expect(p._buttons.length).toBeGreaterThan(3);
    expect(p._applyBtn).toBeDefined();
    p.destroy();
  });

  it('clicking solidSharp sets active and builds overlay', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    const sharpBtn = p._buttons.find((b) => b.btn.element.dataset.feature === 'solidSharp');
    expect(sharpBtn).toBeDefined();
    sharpBtn.btn.element.dispatchEvent(new Event('click'));
    expect(p._activeId).toBe('solidSharp');
    expect(p._frameOverlay).toBeTruthy();
    p.destroy();
  });

  it('_rebuildFrame with no selection clears overlay', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    expect(p._frameOverlay).toBeTruthy();
    p._buttons[0].btn.element.dispatchEvent(new Event('click'));
    expect(p._activeId).toBe(null);
    expect(p._frameOverlay).toBe(null);
    p.destroy();
  });

  it('_applyFrame applies transformation and clears state', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;

    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();

    expect(ed.applyTransformation).toHaveBeenCalledTimes(1);
    const T = ed.applyTransformation.mock.calls[0][0];
    expect(T.options.style).toEqual(defaultFrameStyles.solidSharp);
    expect(p._activeId).toBe(null);
    expect(p._frameOverlay).toBe(null);

    const mockCanvas = {
      getElement: () => ed.canvas.getElement(),
      createLockedImage: (el) => imgtor.CanvasAdapterNative.createLockedImage(el),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      add: vi.fn(),
    };
    const mockImage = { remove: vi.fn() };
    const next = vi.fn();
    T.applyTransformation(mockCanvas, mockImage, next);

    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });

    globalThis.Image = Orig;
    p.destroy();
  });

  it('FrameTransformation early exits without style', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
    const T = ed.applyTransformation.mock.calls[0][0];
    const next = vi.fn();
    T.options.style = null;
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 4;
    T.applyTransformation({ getElement: () => c }, { remove: vi.fn() }, next);
    expect(next).toHaveBeenCalled();
    p.destroy();
  });

  it('FrameTransformation early exit on tiny canvas', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
    const T = ed.applyTransformation.mock.calls[0][0];
    const c = document.createElement('canvas');
    c.width = 0;
    c.height = 0;
    const next = vi.fn();
    T.applyTransformation({ getElement: () => c }, { remove: vi.fn() }, next);
    expect(next).toHaveBeenCalled();
    p.destroy();
  });

  it('hook style exercises path drawing in transformation', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    const hookBtn = p._buttons.find((b) => b.btn.element.dataset.feature === 'hook');
    hookBtn.btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
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
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('solidRound style uses rounded rect branch in drawFrameDefs', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    const roundBtn = p._buttons.find((b) => b.btn.element.dataset.feature === 'solidRound');
    roundBtn.btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
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
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('polaroid style expands and draws', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    const btn = p._buttons.find((b) => b.btn.element.dataset.feature === 'polaroid');
    btn.btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
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
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('_applyFrame no-op without active style', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._applyFrame();
    expect(ed.applyTransformation).not.toHaveBeenCalled();
    p.destroy();
  });

  it('destroy removes listeners and clears overlay from canvas', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    expect(p._frameOverlay).toBeTruthy();
    p.destroy();
    expect(ed.removeEventListener).toHaveBeenCalled();
  });

  it('_rebuildFrame with unknown active id only renderAlls', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._activeId = 'notARealFrameStyle';
    const spy = vi.spyOn(ed.canvas, 'renderAll');
    p._rebuildFrame();
    expect(p._frameOverlay).toBe(null);
    expect(spy).toHaveBeenCalled();
    p.destroy();
  });

  it('FrameTransformation calls next on zero-size decoded image', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = vi.fn().mockImplementation(function FrameZeroImage() {
      const self = this;
      self.onload = null;
      self.onerror = null;
      self.naturalWidth = 0;
      self.naturalHeight = 0;
      self.width = 0;
      self.height = 0;
      Object.defineProperty(self, 'src', {
        configurable: true,
        set() {
          queueMicrotask(() => self.onload && self.onload());
        },
      });
    });

    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
    const T = ed.applyTransformation.mock.calls[0][0];
    const next = vi.fn();
    T.applyTransformation(
      {
        getElement: () => ed.canvas.getElement(),
        createLockedImage: vi.fn(),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        add: vi.fn(),
      },
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('FrameTransformation calls next on image onerror', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = vi.fn().mockImplementation(function FrameErrImage() {
      const self = this;
      self.onload = null;
      self.onerror = null;
      Object.defineProperty(self, 'src', {
        configurable: true,
        set() {
          queueMicrotask(() => self.onerror && self.onerror());
        },
      });
    });

    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    p._buttons[1].btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
    const T = ed.applyTransformation.mock.calls[0][0];
    const next = vi.fn();
    T.applyTransformation(
      {
        getElement: () => ed.canvas.getElement(),
        createLockedImage: vi.fn(),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        add: vi.fn(),
      },
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('lineSingle style uses stroke-only rect branch', async () => {
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;
    const ed = makeEditor();
    const p = new imgtor.plugins.frame(ed, {});
    const btn = p._buttons.find((b) => b.btn.element.dataset.feature === 'lineSingle');
    btn.btn.element.dispatchEvent(new Event('click'));
    p._applyFrame();
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
      { remove: vi.fn() },
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    globalThis.Image = Orig;
    p.destroy();
  });
});
