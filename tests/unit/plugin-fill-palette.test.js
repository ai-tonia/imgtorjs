import { describe, expect, it } from 'vitest';
import { fillToCSS } from '../../lib/js/plugins/imgtor.fill/palette.js';

describe('imgtor.fill palette', () => {
  it('fillToCSS maps RGBA unit array to rgba()', () => {
    expect(fillToCSS([1, 0, 0, 1])).toBe('rgba(255,0,0,1)');
  });
  it('transparent', () => {
    expect(fillToCSS([0, 0, 0, 0])).toMatch(/rgba\(0,0,0,0\)/);
  });
});
