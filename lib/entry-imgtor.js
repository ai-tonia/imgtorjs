/**
 * Library entry — load order matches the legacy Gulp concat pipeline.
 * Depends on global `fabric` (e.g. from demo/vendor/fabric.js).
 */
import './js/core/inject-icon-sprite.js';
import './js/core/imgtor.js';
import './js/core/canvas-adapter-fabric.js';
import './js/core/canvas-adapter-native-stub.js';
import './js/core/plugin.js';
import './js/core/transformation.js';
import './js/core/ui.js';
import './js/core/utils.js';
import './js/plugins/imgtor.history.js';
import './js/plugins/imgtor.rotate.js';
import './js/plugins/imgtor.crop.js';
import './js/plugins/imgtor.save.js';
