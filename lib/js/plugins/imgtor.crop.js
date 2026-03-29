(function () {
  'use strict';

  const Crop = imgtor.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      const viewport = imgtor.Utils.computeImageViewPort(image);
      const imageWidth = viewport.width;
      const imageHeight = viewport.height;

      const left = this.options.left * imageWidth;
      const top = this.options.top * imageHeight;
      const width = Math.min(this.options.width * imageWidth, imageWidth - left);
      const height = Math.min(this.options.height * imageHeight, imageHeight - top);

      const snapshot = new Image();
      snapshot.onload = function () {
        const w = this.width;
        const h = this.height;
        if (h < 1 || w < 1) {
          return;
        }

        const imgInstance = canvas.createLockedImage(this);

        canvas.setWidth(w);
        canvas.setHeight(h);
        image.remove();
        canvas.add(imgInstance);
        next(imgInstance);
      };

      snapshot.src = canvas.toDataURL({
        left,
        top,
        width,
        height,
      });
    },
  });

  const CropZone = imgtor.CanvasObject.extend({
    _render: function (ctx) {
      this.callSuper('_render', ctx);

      const dashWidth = 7;

      const flipX = this.flipX ? -1 : 1;
      const flipY = this.flipY ? -1 : 1;
      const scaleX = flipX / this.scaleX;
      const scaleY = flipY / this.scaleY;

      ctx.scale(scaleX, scaleY);

      // Overlay rendering
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this._renderOverlay(ctx);

      // Set dashed borders
      if (ctx.setLineDash !== undefined) ctx.setLineDash([dashWidth, dashWidth]);
      else if (ctx.mozDash !== undefined) ctx.mozDash = [dashWidth, dashWidth];

      // First lines rendering with black
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      this._renderBorders(ctx);
      this._renderGrid(ctx);

      // Re render lines in white
      ctx.lineDashOffset = dashWidth;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this._renderBorders(ctx);
      this._renderGrid(ctx);

      // Reset scale
      ctx.scale(1 / scaleX, 1 / scaleY);
    },

    _renderOverlay: function (ctx) {
      const canvas = ctx.canvas;

      //
      //    x0    x1        x2      x3
      // y0 +------------------------+
      //    |\\\\\\\\\\\\\\\\\\\\\\\\|
      //    |\\\\\\\\\\\\\\\\\\\\\\\\|
      // y1 +------+---------+-------+
      //    |\\\\\\|         |\\\\\\\|
      //    |\\\\\\|    0    |\\\\\\\|
      //    |\\\\\\|         |\\\\\\\|
      // y2 +------+---------+-------+
      //    |\\\\\\\\\\\\\\\\\\\\\\\\|
      //    |\\\\\\\\\\\\\\\\\\\\\\\\|
      // y3 +------------------------+
      //

      const x0 = Math.ceil(-this.getWidth() / 2 - this.getLeft());
      const x1 = Math.ceil(-this.getWidth() / 2);
      const x2 = Math.ceil(this.getWidth() / 2);
      const x3 = Math.ceil(this.getWidth() / 2 + (canvas.width - this.getWidth() - this.getLeft()));

      const y0 = Math.ceil(-this.getHeight() / 2 - this.getTop());
      const y1 = Math.ceil(-this.getHeight() / 2);
      const y2 = Math.ceil(this.getHeight() / 2);
      const y3 = Math.ceil(
        this.getHeight() / 2 + (canvas.height - this.getHeight() - this.getTop()),
      );

      ctx.beginPath();

      // Draw outer rectangle.
      // Numbers are +/-1 so that overlay edges don't get blurry.
      ctx.moveTo(x0 - 1, y0 - 1);
      ctx.lineTo(x3 + 1, y0 - 1);
      ctx.lineTo(x3 + 1, y3 + 1);
      ctx.lineTo(x0 - 1, y3 - 1);
      ctx.lineTo(x0 - 1, y0 - 1);
      ctx.closePath();

      // Draw inner rectangle.
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x1, y1);

      ctx.closePath();
      ctx.fill();
    },

    _renderBorders: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-this.getWidth() / 2, -this.getHeight() / 2); // upper left
      ctx.lineTo(this.getWidth() / 2, -this.getHeight() / 2); // upper right
      ctx.lineTo(this.getWidth() / 2, this.getHeight() / 2); // down right
      ctx.lineTo(-this.getWidth() / 2, this.getHeight() / 2); // down left
      ctx.lineTo(-this.getWidth() / 2, -this.getHeight() / 2); // upper left
      ctx.stroke();
    },

    _renderGrid: function (ctx) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(-this.getWidth() / 2 + (1 / 3) * this.getWidth(), -this.getHeight() / 2);
      ctx.lineTo(-this.getWidth() / 2 + (1 / 3) * this.getWidth(), this.getHeight() / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-this.getWidth() / 2 + (2 / 3) * this.getWidth(), -this.getHeight() / 2);
      ctx.lineTo(-this.getWidth() / 2 + (2 / 3) * this.getWidth(), this.getHeight() / 2);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(-this.getWidth() / 2, -this.getHeight() / 2 + (1 / 3) * this.getHeight());
      ctx.lineTo(this.getWidth() / 2, -this.getHeight() / 2 + (1 / 3) * this.getHeight());
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-this.getWidth() / 2, -this.getHeight() / 2 + (2 / 3) * this.getHeight());
      ctx.lineTo(this.getWidth() / 2, -this.getHeight() / 2 + (2 / 3) * this.getHeight());
      ctx.stroke();
    },
  });

  imgtor.plugins['crop'] = imgtor.Plugin.extend({
    // Init point
    startX: null,
    startY: null,

    // Keycrop
    isKeyCroping: false,
    isKeyLeft: false,
    isKeyUp: false,

    defaults: {
      // min crop dimension
      minHeight: 1,
      minWidth: 1,
      // ensure crop ratio
      ratio: null,
      // quick crop feature (set a key code to enable it)
      quickCropKey: false,
    },

    initialize: function initImgTorCropPlugin() {
      const buttonGroup = this.imgtor.toolbar.createButtonGroup();

      this.cropButton = buttonGroup.createButton({
        image: 'crop',
      });
      this.okButton = buttonGroup.createButton({
        image: 'done',
        type: 'success',
        hide: true,
      });
      this.cancelButton = buttonGroup.createButton({
        image: 'close',
        type: 'danger',
        hide: true,
      });

      this._onToggleCrop = this.toggleCrop.bind(this);
      this._onCropCurrentZone = this.cropCurrentZone.bind(this);
      this._onReleaseFocus = this.releaseFocus.bind(this);
      this.cropButton.addEventListener('click', this._onToggleCrop);
      this.okButton.addEventListener('click', this._onCropCurrentZone);
      this.cancelButton.addEventListener('click', this._onReleaseFocus);

      this._onMouseDown = this.onMouseDown.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseUp = this.onMouseUp.bind(this);
      this._onObjectMoving = this.onObjectMoving.bind(this);
      this._onObjectScaling = this.onObjectScaling.bind(this);
      this.imgtor.canvas.on('mouse:down', this._onMouseDown);
      this.imgtor.canvas.on('mouse:move', this._onMouseMove);
      this.imgtor.canvas.on('mouse:up', this._onMouseUp);
      this.imgtor.canvas.on('object:moving', this._onObjectMoving);
      this.imgtor.canvas.on('object:scaling', this._onObjectScaling);

      this._onKeyDown = this.onKeyDown.bind(this);
      this._onKeyUp = this.onKeyUp.bind(this);
      document.addEventListener('keydown', this._onKeyDown);
      document.addEventListener('keyup', this._onKeyUp);

      this._onCoreTransformation = this.releaseFocus.bind(this);
      this.imgtor.addEventListener('core:transformation', this._onCoreTransformation);
    },

    destroy: function destroyCropPlugin() {
      if (this.cropButton && this._onToggleCrop) {
        this.cropButton.removeEventListener('click', this._onToggleCrop);
      }
      if (this.okButton && this._onCropCurrentZone) {
        this.okButton.removeEventListener('click', this._onCropCurrentZone);
      }
      if (this.cancelButton && this._onReleaseFocus) {
        this.cancelButton.removeEventListener('click', this._onReleaseFocus);
      }

      const c = this.imgtor.canvas;
      if (c) {
        if (this._onMouseDown) c.off('mouse:down', this._onMouseDown);
        if (this._onMouseMove) c.off('mouse:move', this._onMouseMove);
        if (this._onMouseUp) c.off('mouse:up', this._onMouseUp);
        if (this._onObjectMoving) c.off('object:moving', this._onObjectMoving);
        if (this._onObjectScaling) c.off('object:scaling', this._onObjectScaling);
      }

      if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown);
      if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);

      if (this._onCoreTransformation) {
        this.imgtor.removeEventListener('core:transformation', this._onCoreTransformation);
      }

      this.releaseFocus();
    },

    // Avoid crop zone to go beyond the canvas edges
    onObjectMoving: function (event) {
      if (!this.hasFocus()) {
        return;
      }

      const currentObject = event.target;
      if (currentObject !== this.cropZone) return;

      const canvas = this.imgtor.canvas;
      const x = currentObject.getLeft(),
        y = currentObject.getTop();
      const w = currentObject.getWidth(),
        h = currentObject.getHeight();
      const maxX = canvas.getWidth() - w;
      const maxY = canvas.getHeight() - h;

      if (x < 0) currentObject.set('left', 0);
      if (y < 0) currentObject.set('top', 0);
      if (x > maxX) currentObject.set('left', maxX);
      if (y > maxY) currentObject.set('top', maxY);

      this.imgtor.dispatchEvent('crop:update');
    },

    // Prevent crop zone from going beyond the canvas edges (like mouseMove)
    onObjectScaling: function (event) {
      if (!this.hasFocus()) {
        return;
      }

      let preventScaling = false;
      const currentObject = event.target;
      if (currentObject !== this.cropZone) return;

      const canvas = this.imgtor.canvas;

      const minX = currentObject.getLeft();
      const minY = currentObject.getTop();
      const maxX = currentObject.getLeft() + currentObject.getWidth();
      const maxY = currentObject.getTop() + currentObject.getHeight();

      if (null !== this.options.ratio) {
        if (minX < 0 || maxX > canvas.getWidth() || minY < 0 || maxY > canvas.getHeight()) {
          preventScaling = true;
        }
      }

      if (minX < 0 || maxX > canvas.getWidth() || preventScaling) {
        const lastScaleX = this.lastScaleX || 1;
        currentObject.setScaleX(lastScaleX);
      }
      if (minX < 0) {
        currentObject.setLeft(0);
      }

      if (minY < 0 || maxY > canvas.getHeight() || preventScaling) {
        const lastScaleY = this.lastScaleY || 1;
        currentObject.setScaleY(lastScaleY);
      }
      if (minY < 0) {
        currentObject.setTop(0);
      }

      if (currentObject.getWidth() < this.options.minWidth) {
        currentObject.scaleToWidth(this.options.minWidth);
      }
      if (currentObject.getHeight() < this.options.minHeight) {
        currentObject.scaleToHeight(this.options.minHeight);
      }

      this.lastScaleX = currentObject.getScaleX();
      this.lastScaleY = currentObject.getScaleY();

      this.imgtor.dispatchEvent('crop:update');
    },

    // Init crop zone
    onMouseDown: function (event) {
      if (!this.hasFocus()) {
        return;
      }

      const canvas = this.imgtor.canvas;

      // recalculate offset, in case canvas was manipulated since last `calcOffset`
      canvas.calcOffset();
      const pointer = canvas.getPointer(event.e);
      const x = pointer.x;
      const y = pointer.y;
      const point = { x, y };

      // Let the canvas handle drag/resize when the pointer is inside the zone.
      // Do not treat "active object === crop zone" alone as inside: after a full-canvas
      // crop the zone still has focus but clicks outside must start a new selection.
      if (this.cropZone.containsPoint(point)) {
        return;
      }

      canvas.discardActiveObject();
      this.cropZone.setWidth(0);
      this.cropZone.setHeight(0);
      this.cropZone.setScaleX(1);
      this.cropZone.setScaleY(1);

      this.startX = x;
      this.startY = y;
    },

    // Extend crop zone
    onMouseMove: function (event) {
      // Quick crop feature
      if (this.isKeyCroping) return this.onMouseMoveKeyCrop(event);

      if (null === this.startX || null === this.startY) {
        return;
      }

      const canvas = this.imgtor.canvas;
      const pointer = canvas.getPointer(event.e);
      const x = pointer.x;
      const y = pointer.y;

      this._renderCropZone(this.startX, this.startY, x, y);
    },

    onMouseMoveKeyCrop: function (event) {
      const canvas = this.imgtor.canvas;
      const zone = this.cropZone;

      const pointer = canvas.getPointer(event.e);
      const x = pointer.x;
      const y = pointer.y;

      if (!zone.left || !zone.top) {
        zone.setTop(y);
        zone.setLeft(x);
      }

      this.isKeyLeft = x < zone.left + zone.width / 2;
      this.isKeyUp = y < zone.top + zone.height / 2;

      this._renderCropZone(
        Math.min(zone.left, x),
        Math.min(zone.top, y),
        Math.max(zone.left + zone.width, x),
        Math.max(zone.top + zone.height, y),
      );
    },

    // Finish crop zone
    onMouseUp: function (_event) {
      if (null === this.startX || null === this.startY) {
        return;
      }

      const canvas = this.imgtor.canvas;
      this.cropZone.setCoords();
      canvas.setActiveObject(this.cropZone);
      canvas.calcOffset();

      this.startX = null;
      this.startY = null;
    },

    onKeyDown: function (event) {
      if (
        false === this.options.quickCropKey ||
        event.keyCode !== this.options.quickCropKey ||
        this.isKeyCroping
      )
        return;

      // Active quick crop flow
      this.isKeyCroping = true;
      this.imgtor.canvas.discardActiveObject();
      this.cropZone.setWidth(0);
      this.cropZone.setHeight(0);
      this.cropZone.setScaleX(1);
      this.cropZone.setScaleY(1);
      this.cropZone.setTop(0);
      this.cropZone.setLeft(0);
    },

    onKeyUp: function (event) {
      if (
        false === this.options.quickCropKey ||
        event.keyCode !== this.options.quickCropKey ||
        !this.isKeyCroping
      )
        return;

      // Unactive quick crop flow
      this.isKeyCroping = false;
      this.startX = 1;
      this.startY = 1;
      this.onMouseUp();
    },

    selectZone: function (x, y, width, height, forceDimension) {
      if (!this.hasFocus()) this.requireFocus();

      if (!forceDimension) {
        this._renderCropZone(x, y, x + width, y + height);
      } else {
        this.cropZone.set({
          left: x,
          top: y,
          width: width,
          height: height,
        });
      }

      const canvas = this.imgtor.canvas;
      canvas.bringToFront(this.cropZone);
      this.cropZone.setCoords();
      canvas.setActiveObject(this.cropZone);
      canvas.calcOffset();

      this.imgtor.dispatchEvent('crop:update');
    },

    toggleCrop: function () {
      if (!this.hasFocus()) this.requireFocus();
      else this.releaseFocus();
    },

    cropCurrentZone: function () {
      if (!this.hasFocus()) return;

      // Avoid croping empty zone
      if (this.cropZone.width < 1 && this.cropZone.height < 1) return;

      const image = this.imgtor.image;

      // Compute crop zone dimensions
      let top = this.cropZone.getTop() - image.getTop();
      let left = this.cropZone.getLeft() - image.getLeft();
      let width = this.cropZone.getWidth();
      let height = this.cropZone.getHeight();

      // Adjust dimensions to image only
      if (top < 0) {
        height += top;
        top = 0;
      }

      if (left < 0) {
        width += left;
        left = 0;
      }

      // Apply crop transformation.
      // Make sure to use relative dimension since the crop will be applied
      // on the source image.
      this.imgtor.applyTransformation(
        new Crop({
          top: top / image.getHeight(),
          left: left / image.getWidth(),
          width: width / image.getWidth(),
          height: height / image.getHeight(),
        }),
      );
    },

    // Test wether crop zone is set
    hasFocus: function () {
      return this.cropZone !== undefined;
    },

    // Create the crop zone
    requireFocus: function () {
      this.cropZone = new CropZone({
        fill: 'transparent',
        hasBorders: false,
        originX: 'left',
        originY: 'top',
        //stroke: '#444',
        //strokeDashArray: [5, 5],
        //borderColor: '#444',
        cornerColor: '#444',
        cornerSize: 8,
        transparentCorners: false,
        lockRotation: true,
        hasRotatingPoint: false,
      });

      if (null !== this.options.ratio) {
        this.cropZone.set('lockUniScaling', true);
        this.cropZone._ratioLock = +this.options.ratio;
      }

      this.imgtor.canvas.add(this.cropZone);
      this.imgtor.canvas.defaultCursor = 'crosshair';

      this.cropButton.active(true);
      this.okButton.hide(false);
      this.cancelButton.hide(false);
    },

    // Remove the crop zone
    releaseFocus: function () {
      if (undefined === this.cropZone) return;

      this.cropZone.remove();
      this.cropZone = undefined;

      this.cropButton.active(false);
      this.okButton.hide(true);
      this.cancelButton.hide(true);

      this.imgtor.canvas.defaultCursor = 'default';

      this.imgtor.dispatchEvent('crop:update');
    },

    _renderCropZone: function (fromX, fromY, toX, toY) {
      const canvas = this.imgtor.canvas;
      const r = imgtor.Utils.computeCropRectFromDrag({
        fromX,
        fromY,
        toX,
        toY,
        canvasWidth: canvas.getWidth(),
        canvasHeight: canvas.getHeight(),
        minWidth: Math.min(+this.options.minWidth, canvas.getWidth()),
        minHeight: Math.min(+this.options.minHeight, canvas.getHeight()),
        ratio: this.options.ratio,
        isKeyCroping: this.isKeyCroping,
        isKeyLeft: this.isKeyLeft,
        isKeyUp: this.isKeyUp,
      });

      this.cropZone.left = r.left;
      this.cropZone.top = r.top;
      this.cropZone.width = r.width;
      this.cropZone.height = r.height;

      this.imgtor.canvas.bringToFront(this.cropZone);

      this.imgtor.dispatchEvent('crop:update');
    },
  });
})();
