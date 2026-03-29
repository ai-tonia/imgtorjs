/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

let Rotation;

beforeAll(async () => {
  globalThis.imgtor = { plugins: [] };
  await import('../../lib/js/core/utils.js');
  await import('../../lib/js/core/plugin.js');
  await import('../../lib/js/core/transformation.js');
  await import('../../lib/js/core/ui.js');
  const extendSpy = vi.spyOn(imgtor.Transformation, 'extend');
  await import('../../lib/js/plugins/imgtor.rotate.js');
  Rotation = extendSpy.mock.results[0].value;
  extendSpy.mockRestore();
});

describe('rotate plugin', () => {
  it('registers on imgtor.plugins.rotate', () => {
    expect(imgtor.plugins.rotate).toBeDefined();
  });

  it('Rotation.applyTransformation updates angle, canvas, and calls next', () => {
    const image = {
      getAngle: vi.fn(() => 0),
      rotate: vi.fn(),
      getWidth: vi.fn(() => 100),
      getHeight: vi.fn(() => 200),
      setCoords: vi.fn(),
    };
    const canvas = {
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      centerObject: vi.fn(),
      renderAll: vi.fn(),
    };
    const next = vi.fn();
    const instance = new Rotation({ angle: 90 });

    instance.applyTransformation(canvas, image, next);

    expect(image.rotate).toHaveBeenCalledWith(90);
    const angleRad = (90 * Math.PI) / 180;
    const expectedHeight =
      Math.abs(100 * Math.sin(angleRad)) + Math.abs(200 * Math.cos(angleRad));
    const expectedWidth =
      Math.abs(200 * Math.sin(angleRad)) + Math.abs(100 * Math.cos(angleRad));
    expect(canvas.setWidth).toHaveBeenCalledWith(expectedWidth);
    expect(canvas.setHeight).toHaveBeenCalledWith(expectedHeight);
    expect(canvas.centerObject).toHaveBeenCalledWith(image);
    expect(canvas.renderAll).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it('left and right buttons call applyTransformation with Rotation instances', () => {
    const applyTransformation = vi.fn();
    const toolbarHost = document.createElement('div');
    const editor = {
      toolbar: new imgtor.UI.Toolbar(toolbarHost),
      applyTransformation,
    };
    new imgtor.plugins.rotate(editor, {});

    const buttons = toolbarHost.querySelectorAll('button');
    expect(buttons.length).toBe(2);

    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(applyTransformation).toHaveBeenCalledTimes(1);
    const leftArg = applyTransformation.mock.calls[0][0];
    expect(leftArg).toBeInstanceOf(Rotation);
    expect(leftArg.options.angle).toBe(-90);

    buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(applyTransformation).toHaveBeenCalledTimes(2);
    const rightArg = applyTransformation.mock.calls[1][0];
    expect(rightArg).toBeInstanceOf(Rotation);
    expect(rightArg.options.angle).toBe(90);
  });

  it('destroy removes button listeners', () => {
    const applyTransformation = vi.fn();
    const toolbarHost = document.createElement('div');
    const editor = {
      toolbar: new imgtor.UI.Toolbar(toolbarHost),
      applyTransformation,
    };
    const instance = new imgtor.plugins.rotate(editor, {});

    instance.destroy();
    applyTransformation.mockClear();

    const buttons = toolbarHost.querySelectorAll('button');
    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(applyTransformation).not.toHaveBeenCalled();
  });
});
