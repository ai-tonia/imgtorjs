/**
 * Apply control for the resize plugin toolbar row.
 */

export function createApplyControl(doc) {
  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = 'imgtor-button imgtor-button-default imgtor-resize-apply';
  btn.textContent = 'Apply';
  return {
    element: btn,
    addClickListener(fn) {
      btn.addEventListener('click', fn);
    },
    removeClickListener(fn) {
      btn.removeEventListener('click', fn);
    },
  };
}
