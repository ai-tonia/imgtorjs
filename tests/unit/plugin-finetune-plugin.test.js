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
  await import('../../lib/js/plugins/imgtor.finetune/index.js');
});

afterAll(() => {
  removeCanvas2dStub();
  vi.restoreAllMocks();
});

function makeEditor() {
  const toolbarEl = document.createElement('div');
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 4;
  canvasEl.height = 4;
  const sourceEl = document.createElement('canvas');
  sourceEl.width = 4;
  sourceEl.height = 4;

  const canvas = imgtor.CanvasAdapterNative.createCanvas(canvasEl, { backgroundColor: '#fff' });
  const sourceCanvas = imgtor.CanvasAdapterNative.createCanvas(sourceEl, { backgroundColor: '#fff' });

  return {
    toolbar: new imgtor.UI.Toolbar(toolbarEl),
    canvas,
    sourceCanvas,
    applyTransformation: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('imgtor.finetune plugin', () => {
  it('constructs with panel and range inputs', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {});
    expect(p._panel.classList.contains('imgtor-finetune-panel')).toBe(true);
    expect(Object.keys(p._inputs).length).toBeGreaterThan(0);
    p.destroy();
  });

  it('uses custom controls option for row list', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [
        ['brightness', 'B'],
        ['contrast', 'C'],
      ],
    });
    expect(p._inputs.brightness).toBeDefined();
    expect(p._inputs.contrast).toBeDefined();
    expect(p._inputs.saturation).toBeUndefined();
    p.destroy();
  });

  it('unknown control id falls back to default range', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['unknownSlider', 'X']],
    });
    expect(p._inputs.unknownSlider).toBeDefined();
    expect(p._inputs.unknownSlider.min).toBe('0');
    expect(p._inputs.unknownSlider.max).toBe('100');
    p.destroy();
  });

  it('_togglePanel shows and hides panel', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    expect(p._panel.style.display).toBe('none');
    p._togglePanel();
    expect(p._panel.style.display).toBe('flex');
    p._togglePanel();
    expect(p._panel.style.display).toBe('none');
    p.destroy();
  });

  it('_readValues returns numeric map from inputs', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    p._inputs.brightness.value = '40';
    const v = p._readValues();
    expect(v.brightness).toBe(40);
    p.destroy();
  });

  it('_scheduleApply coalesces with requestAnimationFrame', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    const spy = vi.spyOn(p, '_applyFinetune');
    let rafId = 0;
    const callbacks = [];
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      callbacks.push(cb);
      return ++rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', cancel);

    p._scheduleApply();
    p._scheduleApply();
    expect(cancel).toHaveBeenCalledWith(1);
    expect(callbacks.length).toBe(2);

    callbacks[1]();
    expect(spy).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
    p.destroy();
  });

  it('_applyFinetune calls applyTransformation', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    p._inputs.brightness.value = '10';
    p._applyFinetune();
    expect(ed.applyTransformation).toHaveBeenCalledTimes(1);
    const T = ed.applyTransformation.mock.calls[0][0];
    expect(T).toBeDefined();
    expect(T.options.values.brightness).toBe(10);
    p.destroy();
  });

  it('destroy removes listeners and cancels raf', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    p._applyRaf = 99;
    p.destroy();
    expect(cancel).toHaveBeenCalledWith(99);
    vi.unstubAllGlobals();
  });

  it('FinetuneTransformation processes pixels and calls next with locked image', async () => {
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
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;

    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    let T;
    ed.applyTransformation.mockImplementation((t) => {
      T = t;
    });
    p._inputs.brightness.value = '30';
    p._applyFinetune();

    const dataCanvas = document.createElement('canvas');
    dataCanvas.width = 2;
    dataCanvas.height = 2;
    const dctx = dataCanvas.getContext('2d');
    dctx.fillStyle = '#808080';
    dctx.fillRect(0, 0, 2, 2);

    const mockCanvas = {
      toDataURL: () => dataCanvas.toDataURL('image/png'),
      createLockedImage: (imgEl) => imgtor.CanvasAdapterNative.createLockedImage(imgEl),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      add: vi.fn(),
    };
    const mockImage = {
      getWidth: () => 2,
      getHeight: () => 2,
      getAngle: () => 0,
      remove: vi.fn(),
    };
    const next = vi.fn();

    T.applyTransformation(mockCanvas, mockImage, next);

    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 3000 });

    expect(mockImage.remove).toHaveBeenCalled();
    expect(mockCanvas.add).toHaveBeenCalled();

    globalThis.Image = Orig;
    p.destroy();
  });

  it('FinetuneTransformation returns early when viewport is empty', () => {
    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    let T;
    ed.applyTransformation.mockImplementation((t) => {
      T = t;
    });
    p._applyFinetune();

    const next = vi.fn();
    T.applyTransformation(
      { toDataURL: vi.fn() },
      { getWidth: () => 0, getHeight: () => 2, getAngle: () => 0, remove: vi.fn() },
      next,
    );
    expect(next).not.toHaveBeenCalled();

    p.destroy();
  });

  it('FinetuneTransformation skips pipeline when offscreen getContext is null', async () => {
    class SyncImage {
      onload = null;
      set src(_v) {
        queueMicrotask(() => this.onload && this.onload());
      }
    }
    const Orig = globalThis.Image;
    globalThis.Image = SyncImage;

    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    let T;
    ed.applyTransformation.mockImplementation((t) => {
      T = t;
    });
    p._applyFinetune();

    const origCreate = document.createElement.bind(document);
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'canvas') {
        el.getContext = () => null;
      }
      return el;
    });

    const next = vi.fn();
    T.applyTransformation(
      { toDataURL: () => 'data:image/png;base64,AAAA' },
      { getWidth: () => 2, getHeight: () => 2, getAngle: () => 0, remove: vi.fn() },
      next,
    );

    await vi.waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 500 });
    expect(next).not.toHaveBeenCalled();
    spy.mockRestore();
    globalThis.Image = Orig;
    p.destroy();
  });

  it('FinetuneTransformation calls next() when output image has zero dimensions', async () => {
    let created = 0;
    const Orig = globalThis.Image;
    globalThis.Image = vi.fn().mockImplementation(function FinetuneSeqImage() {
      const self = this;
      self.onload = null;
      self.onerror = null;
      self.naturalWidth = 2;
      self.naturalHeight = 2;
      self.width = 2;
      self.height = 2;
      const id = ++created;
      Object.defineProperty(self, 'src', {
        configurable: true,
        set() {
          queueMicrotask(() => {
            if (id === 1) {
              self.onload && self.onload();
            } else if (id === 2) {
              self.naturalWidth = 0;
              self.naturalHeight = 0;
              self.width = 0;
              self.height = 0;
              self.onload && self.onload();
            }
          });
        },
      });
    });

    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    let T;
    ed.applyTransformation.mockImplementation((t) => {
      T = t;
    });
    p._applyFinetune();

    const next = vi.fn();
    T.applyTransformation(
      {
        toDataURL: () => 'data:image/png;base64,AAAA',
        createLockedImage: (el) => imgtor.CanvasAdapterNative.createLockedImage(el),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        add: vi.fn(),
      },
      { getWidth: () => 2, getHeight: () => 2, getAngle: () => 0, remove: vi.fn() },
      next,
    );

    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 3000 });
    globalThis.Image = Orig;
    p.destroy();
  });

  it('FinetuneTransformation does not call next when output image fires onerror', async () => {
    let created = 0;
    const Orig = globalThis.Image;
    globalThis.Image = vi.fn().mockImplementation(function FinetuneErrImage() {
      const self = this;
      self.onload = null;
      self.onerror = null;
      self.naturalWidth = 2;
      self.naturalHeight = 2;
      self.width = 2;
      self.height = 2;
      const id = ++created;
      Object.defineProperty(self, 'src', {
        configurable: true,
        set() {
          queueMicrotask(() => {
            if (id === 1) self.onload && self.onload();
            else self.onerror && self.onerror();
          });
        },
      });
    });

    const ed = makeEditor();
    const p = new imgtor.plugins.finetune(ed, {
      controls: [['brightness', 'B']],
    });
    let T;
    ed.applyTransformation.mockImplementation((t) => {
      T = t;
    });
    p._applyFinetune();

    const next = vi.fn();
    T.applyTransformation(
      {
        toDataURL: () => 'data:image/png;base64,AAAA',
        createLockedImage: vi.fn(),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        add: vi.fn(),
      },
      { getWidth: () => 2, getHeight: () => 2, getAngle: () => 0, remove: vi.fn() },
      next,
    );

    await new Promise((r) => setTimeout(r, 80));
    expect(next).not.toHaveBeenCalled();
    globalThis.Image = Orig;
    p.destroy();
  });
});
