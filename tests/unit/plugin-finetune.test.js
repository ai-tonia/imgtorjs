import { describe, expect, it } from 'vitest';

import { brightness } from '../../lib/js/plugins/imgtor.finetune/controls.js';
import { defaultFinetuneOptions } from '../../lib/js/plugins/imgtor.finetune/layout.js';

describe('finetune plugin modules', () => {
  it('matrix control computeMatrix returns length 20', () => {
    const m = brightness.computeMatrix(0);
    expect(m.length).toBe(20);
  });

  it('defaultFinetuneOptions is non-empty', () => {
    expect(defaultFinetuneOptions.length).toBeGreaterThan(0);
  });
});
