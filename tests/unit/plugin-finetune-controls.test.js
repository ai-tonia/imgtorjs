/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';
import {
  brightness,
  clarity,
  contrast,
  exposure,
  gamma,
  identityMatrix,
  multiplyMatrix,
  saturation,
  vignette,
} from '../../lib/js/plugins/imgtor.finetune/controls.js';

describe('imgtor.finetune controls', () => {
  it('identityMatrix and multiplyMatrix compose to valid 20-length matrix', () => {
    const id = identityMatrix();
    const out = new Float32Array(20);
    multiplyMatrix(out, id, id);
    expect(out[0]).toBe(1);
    expect(out[6]).toBe(1);
    expect(out[12]).toBe(1);
    expect(out[18]).toBe(1);
  });

  it('brightness.computeMatrix handles non-number input', () => {
    const m = brightness.computeMatrix(NaN);
    expect(m.length).toBe(20);
    expect(m[4]).toBe(0);
  });

  it('contrast.computeMatrix clamps factor and offsets', () => {
    const m = contrast.computeMatrix(0);
    expect(m[0]).toBeGreaterThan(0);
    const m2 = contrast.computeMatrix(200);
    expect(m2[0]).toBe(2);
  });

  it('saturation.computeMatrix at 0 is luminance mix', () => {
    const m = saturation.computeMatrix(0);
    expect(m[0]).toBeGreaterThan(0);
    expect(m[0] + m[1] + m[2]).toBeCloseTo(1, 5);
  });

  it('exposure.computeMatrix scales RGB', () => {
    const m = exposure.computeMatrix(100);
    expect(m[0]).toBeGreaterThan(1);
  });

  it('gamma.applyPixels is no-op edge gamma', () => {
    const d = new Uint8ClampedArray([128, 128, 128, 255]);
    const imageData = { data: d, width: 1, height: 1 };
    gamma.applyPixels(imageData, 20);
    expect(d[0]).toBeGreaterThan(0);
  });

  it('gamma.applyPixels adjusts RGB away from linear', () => {
    const d = new Uint8ClampedArray([200, 100, 50, 255]);
    const imageData = { data: d, width: 1, height: 1 };
    gamma.applyPixels(imageData, 50);
    expect(d[0]).not.toBe(200);
  });

  it('clarity.applyPixels skips when amount near zero', () => {
    const d = new Uint8ClampedArray([10, 20, 30, 255]);
    const copy = new Uint8ClampedArray(d);
    const imageData = { data: d, width: 1, height: 1 };
    clarity.applyPixels(imageData, 0);
    expect(d[0]).toBe(copy[0]);
  });

  it('clarity.applyPixels sharpens 3x3 neighborhood', () => {
    const w = 3;
    const h = 3;
    const d = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 100;
      d[i + 1] = 100;
      d[i + 2] = 100;
      d[i + 3] = 255;
    }
    d[4 * 4 + 0] = 255;
    const imageData = { data: d, width: w, height: h };
    clarity.applyPixels(imageData, 50);
    expect(d[16]).not.toBe(100);
  });

  it('vignette.applyPixels skips when strength near zero', () => {
    const d = new Uint8ClampedArray([200, 200, 200, 255]);
    const copy = new Uint8ClampedArray(d);
    const imageData = { data: d, width: 2, height: 2 };
    vignette.applyPixels(imageData, 0);
    expect(d[0]).toBe(copy[0]);
  });

  it('vignette.applyPixels darkens edges', () => {
    const w = 5;
    const h = 5;
    const d = new Uint8ClampedArray(w * h * 4).fill(200);
    for (let i = 3; i < d.length; i += 4) d[i] = 255;
    const imageData = { data: d, width: w, height: h };
    const before = d[0];
    vignette.applyPixels(imageData, 100);
    expect(d[0]).toBeLessThan(before);
  });
});
