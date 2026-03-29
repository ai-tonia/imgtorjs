/**
 * @vitest-environment happy-dom
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.fabric = {};
  globalThis.imgtor = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/ui.js');
  await import('../../lib/js/plugins/imgtor.history.js');
});

afterAll(() => {
  if (imgtor.plugins.history?.prototype) {
    imgtor.plugins.history.prototype.undoTransformations = [];
  }
});

beforeEach(() => {
  if (imgtor.plugins.history?.prototype) {
    imgtor.plugins.history.prototype.undoTransformations = [];
  }
});

function createEditor() {
  const toolbarHost = document.createElement('div');
  const listeners = new Map();
  return {
    toolbar: new imgtor.UI.Toolbar(toolbarHost),
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
  it('registers on imgtor.plugins.history', () => {
    expect(imgtor.plugins.history).toBeDefined();
  });

  it('undo pops last transformation and moves it to redo stack', () => {
    const editor = createEditor();
    editor.transformations.push({ kind: 'a' }, { kind: 'b' });
    const plugin = new imgtor.plugins.history(editor, {});

    plugin.undo();

    expect(editor.transformations).toEqual([{ kind: 'a' }]);
    expect(plugin.undoTransformations).toEqual([{ kind: 'b' }]);
    expect(editor.reinitializeImage).toHaveBeenCalledOnce();
  });

  it('undo does nothing when there are no transformations', () => {
    const editor = createEditor();
    const plugin = new imgtor.plugins.history(editor, {});

    plugin.undo();

    expect(editor.transformations).toEqual([]);
    expect(plugin.undoTransformations).toEqual([]);
    expect(editor.reinitializeImage).not.toHaveBeenCalled();
  });

  it('redo restores transformation from undo stack', () => {
    const editor = createEditor();
    const plugin = new imgtor.plugins.history(editor, {});
    plugin.undoTransformations.push({ kind: 'x' });

    plugin.redo();

    expect(editor.transformations).toEqual([{ kind: 'x' }]);
    expect(plugin.undoTransformations).toEqual([]);
    expect(editor.reinitializeImage).toHaveBeenCalledOnce();
  });

  it('redo does nothing when undo stack is empty', () => {
    const editor = createEditor();
    const plugin = new imgtor.plugins.history(editor, {});

    plugin.redo();

    expect(editor.transformations).toEqual([]);
    expect(editor.reinitializeImage).not.toHaveBeenCalled();
  });

  it('core:transformation clears redo stack and updates buttons', () => {
    const editor = createEditor();
    const plugin = new imgtor.plugins.history(editor, {});
    plugin.undoTransformations.push({ kind: 'old' });
    const updateSpy = vi.spyOn(plugin, '_updateButtons');

    editor.dispatchEvent('core:transformation');

    expect(plugin.undoTransformations).toEqual([]);
    expect(updateSpy).toHaveBeenCalled();
  });
});
