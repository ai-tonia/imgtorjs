/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  globalThis.Darkroom = {};
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/ui.js');
});

describe('Darkroom.UI.Toolbar / ButtonGroup / Button', () => {
  it('createButtonGroup appends darkroom-button-group', () => {
    const host = document.createElement('div');
    const toolbar = new Darkroom.UI.Toolbar(host);
    const group = toolbar.createButtonGroup();
    const div = host.querySelector('.darkroom-button-group');
    expect(div).toBe(group.element);
  });

  it('createButton sets class from type and svg use href from image', () => {
    const host = document.createElement('div');
    const toolbar = new Darkroom.UI.Toolbar(host);
    const group = toolbar.createButtonGroup();
    const btn = group.createButton({ image: 'undo', type: 'success' });
    expect(btn.element.classList.contains('darkroom-button-success')).toBe(true);
    expect(btn.element.innerHTML).toContain('#undo');
  });

  it('Button toggles active, hidden, and disabled', () => {
    const host = document.createElement('div');
    const toolbar = new Darkroom.UI.Toolbar(host);
    const group = toolbar.createButtonGroup();
    const btn = group.createButton({});
    btn.active(true);
    expect(btn.element.classList.contains('darkroom-button-active')).toBe(true);
    btn.active(false);
    expect(btn.element.classList.contains('darkroom-button-active')).toBe(false);
    btn.hide(true);
    expect(btn.element.classList.contains('darkroom-button-hidden')).toBe(true);
    btn.disable(true);
    expect(btn.element.disabled).toBe(true);
  });

  it('Button forwards addEventListener', () => {
    const host = document.createElement('div');
    const toolbar = new Darkroom.UI.Toolbar(host);
    const group = toolbar.createButtonGroup();
    const btn = group.createButton({});
    const fn = vi.fn();
    btn.addEventListener('click', fn);
    btn.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
