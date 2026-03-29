/**
 * Experimental native adapter placeholder (Canvas 2D / DOM). Not wired for full editor init yet.
 * See docs/MIGRATION_CANVAS_ADAPTER.md — Phase C will flesh this out behind adapterKind.
 */
(function () {
  'use strict';

  function notImplemented(name) {
    throw new Error(
      '[imgtor] CanvasAdapterNative.' + name + ' is not implemented yet; use adapterKind "fabric".',
    );
  }

  imgtor.CanvasAdapterNative = {
    createCanvas: function createCanvas() {
      notImplemented('createCanvas');
    },
    createLockedImage: function createLockedImage() {
      notImplemented('createLockedImage');
    },
    layoutSourceImage: function layoutSourceImage() {
      notImplemented('layoutSourceImage');
    },
    layoutViewportImage: function layoutViewportImage() {
      notImplemented('layoutViewportImage');
    },
  };
})();
