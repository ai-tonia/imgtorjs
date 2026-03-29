/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
});

describe('imgtor.CanvasAdapterNative', () => {
  it('createCanvas returns wrapper with getElement and dimensions', () => {
    const el = document.createElement('canvas');
    const c = imgtor.CanvasAdapterNative.createCanvas(el, { backgroundColor: '#000' });
    expect(c.getElement()).toBe(el);
    c.setWidth(40);
    c.setHeight(30);
    expect(el.width).toBe(40);
    expect(el.height).toBe(30);
  });

  it('createLockedImage tracks angle and dimensions from natural size', () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 100, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 80, configurable: true });
    const w = imgtor.CanvasAdapterNative.createLockedImage(img);
    expect(w.getAngle()).toBe(0);
    expect(w.getWidth()).toBe(100);
    expect(w.getHeight()).toBe(80);
    w.rotate(90);
    expect(w.getAngle()).toBe(90);
  });

  it('layoutViewportImage draws scaled rotated image', () => {
    const el = document.createElement('canvas');
    const canvas = imgtor.CanvasAdapterNative.createCanvas(el, { backgroundColor: '#fff' });
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 10, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 10, configurable: true });
    const image = imgtor.CanvasAdapterNative.createLockedImage(img);
    imgtor.CanvasAdapterNative.layoutViewportImage(canvas, image, 50, 50, 2);
    expect(el.width).toBe(50);
    expect(el.height).toBe(50);
  });
});
