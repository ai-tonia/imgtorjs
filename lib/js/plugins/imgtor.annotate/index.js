(function () {
  'use strict';

  const AnnotateTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const shapes = this.options.shapes || [];
      const sourceEl = canvas.getElement();
      const snapshot = sourceEl.toDataURL('image/png');
      const iw = Math.max(1, Math.floor(image.getWidth()));
      const ih = Math.max(1, Math.floor(image.getHeight()));
      const vw = Math.max(1, this.options.viewportWidth || iw);
      const vh = Math.max(1, this.options.viewportHeight || ih);
      const sx = iw / vw;
      const sy = ih / vh;

      const imgBase = new Image();
      imgBase.onload = function () {
        const off = document.createElement('canvas');
        off.width = iw;
        off.height = ih;
        const ctx = off.getContext('2d');
        if (!ctx) {
          next();
          return;
        }
        ctx.drawImage(imgBase, 0, 0, iw, ih);
        for (let i = 0; i < shapes.length; i++) {
          const s = shapes[i];
          ctx.save();
          ctx.strokeStyle = s.strokeColor || '#f00';
          ctx.lineWidth = Math.max(1, (s.strokeWidth || 2) * Math.min(sx, sy));
          const cx = (s.left + s.width / 2) * sx;
          const cy = (s.top + s.height / 2) * sy;
          const sw = s.width * sx;
          const sh = s.height * sy;
          ctx.translate(cx, cy);
          ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
          ctx.restore();
        }
        const dataUrl = off.toDataURL('image/png');
        const img = new Image();
        img.onload = function () {
          const natW = this.naturalWidth || this.width;
          const natH = this.naturalHeight || this.height;
          if (natW < 1 || natH < 1) {
            next();
            return;
          }
          const inst = canvas.createLockedImage(this);
          canvas.setWidth(natW);
          canvas.setHeight(natH);
          image.remove();
          canvas.add(inst);
          next(inst);
        };
        img.onerror = function () {
          next();
        };
        img.src = dataUrl;
      };
      imgBase.onerror = function () {
        next();
      };
      imgBase.src = snapshot;
    },
  });

  imgtor.plugins['annotate'] = imgtor.Plugin.extend({
    defaults: {},

    initialize: function initAnnotatePlugin() {
      this._active = false;
      this._shapes = [];
      this._overlays = [];
      this._drawing = false;
      this._sx = null;
      this._sy = null;
      this._live = null;

      const g = this.imgtor.toolbar.createButtonGroup();
      this._toolBtn = g.createButton({
        image: 'annotate',
        pluginId: 'annotate',
        feature: 'toggle-tool',
      });
      this._toolBtn.element.title = 'Rect tool';
      this._onTool = this._toggle.bind(this);
      this._toolBtn.addEventListener('click', this._onTool);

      const g2 = this.imgtor.toolbar.createButtonGroup();
      this._confirmBtn = g2.createButton({
        image: 'done',
        pluginId: 'annotate',
        feature: 'bake',
      });
      this._confirmBtn.element.title = 'Bake annotations';
      this._onConfirm = this._confirm.bind(this);
      this._confirmBtn.addEventListener('click', this._onConfirm);

      this._md = this._onDown.bind(this);
      this._mm = this._onMove.bind(this);
      this._mu = this._onUp.bind(this);
      this._onRef = this._restore.bind(this);
      this.imgtor.canvas.on('mouse:down', this._md);
      this.imgtor.canvas.on('mouse:move', this._mm);
      this.imgtor.canvas.on('mouse:up', this._mu);
      this.imgtor.addEventListener('core:refreshed', this._onRef);
    },

    _toggle: function () {
      this._active = !this._active;
      this._toolBtn.active(!!this._active);
    },

    _onDown: function (ev) {
      if (!this._active) return;
      const c = this.imgtor.canvas;
      const p = c.getPointer(ev.e);
      this._drawing = true;
      this._sx = p.x;
      this._sy = p.y;
      if (this._live) this._live.remove();
      const Rect = imgtor.CanvasObject.extend({
        _render: function (ctx) {
          ctx.strokeStyle = '#0af';
          ctx.lineWidth = 2;
          ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        },
      });
      this._live = new Rect({ left: p.x, top: p.y, width: 0, height: 0 });
      c.add(this._live);
    },

    _onMove: function (ev) {
      if (!this._drawing || !this._live) return;
      const c = this.imgtor.canvas;
      const p = c.getPointer(ev.e);
      const x0 = Math.min(this._sx, p.x);
      const y0 = Math.min(this._sy, p.y);
      this._live.left = x0;
      this._live.top = y0;
      this._live.width = Math.abs(p.x - this._sx);
      this._live.height = Math.abs(p.y - this._sy);
      c.renderAll();
    },

    _onUp: function () {
      if (!this._drawing) return;
      this._drawing = false;
      if (this._live && this._live.width > 2 && this._live.height > 2) {
        this._shapes.push({
          left: this._live.left,
          top: this._live.top,
          width: this._live.width,
          height: this._live.height,
          strokeColor: '#f00',
          strokeWidth: 2,
        });
      }
      if (this._live) {
        this._live.remove();
        this._live = null;
      }
      this._restore();
    },

    _restore: function () {
      const c = this.imgtor.canvas;
      for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
      this._overlays = [];
      const Rect = imgtor.CanvasObject.extend({
        _render: function (ctx) {
          ctx.strokeStyle = this._sc;
          ctx.lineWidth = this._sw;
          ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        },
      });
      for (let i = 0; i < this._shapes.length; i++) {
        const s = this._shapes[i];
        const o = new Rect({ left: s.left, top: s.top, width: s.width, height: s.height });
        o._sc = s.strokeColor;
        o._sw = s.strokeWidth;
        this._overlays.push(o);
        c.add(o);
      }
      if (this._overlays.length) c.bringToFront(this._overlays[this._overlays.length - 1]);
      c.renderAll();
    },

    _confirm: function () {
      if (this._shapes.length === 0) return;
      const c = this.imgtor.canvas;
      this.imgtor.applyTransformation(
        new AnnotateTransformation({
          shapes: this._shapes.slice(),
          viewportWidth: c.getWidth(),
          viewportHeight: c.getHeight(),
        }),
      );
      this._shapes = [];
      for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
      this._overlays = [];
    },

    destroy: function () {
      this.imgtor.canvas.off('mouse:down', this._md);
      this.imgtor.canvas.off('mouse:move', this._mm);
      this.imgtor.canvas.off('mouse:up', this._mu);
      this.imgtor.removeEventListener('core:refreshed', this._onRef);
      if (this._toolBtn) this._toolBtn.removeEventListener('click', this._onTool);
      if (this._confirmBtn) this._confirmBtn.removeEventListener('click', this._onConfirm);
      for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
    },
  });
})();
