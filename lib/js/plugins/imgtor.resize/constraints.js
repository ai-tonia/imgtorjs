/**
 * Resize bounds: numeric clamp and dimension pairs for the resize plugin.
 */

export function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  if (n === Number.POSITIVE_INFINITY) return max;
  if (n === Number.NEGATIVE_INFINITY) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function effectiveConstraints(editor, pluginOptions) {
  const o = editor && editor.options ? editor.options : {};
  const p = pluginOptions || {};
  return {
    minWidth: firstDefined(p.minWidth, o.minWidth),
    maxWidth: firstDefined(p.maxWidth, o.maxWidth),
    minHeight: firstDefined(p.minHeight, o.minHeight),
    maxHeight: firstDefined(p.maxHeight, o.maxHeight),
  };
}

export function clampDimensions(width, height, constraints) {
  const minW = Math.max(1, constraints.minWidth != null ? constraints.minWidth : 1);
  const minH = Math.max(1, constraints.minHeight != null ? constraints.minHeight : 1);
  const maxW = constraints.maxWidth != null ? constraints.maxWidth : Number.MAX_SAFE_INTEGER;
  const maxH = constraints.maxHeight != null ? constraints.maxHeight : Number.MAX_SAFE_INTEGER;
  return {
    width: Math.floor(clamp(width, minW, maxW)),
    height: Math.floor(clamp(height, minH, maxH)),
  };
}

function firstDefined() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] != null) return arguments[i];
  }
  return null;
}
