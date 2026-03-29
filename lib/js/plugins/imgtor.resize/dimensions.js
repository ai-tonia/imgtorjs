/**
 * Width / height number inputs for resize UI.
 */

export function createDimensionInputs(doc) {
  const row = doc.createElement('div');
  row.className = 'imgtor-resize-dimensions';

  const wLabel = doc.createElement('label');
  wLabel.className = 'imgtor-resize-label';
  wLabel.textContent = 'W';
  const widthInput = doc.createElement('input');
  widthInput.type = 'number';
  widthInput.className = 'imgtor-resize-input';
  widthInput.min = '1';
  widthInput.setAttribute('aria-label', 'Resize width');
  widthInput.dataset.plugin = 'resize';
  widthInput.dataset.feature = 'width';
  wLabel.appendChild(widthInput);

  const hLabel = doc.createElement('label');
  hLabel.className = 'imgtor-resize-label';
  hLabel.textContent = 'H';
  const heightInput = doc.createElement('input');
  heightInput.type = 'number';
  heightInput.className = 'imgtor-resize-input';
  heightInput.min = '1';
  heightInput.setAttribute('aria-label', 'Resize height');
  heightInput.dataset.plugin = 'resize';
  heightInput.dataset.feature = 'height';
  hLabel.appendChild(heightInput);

  row.appendChild(wLabel);
  row.appendChild(hLabel);

  return {
    element: row,
    widthInput,
    heightInput,
    setValues(w, h) {
      widthInput.value = String(w);
      heightInput.value = String(h);
    },
    getValues() {
      return {
        width: widthInput.value,
        height: heightInput.value,
      };
    },
  };
}
