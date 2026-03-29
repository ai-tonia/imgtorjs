(function () {
  'use strict';

  imgtor.plugins['history'] = imgtor.Plugin.extend({
    undoTransformations: [],

    initialize: function initImgTorHistoryPlugin() {
      this._initButtons();

      this._onTransformationApplied = this._onTranformationApplied.bind(this);
      this.imgtor.addEventListener('core:transformation', this._onTransformationApplied);
    },

    destroy: function destroyHistoryPlugin() {
      if (this._onTransformationApplied) {
        this.imgtor.removeEventListener('core:transformation', this._onTransformationApplied);
      }
      if (this.backButton && this._onUndo) {
        this.backButton.removeEventListener('click', this._onUndo);
      }
      if (this.forwardButton && this._onRedo) {
        this.forwardButton.removeEventListener('click', this._onRedo);
      }
    },

    undo: function () {
      if (this.imgtor.transformations.length === 0) {
        return;
      }

      const lastTransformation = this.imgtor.transformations.pop();
      this.undoTransformations.unshift(lastTransformation);

      this.imgtor.reinitializeImage();
      this._updateButtons();
    },

    redo: function () {
      if (this.undoTransformations.length === 0) {
        return;
      }

      const cancelTransformation = this.undoTransformations.shift();
      this.imgtor.transformations.push(cancelTransformation);

      this.imgtor.reinitializeImage();
      this._updateButtons();
    },

    _initButtons: function () {
      const buttonGroup = this.imgtor.toolbar.createButtonGroup();

      this.backButton = buttonGroup.createButton({
        image: 'undo',
        disabled: true,
        pluginId: 'history',
        feature: 'undo',
      });

      this.forwardButton = buttonGroup.createButton({
        image: 'redo',
        disabled: true,
        pluginId: 'history',
        feature: 'redo',
      });

      this._onUndo = this.undo.bind(this);
      this._onRedo = this.redo.bind(this);
      this.backButton.addEventListener('click', this._onUndo);
      this.forwardButton.addEventListener('click', this._onRedo);

      return this;
    },

    _updateButtons: function () {
      this.backButton.disable(this.imgtor.transformations.length === 0);
      this.forwardButton.disable(this.undoTransformations.length === 0);
    },

    _onTranformationApplied: function () {
      this.undoTransformations = [];
      this._updateButtons();
    },
  });
})();
