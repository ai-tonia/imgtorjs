/**
 * @vitest-environment happy-dom
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { boundingBoxForRotatedRect } from '../../lib/js/math-viewport.js';

beforeAll(async () => {
  globalThis.Darkroom = {};
  await import('../../lib/js/core/utils.js');
});

describe('Darkroom.Utils', () => {
  it('extend copies missing keys from defaults into options', () => {
    const options = { a: 1 };
    const defaults = { a: 99, b: 2 };
    Darkroom.Utils.extend(options, defaults);
    expect(options).toEqual({ a: 1, b: 2 });
  });

  it('computeImageViewPort matches boundingBoxForRotatedRect', () => {
    const image = {
      getWidth: () => 80,
      getHeight: () => 60,
      getAngle: () => 30,
    };
    expect(Darkroom.Utils.computeImageViewPort(image)).toEqual(
      boundingBoxForRotatedRect(80, 60, 30),
    );
  });

  it('computeImageViewPort handles zero angle', () => {
    const image = {
      getWidth: () => 100,
      getHeight: () => 40,
      getAngle: () => 0,
    };
    expect(Darkroom.Utils.computeImageViewPort(image)).toEqual({
      width: 100,
      height: 40,
    });
  });
});
