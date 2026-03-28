import { extendObject } from '../extend-object.js';

(function () {
  'use strict';

  Darkroom.Utils = {
    extend: extend,
    computeImageViewPort: computeImageViewPort,
  };

  function extend(b, a) {
    return extendObject(b, a);
  }

  function computeImageViewPort(image) {
    return {
      height:
        Math.abs(image.getWidth() * Math.sin((image.getAngle() * Math.PI) / 180)) +
        Math.abs(image.getHeight() * Math.cos((image.getAngle() * Math.PI) / 180)),
      width:
        Math.abs(image.getHeight() * Math.sin((image.getAngle() * Math.PI) / 180)) +
        Math.abs(image.getWidth() * Math.cos((image.getAngle() * Math.PI) / 180)),
    };
  }
})();
