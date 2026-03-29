/**
 * Apply a 4×5 color matrix to RGBA ImageData (row-major: R', G', B', A' rows).
 * Each output channel: m0*R + m1*G + m2*B + m3*A + m4*255 with inputs 0–255.
 *
 * @param {ImageData} imageData
 * @param {Float32Array} matrix20 length 20
 */
export function applyColorMatrix(imageData, matrix20) {
  const d = imageData.data;
  const m = matrix20;
  for (let i = 0; i < d.length; i += 4) {
    const R = d[i];
    const G = d[i + 1];
    const B = d[i + 2];
    const A = d[i + 3];
    const r = m[0] * R + m[1] * G + m[2] * B + m[3] * A + m[4] * 255;
    const g = m[5] * R + m[6] * G + m[7] * B + m[8] * A + m[9] * 255;
    const b = m[10] * R + m[11] * G + m[12] * B + m[13] * A + m[14] * 255;
    const a = m[15] * R + m[16] * G + m[17] * B + m[18] * A + m[19] * 255;
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    d[i + 3] = a < 0 ? 0 : a > 255 ? 255 : a;
  }
}
