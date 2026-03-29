/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete globalThis.imgtor;
  delete globalThis.fabric;
});

describe('imgtor.CanvasAdapterFabric', () => {
  it('createCanvas delegates to fabric.Canvas', async () => {
    globalThis.imgtor = {};
    const Canvas = vi.fn(function FabricCanvasMock(el, opts) {
      this.el = el;
      this.opts = opts;
    });
    globalThis.fabric = { Canvas };
    await import('../../lib/js/core/canvas-adapter-fabric.js');

    const el = document.createElement('canvas');
    const opts = { selection: false };
    const c = imgtor.CanvasAdapterFabric.createCanvas(el, opts);

    expect(Canvas).toHaveBeenCalledWith(el, opts);
    expect(c).toBeInstanceOf(Canvas);
  });

  it('createLockedImage delegates to fabric.Image with static options', async () => {
    globalThis.imgtor = {};
    const Image = vi.fn(function FabricImageMock(imgEl, opts) {
      this.imgEl = imgEl;
      this.opts = opts;
    });
    globalThis.fabric = { Canvas: vi.fn(), Image };
    await import('../../lib/js/core/canvas-adapter-fabric.js');

    const img = document.createElement('img');
    const o = imgtor.CanvasAdapterFabric.createLockedImage(img);

    expect(Image).toHaveBeenCalledWith(
      img,
      expect.objectContaining({
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      }),
    );
    expect(o).toBeInstanceOf(Image);
  });

  it('throws when fabric is missing', async () => {
    globalThis.imgtor = {};
    globalThis.fabric = undefined;
    await import('../../lib/js/core/canvas-adapter-fabric.js');

    expect(() =>
      imgtor.CanvasAdapterFabric.createCanvas(document.createElement('canvas'), {}),
    ).toThrow(/Fabric\.js must be loaded/);
  });
});
