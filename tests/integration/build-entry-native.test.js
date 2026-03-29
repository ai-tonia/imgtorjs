/**
 * Native subset entry — no Fabric global.
 *
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it } from 'vitest';

describe('lib/entry-imgtor-native.js (ESM)', () => {
  beforeAll(async () => {
    document.body.replaceChildren();
    delete globalThis.fabric;
    delete globalThis.imgtor;
    await import('../../lib/entry-imgtor-native.js');
  });

  it('exposes imgtor without fabric and without crop plugin', () => {
    expect(typeof imgtor).toBe('function');
    expect(globalThis.fabric).toBeUndefined();
    expect(imgtor.plugins).toHaveProperty('rotate');
    expect(imgtor.plugins).toHaveProperty('history');
    expect(imgtor.plugins).toHaveProperty('save');
    expect(imgtor.plugins.crop).toBeUndefined();
  });

  it('exposes working CanvasAdapterNative', () => {
    expect(imgtor.CanvasAdapterNative).toBeDefined();
    const el = document.createElement('canvas');
    const c = imgtor.CanvasAdapterNative.createCanvas(el, {});
    expect(c.getElement()).toBe(el);
  });
});
