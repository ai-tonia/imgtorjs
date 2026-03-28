(function () {
  'use strict';

  Darkroom.Utils = {
    extend: extend,
    computeImageViewPort: computeImageViewPort,
  };

  // Utility method to easily extend objects.
  function extend(b, a) {
    let prop;
    if (b === undefined) {
      return a;
    }
    for (prop in a) {
      if (
        Object.prototype.hasOwnProperty.call(a, prop) &&
        Object.prototype.hasOwnProperty.call(b, prop) === false
      ) {
        b[prop] = a[prop];
      }
    }
    return b;
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
