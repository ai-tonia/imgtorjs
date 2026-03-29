/**
 * Integration: full ESM entry (`lib/entry-imgtor.js`).
 *
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it } from 'vitest';

describe('lib/entry-imgtor.js (ESM)', () => {
  beforeAll(async () => {
    document.body.replaceChildren();
    delete globalThis.fabric;
    delete globalThis.imgtor;
    await import('../../lib/entry-imgtor.js');
  });

  it('exposes imgtor with core namespaces and default plugin constructors', () => {
    expect(typeof imgtor).toBe('function');
    expect(imgtor.Utils).toBeDefined();
    expect(imgtor.UI).toBeDefined();
    expect(imgtor.Transformation).toBeDefined();
    expect(typeof imgtor.Transformation.extend).toBe('function');
    expect(imgtor.Plugin).toBeDefined();
    expect(typeof imgtor.Plugin.extend).toBe('function');
    expect(imgtor.CanvasObject).toBeDefined();

    for (const name of ['history', 'rotate', 'crop', 'save']) {
      expect(imgtor.plugins).toHaveProperty(name);
      expect(typeof imgtor.plugins[name]).toBe('function');
    }
  });

  it('runs inject-icon-sprite from the entry chain (icon host)', () => {
    const icons = document.getElementById('imgtor-icons');
    expect(icons).toBeTruthy();
    expect(document.body.contains(icons)).toBe(true);
  });

  it('exposes CanvasAdapterNative (Canvas 2D implementation)', () => {
    expect(imgtor.CanvasAdapterNative).toBeDefined();
    const el = document.createElement('canvas');
    const c = imgtor.CanvasAdapterNative.createCanvas(el, {});
    expect(c.getElement()).toBe(el);
  });

  it('does not require a fabric global', () => {
    expect(globalThis.fabric).toBeUndefined();
  });

  it('Utils.computeCropRectFromDrag is available for crop parity', () => {
    expect(typeof imgtor.Utils.computeCropRectFromDrag).toBe('function');
    const r = imgtor.Utils.computeCropRectFromDrag({
      fromX: 0,
      fromY: 0,
      toX: 50,
      toY: 40,
      canvasWidth: 100,
      canvasHeight: 80,
      minWidth: 1,
      minHeight: 1,
      ratio: null,
      isKeyCroping: false,
      isKeyLeft: false,
      isKeyUp: false,
    });
    expect(r.width).toBe(50);
    expect(r.height).toBe(40);
  });
});
