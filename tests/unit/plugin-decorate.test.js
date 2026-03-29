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
  await import('../../lib/js/plugins/imgtor.decorate/index.js');
});

function mockEditor() {
  return {
    toolbar: new imgtor.UI.Toolbar(document.createElement('div')),
    canvas: {
      on: vi.fn(),
      off: vi.fn(),
      getPointer: () => ({ x: 5, y: 5 }),
      getWidth: () => 50,
      getHeight: () => 50,
      getElement: () => {
        const c = document.createElement('canvas');
        c.width = 50;
        c.height = 50;
        return c;
      },
      add: vi.fn(),
      bringToFront: vi.fn(),
      renderAll: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    applyTransformation: vi.fn(),
  };
}

describe('imgtor.decorate', () => {
  it('registers constructor', () => {
    expect(typeof imgtor.plugins.decorate).toBe('function');
  });

  it('decorate toggle has data-plugin', () => {
    const ed = mockEditor();
    const p = new imgtor.plugins.decorate(ed, {});
    expect(p._btn.element.getAttribute('data-plugin')).toBe('decorate');
    p.destroy();
  });
});
