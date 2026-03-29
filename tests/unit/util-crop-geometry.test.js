import { describe, expect, it } from 'vitest';
import { computeCropRectFromDrag } from '../../lib/js/crop-geometry.js';

describe('computeCropRectFromDrag', () => {
  it('returns clamped rectangle without ratio', () => {
    const r = computeCropRectFromDrag({
      fromX: 10,
      fromY: 20,
      toX: 100,
      toY: 80,
      canvasWidth: 200,
      canvasHeight: 150,
      minWidth: 1,
      minHeight: 1,
      ratio: null,
      isKeyCroping: false,
      isKeyLeft: false,
      isKeyUp: false,
    });
    expect(r.left).toBe(10);
    expect(r.top).toBe(20);
    expect(r.width).toBe(90);
    expect(r.height).toBe(60);
  });

  it('enforces min width inside canvas', () => {
    const r = computeCropRectFromDrag({
      fromX: 50,
      fromY: 50,
      toX: 52,
      toY: 100,
      canvasWidth: 200,
      canvasHeight: 150,
      minWidth: 40,
      minHeight: 1,
      ratio: null,
      isKeyCroping: false,
      isKeyLeft: false,
      isKeyUp: false,
    });
    expect(r.width).toBeGreaterThanOrEqual(40);
  });
});
