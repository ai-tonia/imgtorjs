/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.Darkroom = {};
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
});

describe('Darkroom.Plugin', () => {
  it('merge options with defaults on construct', () => {
    const init = vi.fn();
    const Child = Darkroom.Plugin.extend({
      defaults: { x: 1, y: 0 },
      initialize: init,
    });
    const dr = {};
    const instance = new Child(dr, { y: 2 });
    expect(instance.darkroom).toBe(dr);
    expect(instance.options).toEqual({ x: 1, y: 2 });
    expect(init).toHaveBeenCalledOnce();
  });

  it('extend preserves prototype chain and __super__', () => {
    const Child = Darkroom.Plugin.extend({ defaults: { n: 1 } });
    expect(Child.__super__).toBe(Darkroom.Plugin.prototype);
    expect(Object.getPrototypeOf(Child.prototype)).toBe(Darkroom.Plugin.prototype);
  });
});

describe('Darkroom.Transformation', () => {
  it('base applyTransformation is a no-op', () => {
    const t = new Darkroom.Transformation({});
    expect(() => t.applyTransformation({})).not.toThrow();
  });

  it('extend adds custom applyTransformation', () => {
    const Custom = Darkroom.Transformation.extend({
      applyTransformation(image) {
        image.touched = true;
      },
    });
    const img = {};
    new Custom({}).applyTransformation(img);
    expect(img.touched).toBe(true);
  });
});
