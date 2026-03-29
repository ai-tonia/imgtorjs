/**
 * Integration-style import of `lib/entry-darkroom.js` (ESM) with a minimal
 * global `fabric` stub so plugin modules evaluate in Node/happy-dom.
 *
 * Placed under `tests/unit/` because `npm run test:unit` runs only
 * `vitest run tests/unit` (see package.json); `tests/integration/` is not
 * included in that script.
 *
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

/** Enough for `darkroom.crop.js` top-level `fabric.util.createClass(fabric.Rect, …)` and sibling plugins. */
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

describe('lib/entry-darkroom.js (ESM)', () => {
  beforeAll(async () => {
    document.body.replaceChildren();
    globalThis.fabric = createMinimalFabricStub();
    delete globalThis.Darkroom;
    await import('../../lib/entry-darkroom.js');
  });

  it('exposes Darkroom with core namespaces and default plugin constructors', () => {
    expect(typeof Darkroom).toBe('function');
    expect(Darkroom.Utils).toBeDefined();
    expect(Darkroom.UI).toBeDefined();
    expect(Darkroom.Transformation).toBeDefined();
    expect(typeof Darkroom.Transformation.extend).toBe('function');
    expect(Darkroom.Plugin).toBeDefined();
    expect(typeof Darkroom.Plugin.extend).toBe('function');

    for (const name of ['history', 'rotate', 'crop', 'save']) {
      expect(Darkroom.plugins).toHaveProperty(name);
      expect(typeof Darkroom.plugins[name]).toBe('function');
    }
  });

  it('runs bootstrap from the entry chain (icon host)', () => {
    const icons = document.getElementById('darkroom-icons');
    expect(icons).toBeTruthy();
    expect(document.body.contains(icons)).toBe(true);
  });
});
