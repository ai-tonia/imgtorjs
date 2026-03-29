import { describe, expect, it, vi } from 'vitest';
import { applyRedactions, scrambleRegion } from '../../lib/js/plugins/imgtor.redact/scrambler.js';

function makeCtx(w, h, fill = 128) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill;
    data[i + 1] = fill - 20;
    data[i + 2] = fill + 20;
    data[i + 3] = 255;
  }
  const imageData = { data, width: w, height: h };
  return {
    getImageData: vi.fn(() => imageData),
    putImageData: vi.fn(),
    _imageData: imageData,
  };
}

describe('imgtor.redact scrambler', () => {
  it('blackout zeros region pixels', () => {
    const ctx = makeCtx(5, 5, 255);
    applyRedactions(ctx, 5, 5, [{ left: 0, top: 0, width: 1, height: 1 }], 'blackout');
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx._imageData.data[0]).toBe(0);
    expect(ctx._imageData.data[1]).toBe(0);
    expect(ctx._imageData.data[2]).toBe(0);
  });

  it('scrambleRegion is no-op when w or h < 1', () => {
    const ctx = makeCtx(2, 2);
    scrambleRegion(ctx, 0, 0, 0, 2, 'blackout');
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it('pixelate averages blocks', () => {
    const ctx = makeCtx(24, 24, 100);
    scrambleRegion(ctx, 0, 0, 24, 24, 'pixelate');
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it('blur runs multi-pass box blur', () => {
    const ctx = makeCtx(12, 12, 80);
    scrambleRegion(ctx, 0, 0, 12, 12, 'blur');
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it('applyRedactions iterates multiple regions', () => {
    const ctx = makeCtx(10, 10, 200);
    applyRedactions(
      ctx,
      10,
      10,
      [
        { left: 0, top: 0, width: 0.2, height: 0.2 },
        { left: 0.5, top: 0.5, width: 0.3, height: 0.3 },
      ],
      'blackout',
    );
    expect(ctx.putImageData.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
