(function () {
  'use strict';

  const AnnotateTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const shapes = this.options.shapes || [];
      const el = canvas.getElement();
      const w = el.width;
      const h = el.height;
      const ctx = el.getContext('2d');
      if (!ctx || w < 1 || h < 1) {
        next();
        return;
      }
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        ctx.save();
        ctx.strokeStyle = s.strokeColor || '#f00';
        ctx.lineWidth = s.strokeWidth || 2;
        ctx.translate(s.left + s.width / 2, s.top + s.height / 2);
        ctx.strokeRect(-s.width / 2, -s.height / 2, s.width, s.height);
        ctx.restore();
      }
      const dataUrl = el.toDataURL('image/png');
      const img = new Image();
      img.onload = function () {
        const inst = canvas.createLockedImage(this);
        canvas.setWidth(this.width);
        canvas.setHeight(this.height);
        image.remove();
        canvas.add(inst);
        next(inst);
      };
      img.src = dataUrl;
    },
  });

  imgtor.plugins['annotate'] = imgtor.Plugin.extend({
    defaults: {},

    initialize: function initAnnotatePlugin() {
      this._shapes = [];
      this._overlays = [];
      this._drawing = false;
      this._sx = null;
      this._sy = null;
      this._live = null;

      const g = this.imgtor.toolbar.createButtonGroup();
      this._toolBtn = g.createButton({ image: 'rotate-left' });
      this._toolBtn.element.title = 'Rect tool';
      this._onTool = this._toggle.bind(this);
      this._toolBtn.addEventListener('click', this._onTool);

      const g2 = this.imgtor.toolbar.createButtonGroup();
      this._confirmBtn = g2.createButton({ image: 'done' });
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
      this.imgtor.applyTransformation(new AnnotateTransformation({ shapes: this._shapes.slice() }));
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
