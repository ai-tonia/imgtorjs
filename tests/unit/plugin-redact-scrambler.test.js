import { describe, expect, it, vi } from 'vitest';
import { applyRedactions } from '../../lib/js/plugins/imgtor.redact/scrambler.js';

describe('imgtor.redact scrambler', () => {
  it('blackout zeros region pixels', () => {
    const data = new Uint8ClampedArray(4 * 5 * 5);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
    const imageData = { data, width: 5, height: 5 };
    const ctx = {
      getImageData: vi.fn(() => imageData),
      putImageData: vi.fn(),
    };
    applyRedactions(ctx, 5, 5, [{ left: 0, top: 0, width: 1, height: 1 }], 'blackout');
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(imageData.data[0]).toBe(0);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(0);
  });
});
