/** @typedef {{ strokeColor: string, strokeWidth: number, inset: number, round?: boolean }} FrameStyleShape */

export const defaultFrameStyles = {
  solidSharp: {
    id: 'solidSharp',
    shape: { strokeColor: '#fff', strokeWidth: 0.02, inset: 0.02, round: false },
    thumb: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  },
  solidRound: {
    id: 'solidRound',
    shape: { strokeColor: '#fff', strokeWidth: 0.02, inset: 0.02, round: true },
    thumb: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  },
  lineSingle: {
    id: 'lineSingle',
    shape: { strokeColor: '#eee', strokeWidth: 0.008, inset: 0.04, round: false },
    thumb: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
  },
  lineDouble: {
    id: 'lineDouble',
    shape: { strokeColor: '#ddd', strokeWidth: 0.006, inset: 0.03, round: false, double: true },
    thumb: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/><rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor"/></svg>',
  },
  hook: {
    id: 'hook',
    shape: { strokeColor: '#fff', strokeWidth: 0.015, inset: 0.05, hook: true },
    thumb: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 4h6v6M14 4h6v6M4 14v6h6M14 20h6v-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  },
  polaroid: {
    id: 'polaroid',
    shape: { strokeColor: '#f5f5f5', strokeWidth: 0.04, inset: 0, polaroid: true },
    thumb: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="2" width="20" height="16" fill="none" stroke="currentColor"/><rect x="2" y="18" width="20" height="4" fill="currentColor" opacity=".3"/></svg>',
  },
};
