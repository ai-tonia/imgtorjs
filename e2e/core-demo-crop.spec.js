import { test, expect } from '@playwright/test';

test('demo crop: draw zone via API without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();

  await page.evaluate(() => {
    window._imgtorCropTest = new imgtor('#target', {
      plugins: {
        filter: false,
        finetune: false,
        resize: false,
        frame: false,
        fill: false,
        redact: false,
        annotate: false,
        decorate: false,
        retouch: false,
        history: false,
        rotate: false,
        save: false,
      },
    });
  });

  await expect(page.locator('.imgtor-image-container canvas').first()).toBeVisible({
    timeout: 15_000,
  });

  await page.evaluate(() => {
    window._imgtorCropTest.plugins.crop.requireFocus();
  });

  const canvas = page.locator('.imgtor-image-container canvas').first();
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();

  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + Math.min(200, box.width - 20), box.y + Math.min(160, box.height - 20));
  await page.mouse.up();

  await expect(canvas).toBeVisible();
  expect(errors, errors.join('\n')).toEqual([]);
});
