/**
 * Optional legacy helpers — load before ImgTor only if you target very old browsers.
 * Currently: requestAnimationFrame / cancelAnimationFrame fallback.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  let last = 0;
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (cb) {
      const now = Date.now();
      const t = Math.max(0, 16 - (now - last));
      last = now + t;
      return setTimeout(function () {
        cb(now + t);
      }, t);
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
})();
