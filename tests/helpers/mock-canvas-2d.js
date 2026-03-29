import { vi } from 'vitest';

/** 1×1 PNG data URL (valid for Image.onload in tests). */
export const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let getContextSpy;
let toDataURLSpy;

/**
 * Install stubs so `canvas.getContext('2d')` is never null (happy-dom returns null).
 * Stubs `HTMLCanvasElement.prototype.toDataURL` to a tiny PNG for async Image loads.
 */
export function installCanvas2dStub() {
  getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (type) {
    if (type !== '2d') return null;
    const el = this;
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    const imageData = {
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    };
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 128;
      imageData.data[i + 3] = 255;
    }
    return {
      canvas: el,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn((_sx, _sy, gw, gh) => ({
        data: new Uint8ClampedArray(Math.max(1, gw) * Math.max(1, gh) * 4).fill(128),
        width: Math.max(1, gw),
        height: Math.max(1, gh),
      })),
      putImageData: vi.fn((id) => {
        if (id && id.data) {
          for (let i = 0; i < imageData.data.length && i < id.data.length; i++) {
            imageData.data[i] = id.data[i];
          }
        }
      }),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      rect: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      quadraticCurveTo: vi.fn(),
      setLineDash: vi.fn(),
      lineDashOffset: 0,
    };
  });

  toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => TINY_PNG_DATA_URL);
}

export function removeCanvas2dStub() {
  getContextSpy?.mockRestore();
  toDataURLSpy?.mockRestore();
  getContextSpy = undefined;
  toDataURLSpy = undefined;
}
