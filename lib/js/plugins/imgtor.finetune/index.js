import {
  brightness,
  clarity,
  contrast,
  exposure,
  gamma,
  identityMatrix,
  multiplyMatrix,
  saturation,
  vignette,
} from './controls.js';
import { defaultFinetuneOptions } from './layout.js';

(function () {
  'use strict';

  const imgtor = globalThis.imgtor;

  function clamp255(x) {
    if (x < 0) return 0;
    if (x > 255) return 255;
    return x;
  }

  /**
   * @param {Record<string, number>} values
   * @returns {Float32Array}
   */
  function composeFinetuneMatrix(values) {
    const a = identityMatrix();
    const b = new Float32Array(20);
    multiplyMatrix(b, brightness.computeMatrix(values.brightness), a);
    multiplyMatrix(a, contrast.computeMatrix(values.contrast), b);
    multiplyMatrix(b, saturation.computeMatrix(values.saturation), a);
    multiplyMatrix(a, exposure.computeMatrix(values.exposure), b);
    return a;
  }

  /**
   * @param {ImageData} imageData
   * @param {Float32Array} m
   */
  function applyColorMatrix(imageData, m) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const a = d[i + 3];
      d[i] = clamp255(r * m[0] + g * m[1] + b * m[2] + a * m[3] + m[4]);
      d[i + 1] = clamp255(r * m[5] + g * m[6] + b * m[7] + a * m[8] + m[9]);
      d[i + 2] = clamp255(r * m[10] + g * m[11] + b * m[12] + a * m[13] + m[14]);
      d[i + 3] = clamp255(r * m[15] + g * m[16] + b * m[17] + a * m[18] + m[19]);
    }
  }

  const FinetuneTransformation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const viewport = imgtor.Utils.computeImageViewPort(image);
      const w = Math.floor(viewport.width);
      const h = Math.floor(viewport.height);
      if (w < 1 || h < 1) {
        return;
      }

      const values = this.options.values || {};
      const snapshot = new Image();
      snapshot.onload = function () {
        const el = document.createElement('canvas');
        el.width = w;
        el.height = h;
        const ctx = el.getContext('2d');
        if (!ctx) {
          return;
        }
        ctx.drawImage(snapshot, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);

        const matrix = composeFinetuneMatrix(values);
        applyColorMatrix(imageData, matrix);
        gamma.applyPixels(imageData, values.gamma);
        clarity.applyPixels(imageData, values.clarity);
        vignette.applyPixels(imageData, values.vignette);

        ctx.putImageData(imageData, 0, 0);
        const outUrl = el.toDataURL('image/png');
        const out = new Image();
        out.onload = function () {
          const imgInstance = canvas.createLockedImage(out);
          canvas.setWidth(w);
          canvas.setHeight(h);
          image.remove();
          canvas.add(imgInstance);
          next(imgInstance);
        };
        out.src = outUrl;
      };
      snapshot.src = canvas.toDataURL();
    },
  });

  const RANGE_DEFAULTS = {
    brightness: { min: -100, max: 100, default: 0 },
    contrast: { min: 0, max: 200, default: 100 },
    saturation: { min: 0, max: 200, default: 100 },
    exposure: { min: -100, max: 100, default: 0 },
    gamma: { min: 20, max: 300, default: 100 },
    clarity: { min: 0, max: 100, default: 0 },
    vignette: { min: 0, max: 100, default: 0 },
  };

  imgtor.plugins.finetune = imgtor.Plugin.extend({
    defaults: {
      controls: defaultFinetuneOptions,
    },

    initialize: function initFinetunePlugin() {
      const buttonGroup = this.imgtor.toolbar.createButtonGroup();
      this._toggleButton = buttonGroup.createButton({
        image: 'finetune',
        pluginId: 'finetune',
        feature: 'toggle-panel',
      });
      this._toggleButton.element.title = 'Finetune';

      this._panel = document.createElement('div');
      this._panel.className = 'imgtor-finetune-panel';
      this._panel.dataset.plugin = 'finetune';
      this._panel.dataset.feature = 'panel';
      this._panel.style.display = 'none';
      this._panel.style.flexDirection = 'column';
      this._panel.style.gap = '6px';
      this._panel.style.padding = '6px 0';
      this._panel.style.minWidth = '200px';

      const opts = /** @type {Array<[string, string]>} */ (
        this.options.controls || this.defaults.controls
      );

      /** @type {Record<string, HTMLInputElement>} */
      this._inputs = {};
      /** @type {Record<string, number>} */
      this._values = {};

      for (let i = 0; i < opts.length; i++) {
        const id = opts[i][0];
        const labelText = opts[i][1];
        const range = RANGE_DEFAULTS[id] || { min: 0, max: 100, default: 50 };

        const row = document.createElement('label');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.fontSize = '12px';

        const span = document.createElement('span');
        span.textContent = labelText;
        span.style.flex = '0 0 88px';

        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(range.min);
        input.max = String(range.max);
        input.value = String(range.default);
        input.step = '1';
        input.style.flex = '1';
        input.dataset.plugin = 'finetune';
        input.dataset.control = id;

        this._values[id] = +input.value;
        this._inputs[id] = input;

        row.appendChild(span);
        row.appendChild(input);
        this._panel.appendChild(row);
      }

      buttonGroup.element.appendChild(this._panel);

      this._onToggle = this._togglePanel.bind(this);
      this._onInput = this._scheduleApply.bind(this);
      this._toggleButton.addEventListener('click', this._onToggle);

      for (const k in this._inputs) {
        if (!Object.prototype.hasOwnProperty.call(this._inputs, k)) continue;
        this._inputs[k].addEventListener('input', this._onInput);
      }

      this._applyRaf = null;
    },

    _togglePanel: function () {
      const open = this._panel.style.display === 'none';
      this._panel.style.display = open ? 'flex' : 'none';
      this._toggleButton.active(open);
    },

    _readValues: function () {
      for (const k in this._inputs) {
        if (!Object.prototype.hasOwnProperty.call(this._inputs, k)) continue;
        this._values[k] = +this._inputs[k].value;
      }
      return this._values;
    },

    _scheduleApply: function () {
      if (this._applyRaf != null) {
        cancelAnimationFrame(this._applyRaf);
      }
      const self = this;
      this._applyRaf = requestAnimationFrame(function () {
        self._applyRaf = null;
        self._applyFinetune();
      });
    },

    _applyFinetune: function () {
      const values = this._readValues();
      this.imgtor.applyTransformation(
        new FinetuneTransformation({
          values: values,
        }),
      );
    },

    destroy: function destroyFinetunePlugin() {
      if (this._applyRaf != null) {
        cancelAnimationFrame(this._applyRaf);
        this._applyRaf = null;
      }
      if (this._toggleButton) this._toggleButton.removeEventListener('click', this._onToggle);
      for (const k in this._inputs) {
        if (!Object.prototype.hasOwnProperty.call(this._inputs, k)) continue;
        this._inputs[k].removeEventListener('input', this._onInput);
      }
    },
  });
})();
