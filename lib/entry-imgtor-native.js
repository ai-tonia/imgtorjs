/**
 * Native subset bundle — no Fabric.js. Rotate, history, save only (no crop).
 * Use: new imgtor('#img', { adapterKind: 'native', plugins: { crop: false } })
 */
import './js/core/inject-icon-sprite.js';
import './js/core/imgtor.js';
import './js/core/canvas-adapter-native.js';
import './js/core/plugin.js';
import './js/core/transformation.js';
import './js/core/ui.js';
import './js/core/utils.js';
import './js/plugins/imgtor.history.js';
import './js/plugins/imgtor.rotate.native.js';
import './js/plugins/imgtor.save.js';
