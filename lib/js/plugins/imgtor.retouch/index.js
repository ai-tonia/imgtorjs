(function () {
  'use strict';

  imgtor.plugins['retouch'] = imgtor.Plugin.extend({
    defaults: {
      onSelectionComplete: null,
      gridSize: 0,
    },

    initialize: function initRetouchPlugin() {
      this._selecting = false;
      this._sx = null;
      this._sy = null;
      this._rect = null;

      const g = this.imgtor.toolbar.createButtonGroup();
      this._btn = g.createButton({
        image: 'retouch',
        pluginId: 'retouch',
        feature: 'toggle-select',
      });
      this._btn.element.title = 'Select region';
      this._btn.addEventListener(
        'click',
        function () {
          this._selecting = !this._selecting;
          this._btn.active(this._selecting);
        }.bind(this),
      );

      this._md = this._down.bind(this);
      this._mu = this._up.bind(this);
      this.imgtor.canvas.on('mouse:down', this._md);
      this.imgtor.canvas.on('mouse:up', this._mu);
    },

    placeResult: function (imageURL, region) {
      const c = this.imgtor.canvas;
      const img = new Image();
      img.onload = function () {
        const R = imgtor.CanvasObject.extend({
          _render: function (ctx) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
          },
        });
        const o = new R({
          left: region.left * c.getWidth(),
          top: region.top * c.getHeight(),
          width: region.width * c.getWidth(),
          height: region.height * c.getHeight(),
        });
        c.add(o);
        c.renderAll();
      };
      img.src = imageURL;
    },

    _down: function (ev) {
      if (!this._selecting) return;
      const p = this.imgtor.canvas.getPointer(ev.e);
      this._sx = p.x;
      this._sy = p.y;
    },

    _up: function (ev) {
      if (!this._selecting || this._sx == null) return;
      const c = this.imgtor.canvas;
      const p = c.getPointer(ev.e);
      const cw = c.getWidth();
      const ch = c.getHeight();
      const left = Math.min(this._sx, p.x) / cw;
      const top = Math.min(this._sy, p.y) / ch;
      const width = Math.abs(p.x - this._sx) / cw;
      const height = Math.abs(p.y - this._sy) / ch;
      if (width < 0.01 || height < 0.01) return;
      const region = { left, top, width, height };
      const el = c.getElement();
      const px = Math.floor(left * el.width);
      const py = Math.floor(top * el.height);
      const pw = Math.floor(width * el.width);
      const ph = Math.floor(height * el.height);
      const off = document.createElement('canvas');
      off.width = Math.max(1, pw);
      off.height = Math.max(1, ph);
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(el, px, py, pw, ph, 0, 0, pw, ph);
      const dataUrl = off.toDataURL('image/png');
      if (typeof this.options.onSelectionComplete === 'function') {
        this.options.onSelectionComplete(dataUrl, region, this.placeResult.bind(this));
      }
    },

    destroy: function () {
      this.imgtor.canvas.off('mouse:down', this._md);
      this.imgtor.canvas.off('mouse:up', this._mu);
    },
  });
})();
