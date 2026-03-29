(function () {
  'use strict';

  imgtor.plugins['save'] = imgtor.Plugin.extend({
    defaults: {
      callback: function () {
        this.imgtor.selfDestroy();
      },
    },

    initialize: function initImgTorSavePlugin() {
      const buttonGroup = this.imgtor.toolbar.createButtonGroup();

      this.destroyButton = buttonGroup.createButton({
        image: 'save',
      });

      this.destroyButton.addEventListener('click', this.options.callback.bind(this));
    },
  });
})();
