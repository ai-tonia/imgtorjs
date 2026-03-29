import { test, expect } from '@playwright/test';

function attachErrorCapture(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function canvasBox(page) {
  const canvas = page.locator('.imgtor-image-container canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  return { canvas, box };
}

async function dragRect(page, box, x0r, y0r, x1r, y1r) {
  const x0 = box.x + box.width * x0r;
  const y0 = box.y + box.height * y0r;
  const x1 = box.x + box.width * x1r;
  const y1 = box.y + box.height * y1r;
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  await page.mouse.move(x1, y1);
  await page.mouse.up();
}

test.describe('demo feature smoke (isolated pages)', () => {
  test('crop: second selection drag outside first zone updates zone', async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto('/e2e-isolate-crop.html');
    await expect.poll(async () => page.evaluate(() => typeof window.e2eCropEditor)).toBe('object');

    const { box } = await canvasBox(page);

    await dragRect(page, box, 0.08, 0.08, 0.28, 0.28);
    const first = await page.evaluate(() => {
      const z = window.e2eCropEditor.plugins.crop.cropZone;
      return { w: z.width, h: z.height, left: z.left, top: z.top };
    });
    expect(first.w).toBeGreaterThan(10);
    expect(first.h).toBeGreaterThan(10);

    await dragRect(page, box, 0.72, 0.72, 0.92, 0.88);
    const second = await page.evaluate(() => {
      const z = window.e2eCropEditor.plugins.crop.cropZone;
      return { w: z.width, h: z.height, left: z.left, top: z.top };
    });

    expect(second.left).toBeGreaterThan(first.left + first.w - 5);
    expect(errors).toEqual([]);
  });

  test('crop: apply adds a transformation', async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto('/e2e-isolate-crop.html');
    await expect.poll(async () => page.evaluate(() => typeof window.e2eCropEditor)).toBe('object');

    const { box } = await canvasBox(page);
    await dragRect(page, box, 0.15, 0.15, 0.55, 0.55);

    const before = await page.evaluate(() => window.e2eCropEditor.transformations.length);
    await page.evaluate(() => {
      window.e2eCropEditor.plugins.crop.okButton.element.click();
    });
    const after = await page.evaluate(() => window.e2eCropEditor.transformations.length);

    expect(after).toBe(before + 1);
    expect(errors).toEqual([]);
  });

  test('rotate then undo', async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto('/e2e-isolate-history.html');
    await expect.poll(async () => page.evaluate(() => typeof window.e2eHistEditor)).toBe('object');

    const undo = page.locator('.imgtor-toolbar [data-plugin="history"][data-feature="undo"]').first();
    const rotateLeft = page
      .locator('.imgtor-toolbar [data-plugin="rotate"][data-feature="rotate-left"]')
      .first();

    await expect(undo).toBeDisabled();
    await rotateLeft.click();
    await expect(undo).not.toBeDisabled();

    const t1 = await page.evaluate(() => window.e2eHistEditor.transformations.length);
    expect(t1).toBeGreaterThanOrEqual(1);

    await undo.click();
    await expect(undo).toBeDisabled();
    const t2 = await page.evaluate(() => window.e2eHistEditor.transformations.length);
    expect(t2).toBe(0);
    expect(errors).toEqual([]);
  });

  test('save: default callback invokes editor selfDestroy', async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto('/e2e-isolate-save.html');
    await expect.poll(async () => page.evaluate(() => typeof window.e2eSaveEditor)).toBe('object');

    await page.evaluate(() => {
      window.e2eSaveEditor.selfDestroy = function () {
        window.__saveSelfDestroyCalled = true;
      };
    });

    await page.evaluate(() => {
      window.e2eSaveEditor.plugins.save.destroyButton.element.click();
    });

    const called = await page.evaluate(() => window.__saveSelfDestroyCalled === true);
    expect(called).toBe(true);
    expect(errors).toEqual([]);
  });
});
