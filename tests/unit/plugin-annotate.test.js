/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/imgtor.annotate/index.js');
});

function mockEditor() {
  const handlers = new Map();
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 100;
  canvasEl.height = 80;
  return {
    toolbar: new imgtor.UI.Toolbar(document.createElement('div')),
    canvas: {
      on(n, fn) {
        if (!handlers.has(n)) handlers.set(n, []);
        handlers.get(n).push(fn);
      },
      off(n, fn) {
        const list = handlers.get(n);
        if (!list) return;
        const i = list.indexOf(fn);
        if (i !== -1) list.splice(i, 1);
      },
      getPointer: () => ({ x: 10, y: 10 }),
      getWidth: () => 100,
      getHeight: () => 80,
      add: vi.fn(),
      bringToFront: vi.fn(),
      renderAll: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    applyTransformation: vi.fn(),
  };
}

describe('imgtor.annotate', () => {
  it('registers constructor', () => {
    expect(typeof imgtor.plugins.annotate).toBe('function');
  });

  it('initializes and tool button has data-plugin', () => {
    const ed = mockEditor();
    const p = new imgtor.plugins.annotate(ed, {});
    expect(p._toolBtn.element.getAttribute('data-plugin')).toBe('annotate');
    p.destroy();
  });
});
