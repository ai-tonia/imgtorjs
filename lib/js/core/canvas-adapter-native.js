/**
 * Canvas 2D adapter — no Fabric.js. Subset for rotate / history / save / viewport preview.
 * Crop and other Fabric-only plugins are not supported (use build/imgtor.js + Fabric).
 */
(function () {
  'use strict';

  function noop2dContext() {
    return {
      fillStyle: '',
      fillRect: function () {},
      save: function () {},
      restore: function () {},
      translate: function () {},
      rotate: function () {},
      scale: function () {},
      drawImage: function () {},
    };
  }

  const { boundingBoxForRotatedRect } = (function () {
    /** Inline bbox to avoid ESM in IIFE bundle */
    function bbox(width, height, angleDeg) {
      const theta = (angleDeg * Math.PI) / 180;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);
      return {
        height: Math.abs(width * sin) + Math.abs(height * cos),
        width: Math.abs(height * sin) + Math.abs(width * cos),
      };
    }
    return { boundingBoxForRotatedRect: bbox };
  })();

  function naturalSize(img) {
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    return { w, h };
  }

  /**
   * @param {HTMLImageElement | Image} imgEl
   */
  function NativeImageWrapper(imgEl) {
    this._el = imgEl;
    this.angle = 0;
    this.selectable = false;
    /** @type {NativeCanvasWrapper | null} */
    this._parent = null;
  }

  NativeImageWrapper.prototype.getWidth = function () {
    const { w, h } = naturalSize(this._el);
    return boundingBoxForRotatedRect(w, h, this.angle).width;
  };

  NativeImageWrapper.prototype.getHeight = function () {
    const { w, h } = naturalSize(this._el);
    return boundingBoxForRotatedRect(w, h, this.angle).height;
  };

  NativeImageWrapper.prototype.getAngle = function () {
    return this.angle;
  };

  /** Fabric-compatible: set absolute rotation in degrees. */
  NativeImageWrapper.prototype.rotate = function (deg) {
    this.angle = ((deg % 360) + 360) % 360;
  };

  NativeImageWrapper.prototype.setScaleX = NativeImageWrapper.prototype.setScaleY = function () {
    /* viewport scaling handled in layoutViewportImage */
  };

  NativeImageWrapper.prototype.setCoords = function () {};

  NativeImageWrapper.prototype.remove = function () {
    if (this._parent) this._parent._removeObject(this);
  };

  NativeImageWrapper.prototype.toDataURL = function () {
    if (!this._parent) return '';
    return this._parent._canvas.toDataURL('image/png');
  };

  /**
   * @param {HTMLCanvasElement} el
   */
  function NativeCanvasWrapper(el, options) {
    this._canvas = el;
    this._ctx = el.getContext('2d') || noop2dContext();
    this._bg = (options && options.backgroundColor) || '#fff';
    /** @type {NativeImageWrapper | null} */
    this._image = null;
    this._listeners = new Map();
    this.defaultCursor = 'default';
  }

  NativeCanvasWrapper.prototype.getElement = function () {
    return this._canvas;
  };

  NativeCanvasWrapper.prototype._removeObject = function (obj) {
    if (this._image === obj) this._image = null;
    obj._parent = null;
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.add = function (obj) {
    if (obj instanceof NativeImageWrapper) {
      this._image = obj;
      obj._parent = this;
    }
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.setWidth = function (w) {
    this._canvas.width = Math.max(1, Math.floor(w));
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.setHeight = function (h) {
    this._canvas.height = Math.max(1, Math.floor(h));
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.centerObject = function () {
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.renderAll = function () {
    const ctx = this._ctx;
    const cw = this._canvas.width;
    const ch = this._canvas.height;
    ctx.fillStyle = this._bg;
    ctx.fillRect(0, 0, cw, ch);
    if (!this._image) return;
    const img = this._image._el;
    const { w, h } = naturalSize(img);
    if (w < 1 || h < 1) return;
    const rad = (this._image.angle * Math.PI) / 180;
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  NativeCanvasWrapper.prototype.on = function (eventName, handler) {
    if (!this._listeners.has(eventName)) this._listeners.set(eventName, new Set());
    this._listeners.get(eventName).add(handler);
  };

  NativeCanvasWrapper.prototype.off = function (eventName, handler) {
    this._listeners.get(eventName)?.delete(handler);
  };

  NativeCanvasWrapper.prototype.discardActiveObject = function () {};
  NativeCanvasWrapper.prototype.setActiveObject = function () {};
  NativeCanvasWrapper.prototype.bringToFront = function () {};
  NativeCanvasWrapper.prototype.calcOffset = function () {};
  NativeCanvasWrapper.prototype.getPointer = function () {
    return { x: 0, y: 0 };
  };
  NativeCanvasWrapper.prototype.getActiveObject = function () {
    return null;
  };
  NativeCanvasWrapper.prototype.getWidth = function () {
    return this._canvas.width;
  };
  NativeCanvasWrapper.prototype.getHeight = function () {
    return this._canvas.height;
  };

  imgtor.CanvasAdapterNative = {
    createCanvas: function createCanvas(canvasElement, options) {
      return new NativeCanvasWrapper(canvasElement, options);
    },

    createLockedImage: function createLockedImage(imageElement) {
      return new NativeImageWrapper(imageElement);
    },

    layoutSourceImage: function layoutSourceImage(canvas, image, canvasWidth, canvasHeight) {
      canvas.add(image);
      canvas.setWidth(canvasWidth);
      canvas.setHeight(canvasHeight);
      canvas.centerObject(image);
    },

    layoutViewportImage: function layoutViewportImage(
      canvas,
      image,
      canvasWidth,
      canvasHeight,
      scale,
    ) {
      const ctx = canvas._ctx;
      const cw = Math.max(1, Math.floor(canvasWidth));
      const ch = Math.max(1, Math.floor(canvasHeight));
      canvas._canvas.width = cw;
      canvas._canvas.height = ch;
      const img = image._el;
      const { w, h } = naturalSize(img);
      const rad = (image.angle * Math.PI) / 180;
      ctx.fillStyle = canvas._bg;
      ctx.fillRect(0, 0, cw, ch);
      if (w < 1 || h < 1) return;
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate(rad);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      canvas._image = image;
      image._parent = canvas;
    },
  };
})();
