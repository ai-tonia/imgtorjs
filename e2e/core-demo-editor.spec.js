import { test, expect } from '@playwright/test';

test('demo can instantiate imgtor on #target without console errors', async ({ page }) => {
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });

  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();

  await expect.poll(async () => page.evaluate(() => typeof window.imgtor)).toBe('function');
  await expect
    .poll(async () => page.evaluate(() => typeof window.fabric))
    .toBe('undefined');

  await expect(page.locator('.imgtor-container').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.imgtor-toolbar').first()).toBeVisible({ timeout: 15_000 });

  await page.evaluate(() => {
    new imgtor('#target', {
      plugins: {
        history: false,
        rotate: false,
        crop: false,
        save: false,
      },
    });
  });

  await expect
    .poll(async () => page.locator('.imgtor-container').count(), { timeout: 12_000 })
    .toBeGreaterThanOrEqual(2);

  expect(errors, errors.join('\n')).toEqual([]);
});
