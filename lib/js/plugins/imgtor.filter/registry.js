function m(rows) {
  const a = new Float32Array(20);
  let i = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      a[i++] = rows[r][c];
    }
  }
  return a;
}

const I = m([
  [1, 0, 0, 0, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0],
]);

/** BT.601 luma replicated to RGB */
const GRAY = (lr, lg, lb) =>
  m([
    [lr, lg, lb, 0, 0],
    [lr, lg, lb, 0, 0],
    [lr, lg, lb, 0, 0],
    [0, 0, 0, 1, 0],
  ]);

const SEPIA_BASE = m([
  [0.393, 0.769, 0.189, 0, 0],
  [0.349, 0.686, 0.168, 0, 0],
  [0.272, 0.534, 0.131, 0, 0],
  [0, 0, 0, 1, 0],
]);

function blendMatrices(a, b, t) {
  const out = new Float32Array(20);
  for (let i = 0; i < 20; i++) {
    out[i] = a[i] * (1 - t) + b[i] * t;
  }
  return out;
}

/**
 * Built-in filter id → factory returning a fresh Float32Array(20).
 */
export const filterFunctions = {
  chrome: function chrome() {
    return m([
      [1.15, 0.05, 0, 0, -0.02],
      [0.05, 1.1, 0.05, 0, -0.02],
      [0, 0.05, 1.05, 0, -0.02],
      [0, 0, 0, 1, 0],
    ]);
  },
  fade: function fade() {
    return m([
      [0.85, 0, 0, 0, 0.08],
      [0, 0.85, 0, 0, 0.08],
      [0, 0, 0.85, 0, 0.08],
      [0, 0, 0, 1, 0],
    ]);
  },
  pastel: function pastel() {
    return m([
      [0.75, 0.1, 0.1, 0, 0.06],
      [0.1, 0.75, 0.1, 0, 0.06],
      [0.1, 0.1, 0.75, 0, 0.06],
      [0, 0, 0, 1, 0],
    ]);
  },
  warm: function warm() {
    return m([
      [1.12, 0.08, 0, 0, 0.02],
      [0.04, 1.02, 0, 0, 0],
      [0, 0, 0.92, 0, 0],
      [0, 0, 0, 1, 0],
    ]);
  },
  cold: function cold() {
    return m([
      [0.92, 0, 0.04, 0, 0],
      [0, 0.98, 0.06, 0, 0],
      [0.06, 0.08, 1.1, 0, 0.02],
      [0, 0, 0, 1, 0],
    ]);
  },
  monoDefault: function monoDefault() {
    return GRAY(0.299, 0.587, 0.114);
  },
  monoNoir: function monoNoir() {
    const f = 1.45;
    const o = ((1 - f) * 128) / 255;
    return m([
      [f * 0.299, f * 0.587, f * 0.114, 0, o],
      [f * 0.299, f * 0.587, f * 0.114, 0, o],
      [f * 0.299, f * 0.587, f * 0.114, 0, o],
      [0, 0, 0, 1, 0],
    ]);
  },
  monoWash: function monoWash() {
    return m([
      [0.22, 0.45, 0.09, 0, 0.12],
      [0.22, 0.45, 0.09, 0, 0.12],
      [0.22, 0.45, 0.09, 0, 0.12],
      [0, 0, 0, 1, 0],
    ]);
  },
  monoStark: function monoStark() {
    const f = 1.75;
    const o = ((1 - f) * 128) / 255;
    return m([
      [f * 0.2126, f * 0.7152, f * 0.0722, 0, o],
      [f * 0.2126, f * 0.7152, f * 0.0722, 0, o],
      [f * 0.2126, f * 0.7152, f * 0.0722, 0, o],
      [0, 0, 0, 1, 0],
    ]);
  },
  sepiaDefault: function sepiaDefault() {
    return new Float32Array(SEPIA_BASE);
  },
  sepiaRust: function sepiaRust() {
    return m([
      [0.45, 0.72, 0.12, 0, 0.02],
      [0.32, 0.62, 0.1, 0, 0],
      [0.22, 0.42, 0.1, 0, 0],
      [0, 0, 0, 1, 0],
    ]);
  },
  sepiaBlues: function sepiaBlues() {
    return m([
      [0.32, 0.58, 0.22, 0, 0],
      [0.28, 0.55, 0.25, 0, 0],
      [0.22, 0.48, 0.42, 0, 0.03],
      [0, 0, 0, 1, 0],
    ]);
  },
  sepiaColor: function sepiaColor() {
    return blendMatrices(SEPIA_BASE, I, 0.45);
  },
  invert: function invert() {
    return m([
      [-1, 0, 0, 0, 1],
      [0, -1, 0, 0, 1],
      [0, 0, -1, 0, 1],
      [0, 0, 0, 1, 0],
    ]);
  },
};
