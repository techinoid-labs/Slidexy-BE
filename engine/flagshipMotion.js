/**
 * Shared flagship motion defaults for creative templates.
 * Morph / camera-pan / scatter stay off; ambient + role transitions stay on.
 * Keep this plain JS so batch scripts can require it without ts-node.
 */
const FLAGSHIP_MOTION = {
  morph: false,
  ambient: true,
  continuityFade: true,
  /**
   * Fade-led (Moodboard / EPK recipe): the dissolve carries the beat.
   * No post-transition entrances — PPT always plays those after the fade,
   * which reads as a disconnected second act.
   */
  entrancesMode: "none",
  /** Kept for decks that re-enable entrances (newOnly / all). */
  blendEntrances: true,
  cameraPan: false,
  scatter: false,
  defaultTransition: "fade",
  /** Maps to spd="fast" (<750) with precise p14:dur — snappy like references. */
  durationMs: 600,
};

/**
 * Premium / Atelier: same continuity fade, but role-aware entrances on NEW beats.
 * Titles fadeUp, cards/notes settle, chrome persists under the dissolve.
 */
const PREMIUM_MOTION = {
  ...FLAGSHIP_MOTION,
  entrancesMode: "newOnly",
  /** Short fade; entrances are the dissolve tail (PPT can't true-overlap). */
  durationMs: 400,
  /** Title + up to 2 beats — rest of the slide arrives inside the fade. */
  maxEntrances: 3,
};

module.exports = {
  FLAGSHIP_MOTION,
  PREMIUM_MOTION,
};
