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
});

describe('core:refreshed', () => {
  it('fires after _replaceCurrentImage completes layout', () => {
    const d = Object.create(imgtor.prototype);
    d._canvasAdapter = imgtor.CanvasAdapterNative;
    d.options = imgtor.Utils.extend({}, imgtor.prototype.defaults);
    d.canvas = imgtor.CanvasAdapterNative.createCanvas(document.createElement('canvas'), {});
    d.dispatchEvent = vi.fn();

    const el = document.createElement('img');
    Object.defineProperty(el, 'naturalWidth', { value: 20, configurable: true });
    Object.defineProperty(el, 'naturalHeight', { value: 10, configurable: true });
    const img = imgtor.CanvasAdapterNative.createLockedImage(el);

    d._replaceCurrentImage(img);

    expect(d.dispatchEvent).toHaveBeenCalledWith('core:refreshed');
  });
});
