/**
 * Canvas 2D adapter. Full editor: viewport, source, crop overlays, rotate/history/save.
 */
(function () {
  'use strict';

  function noop2dContext() {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineDashOffset: 0,
      fillRect: function () {},
      stroke: function () {},
      beginPath: function () {},
      moveTo: function () {},
      lineTo: function () {},
      closePath: function () {},
      save: function () {},
      restore: function () {},
      translate: function () {},
      rotate: function () {},
      scale: function () {},
      drawImage: function () {},
      setLineDash: function () {},
    };
  }

  function bbox(width, height, angleDeg) {
    const theta = (angleDeg * Math.PI) / 180;
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    return {
      height: Math.abs(width * sin) + Math.abs(height * cos),
      width: Math.abs(height * sin) + Math.abs(width * cos),
    };
  }

  function naturalSize(img) {
    if (!img) return { w: 0, h: 0 };
    const el = img._el;
    if (el) {
      const w = el.naturalWidth || el.width || 0;
      const h = el.naturalHeight || el.height || 0;
      return { w, h };
    }
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    return { w, h };
  }

  /** Base for interactive objects (crop zone). */
  function NativeCanvasObject(opts) {
    opts = opts || {};
    this.left = opts.left != null ? opts.left : 0;
    this.top = opts.top != null ? opts.top : 0;
    this.width = opts.width != null ? opts.width : 0;
    this.height = opts.height != null ? opts.height : 0;
    this.scaleX = opts.scaleX != null ? opts.scaleX : 1;
    this.scaleY = opts.scaleY != null ? opts.scaleY : 1;
    this.flipX = !!opts.flipX;
    this.flipY = !!opts.flipY;
    this.lockUniScaling = !!opts.lockUniScaling;
    /** @type {number | null} set by crop plugin when ratio is enforced */
    this._ratioLock = opts._ratioLock != null ? opts._ratioLock : null;
    this._parent = null;
    for (const k in opts) {
      if (
        Object.prototype.hasOwnProperty.call(opts, k) &&
        !Object.prototype.hasOwnProperty.call(NativeCanvasObject.prototype, k) &&
        k !== 'constructor'
      ) {
        this[k] = opts[k];
      }
    }
  }

  NativeCanvasObject.prototype.getLeft = function () {
    return this.left;
  };
  NativeCanvasObject.prototype.getTop = function () {
    return this.top;
  };
  NativeCanvasObject.prototype.getWidth = function () {
    return this.width * this.scaleX;
  };
  NativeCanvasObject.prototype.getHeight = function () {
    return this.height * this.scaleY;
  };
  NativeCanvasObject.prototype.getScaleX = function () {
    return this.scaleX;
  };
  NativeCanvasObject.prototype.getScaleY = function () {
    return this.scaleY;
  };
  NativeCanvasObject.prototype.setLeft = function (v) {
    this.left = v;
  };
  NativeCanvasObject.prototype.setTop = function (v) {
    this.top = v;
  };
  NativeCanvasObject.prototype.setWidth = function (v) {
    this.width = v;
  };
  NativeCanvasObject.prototype.setHeight = function (v) {
    this.height = v;
  };
  NativeCanvasObject.prototype.setScaleX = function (v) {
    this.scaleX = v;
  };
  NativeCanvasObject.prototype.setScaleY = function (v) {
    this.scaleY = v;
  };
  NativeCanvasObject.prototype.set = function (keyOrProps, value) {
    if (typeof keyOrProps === 'string') this[keyOrProps] = value;
    else Object.assign(this, keyOrProps);
  };
  NativeCanvasObject.prototype.setCoords = function () {};
  NativeCanvasObject.prototype.containsPoint = function (point) {
    const x = point.x;
    const y = point.y;
    return (
      x >= this.left &&
      x <= this.left + this.getWidth() &&
      y >= this.top &&
      y <= this.top + this.getHeight()
    );
  };
  NativeCanvasObject.prototype.scaleToWidth = function (targetW) {
    const r = targetW / this.getWidth();
    this.scaleX *= r;
    this.scaleY *= r;
  };
  NativeCanvasObject.prototype.scaleToHeight = function (targetH) {
    const r = targetH / this.getHeight();
    this.scaleX *= r;
    this.scaleY *= r;
  };
  NativeCanvasObject.prototype.remove = function () {
    if (this._parent) this._parent._removeObject(this);
  };
  NativeCanvasObject.prototype._render = function () {};
  NativeCanvasObject.prototype.callSuper = function () {};

  NativeCanvasObject.extend = function (protoProps) {
    const parent = this;
    let child;
    if (protoProps && Object.prototype.hasOwnProperty.call(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function (opts) {
        parent.call(this, opts);
      };
    }
    const Surrogate = function () {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
    child.prototype.constructor = child;
    if (protoProps) {
      for (const k in protoProps) {
        if (Object.prototype.hasOwnProperty.call(protoProps, k)) {
          child.prototype[k] = protoProps[k];
        }
      }
    }
    child.extend = NativeCanvasObject.extend;
    child.__super__ = parent.prototype;
    return child;
  };

  imgtor.CanvasObject = NativeCanvasObject;

  function NativeImageWrapper(imgEl) {
    this._el = imgEl;
    this.angle = 0;
    this.selectable = false;
    this._parent = null;
    this.left = 0;
    this.top = 0;
  }

  NativeImageWrapper.prototype.getWidth = function () {
    const { w, h } = naturalSize(this._el);
    return bbox(w, h, this.angle).width;
  };
  NativeImageWrapper.prototype.getHeight = function () {
    const { w, h } = naturalSize(this._el);
    return bbox(w, h, this.angle).height;
  };
  NativeImageWrapper.prototype.getAngle = function () {
    return this.angle;
  };
  NativeImageWrapper.prototype.getLeft = function () {
    return this.left;
  };
  NativeImageWrapper.prototype.getTop = function () {
    return this.top;
  };
  NativeImageWrapper.prototype.rotate = function (deg) {
    this.angle = ((deg % 360) + 360) % 360;
  };
  NativeImageWrapper.prototype.setScaleX = NativeImageWrapper.prototype.setScaleY = function () {};
  NativeImageWrapper.prototype.setCoords = function () {};
  NativeImageWrapper.prototype.remove = function () {
    if (this._parent) this._parent._removeObject(this);
  };
  NativeImageWrapper.prototype.toDataURL = function () {
    if (!this._parent) return '';
    return this._parent.toDataURL();
  };

  const HANDLE = 8;

  function NativeCanvasWrapper(el, options) {
    this._canvas = el;
    this._ctx = el.getContext('2d') || noop2dContext();
    this._bg = (options && options.backgroundColor) || '#fff';
    /** @type {Array<NativeImageWrapper|NativeCanvasObject>} */
    this._objects = [];
    this._listeners = new Map();
    this._activeObject = null;
    this._dragState = null;
    this._rect = null;
    this._mouseBound = false;
    this._cursor = 'default';
    Object.defineProperty(this, 'defaultCursor', {
      get: function () {
        return this._cursor;
      },
      set: function (v) {
        this._cursor = v || 'default';
        this._canvas.style.cursor = this._cursor;
      },
    });
    this.defaultCursor = 'default';
  }

  NativeCanvasWrapper.prototype.getElement = function () {
    return this._canvas;
  };

  NativeCanvasWrapper.prototype._ensureMouseBridge = function () {
    if (this._mouseBound) return;
    this._mouseBound = true;
    const el = this._canvas;
    el.addEventListener('mousedown', this._onMouseDownBound || (this._onMouseDownBound = this._onMouseDownDom.bind(this)));
    el.addEventListener('mousemove', this._onMouseMoveBound || (this._onMouseMoveBound = this._onMouseMoveDom.bind(this)));
    el.addEventListener('mouseup', this._onMouseUpBound || (this._onMouseUpBound = this._onMouseUpDom.bind(this)));
  };

  NativeCanvasWrapper.prototype._emit = function (name, payload) {
    const set = this._listeners.get(name);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch {
        /* ignore */
      }
    }
  };

  NativeCanvasWrapper.prototype._onMouseDownDom = function (e) {
    this._ensureMouseBridge();
    this.calcOffset();
    this._emit('mouse:down', { e });
    const ptr = this.getPointer(e);
    const ao = this._activeObject;
    if (ao && ao !== this._findImage()) {
      const h = this._hitHandle(ao, ptr);
      if (h) {
        this._dragState = {
          kind: 'resize',
          handle: h,
          startX: ptr.x,
          startY: ptr.y,
          origLeft: ao.left,
          origTop: ao.top,
          origW: ao.width,
          origH: ao.height,
          origSX: ao.scaleX,
          origSY: ao.scaleY,
        };
        return;
      }
      if (ao.containsPoint(ptr)) {
        this._dragState = { kind: 'move', lastX: ptr.x, lastY: ptr.y };
        return;
      }
    }
  };

  NativeCanvasWrapper.prototype._onMouseMoveDom = function (e) {
    const ptr = this.getPointer(e);
    this._emit('mouse:move', { e });
    const d = this._dragState;
    if (!d || !this._activeObject) return;
    const ao = this._activeObject;
    if (d.kind === 'move') {
      const dx = ptr.x - d.lastX;
      const dy = ptr.y - d.lastY;
      ao.left += dx;
      ao.top += dy;
      d.lastX = ptr.x;
      d.lastY = ptr.y;
      this._emit('object:moving', { target: ao });
      this.renderAll();
    } else if (d.kind === 'resize') {
      this._applyResize(ao, d, ptr);
      this._emit('object:scaling', { target: ao });
      this.renderAll();
    }
  };

  NativeCanvasWrapper.prototype._onMouseUpDom = function (e) {
    this._dragState = null;
    this._emit('mouse:up', { e });
  };

  NativeCanvasWrapper.prototype._handlePositions = function (obj) {
    const l = obj.left;
    const t = obj.top;
    const w = obj.getWidth();
    const h = obj.getHeight();
    const cx = l + w / 2;
    const cy = t + h / 2;
    return {
      TL: { x: l, y: t },
      TC: { x: cx, y: t },
      TR: { x: l + w, y: t },
      ML: { x: l, y: cy },
      MR: { x: l + w, y: cy },
      BL: { x: l, y: t + h },
      BC: { x: cx, y: t + h },
      BR: { x: l + w, y: t + h },
    };
  };

  NativeCanvasWrapper.prototype._hitHandle = function (obj, ptr) {
    const hs = this._handlePositions(obj);
    const r = HANDLE / 2;
    for (const name of Object.keys(hs)) {
      const p = hs[name];
      if (Math.abs(ptr.x - p.x) <= r && Math.abs(ptr.y - p.y) <= r) return name;
    }
    return null;
  };

  NativeCanvasWrapper.prototype._applyResize = function (obj, d, ptr) {
    const dx = ptr.x - d.startX;
    const dy = ptr.y - d.startY;
    const ol = d.origLeft;
    const ot = d.origTop;
    const ow = d.origW * d.origSX;
    const oh = d.origH * d.origSY;
    let nl = ol;
    let nt = ot;
    let nw = ow;
    let nh = oh;
    const h = d.handle;
    if (h === 'BR') {
      nw = Math.max(1, ow + dx);
      nh = Math.max(1, oh + dy);
    } else if (h === 'TR') {
      nw = Math.max(1, ow + dx);
      nh = Math.max(1, oh - dy);
      nt = ot + (oh - nh);
    } else if (h === 'BL') {
      nw = Math.max(1, ow - dx);
      nh = Math.max(1, oh + dy);
      nl = ol + (ow - nw);
    } else if (h === 'TL') {
      nw = Math.max(1, ow - dx);
      nh = Math.max(1, oh - dy);
      nl = ol + (ow - nw);
      nt = ot + (oh - nh);
    } else if (h === 'MR') {
      nw = Math.max(1, ow + dx);
    } else if (h === 'ML') {
      nw = Math.max(1, ow - dx);
      nl = ol + (ow - nw);
    } else if (h === 'BC') {
      nh = Math.max(1, oh + dy);
    } else if (h === 'TC') {
      nh = Math.max(1, oh - dy);
      nt = ot + (oh - nh);
    }
    if (obj.lockUniScaling && obj._ratioLock) {
      const r = obj._ratioLock;
      if (h === 'MR' || h === 'ML' || h === 'BR' || h === 'TR' || h === 'BL' || h === 'TL') {
        nh = nw / r;
      }
      if (h === 'TC' || h === 'BC') {
        nw = nh * r;
      }
    }
    obj.left = nl;
    obj.top = nt;
    obj.width = nw;
    obj.height = nh;
    obj.scaleX = 1;
    obj.scaleY = 1;
  };

  NativeCanvasWrapper.prototype._drawHandles = function (ctx, obj) {
    const hs = this._handlePositions(obj);
    ctx.fillStyle = '#444';
    const r = HANDLE / 2;
    for (const k of Object.keys(hs)) {
      const p = hs[k];
      ctx.fillRect(p.x - r, p.y - r, HANDLE, HANDLE);
    }
  };

  NativeCanvasWrapper.prototype._findImage = function () {
    for (let i = 0; i < this._objects.length; i++) {
      if (this._objects[i] instanceof NativeImageWrapper) return this._objects[i];
    }
    return null;
  };

  NativeCanvasWrapper.prototype._removeObject = function (obj) {
    const i = this._objects.indexOf(obj);
    if (i !== -1) this._objects.splice(i, 1);
    obj._parent = null;
    if (this._activeObject === obj) {
      this._activeObject = null;
      this._dragState = null;
    }
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.add = function (obj) {
    this._ensureMouseBridge();
    const idx = this._objects.indexOf(obj);
    if (idx === -1) this._objects.push(obj);
    obj._parent = this;
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.bringToFront = function (obj) {
    this._removeObject(obj);
    this._objects.push(obj);
    obj._parent = this;
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

  NativeCanvasWrapper.prototype.centerObject = function (obj) {
    if (!obj) {
      this.renderAll();
      return;
    }
    obj.left = this.getWidth() / 2 - obj.getWidth() / 2;
    obj.top = this.getHeight() / 2 - obj.getHeight() / 2;
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.getWidth = function () {
    return this._canvas.width;
  };
  NativeCanvasWrapper.prototype.getHeight = function () {
    return this._canvas.height;
  };

  NativeCanvasWrapper.prototype.calcOffset = function () {
    this._rect = this._canvas.getBoundingClientRect();
  };

  NativeCanvasWrapper.prototype.getPointer = function (e) {
    const r = this._rect || this._canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  NativeCanvasWrapper.prototype.getActiveObject = function () {
    return this._activeObject;
  };

  NativeCanvasWrapper.prototype.setActiveObject = function (obj) {
    this._activeObject = obj;
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.discardActiveObject = function () {
    this._activeObject = null;
    this._dragState = null;
    this.renderAll();
  };

  NativeCanvasWrapper.prototype.on = function (eventName, handler) {
    if (!this._listeners.has(eventName)) this._listeners.set(eventName, new Set());
    this._listeners.get(eventName).add(handler);
    this._ensureMouseBridge();
  };

  NativeCanvasWrapper.prototype.off = function (eventName, handler) {
    this._listeners.get(eventName)?.delete(handler);
  };

  NativeCanvasWrapper.prototype.renderAll = function () {
    const ctx = this._ctx;
    const cw = this._canvas.width;
    const ch = this._canvas.height;
    ctx.fillStyle = this._bg;
    ctx.fillRect(0, 0, cw, ch);

    for (let i = 0; i < this._objects.length; i++) {
      const obj = this._objects[i];
      if (obj instanceof NativeImageWrapper) {
        const img = obj._el;
        const { w, h } = naturalSize(img);
        if (w < 1 || h < 1) continue;
        const rad = (obj.angle * Math.PI) / 180;
        const cx = obj.left + obj.getWidth() / 2;
        const cy = obj.top + obj.getHeight() / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else if (obj._render) {
        ctx.save();
        ctx.translate(obj.left + obj.getWidth() / 2, obj.top + obj.getHeight() / 2);
        const flipX = obj.flipX ? -1 : 1;
        const flipY = obj.flipY ? -1 : 1;
        const sx = flipX / obj.scaleX;
        const sy = flipY / obj.scaleY;
        ctx.scale(sx, sy);
        obj._render(ctx);
        ctx.restore();
      }
    }

    if (this._activeObject && this._activeObject._render) {
      this._drawHandles(ctx, this._activeObject);
    }
  };

  NativeCanvasWrapper.prototype.createLockedImage = function (imageElement) {
    return imgtor.CanvasAdapterNative.createLockedImage(imageElement);
  };

  NativeCanvasWrapper.prototype.toDataURL = function (region) {
    if (!region) {
      return this._canvas.toDataURL('image/png');
    }
    const { left, top, width, height } = region;
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.floor(width));
    off.height = Math.max(1, Math.floor(height));
    const octx = off.getContext('2d');
    if (!octx) return this._canvas.toDataURL('image/png');
    octx.drawImage(
      this._canvas,
      left,
      top,
      width,
      height,
      0,
      0,
      off.width,
      off.height,
    );
    return off.toDataURL('image/png');
  };

  imgtor.CanvasAdapterNative = {
    createCanvas: function createCanvas(canvasElement, options) {
      return new NativeCanvasWrapper(canvasElement, options);
    },

    createLockedImage: function createLockedImage(imageElement) {
      return new NativeImageWrapper(imageElement);
    },

    layoutSourceImage: function layoutSourceImage(canvas, image, canvasWidth, canvasHeight) {
      canvas.setWidth(canvasWidth);
      canvas.setHeight(canvasHeight);
      canvas.add(image);
      image.left = canvasWidth / 2 - image.getWidth() / 2;
      image.top = canvasHeight / 2 - image.getHeight() / 2;
      canvas.renderAll();
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
      for (let i = canvas._objects.length - 1; i >= 0; i--) {
        if (canvas._objects[i] instanceof NativeImageWrapper) {
          canvas._objects[i]._parent = null;
          canvas._objects.splice(i, 1);
        }
      }
      const img = image._el;
      const { w, h } = naturalSize(img);
      const rad = (image.angle * Math.PI) / 180;
      ctx.fillStyle = canvas._bg;
      ctx.fillRect(0, 0, cw, ch);
      if (w >= 1 && h >= 1) {
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(rad);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      canvas.add(image);
      image.left = cw / 2 - image.getWidth() / 2;
      image.top = ch / 2 - image.getHeight() / 2;
      canvas.renderAll();
    },
  };
})();
