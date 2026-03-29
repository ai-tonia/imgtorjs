/**
 * Keep width/height in sync when aspect lock is enabled.
 */

export function parsePositiveInt(raw, fallback) {
  const n = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

export function createAspectLock(doc, initialRatio) {
  const wrap = doc.createElement('label');
  wrap.className = 'imgtor-resize-aspect';
  const input = doc.createElement('input');
  input.type = 'checkbox';
  input.checked = true;
  const span = doc.createElement('span');
  span.textContent = 'Lock aspect';
  wrap.appendChild(input);
  wrap.appendChild(span);

  let ratio = initialRatio > 0 ? initialRatio : 1;

  function setRatioFromDimensions(w, h) {
    if (w > 0 && h > 0) ratio = w / h;
  }

  function syncFromWidth(width, heightInput) {
    if (!input.checked) return heightInput.value;
    const h = Math.max(1, Math.round(width / ratio));
    heightInput.value = String(h);
    return h;
  }

  function syncFromHeight(height, widthInput) {
    if (!input.checked) return widthInput.value;
    const w = Math.max(1, Math.round(height * ratio));
    widthInput.value = String(w);
    return w;
  }

  return {
    element: wrap,
    input,
    get locked() {
      return input.checked;
    },
    setRatioFromDimensions,
    syncFromWidth,
    syncFromHeight,
  };
}
