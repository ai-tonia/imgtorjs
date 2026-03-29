/**
 * Integration: full ESM entry (`lib/entry-imgtor.js`) with a minimal global
 * `fabric` stub so plugin modules evaluate under Vitest + happy-dom.
 *
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

/** Enough for `imgtor.crop.js` top-level `fabric.util.createClass(fabric.Rect, …)` and sibling plugins. */
function createMinimalFabricStub() {
  function Rect() {}
  Rect.prototype = {};

  return {
    document: typeof document !== 'undefined' ? document : {},
    Point: class Point {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    Image: function FabricImageStub() {},
    Canvas: function FabricCanvasStub() {},
    Rect,
    util: {
      createClass(parent, props) {
        function Klass() {
          if (typeof parent === 'function') parent.apply(this, arguments);
        }
        Klass.prototype = Object.create(parent?.prototype ?? Object.prototype);
        Object.assign(Klass.prototype, props);
        Klass.prototype.callSuper = function callSuper(name, ...args) {
          const sup = Object.getPrototypeOf(Object.getPrototypeOf(this));
          const fn = sup?.[name];
          if (typeof fn === 'function') return fn.apply(this, args);
        };
        return Klass;
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };
}

describe('lib/entry-imgtor.js (ESM)', () => {
  beforeAll(async () => {
    document.body.replaceChildren();
    globalThis.fabric = createMinimalFabricStub();
    delete globalThis.imgtor;
    delete globalThis.ImgTor;
    await import('../../lib/entry-imgtor.js');
  });

  it('exposes imgtor with core namespaces and default plugin constructors', () => {
    expect(typeof imgtor).toBe('function');
    expect(typeof globalThis.ImgTor).toBe('function');
    expect(globalThis.ImgTor).toBe(imgtor);
    expect(imgtor.Utils).toBeDefined();
    expect(imgtor.UI).toBeDefined();
    expect(imgtor.Transformation).toBeDefined();
    expect(typeof imgtor.Transformation.extend).toBe('function');
    expect(imgtor.Plugin).toBeDefined();
    expect(typeof imgtor.Plugin.extend).toBe('function');

    for (const name of ['history', 'rotate', 'crop', 'save']) {
      expect(imgtor.plugins).toHaveProperty(name);
      expect(typeof imgtor.plugins[name]).toBe('function');
    }
  });

  it('runs bootstrap from the entry chain (icon host)', () => {
    const icons = document.getElementById('imgtor-icons');
    expect(icons).toBeTruthy();
    expect(document.body.contains(icons)).toBe(true);
  });
});
