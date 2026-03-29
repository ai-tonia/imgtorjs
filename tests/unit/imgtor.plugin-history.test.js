/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.fabric = {};
  globalThis.Darkroom = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/darkroom.history.js');
});

afterAll(() => {
  if (Darkroom.plugins.history?.prototype) {
    Darkroom.plugins.history.prototype.undoTransformations = [];
  }
});

beforeEach(() => {
  if (Darkroom.plugins.history?.prototype) {
    Darkroom.plugins.history.prototype.undoTransformations = [];
  }
});

function createDarkroom() {
  const toolbarHost = document.createElement('div');
  const listeners = new Map();
  return {
    toolbar: new Darkroom.UI.Toolbar(toolbarHost),
    transformations: [],
    reinitializeImage: vi.fn(),
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    dispatchEvent(type) {
      for (const h of listeners.get(type) ?? []) h();
    },
  };
}

describe('history plugin', () => {
  it('registers on Darkroom.plugins.history', () => {
    expect(Darkroom.plugins.history).toBeDefined();
  });

  it('undo pops last transformation and moves it to redo stack', () => {
    const darkroom = createDarkroom();
    darkroom.transformations.push({ kind: 'a' }, { kind: 'b' });
    const plugin = new Darkroom.plugins.history(darkroom, {});

    plugin.undo();

    expect(darkroom.transformations).toEqual([{ kind: 'a' }]);
    expect(plugin.undoTransformations).toEqual([{ kind: 'b' }]);
    expect(darkroom.reinitializeImage).toHaveBeenCalledOnce();
  });

  it('undo does nothing when there are no transformations', () => {
    const darkroom = createDarkroom();
    const plugin = new Darkroom.plugins.history(darkroom, {});

    plugin.undo();

    expect(darkroom.transformations).toEqual([]);
    expect(plugin.undoTransformations).toEqual([]);
    expect(darkroom.reinitializeImage).not.toHaveBeenCalled();
  });

  it('redo restores transformation from undo stack', () => {
    const darkroom = createDarkroom();
    const plugin = new Darkroom.plugins.history(darkroom, {});
    plugin.undoTransformations.push({ kind: 'x' });

    plugin.redo();

    expect(darkroom.transformations).toEqual([{ kind: 'x' }]);
    expect(plugin.undoTransformations).toEqual([]);
    expect(darkroom.reinitializeImage).toHaveBeenCalledOnce();
  });

  it('redo does nothing when undo stack is empty', () => {
    const darkroom = createDarkroom();
    const plugin = new Darkroom.plugins.history(darkroom, {});

    plugin.redo();

    expect(darkroom.transformations).toEqual([]);
    expect(darkroom.reinitializeImage).not.toHaveBeenCalled();
  });

  it('core:transformation clears redo stack and updates buttons', () => {
    const darkroom = createDarkroom();
    const plugin = new Darkroom.plugins.history(darkroom, {});
    plugin.undoTransformations.push({ kind: 'old' });
    const updateSpy = vi.spyOn(plugin, '_updateButtons');

    darkroom.dispatchEvent('core:transformation');

    expect(plugin.undoTransformations).toEqual([]);
    expect(updateSpy).toHaveBeenCalled();
  });
});
