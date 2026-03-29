/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { clamp, clampDimensions, effectiveConstraints } from '../../lib/js/plugins/imgtor.resize/constraints.js';

(function () {
  'use strict';

  describe('imgtor.resize constraints (clamp)', () => {
    it('clamps to min and max', () => {
      expect(clamp(5, 1, 10)).toBe(5);
      expect(clamp(0, 1, 10)).toBe(1);
      expect(clamp(99, 1, 10)).toBe(10);
    });

    it('returns min when value is not finite', () => {
      expect(clamp(NaN, 3, 100)).toBe(3);
      expect(clamp(Number.POSITIVE_INFINITY, 1, 50)).toBe(50);
    });
  });

  describe('imgtor.resize constraints (dimensions)', () => {
    it('clampDimensions applies per-axis bounds', () => {
      const c = { minWidth: 10, maxWidth: 200, minHeight: 5, maxHeight: 150 };
      expect(clampDimensions(1, 400, c)).toEqual({ width: 10, height: 150 });
      expect(clampDimensions(100, 8, c)).toEqual({ width: 100, height: 8 });
    });

    it('effectiveConstraints merges editor and plugin options', () => {
      const editor = {
        options: { minWidth: 20, maxWidth: 800, minHeight: null, maxHeight: 600 },
      };
      const eff = effectiveConstraints(editor, { minWidth: 50 });
      expect(eff.minWidth).toBe(50);
      expect(eff.maxWidth).toBe(800);
      expect(eff.minHeight).toBe(null);
      expect(eff.maxHeight).toBe(600);
    });
  });
})();

let ResizeTransformation;

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  const extendSpy = vi.spyOn(imgtor.Transformation, 'extend');
  await import('../../lib/js/plugins/imgtor.resize/index.js');
  ResizeTransformation = extendSpy.mock.results[0].value;
  extendSpy.mockRestore();
});

describe('imgtor.resize plugin', () => {
  it('registers on imgtor.plugins.resize', () => {
    expect(imgtor.plugins.resize).toBeDefined();
  });

  it('ResizeTransformation uses offscreen drawImage and replaces source image', async () => {
    class InstantImage {
      onload = null;
      onerror = null;
      naturalWidth = 0;
      naturalHeight = 0;
      width = 0;
      height = 0;
      set src(_v) {
        this.naturalWidth = 64;
        this.naturalHeight = 32;
        this.width = 64;
        this.height = 32;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', InstantImage);

    const drawImage = vi.fn();
    const el = document.createElement('canvas');
    el.width = 100;
    el.height = 80;
    const image = {
      _el: el,
      getAngle: vi.fn(() => 0),
      remove: vi.fn(),
    };
    const newWrapper = {
      rotate: vi.fn(),
      getWidth: () => 50,
      getHeight: () => 25,
      getAngle: () => 0,
    };
    const canvas = {
      createLockedImage: vi.fn(() => newWrapper),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      add: vi.fn(),
    };

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (type, ...args) {
      if (type === '2d') return { drawImage };
      return originalGetContext.apply(this, [type, ...args]);
    });

    const next = vi.fn();
    try {
      const inst = new ResizeTransformation({ width: 50, height: 25 });
      inst.applyTransformation(canvas, image, next);

      await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());
      expect(drawImage).toHaveBeenCalledWith(el, 0, 0, 100, 80, 0, 0, 50, 25);
      expect(canvas.createLockedImage).toHaveBeenCalledOnce();
      expect(image.remove).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(newWrapper);
    } finally {
      ctxSpy.mockRestore();
    }
  });

  it('Apply uses clamped dimensions when applying transformation', () => {
    const applyTransformation = vi.fn();
    const toolbarEl = document.createElement('div');
    const editor = {
      options: { minWidth: null, maxWidth: 100, minHeight: null, maxHeight: null },
      sourceImage: {
        getWidth: () => 200,
        getHeight: () =>100,
        getAngle: () => 0,
      },
      toolbar: new imgtor.UI.Toolbar(toolbarEl),
      applyTransformation,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.spyOn(imgtor.Utils, 'computeImageViewPort').mockReturnValue({ width: 200, height: 100 });

    const plugin = new imgtor.plugins.resize(editor, {});
    plugin._dims.widthInput.value = '999';
    plugin._dims.heightInput.value = '40';
    plugin._onApply();

    expect(applyTransformation).toHaveBeenCalledOnce();
    const arg = applyTransformation.mock.calls[0][0];
    expect(arg.options.width).toBe(100);
    expect(arg.options.height).toBe(40);
  });
});
