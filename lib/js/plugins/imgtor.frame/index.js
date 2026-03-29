import { defaultFrameStyles } from './styles.js';
import { defaultFrameOptions } from './menu.js';
import { expandFrame } from './preprocess.js';

(function () {
  'use strict';

  function drawFrameDefs(ctx, cw, ch, defs) {
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      ctx.strokeStyle = d.strokeColor || 'transparent';
      ctx.fillStyle = d.fillColor || 'transparent';
      ctx.lineWidth = d.strokeWidth || 1;
      if (d.type === 'rect') {
        const x = d.x - cw / 2;
        const y = d.y - ch / 2;
        if (d.fillColor) {
          if (d.rx) {
            roundRectPath(ctx, x, y, d.w, d.h, d.rx);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, d.w, d.h);
          }
        }
        if (d.strokeWidth > 0 && d.strokeColor) {
          ctx.beginPath();
          if (d.rx) {
            roundRectPath(ctx, x, y, d.w, d.h, d.rx);
          } else {
            ctx.rect(x, y, d.w, d.h);
          }
          ctx.stroke();
        }
      } else if (d.type === 'path' && d.points && d.points.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(d.points[0] - cw / 2, d.points[1] - ch / 2);
        for (let j = 2; j < d.points.length; j += 2) {
          ctx.lineTo(d.points[j] - cw / 2, d.points[j + 1] - ch / 2);
        }
        ctx.stroke();
      }
    }
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const FrameOverlay = imgtor.CanvasObject.extend({
    _render: function (ctx) {
      drawFrameDefs(ctx, this._cw, this._ch, this._defs);
    },
  });

  const FrameTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const style = this.options.style;
      if (!style) {
        next();
        return;
      }
      const el = canvas.getElement();
      const w = el.width;
      const h = el.height;
      const ctx = el.getContext('2d');
      if (!ctx || w < 1 || h < 1) {
        next();
        return;
      }
      const defs = expandFrame(style, w, h);
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(el, 0, 0);
      tctx.save();
      tctx.translate(w / 2, h / 2);
      drawFrameDefs(tctx, w, h, defs);
      tctx.restore();

      const dataUrl = tmp.toDataURL('image/png');
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

  imgtor.plugins['frame'] = imgtor.Plugin.extend({
    defaults: {},

    initialize: function initFramePlugin() {
      this._activeId = null;
      this._frameOverlay = null;
      this._buttons = [];

      const group = this.imgtor.toolbar.createButtonGroup();
      for (let i = 0; i < defaultFrameOptions.length; i++) {
        const pair = defaultFrameOptions[i];
        const id = pair[0];
        const label = pair[1];
        const btn = group.createButton({
          image: 'done',
          pluginId: 'frame',
          feature: id === null ? 'none' : String(id),
        });
        const thumb = id && defaultFrameStyles[id] ? defaultFrameStyles[id].thumb : '<span style="font-size:10px">—</span>';
        btn.element.innerHTML = '<span class="imgtor-frame-thumb">' + thumb + '</span>';
        btn.element.title = label;
        const self = this;
        const fid = id;
        const handler = function onFrameStyleClick() {
          self._activeId = fid;
          self._rebuildFrame();
        };
        btn.addEventListener('click', handler);
        this._buttons.push({ btn, handler });
      }

      const applyGroup = this.imgtor.toolbar.createButtonGroup();
      this._applyBtn = applyGroup.createButton({
        image: 'done',
        pluginId: 'frame',
        feature: 'bake',
      });
      this._applyBtn.element.title = 'Bake frame';
      this._onApply = this._applyFrame.bind(this);
      this._applyBtn.addEventListener('click', this._onApply);

      this._onRefreshed = this._rebuildFrame.bind(this);
      this._onTransform = this._rebuildFrame.bind(this);
      this.imgtor.addEventListener('core:refreshed', this._onRefreshed);
      this.imgtor.addEventListener('core:transformation', this._onTransform);
    },

    _rebuildFrame: function () {
      const canvas = this.imgtor.canvas;
      if (this._frameOverlay) {
        this._frameOverlay.remove();
        this._frameOverlay = null;
      }
      if (!this._activeId) {
        canvas.renderAll();
        return;
      }
      const style = defaultFrameStyles[this._activeId];
      if (!style) {
        canvas.renderAll();
        return;
      }
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      const defs = expandFrame(style, cw, ch);
      const overlay = new FrameOverlay({ left: 0, top: 0, width: cw, height: ch });
      overlay._cw = cw;
      overlay._ch = ch;
      overlay._defs = defs;
      this._frameOverlay = overlay;
      canvas.add(overlay);
      canvas.bringToFront(overlay);
      canvas.renderAll();
    },

    _applyFrame: function () {
      if (!this._activeId) return;
      const style = defaultFrameStyles[this._activeId];
      if (!style) return;
      this.imgtor.applyTransformation(new FrameTransformation({ style: style }));
      this._activeId = null;
      if (this._frameOverlay) {
        this._frameOverlay.remove();
        this._frameOverlay = null;
      }
    },

    destroy: function destroyFramePlugin() {
      this.imgtor.removeEventListener('core:refreshed', this._onRefreshed);
      this.imgtor.removeEventListener('core:transformation', this._onTransform);
      if (this._applyBtn && this._onApply) {
        this._applyBtn.removeEventListener('click', this._onApply);
      }
      for (let i = 0; i < this._buttons.length; i++) {
        this._buttons[i].btn.removeEventListener('click', this._buttons[i].handler);
      }
      this._buttons = [];
      if (this._frameOverlay) this._frameOverlay.remove();
    },
  });
})();
