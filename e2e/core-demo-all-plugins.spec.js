import { test, expect } from '@playwright/test';

async function canvasBox(page) {
  const canvas = page.locator('.imgtor-image-container canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  return { canvas, box };
}

/** Drag within the editor canvas using element-relative coordinates (avoids viewport/hit-target skew). */
async function dragOnCanvas(canvas, rx0, ry0, rx1, ry1) {
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  await canvas.dragTo(canvas, {
    sourcePosition: { x: box.width * rx0, y: box.height * ry0 },
    targetPosition: { x: box.width * rx1, y: box.height * ry1 },
  });
}

test.describe('demo with all plugins enabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect.poll(async () => typeof (await page.evaluate(() => window.demoEditor))).toBe('object');
    await canvasBox(page);
  });

  test('toolbar exposes data-plugin hooks for every plugin', async ({ page }) => {
    const plugins = [
      'history',
      'rotate',
      'crop',
      'save',
      'filter',
      'finetune',
      'resize',
      'frame',
      'fill',
      'redact',
      'annotate',
      'decorate',
      'retouch',
    ];
    for (const id of plugins) {
      await expect(page.locator(`.imgtor-toolbar [data-plugin="${id}"]`).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test('filter chrome applies a transformation', async ({ page }) => {
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.locator('[data-plugin="filter"][data-feature="chrome"]').first().click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('finetune panel and brightness slider apply transformation', async ({ page }) => {
    await page.locator('[data-plugin="finetune"][data-feature="toggle-panel"]').click();
    await expect(page.locator('.imgtor-finetune-panel')).toBeVisible();
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.evaluate(() => {
      const el = document.querySelector('input[data-plugin="finetune"][data-control="brightness"]');
      if (el) {
        el.value = '60';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('resize preset and apply', async ({ page }) => {
    await page.locator('select[data-plugin="resize"][data-feature="preset"]').selectOption({ index: 2 });
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.locator('button[data-plugin="resize"][data-feature="apply"]').click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('frame style and bake', async ({ page }) => {
    await page.locator('[data-plugin="frame"][data-feature="solidSharp"]').first().click();
    await page.locator('[data-plugin="frame"][data-feature="bake"]').click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(0);
  });

  test('fill swatch and bake', async ({ page }) => {
    await page.locator('button[data-plugin="fill"][data-feature="swatch-1"]').click();
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.locator('[data-plugin="fill"][data-feature="bake"]').click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('redact toggle, draw region, apply', async ({ page }) => {
    await page.evaluate(() => window.demoEditor.plugins.crop.releaseFocus());
    await page.locator('[data-plugin="redact"][data-feature="toggle-draw"]').click();
    const { canvas } = await canvasBox(page);
    await dragOnCanvas(canvas, 0.2, 0.35, 0.45, 0.55);
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.locator('[data-plugin="redact"][data-feature="apply"]').click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('annotate rect and bake', async ({ page }) => {
    await page.evaluate(() => window.demoEditor.plugins.crop.releaseFocus());
    await page.locator('[data-plugin="annotate"][data-feature="toggle-tool"]').click();
    const { canvas } = await canvasBox(page);
    await dragOnCanvas(canvas, 0.2, 0.35, 0.45, 0.55);
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.locator('[data-plugin="annotate"][data-feature="bake"]').click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('decorate rect and bake', async ({ page }) => {
    await page.evaluate(() => window.demoEditor.plugins.crop.releaseFocus());
    await page.locator('[data-plugin="decorate"][data-feature="toggle-tool"]').click();
    const { canvas } = await canvasBox(page);
    await dragOnCanvas(canvas, 0.18, 0.36, 0.42, 0.52);
    const n0 = await page.evaluate(() => window.demoEditor.transformations.length);
    await page.locator('[data-plugin="decorate"][data-feature="bake"]').click();
    await expect
      .poll(async () => page.evaluate(() => window.demoEditor.transformations.length))
      .toBeGreaterThan(n0);
  });

  test('retouch selection calls hook', async ({ page }) => {
    await page.evaluate(() => {
      window.demoEditor.plugins.crop.releaseFocus();
      window.__retouchCalled = false;
      window.demoEditor.plugins.retouch.options.onSelectionComplete = function () {
        window.__retouchCalled = true;
      };
    });
    await page.locator('[data-plugin="retouch"][data-feature="toggle-select"]').click();
    const { canvas } = await canvasBox(page);
    await dragOnCanvas(canvas, 0.15, 0.34, 0.4, 0.5);
    await expect
      .poll(async () => page.evaluate(() => window.__retouchCalled === true))
      .toBeTruthy();
  });
});
