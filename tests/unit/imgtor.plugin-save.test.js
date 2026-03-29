/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.Darkroom = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/darkroom.save.js');
});

describe('save plugin', () => {
  it('registers on Darkroom.plugins.save', () => {
    expect(Darkroom.plugins.save).toBeDefined();
  });

  it('default callback invokes selfDestroy when save is clicked', () => {
    const selfDestroy = vi.fn();
    const toolbarHost = document.createElement('div');
    const darkroom = {
      toolbar: new Darkroom.UI.Toolbar(toolbarHost),
      selfDestroy,
    };
    const instance = new Darkroom.plugins.save(darkroom, {});
    instance.destroyButton.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(selfDestroy).toHaveBeenCalledOnce();
  });

  it('custom callback is used instead of selfDestroy', () => {
    const callback = vi.fn();
    const selfDestroy = vi.fn();
    const toolbarHost = document.createElement('div');
    const darkroom = {
      toolbar: new Darkroom.UI.Toolbar(toolbarHost),
      selfDestroy,
    };
    const instance = new Darkroom.plugins.save(darkroom, { callback });
    instance.destroyButton.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(callback).toHaveBeenCalledOnce();
    expect(selfDestroy).not.toHaveBeenCalled();
  });
});
