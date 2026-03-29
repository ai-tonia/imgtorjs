import { test, expect } from '@playwright/test';

test('undo is disabled until a transformation; rotate then undo restores state', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(async () => page.evaluate(() => typeof window.imgtor)).toBe('function');

  const buttons = page.locator(
    '.imgtor-toolbar button.imgtor-button:not(.imgtor-button-hidden)',
  );
  await expect(buttons).toHaveCount(8);

  const undo = buttons.nth(0);
  const rotateLeft = buttons.nth(2);

  await expect(undo).toBeDisabled();
  await rotateLeft.click();
  await expect(undo).not.toBeDisabled();

  await undo.click();
  await expect(undo).toBeDisabled();
});
