import { test, expect } from '@playwright/test';

test('demo mounts toolbar with plugin button groups', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();

  await expect.poll(async () => page.evaluate(() => typeof window.imgtor)).toBe('function');

  const toolbar = page.locator('.imgtor-toolbar');
  await expect(toolbar).toBeVisible();

  // History, rotate, crop, save — one group each after init
  await expect(toolbar.locator('.imgtor-button-group')).toHaveCount(4);

  // Demo calls crop.requireFocus() on init, so crop done/close are visible too:
  // undo, redo, rotate×2, crop, done, close, save = 8
  await expect(toolbar.locator('button.imgtor-button:not(.imgtor-button-hidden)')).toHaveCount(
    8,
  );
});
