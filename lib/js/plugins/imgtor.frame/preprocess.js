/**
 * Expand style to drawable defs in canvas pixel space (shortest edge = reference for %).
 * @param {import('./styles.js').defaultFrameStyles[string]} style
 * @param {number} cw
 * @param {number} ch
 */
export function expandFrame(style, cw, ch) {
  if (!style || !style.shape) return [];
  const s = style.shape;
  const ref = Math.min(cw, ch);
  const sw = s.strokeWidth * ref;
  const ins = s.inset * ref;
  const innerW = cw - ins * 2;
  const innerH = ch - ins * 2;
  const rx = s.round ? Math.min(16, innerW * 0.05) : 0;

  if (s.polaroid) {
    const bottom = ch * 0.12;
    return [
      { type: 'rect', x: 0, y: 0, w: cw, h: ch - bottom, strokeWidth: sw, strokeColor: s.strokeColor, fillColor: null, rx: 0 },
      { type: 'rect', x: 0, y: ch - bottom, w: cw, h: bottom, strokeWidth: 0, strokeColor: null, fillColor: 'rgba(240,240,240,0.9)', rx: 0 },
    ];
  }

  if (s.hook) {
    const L = ref * 0.08;
    return [
      { type: 'path', strokeWidth: sw, strokeColor: s.strokeColor, points: [ins, ins, ins + L, ins, ins, ins + L] },
      { type: 'path', strokeWidth: sw, strokeColor: s.strokeColor, points: [cw - ins, ins, cw - ins - L, ins, cw - ins, ins + L] },
      { type: 'path', strokeWidth: sw, strokeColor: s.strokeColor, points: [ins, ch - ins, ins + L, ch - ins, ins, ch - ins - L] },
      { type: 'path', strokeWidth: sw, strokeColor: s.strokeColor, points: [cw - ins, ch - ins,cw - ins - L, ch - ins, cw - ins, ch - ins - L] },
    ];
  }

  if (s.double) {
    return [
      { type: 'rect', x: ins, y: ins, w: innerW, h: innerH, strokeWidth: sw, strokeColor: s.strokeColor, fillColor: null, rx },
      { type: 'rect', x: ins + sw * 2, y: ins + sw * 2, w: innerW - sw * 4, h: innerH - sw * 4, strokeWidth: sw * 0.6, strokeColor: s.strokeColor, fillColor: null, rx: Math.max(0, rx - sw) },
    ];
  }

  return [
    { type: 'rect', x: ins, y: ins, w: innerW, h: innerH, strokeWidth: sw, strokeColor: s.strokeColor, fillColor: null, rx },
  ];
}
