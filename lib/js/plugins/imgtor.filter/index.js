import { applyColorMatrix } from './preview.js';
import { filterFunctions as builtInFilterFunctions } from './registry.js';
import { defaultFilterOptions } from './menu.js';
import { extendFilters, cloneFilterOptions } from './custom.js';

(function () {
  'use strict';

  const groupIcons = ['filter'];

  const filterRegistry = {
    filterFunctions: Object.assign({}, builtInFilterFunctions),
    filterOptions: cloneFilterOptions(defaultFilterOptions),
  };

  imgtor.filterRegistry = filterRegistry;
  imgtor.filterExtend = function filterExtend(custom) {
    extendFilters(filterRegistry, custom);
  };

  const FilterTransformation = imgtor.Transformation.extend({
    applyTransformation: function applyFilterTransformation(canvas, image, next) {
      const matrix = this.options.matrix;
      const el = canvas.getElement();
      const ctx = el.getContext('2d');
      if (!ctx || typeof ctx.getImageData !== 'function') {
        next();
        return;
      }
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      const imageData = ctx.getImageData(0, 0, w, h);
      applyColorMatrix(imageData, matrix);
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL();
      const snapshot = new Image();
      snapshot.onload = function onFilterSnapshotLoad() {
        const iw = this.width;
        const ih = this.height;
        if (iw < 1 || ih < 1) {
          next();
          return;
        }
        const imgInstance = canvas.createLockedImage(this);
        canvas.setWidth(iw);
        canvas.setHeight(ih);
        image.remove();
        canvas.add(imgInstance);
        next(imgInstance);
      };
      snapshot.src = dataUrl;
    },
  });

  imgtor.plugins['filter'] = imgtor.Plugin.extend({
    defaults: {},

    initialize: function initImgTorFilterPlugin() {
      this._activeId = null;
      this._filterButtons = [];

      let gi = 0;
      const groups = filterRegistry.filterOptions;
      for (const _groupName of Object.keys(groups)) {
        const buttonGroup = this.imgtor.toolbar.createButtonGroup();
        const icon = groupIcons[gi % groupIcons.length];
        gi += 1;

        const items = groups[_groupName];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const filterId = item.id;
          const btn = buttonGroup.createButton({
            image: icon,
            pluginId: 'filter',
            feature: filterId === null ? 'original' : String(filterId),
          });
          btn.element.title = item.title || _groupName;
          const handler = this._makeFilterClickHandler(filterId);
          btn.addEventListener('click', handler);
          this._filterButtons.push({ id: filterId, button: btn, handler: handler });
        }
      }

      this._onCoreTransformation = this._clearActiveFilter.bind(this);
      this.imgtor.addEventListener('core:transformation', this._onCoreTransformation);
    },

    _makeFilterClickHandler: function (filterId) {
      const self = this;
      return function onFilterToolbarClick() {
        if (filterId === null) {
          self._setActiveFilter(null);
          return;
        }
        const factory = filterRegistry.filterFunctions[filterId];
        if (!factory) {
          return;
        }
        const matrix = factory();
        self._setActiveFilter(filterId);
        self.imgtor.applyTransformation(new FilterTransformation({ matrix: matrix }));
      };
    },

    _setActiveFilter: function (id) {
      this._activeId = id;
      for (let i = 0; i < this._filterButtons.length; i++) {
        const entry = this._filterButtons[i];
        entry.button.active(entry.id === id);
      }
    },

    _clearActiveFilter: function () {
      this._activeId = null;
      for (let i = 0; i < this._filterButtons.length; i++) {
        this._filterButtons[i].button.active(false);
      }
    },

    destroy: function destroyFilterPlugin() {
      if (this._onCoreTransformation) {
        this.imgtor.removeEventListener('core:transformation', this._onCoreTransformation);
      }
      for (let i = 0; i < this._filterButtons.length; i++) {
        const entry = this._filterButtons[i];
        entry.button.removeEventListener('click', entry.handler);
      }
      this._filterButtons = [];
    },
  });
})();
