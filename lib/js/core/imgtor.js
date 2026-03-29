(function () {
  'use strict';

  window.imgtor = imgtor;
  window.ImgTor = imgtor;

  // Core constructor (global `imgtor`; `ImgTor` kept for older snippets).
  // Basically it's a single object, instanciable via an element
  // (it could be a CSS selector or a DOM element), some custom options,
  // and a list of plugin objects (or none to use default ones).
  function imgtor(element, options, _plugins) {
    return this.constructor(element, options, _plugins);
  }

  // Create an empty list of plugin objects, which will be filled by
  // other plugin scripts. This is the default plugin list if none is
  // specified in imgtor's constructor.
  imgtor.plugins = [];

  imgtor.prototype = {
    // Reference to the main container element
    containerElement: null,

    // Viewport canvas wrapper (Canvas 2D)
    canvas: null,

    // Viewport image wrapper
    image: null,

    // Hidden source canvas wrapper
    sourceCanvas: null,

    // Hidden source image wrapper
    sourceImage: null,

    // Track of the original image element
    originalImageElement: null,

    // Stack of transformations to apply to the image source
    transformations: [],

    // Default options
    defaults: {
      // Canvas properties (dimension, ratio, color)
      minWidth: null,
      minHeight: null,
      maxWidth: null,
      maxHeight: null,
      ratio: null,
      backgroundColor: '#fff',

      // Plugins options
      plugins: {},

      // Post-initialisation callback
      initialize: function () {
        /* noop */
      },
    },

    // List of the instancied plugins
    plugins: {},

    /** @type {typeof imgtor.CanvasAdapterNative | null} */
    _canvasAdapter: null,

    // This options are a merge between `defaults` and the options passed
    // through the constructor
    options: {},

    constructor: function (element, options, _plugins) {
      this.options = imgtor.Utils.extend(options, this.defaults);
      this._normalizePluginsOptions();

      if (typeof element === 'string') element = document.querySelector(element);
      if (null === element) return;

      const image = new Image();
      image.onload = function () {
        // Initialize the DOM and canvases
        this._initializeDOM(element);
        this._initializeImage();

        // Then initialize the plugins
        this._initializePlugins(imgtor.plugins);

        // Public method to adjust image according to the canvas
        this.refresh(
          function () {
            // Execute a custom callback after initialization
            this.options.initialize.bind(this).call();
          }.bind(this),
        );
      }.bind(this);

      //image.crossOrigin = 'anonymous';
      image.src = element.src;
    },

    selfDestroy: function () {
      this._destroyPlugins();

      const container = this.containerElement;
      const image = new Image();
      image.onload = function () {
        container.parentNode.replaceChild(image, container);
      };

      image.src = this.sourceImage.toDataURL();
    },

    // Add ability to attach event listener on the core object.
    // It uses the canvas element to process events.
    addEventListener: function (eventName, callback) {
      this.canvas.getElement().addEventListener(eventName, callback);
    },

    removeEventListener: function (eventName, callback) {
      this.canvas.getElement().removeEventListener(eventName, callback);
    },

    dispatchEvent: function (eventName) {
      this.canvas
        .getElement()
        .dispatchEvent(new Event(eventName, { bubbles: true, cancelable: true }));
    },

    // Adjust image & canvas dimension according to min/max width/height
    // and ratio specified in the options.
    // This method should be called after each image transformation.
    refresh: function (next) {
      const clone = new Image();
      clone.onload = function () {
        this._replaceCurrentImage(this._canvasAdapter.createLockedImage(clone));

        if (next) next();
      }.bind(this);
      clone.src = this.sourceImage.toDataURL();
    },

    _replaceCurrentImage: function (newImage) {
      if (this.image) {
        this.image.remove();
      }

      this.image = newImage;
      this.image.selectable = false;

      // Adjust width or height according to specified ratio
      const viewport = imgtor.Utils.computeImageViewPort(this.image);
      let canvasWidth = viewport.width;
      let canvasHeight = viewport.height;

      if (null !== this.options.ratio) {
        const canvasRatio = +this.options.ratio;
        const currentRatio = canvasWidth / canvasHeight;

        if (currentRatio > canvasRatio) {
          canvasHeight = canvasWidth / canvasRatio;
        } else if (currentRatio < canvasRatio) {
          canvasWidth = canvasHeight * canvasRatio;
        }
      }

      // Then scale the image to fit into dimension limits
      let scaleX = 1;
      let scaleY = 1;

      if (null !== this.options.maxWidth && this.options.maxWidth < canvasWidth) {
        scaleX = this.options.maxWidth / canvasWidth;
      }
      if (null !== this.options.maxHeight && this.options.maxHeight < canvasHeight) {
        scaleY = this.options.maxHeight / canvasHeight;
      }
      const scaleMin = Math.min(scaleX, scaleY);

      scaleX = 1;
      scaleY = 1;
      if (null !== this.options.minWidth && this.options.minWidth > canvasWidth) {
        scaleX = this.options.minWidth / canvasWidth;
      }
      if (null !== this.options.minHeight && this.options.minHeight > canvasHeight) {
        scaleY = this.options.minHeight / canvasHeight;
      }
      const scaleMax = Math.max(scaleX, scaleY);

      const scale = scaleMax * scaleMin; // one should be equals to 1

      canvasWidth *= scale;
      canvasHeight *= scale;

      // Finally place the image in the center of the canvas
      this._canvasAdapter.layoutViewportImage(
        this.canvas,
        this.image,
        canvasWidth,
        canvasHeight,
        scale,
      );

      this.dispatchEvent('core:refreshed');
    },

    // Apply the transformation on the current image and save it in the
    // transformations stack (in order to reconstitute the previous states
    // of the image).
    applyTransformation: function (transformation) {
      this.transformations.push(transformation);

      transformation.applyTransformation(
        this.sourceCanvas,
        this.sourceImage,
        this._postTransformation.bind(this),
      );
    },

    _postTransformation: function (newImage) {
      if (newImage) this.sourceImage = newImage;

      this.refresh(
        function () {
          this.dispatchEvent('core:transformation');
        }.bind(this),
      );
    },

    // Initialize image from original element plus re-apply every
    // transformations.
    reinitializeImage: function () {
      this.sourceImage.remove();
      this._initializeImage();
      this._popTransformation(this.transformations.slice());
    },

    _popTransformation: function (transformations) {
      if (0 === transformations.length) {
        this.dispatchEvent('core:reinitialized');
        this.refresh();
        return;
      }

      const transformation = transformations.shift();

      const next = function (newImage) {
        if (newImage) this.sourceImage = newImage;
        this._popTransformation(transformations);
      };

      transformation.applyTransformation(this.sourceCanvas, this.sourceImage, next.bind(this));
    },

    // Create the DOM elements and instantiate the viewport + source canvases.
    // The image element is replaced by a new `div` element.
    // However the original image is re-injected in order to keep a trace of it.
    _initializeDOM: function (imageElement) {
      // Container
      const mainContainerElement = document.createElement('div');
      mainContainerElement.className = 'imgtor-container';

      // Toolbar
      const toolbarElement = document.createElement('div');
      toolbarElement.className = 'imgtor-toolbar';
      mainContainerElement.appendChild(toolbarElement);

      // Viewport canvas
      const canvasContainerElement = document.createElement('div');
      canvasContainerElement.className = 'imgtor-image-container';
      const canvasElement = document.createElement('canvas');
      canvasContainerElement.appendChild(canvasElement);
      mainContainerElement.appendChild(canvasContainerElement);

      // Source canvas
      const sourceCanvasContainerElement = document.createElement('div');
      sourceCanvasContainerElement.className = 'imgtor-source-container';
      sourceCanvasContainerElement.style.display = 'none';
      const sourceCanvasElement = document.createElement('canvas');
      sourceCanvasContainerElement.appendChild(sourceCanvasElement);
      mainContainerElement.appendChild(sourceCanvasContainerElement);

      // Original image
      imageElement.parentNode.replaceChild(mainContainerElement, imageElement);
      imageElement.style.display = 'none';
      mainContainerElement.appendChild(imageElement);

      // Instanciate object from elements
      this.containerElement = mainContainerElement;
      this.originalImageElement = imageElement;

      this.toolbar = new imgtor.UI.Toolbar(toolbarElement);

      if (!imgtor.CanvasAdapterNative) {
        throw new Error('[imgtor] CanvasAdapterNative is missing from the bundle.');
      }
      this._canvasAdapter = imgtor.CanvasAdapterNative;
      const canvasOpts = {
        selection: false,
        backgroundColor: this.options.backgroundColor,
      };
      this.canvas = this._canvasAdapter.createCanvas(canvasElement, canvasOpts);
      this.sourceCanvas = this._canvasAdapter.createCanvas(sourceCanvasElement, canvasOpts);
    },

    // Create the locked source image wrapper.
    // The image is created as a static element with no control,
    // then it is added to the source canvas.
    _initializeImage: function () {
      this.sourceImage = this._canvasAdapter.createLockedImage(this.originalImageElement);

      // Adjust width or height according to specified ratio
      const viewport = imgtor.Utils.computeImageViewPort(this.sourceImage);
      const canvasWidth = viewport.width;
      const canvasHeight = viewport.height;

      this._canvasAdapter.layoutSourceImage(
        this.sourceCanvas,
        this.sourceImage,
        canvasWidth,
        canvasHeight,
      );
    },

    /**
     * If `options.plugins` is an array, treat it as an ordered whitelist:
     * only listed ids load; unlisted built-ins are skipped. Items may be
     * strings (`'crop'`) or `{ id: 'crop', ...opts }`. Duplicate ids merge options;
     * order follows first occurrence.
     * Object form `{ crop: {}, save: false }` is unchanged (all registered plugins
     * are considered; `false` disables).
     */
    _normalizePluginsOptions: function () {
      const raw = this.options.plugins;
      this._pluginInitOrder = null;
      if (!Array.isArray(raw)) {
        this.options.plugins = raw && typeof raw === 'object' ? raw : {};
        return;
      }
      const merged = {};
      const order = [];
      const seen = {};
      for (let i = 0; i < raw.length; i++) {
        const item = raw[i];
        if (item == null) continue;
        let id;
        const opts = {};
        if (typeof item === 'string') {
          id = item;
        } else if (item && typeof item === 'object' && typeof item.id === 'string') {
          id = item.id;
          for (const k in item) {
            if (Object.prototype.hasOwnProperty.call(item, k) && k !== 'id') {
              opts[k] = item[k];
            }
          }
        } else {
          continue;
        }
        if (seen[id]) {
          merged[id] = Object.assign({}, merged[id] || {}, opts);
          continue;
        }
        seen[id] = true;
        merged[id] = Object.assign({}, opts);
        order.push(id);
      }
      this.options.plugins = merged;
      this._pluginInitOrder = order;
    },

    _resolvePluginOptions: function (name) {
      const raw = this.options.plugins;
      if (this._pluginInitOrder) {
        return Object.prototype.hasOwnProperty.call(raw, name) ? raw[name] : false;
      }
      return raw[name];
    },

    // Initialize every plugin. Order is array whitelist order, else registry key order.
    _initializePlugins: function (plugins) {
      const order = this._pluginInitOrder;
      const names = order
        ? order
        : (function collectKeys() {
            const out = [];
            for (const n in plugins) {
              if (Object.prototype.hasOwnProperty.call(plugins, n)) {
                out.push(n);
              }
            }
            return out;
          })();

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const plugin = plugins[name];
        if (!plugin) continue;

        const options = this._resolvePluginOptions(name);
        if (options === false) continue;

        if (!Object.prototype.hasOwnProperty.call(plugins, name)) continue;

        try {
          this.plugins[name] = new plugin(this, options);
        } catch (err) {
          console.warn('[imgtor] Plugin "' + name + '" failed to initialize:', err);
        }
      }
    },

    _destroyPlugins: function () {
      if (!this.plugins) return;
      for (const name in this.plugins) {
        if (!Object.prototype.hasOwnProperty.call(this.plugins, name)) continue;
        const instance = this.plugins[name];
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      }
    },
  };
})();
