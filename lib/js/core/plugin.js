(function () {
  'use strict';

  imgtor.Plugin = Plugin;

  // Define a plugin object. This is the (abstract) parent class which
  // has to be extended for each plugin.
  function Plugin(editor, options) {
    this.imgtor = editor;
    this.options = imgtor.Utils.extend(options, this.defaults);
    this.initialize();
  }

  Plugin.prototype = {
    defaults: {},
    initialize: function () {},
  };

  // Inspired by Backbone.js extend capability.
  Plugin.extend = function (protoProps) {
    const parent = this;
    let child;

    if (protoProps && Object.prototype.hasOwnProperty.call(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function () {
        return parent.apply(this, arguments);
      };
    }

    imgtor.Utils.extend(child, parent);

    const Surrogate = function () {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    if (protoProps) imgtor.Utils.extend(child.prototype, protoProps);

    child.__super__ = parent.prototype;

    return child;
  };
})();
