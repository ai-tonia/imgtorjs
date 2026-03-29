import { test, expect } from '@playwright/test';

test.describe('visual regression', () => {
  test('toolbar matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect.poll(async () => page.evaluate(() => typeof window.imgtor)).toBe('function');
    const toolbar = page.locator('.imgtor-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveScreenshot('imgtor-toolbar.png', {
      maxDiffPixels: 200,
      animations: 'disabled',
    });
  });
});
