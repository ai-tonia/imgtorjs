/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/imgtor.retouch/index.js');
});

function mock2d() {
  return {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
  };
}

describe('imgtor.retouch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers constructor', () => {
    expect(typeof imgtor.plugins.retouch).toBe('function');
  });

  it('invokes onSelectionComplete with data URL and region', () => {
    const ctx = mock2d();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,xx');

    const received = { url: null, region: null, placeResult: null };
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 40;
    canvasEl.height = 30;

    const ed = {
      toolbar: new imgtor.UI.Toolbar(document.createElement('div')),
      canvas: {
        on: vi.fn(),
        off: vi.fn(),
        getPointer: vi
          .fn()
          .mockReturnValueOnce({ x: 5, y: 5 })
          .mockReturnValueOnce({ x: 25, y: 20 }),
        getElement: () => canvasEl,
        getWidth: () => 40,
        getHeight: () => 30,
        renderAll: vi.fn(),
      },
    };

    const p = new imgtor.plugins.retouch(ed, {
      onSelectionComplete(url, region, placeResult) {
        received.url = url;
        received.region = region;
        received.placeResult = placeResult;
      },
    });
    p._selecting = true;
    p._down({ e: {} });
    p._up({ e: {} });

    expect(received.url).toMatch(/^data:image\//);
    expect(received.region.width).toBeGreaterThan(0.1);
    expect(typeof received.placeResult).toBe('function');
    expect(ctx.drawImage).toHaveBeenCalled();
    p.destroy();
  });
});
