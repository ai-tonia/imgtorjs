/** Named pixel sizes for the resize preset dropdown. */

export const RESIZE_PRESETS = [
  { label: 'Custom', width: null, height: null },
  { label: '320 × 240', width: 320, height: 240 },
  { label: '640 × 480', width: 640, height: 480 },
  { label: '800 × 600', width: 800, height: 600 },
  { label: '1280 × 720', width: 1280, height: 720 },
  { label: '1920 × 1080', width: 1920, height: 1080 },
];

export function applyPresetValue(preset, setDimensions) {
  if (!preset || preset.width == null || preset.height == null) return;
  setDimensions(preset.width, preset.height);
}
