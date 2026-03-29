(function () {
  'use strict';

  const DecorateTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const shapes = this.options.shapes || [];
      const vEl = this.options.viewportEl;
      const sourceEl = canvas.getElement();
      const snapshot = sourceEl.toDataURL('image/png');
      const iw = Math.max(1, Math.floor(image.getWidth()));
      const ih = Math.max(1, Math.floor(image.getHeight()));
      const vw = Math.max(1, vEl ? vEl.width : iw);
      const vh = Math.max(1, vEl ? vEl.height : ih);
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
          ctx.strokeStyle = s.strokeColor || '#0f0';
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

  imgtor.plugins['decorate'] = imgtor.Plugin.extend({
    defaults: {},

    initialize: function initDecoratePlugin() {
      this._on = false;
      this._shapes = [];
      this._overlays = [];
      this._drawing = false;
      this._sx = null;
      this._sy = null;
      this._live = null;

      const g = this.imgtor.toolbar.createButtonGroup();
      this._btn = g.createButton({
        image: 'decorate',
        pluginId: 'decorate',
        feature: 'toggle-tool',
      });
      this._btn.element.title = 'Decorate rect';
      this._btn.addEventListener(
        'click',
        function () {
          this._on = !this._on;
          this._btn.active(this._on);
        }.bind(this),
      );

      const g2 = this.imgtor.toolbar.createButtonGroup();
      this._bake = g2.createButton({
        image: 'done',
        pluginId: 'decorate',
        feature: 'bake',
      });
      this._bake.element.title = 'Bake decorate';
      this._bake.addEventListener('click', this._apply.bind(this));

      this._md = this._down.bind(this);
      this._mm = this._move.bind(this);
      this._mu = this._up.bind(this);
      this._ref = this._restore.bind(this);
      this.imgtor.canvas.on('mouse:down', this._md);
      this.imgtor.canvas.on('mouse:move', this._mm);
      this.imgtor.canvas.on('mouse:up', this._mu);
      this.imgtor.addEventListener('core:refreshed', this._ref);
    },

    _down: function (ev) {
      if (!this._on) return;
      const c = this.imgtor.canvas;
      const p = c.getPointer(ev.e);
      this._drawing = true;
      this._sx = p.x;
      this._sy = p.y;
      if (this._live) this._live.remove();
      const R = imgtor.CanvasObject.extend({
        _render: function (ctx) {
          ctx.strokeStyle = '#0f0';
          ctx.lineWidth = 2;
          ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        },
      });
      this._live = new R({ left: p.x, top: p.y, width: 0, height: 0 });
      c.add(this._live);
    },

    _move: function (ev) {
      if (!this._drawing || !this._live) return;
      const p = this.imgtor.canvas.getPointer(ev.e);
      this._live.left = Math.min(this._sx, p.x);
      this._live.top = Math.min(this._sy, p.y);
      this._live.width = Math.abs(p.x - this._sx);
      this._live.height = Math.abs(p.y - this._sy);
      this.imgtor.canvas.renderAll();
    },

    _up: function () {
      if (!this._drawing) return;
      this._drawing = false;
      if (this._live && this._live.width > 2 && this._live.height > 2) {
        this._shapes.push({
          left: this._live.left,
          top: this._live.top,
          width: this._live.width,
          height: this._live.height,
          strokeColor: '#0a0',
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
      const R = imgtor.CanvasObject.extend({
        _render: function (ctx) {
          ctx.strokeStyle = this._sc;
          ctx.lineWidth = this._sw;
          ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        },
      });
      for (let i = 0; i < this._shapes.length; i++) {
        const s = this._shapes[i];
        const o = new R({ left: s.left, top: s.top, width: s.width, height: s.height });
        o._sc = s.strokeColor;
        o._sw = s.strokeWidth;
        this._overlays.push(o);
        c.add(o);
      }
      if (this._overlays.length) c.bringToFront(this._overlays[this._overlays.length - 1]);
      c.renderAll();
    },

    _apply: function () {
      if (!this._shapes.length) return;
      this.imgtor.applyTransformation(
        new DecorateTransformation({
          shapes: this._shapes.slice(),
          viewportEl: this.imgtor.canvas.getElement(),
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
      this.imgtor.removeEventListener('core:refreshed', this._ref);
      for (let i = 0; i < this._overlays.length; i++) this._overlays[i].remove();
    },
  });
})();
