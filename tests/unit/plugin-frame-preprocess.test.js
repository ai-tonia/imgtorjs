import { describe, expect, it } from 'vitest';
import { expandFrame } from '../../lib/js/plugins/imgtor.frame/preprocess.js';
import { defaultFrameStyles } from '../../lib/js/plugins/imgtor.frame/styles.js';

describe('imgtor.frame preprocess', () => {
  it('expandFrame returns rect defs for solidSharp', () => {
    const defs = expandFrame(defaultFrameStyles.solidSharp, 100, 80);
    expect(defs.length).toBeGreaterThan(0);
    expect(defs[0].type).toBe('rect');
    expect(defs[0].w).toBeGreaterThan(0);
    expect(defs[0].h).toBeGreaterThan(0);
  });
});
