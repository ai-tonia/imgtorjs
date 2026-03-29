/**
 * Resize plugin — registered from `lib/entry-imgtor.js`.
 */
import { createAspectLock, parsePositiveInt } from './aspectLock.js';
import { clampDimensions, effectiveConstraints } from './constraints.js';
import { createDimensionInputs } from './dimensions.js';
import { createApplyControl } from './footer.js';
import { RESIZE_PRESETS, applyPresetValue } from './presets.js';

(function () {
  'use strict';

  const ResizeTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const el = image && image._el;
      if (!el) {
        next();
        return;
      }

      const sw = el.naturalWidth || el.width || 0;
      const sh = el.naturalHeight || el.height || 0;
      const dw = Math.floor(this.options.width);
      const dh = Math.floor(this.options.height);
      const prevAngle = typeof image.getAngle === 'function' ? image.getAngle() : 0;

      if (sw < 1 || sh < 1 || dw < 1 || dh < 1) {
        next();
        return;
      }

      const off = document.createElement('canvas');
      off.width = dw;
      off.height = dh;
      const octx = off.getContext('2d');
      if (!octx) {
        next();
        return;
      }

      octx.drawImage(el, 0, 0, sw, sh, 0, 0, dw, dh);

      const out = new Image();
      out.onerror = function () {
        next();
      };
      out.onload = function () {
        const w = this.naturalWidth || this.width;
        const h = this.naturalHeight || this.height;
        if (h < 1 || w < 1) {
          next();
          return;
        }

        const imgInstance = canvas.createLockedImage(this);
        if (typeof imgInstance.rotate === 'function') imgInstance.rotate(prevAngle);

        const vp = imgtor.Utils.computeImageViewPort(imgInstance);
        canvas.setWidth(vp.width);
        canvas.setHeight(vp.height);
        image.remove();
        canvas.add(imgInstance);
        next(imgInstance);
      };
      out.src = off.toDataURL('image/png');
    },
  });

  imgtor.plugins['resize'] = imgtor.Plugin.extend({
    defaults: {
      minWidth: null,
      maxWidth: null,
      minHeight: null,
      maxHeight: null,
    },

    initialize: function initImgTorResizePlugin() {
      const group = this.imgtor.toolbar.createButtonGroup();

      const dims = createDimensionInputs(document);
      this._dims = dims;

      const vp = imgtor.Utils.computeImageViewPort(this.imgtor.sourceImage);
      const ratio = vp.height > 0 ? vp.width / vp.height : 1;
      this._aspect = createAspectLock(document, ratio);
      this._aspect.setRatioFromDimensions(vp.width, vp.height);
      dims.setValues(Math.round(vp.width), Math.round(vp.height));

      const presetWrap = document.createElement('div');
      presetWrap.className = 'imgtor-resize-presets';
      const presetLabel = document.createElement('span');
      presetLabel.className = 'imgtor-resize-preset-label';
      presetLabel.textContent = 'Preset';
      const presetSelect = document.createElement('select');
      presetSelect.className = 'imgtor-resize-preset-select';
      presetSelect.setAttribute('aria-label', 'Resize preset');
      presetSelect.dataset.plugin = 'resize';
      presetSelect.dataset.feature = 'preset';
      for (let i = 0; i < RESIZE_PRESETS.length; i++) {
        const p = RESIZE_PRESETS[i];
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = p.label;
        presetSelect.appendChild(opt);
      }
      presetWrap.appendChild(presetLabel);
      presetWrap.appendChild(presetSelect);

      const applyCtl = createApplyControl(document);
      this._applyCtl = applyCtl;

      group.element.appendChild(dims.element);
      group.element.appendChild(this._aspect.element);
      group.element.appendChild(presetWrap);
      group.element.appendChild(applyCtl.element);

      this._onWidthInput = this._onWidthInput.bind(this);
      this._onHeightInput = this._onHeightInput.bind(this);
      this._onAspectChange = this._onAspectChange.bind(this);
      this._onPresetChange = this._onPresetChange.bind(this);
      this._onApply = this._onApply.bind(this);
      this._onRefreshed = this._syncFromSource.bind(this);

      dims.widthInput.addEventListener('input', this._onWidthInput);
      dims.heightInput.addEventListener('input', this._onHeightInput);
      this._aspect.input.addEventListener('change', this._onAspectChange);
      presetSelect.addEventListener('change', this._onPresetChange);
      applyCtl.addClickListener(this._onApply);
      this.imgtor.addEventListener('core:refreshed', this._onRefreshed);

      this._presetSelect = presetSelect;
    },

    _constraints: function () {
      return effectiveConstraints(this.imgtor, this.options);
    },

    _syncFromSource: function () {
      const vp = imgtor.Utils.computeImageViewPort(this.imgtor.sourceImage);
      this._aspect.setRatioFromDimensions(vp.width, vp.height);
      this._dims.setValues(Math.round(vp.width), Math.round(vp.height));
    },

    _onWidthInput: function () {
      const w = parsePositiveInt(this._dims.widthInput.value, 1);
      this._dims.widthInput.value = String(w);
      this._aspect.syncFromWidth(w, this._dims.heightInput);
    },

    _onHeightInput: function () {
      const h = parsePositiveInt(this._dims.heightInput.value, 1);
      this._dims.heightInput.value = String(h);
      this._aspect.syncFromHeight(h, this._dims.widthInput);
    },

    _onAspectChange: function () {
      const w = parsePositiveInt(this._dims.widthInput.value, 1);
      const h = parsePositiveInt(this._dims.heightInput.value, 1);
      this._aspect.setRatioFromDimensions(w, h);
      if (this._aspect.locked) this._onWidthInput();
    },

    _onPresetChange: function () {
      const idx = parseInt(this._presetSelect.value, 10);
      const preset = RESIZE_PRESETS[idx];
      applyPresetValue(preset, (w, h) => {
        this._dims.setValues(w, h);
        this._aspect.setRatioFromDimensions(w, h);
      });
    },

    _onApply: function () {
      const rawW = parsePositiveInt(this._dims.widthInput.value, 1);
      const rawH = parsePositiveInt(this._dims.heightInput.value, 1);
      const { width, height } = clampDimensions(rawW, rawH, this._constraints());
      this._dims.setValues(width, height);
      this.imgtor.applyTransformation(new ResizeTransformation({ width, height }));
    },

    destroy: function destroyResizePlugin() {
      this.imgtor.removeEventListener('core:refreshed', this._onRefreshed);
      if (this._dims) {
        this._dims.widthInput.removeEventListener('input', this._onWidthInput);
        this._dims.heightInput.removeEventListener('input', this._onHeightInput);
      }
      if (this._aspect && this._aspect.input) {
        this._aspect.input.removeEventListener('change', this._onAspectChange);
      }
      if (this._presetSelect) {
        this._presetSelect.removeEventListener('change', this._onPresetChange);
      }
      if (this._applyCtl) this._applyCtl.removeClickListener(this._onApply);
    },
  });
})();
