import { applyRedactions } from './scrambler.js';

(function () {
  'use strict';

  const RedactTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const regions = this.options.regions || [];
      const method = this.options.method || 'pixelate';
      const el = canvas.getElement();
      const ctx = el.getContext('2d');
      const w = el.width;
      const h = el.height;
      if (!ctx || w < 1 || h < 1 || regions.length === 0) {
        next();
        return;
      }
      applyRedactions(ctx, w, h, regions, method);
      const dataUrl = el.toDataURL('image/png');
      const img = new Image();
      img.onload = function () {
        const iw = this.naturalWidth || this.width;
        const ih = this.naturalHeight || this.height;
        if (iw < 1 || ih < 1) {
          next();
          return;
        }
        const inst = canvas.createLockedImage(this);
        canvas.setWidth(iw);
        canvas.setHeight(ih);
        image.remove();
        canvas.add(inst);
        next(inst);
      };
      img.onerror = function () {
        next();
      };
      img.src = dataUrl;
    },
  });

  imgtor.plugins['redact'] = imgtor.Plugin.extend({
    defaults: {
      method: 'pixelate',
    },

    initialize: function initRedactPlugin() {
      this._regions = [];
      this._drawing = false;
      this._startX = null;
      this._startY = null;
      this._liveRect = null;

      const g = this.imgtor.toolbar.createButtonGroup();
      this._toggleBtn = g.createButton({ image: 'crop' });
      this._toggleBtn.element.title = 'Redact draw';
      this._onToggle = this._toggleDraw.bind(this);
      this._toggleBtn.addEventListener('click', this._onToggle);

      const g2 = this.imgtor.toolbar.createButtonGroup();
      this._applyBtn = g2.createButton({ image: 'done' });
      this._applyBtn.element.title = 'Apply redactions';
      this._onApply = this._apply.bind(this);
      this._applyBtn.addEventListener('click', this._onApply);

      this._clearBtn = g2.createButton({ image: 'close' });
      this._clearBtn.element.title = 'Clear regions';
      this._onClear = this._clear.bind(this);
      this._clearBtn.addEventListener('click', this._onClear);

      this._onMouseDown = this._mouseDown.bind(this);
      this._onMouseMove = this._mouseMove.bind(this);
      this._onMouseUp = this._mouseUp.bind(this);
      this._onRefreshed = this._restoreOverlays.bind(this);
      this.imgtor.canvas.on('mouse:down', this._onMouseDown);
      this.imgtor.canvas.on('mouse:move', this._onMouseMove);
      this.imgtor.canvas.on('mouse:up', this._onMouseUp);
      this.imgtor.addEventListener('core:refreshed', this._onRefreshed);
    },

    _toggleDraw: function () {
      this._mode = !this._mode;
      this._toggleBtn.active(!!this._mode);
    },

    _mouseDown: function (ev) {
      if (!this._mode) return;
      const c = this.imgtor.canvas;
      const p = c.getPointer(ev.e);
      this._drawing = true;
      this._startX = p.x;
      this._startY = p.y;
      if (this._liveRect) this._liveRect.remove();
      const Rect = imgtor.CanvasObject.extend({
        _render: function (ctx) {
          ctx.strokeStyle = 'rgba(255,0,0,0.8)';
          ctx.lineWidth = 2;
          ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        },
      });
      this._liveRect = new Rect({ left: p.x, top: p.y, width: 0, height: 0 });
      c.add(this._liveRect);
    },

    _mouseMove: function (ev) {
      if (!this._drawing || !this._liveRect) return;
      const c = this.imgtor.canvas;
      const p = c.getPointer(ev.e);
      const x0 = Math.min(this._startX, p.x);
      const y0 = Math.min(this._startY, p.y);
      const w = Math.abs(p.x - this._startX);
      const h = Math.abs(p.y - this._startY);
      this._liveRect.left = x0;
      this._liveRect.top = y0;
      this._liveRect.width = w;
      this._liveRect.height = h;
      c.renderAll();
    },

    _mouseUp: function () {
      if (!this._drawing) return;
      this._drawing = false;
      const c = this.imgtor.canvas;
      const cw = c.getWidth();
      const ch = c.getHeight();
      if (this._liveRect && this._liveRect.width > 2 && this._liveRect.height > 2) {
        this._regions.push({
          left: this._liveRect.left / cw,
          top: this._liveRect.top / ch,
          width: this._liveRect.width / cw,
          height: this._liveRect.height / ch,
        });
      }
      if (this._liveRect) {
        this._liveRect.remove();
        this._liveRect = null;
      }
      this._restoreOverlays();
    },

    _restoreOverlays: function () {
      const c = this.imgtor.canvas;
      if (this._overlays) {
        for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
      }
      this._overlays = [];
      const cw = c.getWidth();
      const ch = c.getHeight();
      const Rect = imgtor.CanvasObject.extend({
        _render: function (ctx) {
          ctx.strokeStyle = 'rgba(200,0,0,0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
          ctx.setLineDash([]);
        },
      });
      for (let i = 0; i < this._regions.length; i++) {
        const r = this._regions[i];
        const o = new Rect({
          left: r.left * cw,
          top: r.top * ch,
          width: r.width * cw,
          height: r.height * ch,
        });
        this._overlays.push(o);
        c.add(o);
      }
      if (this._overlays.length > 0) {
        c.bringToFront(this._overlays[this._overlays.length - 1]);
      }
      c.renderAll();
    },

    _apply: function () {
      if (this._regions.length === 0) return;
      this.imgtor.applyTransformation(
        new RedactTransformation({ regions: this._regions.slice(), method: this.options.method }),
      );
      this._regions = [];
      if (this._overlays) {
        for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
        this._overlays = [];
      }
    },

    _clear: function () {
      this._regions = [];
      if (this._overlays) {
        for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
        this._overlays = [];
      }
      this.imgtor.canvas.renderAll();
    },

    destroy: function destroyRedactPlugin() {
      this.imgtor.canvas.off('mouse:down', this._onMouseDown);
      this.imgtor.canvas.off('mouse:move', this._onMouseMove);
      this.imgtor.canvas.off('mouse:up', this._onMouseUp);
      this.imgtor.removeEventListener('core:refreshed', this._onRefreshed);
      if (this._toggleBtn && this._onToggle) this._toggleBtn.removeEventListener('click', this._onToggle);
      if (this._applyBtn && this._onApply) this._applyBtn.removeEventListener('click', this._onApply);
      if (this._clearBtn && this._onClear) this._clearBtn.removeEventListener('click', this._onClear);
      this._clear();
    },
  });
})();
