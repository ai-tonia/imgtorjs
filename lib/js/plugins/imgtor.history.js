(function (window, document, imgtor, _fabric) {
  'use strict';

  imgtor.plugins['history'] = imgtor.Plugin.extend({
    undoTransformations: [],

    initialize: function initImgTorHistoryPlugin() {
      this._initButtons();

      this.imgtor.addEventListener(
        'core:transformation',
        this._onTranformationApplied.bind(this),
      );
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
      });

      this.forwardButton = buttonGroup.createButton({
        image: 'redo',
        disabled: true,
      });

      this.backButton.addEventListener('click', this.undo.bind(this));
      this.forwardButton.addEventListener('click', this.redo.bind(this));

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
})(window, document, imgtor, fabric);
