/**
 * Shared flagship motion defaults for creative templates.
 * Morph / camera-pan / scatter stay off; ambient + role transitions stay on.
 * Keep this plain JS so batch scripts can require it without ts-node.
 */
module.exports = {
  FLAGSHIP_MOTION: {
    morph: false,
    ambient: true,
    continuityFade: true,
    cameraPan: false,
    scatter: false,
    defaultTransition: "fade",
    durationMs: 1600,
  },
};
