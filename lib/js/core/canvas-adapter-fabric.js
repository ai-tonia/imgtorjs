/**
 * Default CanvasAdapter: delegates to the global `fabric` object (Fabric.js 1.4.x).
 *
 * Contract (what imgtor core expects from `imgtor.CanvasAdapterFabric`):
 * - `createCanvas(canvasElement, options)` → Fabric Canvas instance
 * - `createLockedImage(imageElement)` → Fabric Image with editor-static flags
 *
 * Core obtains the adapter via `imgtor.CanvasAdapterFabric` at runtime (lazy, after bundle load).
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
  };
})();
