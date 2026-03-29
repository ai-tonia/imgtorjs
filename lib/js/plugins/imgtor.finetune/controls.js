/**
 * Finetune control definitions: matrix-based (5×4 / 20 coeffs) vs per-pixel.
 */

function clamp255(x) {
  if (x < 0) return 0;
  if (x > 255) return 255;
  return x;
}

/** @returns {Float32Array} 20-element 5×4 color matrix (row-major, RGBA rows). */
function identityMatrix() {
  return new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
}

/**
 * @param {Float32Array} out
 * @param {Float32Array} a
 * @param {Float32Array} b
 * Apply b first, then a: v' = a * b * v (column vector [R,G,B,A,1]).
 */
function multiplyMatrix(out, a, b) {
  const a5 = [
    [a[0], a[1], a[2], a[3], a[4]],
    [a[5], a[6], a[7], a[8], a[9]],
    [a[10], a[11], a[12], a[13], a[14]],
    [a[15], a[16], a[17], a[18], a[19]],
    [0, 0, 0, 0, 1],
  ];
  const b5 = [
    [b[0], b[1], b[2], b[3], b[4]],
    [b[5], b[6], b[7], b[8], b[9]],
    [b[10], b[11], b[12], b[13], b[14]],
    [b[15], b[16], b[17], b[18], b[19]],
    [0, 0, 0, 0, 1],
  ];
  const c5 = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1],
  ];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      let s = 0;
      for (let k = 0; k < 5; k++) s += a5[i][k] * b5[k][j];
      c5[i][j] = s;
    }
  }
  let o = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      out[o++] = c5[i][j];
    }
  }
  return out;
}

/** @param {number} value UI range roughly -100..100 */
export const brightness = {
  computeMatrix(value) {
    const t = ((Number(value) || 0) / 100) * 80;
    return new Float32Array([1, 0, 0, 0, t, 0, 1, 0, 0, t, 0, 0, 1, 0, t, 0, 0, 0, 1, 0]);
  },
};

/** @param {number} value 0..200, 100 = neutral */
export const contrast = {
  computeMatrix(value) {
    const f = Math.max(0.01, (Number(value) || 100) / 100);
    const o = 127.5 * (1 - f);
    return new Float32Array([f, 0, 0, 0, o, 0, f, 0, 0, o, 0, 0, f, 0, o, 0, 0, 0, 1, 0]);
  },
};

const WR = 0.2126;
const WG = 0.7152;
const WB = 0.0722;

/** @param {number} value 0..200, 100 = neutral */
export const saturation = {
  computeMatrix(value) {
    const s = Math.max(0, (Number(value) || 100) / 100);
    const inv = 1 - s;
    const r0 = s + inv * WR;
    const r1 = inv * WG;
    const r2 = inv * WB;
    const g0 = inv * WR;
    const g1 = s + inv * WG;
    const g2 = inv * WB;
    const b0 = inv * WR;
    const b1 = inv * WG;
    const b2 = s + inv * WB;
    return new Float32Array([r0, r1, r2, 0, 0, g0, g1, g2, 0, 0, b0, b1, b2, 0, 0, 0, 0, 0, 1, 0]);
  },
};

/** @param {number} value -100..100 EV-style */
export const exposure = {
  computeMatrix(value) {
    const mult = Math.pow(2, ((Number(value) || 0) / 100) * 1.5);
    return new Float32Array([mult, 0, 0, 0, 0, 0, mult, 0, 0, 0, 0, 0, mult, 0, 0, 0, 0, 0, 1, 0]);
  },
};

/**
 * @param {ImageData} imageData
 * @param {number} value 20..300, 100 = gamma 1
 */
export const gamma = {
  applyPixels(imageData, value) {
    const g = Math.max(0.05, 100 / Math.max(20, Number(value) || 100));
    const d = imageData.data;
    const inv = 1 / 255;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp255(Math.pow(d[i] * inv, g) * 255);
      d[i + 1] = clamp255(Math.pow(d[i + 1] * inv, g) * 255);
      d[i + 2] = clamp255(Math.pow(d[i + 2] * inv, g) * 255);
    }
  },
};

/**
 * @param {ImageData} imageData
 * @param {number} value 0..100
 */
export const clarity = {
  applyPixels(imageData, value) {
    const amt = (Number(value) || 0) / 100;
    if (amt < 0.001) return;
    const w = imageData.width;
    const h = imageData.height;
    const src = new Uint8ClampedArray(imageData.data);
    const d = imageData.data;
    const strength = amt * 0.85;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            const j = (yy * w + xx) * 4;
            r += src[j];
            g += src[j + 1];
            b += src[j + 2];
            n++;
          }
        }
        if (n < 1) continue;
        r /= n;
        g /= n;
        b /= n;
        const sr = src[i];
        const sg = src[i + 1];
        const sb = src[i + 2];
        d[i] = clamp255(sr + strength * (sr - r));
        d[i + 1] = clamp255(sg + strength * (sg - g));
        d[i + 2] = clamp255(sb + strength * (sb - b));
      }
    }
  },
};

/**
 * @param {ImageData} imageData
 * @param {number} value 0..100
 */
export const vignette = {
  applyPixels(imageData, value) {
    const strength = Math.min(1, Math.max(0, (Number(value) || 0) / 100));
    if (strength < 0.001) return;
    const w = imageData.width;
    const h = imageData.height;
    const cx = (w - 1) / 2;
    const cy = (h - 1) / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) || 1;
    const d = imageData.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) / maxR;
        const dy = (y - cy) / maxR;
        const t = Math.min(1, Math.sqrt(dx * dx + dy * dy));
        const dim = 1 - strength * t * t;
        const i = (y * w + x) * 4;
        d[i] = clamp255(d[i] * dim);
        d[i + 1] = clamp255(d[i + 1] * dim);
        d[i + 2] = clamp255(d[i + 2] * dim);
      }
    }
  },
};

export { identityMatrix, multiplyMatrix };
