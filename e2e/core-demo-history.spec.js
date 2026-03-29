import { test, expect } from '@playwright/test';

test('undo is disabled until a transformation; rotate then undo restores state', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(async () => page.evaluate(() => typeof window.imgtor)).toBe('function');

  const undo = page.locator('.imgtor-toolbar [data-plugin="history"][data-feature="undo"]').first();
  const rotateLeft = page
    .locator('.imgtor-toolbar [data-plugin="rotate"][data-feature="rotate-left"]')
    .first();

  await expect(undo).toBeDisabled();
  await rotateLeft.click();
  await expect(undo).not.toBeDisabled();

  await undo.click();
  await expect(undo).toBeDisabled();
});
