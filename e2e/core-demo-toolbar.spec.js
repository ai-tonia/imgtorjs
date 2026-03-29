import { test, expect } from '@playwright/test';

test('demo mounts toolbar with all plugin groups', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();

  await expect.poll(async () => page.evaluate(() => typeof window.imgtor)).toBe('function');

  const toolbar = page.locator('.imgtor-toolbar');
  await expect(toolbar).toBeVisible();

  const groupCount = await toolbar.locator('.imgtor-button-group').count();
  expect(groupCount).toBeGreaterThanOrEqual(13);

  const visibleButtons = await toolbar
    .locator('button.imgtor-button:not(.imgtor-button-hidden)')
    .count();
  expect(visibleButtons).toBeGreaterThanOrEqual(8);

  await expect(page.locator('[data-plugin="history"]').first()).toBeVisible();
  await expect(page.locator('[data-plugin="filter"]').first()).toBeVisible();
});
