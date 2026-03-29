import { defaultFillOptions, fillToCSS, applyFillPreview } from './palette.js';

(function () {
  'use strict';

  const FillTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const fill = this.options.fill;
      const el = canvas.getElement();
      const w = el.width;
      const h = el.height;
      const ctx = el.getContext('2d');
      if (!ctx || w < 1 || h < 1) {
        next();
        return;
      }
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d');
      octx.fillStyle = fillToCSS(fill);
      octx.fillRect(0, 0, w, h);
      octx.drawImage(el, 0, 0);

      const dataUrl = off.toDataURL('image/png');
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

  imgtor.plugins['fill'] = imgtor.Plugin.extend({
    defaults: {},

    initialize: function initFillPlugin() {
      this._currentFill = defaultFillOptions[0];
      this._originalBg = this.imgtor.canvas._bg;

      const group = this.imgtor.toolbar.createButtonGroup();
      this._swatches = [];
      for (let i = 0; i < defaultFillOptions.length; i++) {
        const fill = defaultFillOptions[i];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'imgtor-fill-swatch';
        b.title = 'Fill ' + i;
        b.dataset.plugin = 'fill';
        b.dataset.feature = 'swatch-' + i;
        const css = fillToCSS(fill);
        if (fill[3] === 0) {
          b.style.background =
            'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)';
          b.style.backgroundSize = '8px 8px';
          b.style.backgroundPosition = '0 0,0 4px,4px -4px,-4px 0';
        } else {
          b.style.backgroundColor = css;
        }
        const self = this;
        const fi = fill;
        const handler = function () {
          self._currentFill = fi;
          applyFillPreview(self.imgtor.canvas, fi);
        };
        b.addEventListener('click', handler);
        group.element.appendChild(b);
        this._swatches.push({ el: b, handler });
      }

      const applyG = this.imgtor.toolbar.createButtonGroup();
      this._bakeBtn = applyG.createButton({
        image: 'done',
        pluginId: 'fill',
        feature: 'bake',
      });
      this._bakeBtn.element.title = 'Bake fill';
      this._onBake = this._bake.bind(this);
      this._bakeBtn.addEventListener('click', this._onBake);

      this._onRefreshed = this._syncPreview.bind(this);
      this._onTransform = this._syncPreview.bind(this);
      this.imgtor.addEventListener('core:refreshed', this._onRefreshed);
      this.imgtor.addEventListener('core:transformation', this._onTransform);
    },

    _syncPreview: function () {
      applyFillPreview(this.imgtor.canvas, this._currentFill);
    },

    _bake: function () {
      this.imgtor.applyTransformation(new FillTransformation({ fill: this._currentFill.slice() }));
    },

    destroy: function destroyFillPlugin() {
      this.imgtor.removeEventListener('core:refreshed', this._onRefreshed);
      this.imgtor.removeEventListener('core:transformation', this._onTransform);
      if (this._bakeBtn && this._onBake) {
        this._bakeBtn.removeEventListener('click', this._onBake);
      }
      for (let i = 0; i < this._swatches.length; i++) {
        this._swatches[i].el.removeEventListener('click', this._swatches[i].handler);
      }
      this.imgtor.canvas._bg = this._originalBg;
      this.imgtor.canvas.renderAll();
    },
  });
})();
