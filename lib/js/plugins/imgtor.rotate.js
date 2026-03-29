(function () {
  'use strict';

  const Rotation = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const angle = ((image.getAngle() + this.options.angle) % 360 + 360) % 360;
      image.rotate(angle);

      const height =
        Math.abs(image.getWidth() * Math.sin((angle * Math.PI) / 180)) +
        Math.abs(image.getHeight() * Math.cos((angle * Math.PI) / 180));
      const width =
        Math.abs(image.getHeight() * Math.sin((angle * Math.PI) / 180)) +
        Math.abs(image.getWidth() * Math.cos((angle * Math.PI) / 180));

      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.centerObject(image);
      if (typeof image.setCoords === 'function') image.setCoords();
      canvas.renderAll();

      next();
    },
  });

  imgtor.plugins['rotate'] = imgtor.Plugin.extend({
    initialize: function initImgTorRotatePlugin() {
      const buttonGroup = this.imgtor.toolbar.createButtonGroup();

      this._leftButton = buttonGroup.createButton({
        image: 'rotate-left',
      });

      this._rightButton = buttonGroup.createButton({
        image: 'rotate-right',
      });

      this._onLeft = this.rotateLeft.bind(this);
      this._onRight = this.rotateRight.bind(this);
      this._leftButton.addEventListener('click', this._onLeft);
      this._rightButton.addEventListener('click', this._onRight);
    },

    destroy: function destroyRotatePlugin() {
      if (this._leftButton) this._leftButton.removeEventListener('click', this._onLeft);
      if (this._rightButton) this._rightButton.removeEventListener('click', this._onRight);
    },

    rotateLeft: function rotateLeft() {
      this.rotate(-90);
    },

    rotateRight: function rotateRight() {
      this.rotate(90);
    },

    rotate: function rotate(angle) {
      this.imgtor.applyTransformation(new Rotation({ angle: angle }));
    },
  });
})();
