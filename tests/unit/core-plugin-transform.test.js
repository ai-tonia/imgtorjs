/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
});

describe('imgtor.Plugin', () => {
  it('merge options with defaults on construct', () => {
    const init = vi.fn();
    const Child = imgtor.Plugin.extend({
      defaults: { x: 1, y: 0 },
      initialize: init,
    });
    const dr = {};
    const instance = new Child(dr, { y: 2 });
    expect(instance.imgtor).toBe(dr);
    expect(instance.options).toEqual({ x: 1, y: 2 });
    expect(init).toHaveBeenCalledOnce();
  });

  it('extend preserves prototype chain and __super__', () => {
    const Child = imgtor.Plugin.extend({ defaults: { n: 1 } });
    expect(Child.__super__).toBe(imgtor.Plugin.prototype);
    expect(Object.getPrototypeOf(Child.prototype)).toBe(imgtor.Plugin.prototype);
  });
});

describe('imgtor.Transformation', () => {
  it('base applyTransformation is a no-op', () => {
    const t = new imgtor.Transformation({});
    expect(() => t.applyTransformation({})).not.toThrow();
  });

  it('extend adds custom applyTransformation', () => {
    const Custom = imgtor.Transformation.extend({
      applyTransformation(image) {
        image.touched = true;
      },
    });
    const img = {};
    new Custom({}).applyTransformation(img);
    expect(img.touched).toBe(true);
  });
});
