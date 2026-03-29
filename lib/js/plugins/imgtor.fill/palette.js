/** @param {number[]|string} fill */
export function fillToCSS(fill) {
  if (typeof fill === 'string') return fill;
  if (!fill || fill.length < 4) return 'transparent';
  const r = Math.round(Math.min(1, Math.max(0, fill[0])) * 255);
  const g = Math.round(Math.min(1, Math.max(0, fill[1])) * 255);
  const b = Math.round(Math.min(1, Math.max(0, fill[2])) * 255);
  const a = Math.min(1, Math.max(0, fill[3]));
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export const defaultFillOptions = [
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 1],
  [0.8, 0.2, 0.2, 1],
  [0.2, 0.6, 0.9, 1],
  [0.2, 0.7, 0.3, 1],
  [1, 0.85, 0.2, 1],
  [0.5, 0.3, 0.7, 1],
  [0.9, 0.9, 0.9, 1],
];

export function applyFillPreview(canvas, fill) {
  canvas._bg = fillToCSS(fill);
  canvas.renderAll();
}
