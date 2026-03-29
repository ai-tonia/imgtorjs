import { computeCropRectFromDrag } from '../crop-geometry.js';
import { extendObject } from '../extend-object.js';
import { boundingBoxForRotatedRect } from '../math-viewport.js';

(function () {
  'use strict';

  imgtor.Utils = {
    extend: extend,
    computeImageViewPort: computeImageViewPort,
    computeCropRectFromDrag: computeCropRectFromDrag,
  };

  function extend(b, a) {
    return extendObject(b, a);
  }

  function computeImageViewPort(image) {
    return boundingBoxForRotatedRect(image.getWidth(), image.getHeight(), image.getAngle());
  }
})();
