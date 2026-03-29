/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('bootstrap (icon sprite host)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.resetModules();
  });

  it('injects #imgtor-icons with build placeholder markup', async () => {
    await import('../../lib/js/core/bootstrap.js');
    const el = document.getElementById('imgtor-icons');
    expect(el).toBeTruthy();
    expect(el.innerHTML).toContain('inject:svg');
    expect(document.body.contains(el)).toBe(true);
  });

  it('uses hidden zero-size positioning', async () => {
    await import('../../lib/js/core/bootstrap.js');
    const el = document.getElementById('imgtor-icons');
    expect(el.style.visibility).toBe('hidden');
    expect(el.style.position).toBe('absolute');
  });
});
