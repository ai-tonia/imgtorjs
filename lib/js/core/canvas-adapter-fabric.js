/**
 * Default CanvasAdapter: delegates to the global `fabric` object (Fabric.js 1.4.x).
 *
 * Core uses this for canvas/image construction and viewport/source layout so call sites
 * stay in one module; behavior matches prior direct Fabric usage.
 */
(function () {
  'use strict';

  const LOCKED_IMAGE_OPTIONS = {
    selectable: false,
    evented: false,
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true,
    hasControls: false,
    hasBorders: false,
  };

  function getFabric() {
    if (typeof fabric === 'undefined') {
      throw new Error('[imgtor] Fabric.js must be loaded before imgtor (global `fabric`).');
    }
    return fabric;
  }

  imgtor.CanvasAdapterFabric = {
    createCanvas: function createCanvas(canvasElement, options) {
      const f = getFabric();
      return new f.Canvas(canvasElement, options);
    },

    createLockedImage: function createLockedImage(imageElement) {
      const f = getFabric();
      return new f.Image(imageElement, LOCKED_IMAGE_OPTIONS);
    },

    /**
     * Source canvas: add image, size canvas to viewport, center, coords.
     */
    layoutSourceImage: function layoutSourceImage(canvas, image, canvasWidth, canvasHeight) {
      canvas.add(image);
      canvas.setWidth(canvasWidth);
      canvas.setHeight(canvasHeight);
      canvas.centerObject(image);
      image.setCoords();
    },

    /**
     * Viewport canvas: scale image, add, size canvas, center, coords.
     */
    layoutViewportImage: function layoutViewportImage(
      canvas,
      image,
      canvasWidth,
      canvasHeight,
      scale,
    ) {
      image.setScaleX(scale);
      image.setScaleY(scale);
      canvas.add(image);
      canvas.setWidth(canvasWidth);
      canvas.setHeight(canvasHeight);
      canvas.centerObject(image);
      image.setCoords();
    },
  };
})();
