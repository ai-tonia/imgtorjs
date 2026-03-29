/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { applyColorMatrix } from '../../lib/js/plugins/imgtor.filter/preview.js';
import { filterFunctions } from '../../lib/js/plugins/imgtor.filter/registry.js';
import { defaultFilterOptions } from '../../lib/js/plugins/imgtor.filter/menu.js';
import { extendFilters, cloneFilterOptions } from '../../lib/js/plugins/imgtor.filter/custom.js';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/canvas-adapter-native.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/imgtor.filter/index.js');
});

describe('imgtor.filter preview', () => {
  it('applyColorMatrix with identity leaves RGBA unchanged', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255, 100, 150, 200, 128]);
    const imageData = { data };
    const identity = new Float32Array([
      1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
    ]);
    applyColorMatrix(imageData, identity);
    expect(Array.from(data)).toEqual([10, 20, 30, 255, 100, 150, 200, 128]);
  });
});

describe('imgtor.filter registry', () => {
  const expectedKeys = [
    'chrome',
    'fade',
    'pastel',
    'warm',
    'cold',
    'monoDefault',
    'monoNoir',
    'monoWash',
    'monoStark',
    'sepiaDefault',
    'sepiaRust',
    'sepiaBlues',
    'sepiaColor',
    'invert',
  ];

  it('filterFunctions exposes all preset ids', () => {
    for (const k of expectedKeys) {
      expect(typeof filterFunctions[k]).toBe('function');
      const m = filterFunctions[k]();
      expect(m).toBeInstanceOf(Float32Array);
      expect(m.length).toBe(20);
    }
  });
});

describe('imgtor.filter extendFilters', () => {
  it('merges custom filterFunctions and filterOptions into registry', () => {
    const registry = {
      filterFunctions: Object.assign({}, filterFunctions),
      filterOptions: cloneFilterOptions(defaultFilterOptions),
    };

    function customMatrix() {
      const a = new Float32Array(20);
      a[0] = 2;
      a[6] = 2;
      a[12] = 2;
      a[18] = 1;
      return a;
    }

    extendFilters(registry, {
      filterFunctions: { customBoost: customMatrix },
      filterOptions: {
        Custom: [{ id: 'customBoost', title: 'Boost' }],
      },
    });

    expect(typeof registry.filterFunctions.customBoost).toBe('function');
    expect(registry.filterOptions.Custom).toHaveLength(1);
    expect(registry.filterOptions.Custom[0].id).toBe('customBoost');
    expect(registry.filterOptions.Classic.length).toBe(defaultFilterOptions.Classic.length);
  });
});

describe('imgtor.filter plugin registration', () => {
  it('registers imgtor.plugins.filter', () => {
    expect(imgtor.plugins.filter).toBeDefined();
    expect(typeof imgtor.plugins.filter).toBe('function');
  });
});
