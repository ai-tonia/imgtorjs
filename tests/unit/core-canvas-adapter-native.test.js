/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

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

  it('getPointer uses calcOffset rect', () => {
    const el = document.createElement('canvas');
    el.getBoundingClientRect = vi.fn(() => ({
      left: 10,
      top: 20,
      width: 100,
      height: 80,
      right: 110,
      bottom: 100,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    }));
    const c = imgtor.CanvasAdapterNative.createCanvas(el, {});
    c.calcOffset();
    const p = c.getPointer({ clientX: 50, clientY: 70 });
    expect(p.x).toBe(40);
    expect(p.y).toBe(50);
  });

  it('toDataURL with region is callable (environment may stub canvas)', () => {
    const el = document.createElement('canvas');
    el.width = 20;
    el.height = 20;
    const c = imgtor.CanvasAdapterNative.createCanvas(el, {});
    expect(() => c.toDataURL({ left: 0, top: 0, width: 10, height: 10 })).not.toThrow();
    const url = c.toDataURL({ left: 0, top: 0, width: 10, height: 10 });
    expect(typeof url).toBe('string');
  });

  it('setActiveObject and bringToFront reorder objects', () => {
    const el = document.createElement('canvas');
    const c = imgtor.CanvasAdapterNative.createCanvas(el, {});
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 4, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 4, configurable: true });
    const image = imgtor.CanvasAdapterNative.createLockedImage(img);
    const Zone = imgtor.CanvasObject.extend({
      _render(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(-5, -5, 10, 10);
      },
    });
    const z = new Zone({ left: 0, top: 0, width: 10, height: 10 });
    c.add(image);
    c.add(z);
    c.setActiveObject(z);
    expect(c.getActiveObject()).toBe(z);
    c.bringToFront(image);
    expect(c.getActiveObject()).toBe(z);
  });

  it('emits object:moving when dragging active CanvasObject', () => {
    const el = document.createElement('canvas');
    el.width = 200;
    el.height = 200;
    el.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const c = imgtor.CanvasAdapterNative.createCanvas(el, {});
    const Zone = imgtor.CanvasObject.extend({});
    const z = new Zone({ left: 50, top: 50, width: 40, height: 40 });
    c.add(z);
    c.setActiveObject(z);
    c.calcOffset();
    const moving = vi.fn();
    c.on('object:moving', moving);
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 60, clientY: 60 }));
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 70, clientY: 65 }));
    expect(moving).toHaveBeenCalled();
    expect(z.left).toBe(60);
    expect(z.top).toBe(55);
  });
});
