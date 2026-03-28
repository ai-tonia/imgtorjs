/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.Darkroom = { plugins: [] };
  globalThis.fabric = {};
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/darkroom.history.js');
});

function createDarkroom(overrides = {}) {
  const host = document.createElement('div');
  const canvasProxy = document.createElement('div');
  return {
    toolbar: new Darkroom.UI.Toolbar(host),
    transformations: [],
    reinitializeImage: vi.fn(),
    addEventListener: canvasProxy.addEventListener.bind(canvasProxy),
    dispatchEvent: canvasProxy.dispatchEvent.bind(canvasProxy),
    ...overrides,
  };
}

describe('history plugin', () => {
  it('registers on Darkroom.plugins.history', () => {
    expect(Darkroom.plugins.history).toBeDefined();
  });

  it('undo no-ops when transformations is empty', () => {
    const darkroom = createDarkroom({ transformations: [] });
    const instance = new Darkroom.plugins.history(darkroom, {});
    instance.undoTransformations = [];

    instance.undo();

    expect(darkroom.reinitializeImage).not.toHaveBeenCalled();
    expect(darkroom.transformations).toEqual([]);
    expect(instance.undoTransformations).toEqual([]);
  });

  it('undo pops transformation, calls reinitializeImage, and moves it to undo stack', () => {
    const t = { id: 't1' };
    const darkroom = createDarkroom({ transformations: [t] });
    const instance = new Darkroom.plugins.history(darkroom, {});
    instance.undoTransformations = [];

    instance.undo();

    expect(darkroom.transformations).toEqual([]);
    expect(instance.undoTransformations).toEqual([t]);
    expect(darkroom.reinitializeImage).toHaveBeenCalledOnce();
  });

  it('redo restores transformation from undo stack', () => {
    const t = { id: 't1' };
    const darkroom = createDarkroom({ transformations: [t] });
    const instance = new Darkroom.plugins.history(darkroom, {});
    instance.undoTransformations = [];

    instance.undo();
    instance.redo();

    expect(darkroom.transformations).toEqual([t]);
    expect(instance.undoTransformations).toEqual([]);
    expect(darkroom.reinitializeImage).toHaveBeenCalledTimes(2);
  });

  it('_onTranformationApplied clears undo stack when core:transformation is dispatched', () => {
    const darkroom = createDarkroom();
    const instance = new Darkroom.plugins.history(darkroom, {});
    const stale = { id: 'stale' };
    instance.undoTransformations = [stale];
    instance._updateButtons();
    expect(instance.forwardButton.element.disabled).toBe(false);

    darkroom.dispatchEvent(new CustomEvent('core:transformation'));

    expect(instance.undoTransformations).toEqual([]);
    expect(instance.forwardButton.element.disabled).toBe(true);
  });

  it('_updateButtons disables back when transformations empty and forward when undo stack empty', () => {
    const darkroom = createDarkroom({ transformations: [] });
    const instance = new Darkroom.plugins.history(darkroom, {});
    instance.undoTransformations = [];

    instance._updateButtons();
    expect(instance.backButton.element.disabled).toBe(true);
    expect(instance.forwardButton.element.disabled).toBe(true);

    darkroom.transformations.push({ id: 'x' });
    instance._updateButtons();
    expect(instance.backButton.element.disabled).toBe(false);
    expect(instance.forwardButton.element.disabled).toBe(true);

    darkroom.transformations.length = 0;
    instance.undoTransformations.push({ id: 'u' });
    instance._updateButtons();
    expect(instance.backButton.element.disabled).toBe(true);
    expect(instance.forwardButton.element.disabled).toBe(false);
  });
});
