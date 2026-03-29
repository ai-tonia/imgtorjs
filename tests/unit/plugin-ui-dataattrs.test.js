/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  globalThis.imgtor = {};
  await import('../../lib/js/core/imgtor.js');
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/ui.js');
});

describe('Button createButton data attributes', () => {
  it('sets data-plugin and data-feature from options', () => {
    const host = document.createElement('div');
    const tb = new imgtor.UI.Toolbar(host);
    const g = tb.createButtonGroup();
    const b = g.createButton({
      image: 'save',
      pluginId: 'testplugin',
      feature: 'myaction',
    });
    expect(b.element.getAttribute('data-plugin')).toBe('testplugin');
    expect(b.element.getAttribute('data-feature')).toBe('myaction');
  });
});
