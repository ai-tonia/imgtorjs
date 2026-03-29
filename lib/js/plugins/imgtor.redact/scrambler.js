/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {'pixelate'|'blur'|'blackout'} method
 */
export function scrambleRegion(ctx, x, y, w, h, method) {
  if (w < 1 || h < 1) return;
  const data = ctx.getImageData(x, y, w, h);
  const d = data.data;
  if (method === 'blackout') {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      d[i + 3] = 255;
    }
    ctx.putImageData(data, x, y);
    return;
  }
  if (method === 'pixelate') {
    const block = 12;
    for (let py = 0; py < h; py += block) {
      for (let px = 0; px < w; px += block) {
        let r = 0,
          g = 0,
          b = 0,
          n = 0;
        for (let dy = 0; dy < block && py + dy < h; dy++) {
          for (let dx = 0; dx < block && px + dx < w; dx++) {
            const i = ((py + dy) * w + (px + dx)) * 4;
            r += d[i];
            g += d[i + 1];
            b += d[i + 2];
            n++;
          }
        }
        r = (r / n) | 0;
        g = (g / n) | 0;
        b = (b / n) | 0;
        for (let dy = 0; dy < block && py + dy < h; dy++) {
          for (let dx = 0; dx < block && px + dx < w; dx++) {
            const i = ((py + dy) * w + (px + dx)) * 4;
            d[i] = r;
            d[i + 1] = g;
            d[i + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(data, x, y);
    return;
  }
  /* blur: simple box blur 3 passes */
  const copy = new Uint8ClampedArray(d);
  const passes = 3;
  const rad = 4;
  for (let p = 0; p < passes; p++) {
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        let r = 0,
          g = 0,
          b = 0,
          n = 0;
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const yy = row + dy;
            const xx = col + dx;
            if (yy >= 0 && yy < h && xx >= 0 && xx < w) {
              const i = (yy * w + xx) * 4;
              r += copy[i];
              g += copy[i + 1];
              b += copy[i + 2];
              n++;
            }
          }
        }
        const i = (row * w + col) * 4;
        d[i] = (r / n) | 0;
        d[i + 1] = (g / n) | 0;
        d[i + 2] = (b / n) | 0;
      }
    }
    copy.set(d);
  }
  ctx.putImageData(data, x, y);
}

export function applyRedactions(ctx, sourceWidth, sourceHeight, regions, method) {
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    const x = Math.floor(r.left * sourceWidth);
    const y = Math.floor(r.top * sourceHeight);
    const w = Math.floor(r.width * sourceWidth);
    const h = Math.floor(r.height * sourceHeight);
    scrambleRegion(ctx, x, y, w, h, method);
  }
}
