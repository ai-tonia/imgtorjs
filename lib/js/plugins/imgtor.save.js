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
        pluginId: 'save',
        feature: 'save',
      });

      this._onSaveClick = this.options.callback.bind(this);
      this.destroyButton.addEventListener('click', this._onSaveClick);
    },

    destroy: function destroySavePlugin() {
      if (this.destroyButton && this._onSaveClick) {
        this.destroyButton.removeEventListener('click', this._onSaveClick);
      }
    },
  });
})();
