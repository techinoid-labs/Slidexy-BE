/**
 * Motion scene expansion — Camera Pan (cover parallax) + Scatter (feature grid).
 * Pure deck transforms; OOXML Morph/timing applied later in catalog export.
 */

const { applyAmbientToDeck } = require("./ambient");
const { applyWaveDesign } = require("./waveDesign");
const motionTargets = require("./motionTargets");

export type MotionConfig = {
  wave?: import("./waveDesign").WaveDesignOptions | false;
  morph?: boolean;
  /** Continuous on-slide loops (Pulse / Float / Ken Burns / Teeter). One per slide. */
  ambient?: boolean;
  /**
   * Landscapes-style continuity: slow crossfade + only NEW morphIds get entrances.
   * Persistent chrome (same morphId / same box) must stay put across slides.
   */
  continuityFade?: boolean;
  /** Faux-3D: background scale between cover keyframes (1.2–1.3). */
  parallaxScale?: number;
  /** Foreground title shift as fraction of slide width (default 0.05). */
  parallaxTextShift?: number;
  cameraPan?: boolean;
  scatter?: boolean;
  durationMs?: number;
  defaultTransition?: "fade" | "push" | "wipe" | "morph" | "none";
  entrances?: Array<{ morphId: string; preset: string; delayMs?: number }>;
};

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Full-bleed (or near) cover photo — the only image Morph camera-pan may scale. */
function isFullBleedHero(el: any): boolean {
  if (!el || el.type !== "image") return false;
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 0;
  const h = Number(el.height) || 0;
  if (w >= 1500 && h >= 850 && x <= 40 && y <= 40) return true;
  if (w >= 1580 && h >= 880) return true;
  return false;
}

function coverHasCameraPanHero(layout: any): boolean {
  return ((layout && layout.elements) || []).some(isFullBleedHero);
}

/** Pattern-aware morphId + motionIntent (enter/persist/none). See motionTargets.js. */
function tagMorphIds(elements: any[], role: string) {
  return motionTargets.tagMorphIds(elements, role);
}

/**
 * Camera-pan Morph must only drive hero + title.
 * Badges, plates, bars with morphIds (for ambient elsewhere) must not join the Morph pair —
 * duplicate morphIds (two "accent") also break byObject matching.
 */
function limitCameraPanMorphIds(elements: any[]) {
  const seen = new Set<string>();
  (elements || []).forEach((el) => {
    if (!el) return;
    if (el.type === "image" && isFullBleedHero(el)) {
      el.morphId = "hero";
    } else if (el.type === "image") {
      // Inset / framed photos must stay still — never Morph-scale them
      delete el.morphId;
    } else if (el.type === "text" && (el.morphId === "title" || el.id === "title" || el.slot === "title")) {
      el.morphId = "title";
    } else if (el.morphId === "hero" || el.morphId === "title") {
      // keep
    } else {
      delete el.morphId;
    }
    if (el.morphId) {
      if (seen.has(el.morphId)) delete el.morphId;
      else seen.add(el.morphId);
    }
  });
}

/** Cover Camera Pan + Faux-3D Parallax keyframes. */
function expandCoverParallax(layout: any, motion: MotionConfig): { start: any; end: any } {
  const start = deepClone(layout);
  const end = deepClone(layout);
  start.morphKeyframe = "start";
  end.morphKeyframe = "end";
  end.morphDestination = true;
  start.motion = { transition: "none" };
  end.motion = { transition: "morph", durationMs: motion.durationMs || 2000 };

  const scale = Math.min(1.3, Math.max(1.2, Number(motion.parallaxScale) || 1.25));
  const textShift = Number(motion.parallaxTextShift) || 0.05;
  const slideW = 1600;

  tagMorphIds(start.elements, "cover");
  tagMorphIds(end.elements, "cover");
  limitCameraPanMorphIds(start.elements);
  limitCameraPanMorphIds(end.elements);

  (end.elements || []).forEach((el: any) => {
    if (el.type === "image" && el.morphId === "hero" && isFullBleedHero(el)) {
      // Background scales 20–30%; keep center gravity for camera pan
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      el.width = Math.round(el.width * scale);
      el.height = Math.round(el.height * scale);
      el.x = Math.round(cx - el.width / 2);
      el.y = Math.round(cy - el.height / 2);
      el.morphId = "hero";
    }
    if (el.type === "text" && el.morphId === "title") {
      el.x = Math.round(el.x - slideW * textShift);
    }
  });

  return { start, end };
}

/** Feature scatter: cluster photos in center (A) → final grid (B). */
function expandScatter(layout: any, motion: MotionConfig): { start: any; end: any } {
  const end = deepClone(layout);
  const start = deepClone(layout);
  start.morphKeyframe = "start";
  end.morphKeyframe = "end";
  end.morphDestination = true;
  start.motion = { transition: "none" };
  end.motion = { transition: "morph", durationMs: motion.durationMs || 2000 };

  tagMorphIds(start.elements, "feature");
  tagMorphIds(end.elements, "feature");

  const photos = (start.elements || []).filter((el: any) => el.type === "image");
  const n = Math.max(1, photos.length);
  const cell = Math.round(Math.min(220, 480 / Math.ceil(Math.sqrt(n))));
  const clusterW = Math.ceil(Math.sqrt(n)) * (cell + 16);
  const originX = Math.round((1600 - clusterW) / 2);
  const originY = Math.round((900 - clusterW) / 2);

  photos.forEach((el: any, i: number) => {
    const cols = Math.ceil(Math.sqrt(n));
    const col = i % cols;
    const row = Math.floor(i / cols);
    el.x = originX + col * (cell + 16);
    el.y = originY + row * (cell + 16);
    el.width = cell;
    el.height = cell;
    el.shapeTreatment = "depth";
    el.morphId = el.morphId || "photo-" + (i + 1);
  });

  (end.elements || []).forEach((el: any) => {
    if (el.type === "image") {
      el.shapeTreatment = "depth";
      if (!el.morphId && el.slot && /^p\d$/.test(el.slot)) el.morphId = "photo-" + el.slot.slice(1);
    }
  });

  return { start, end };
}

/**
 * Expand a rendered deck with Morph keyframe pairs and stamp motion metadata.
 */
export function expandMotionScenes(deck: any, motion?: MotionConfig | null): any {
  if (!deck) return deck;
  const cfg: MotionConfig = {
    morph: true,
    ambient: false,
    cameraPan: true,
    scatter: true,
    parallaxScale: 1.25,
    parallaxTextShift: 0.05,
    durationMs: 2000,
    defaultTransition: "fade",
    ...(motion || {}),
    ...((deck.engine && deck.engine.motion) || {}),
  };
  if (cfg.morph === false) {
    (deck.layoutSequence || []).forEach((lid: string) => {
      const layout = deck.layouts[lid];
      if (!layout) return;
      tagMorphIds(layout.elements || [], layout.role);
      stampFlagshipSlideMotion(layout, cfg);
    });
    deck.engine = deck.engine || {};
    deck.engine.motion = { ...cfg, v: "1.2-flagship", scenes: [] };
    deck.engine.v = "1.5-pro-motion";
    if (cfg.ambient) applyAmbientToDeck(deck);
    applyWaveDesign(deck, cfg.wave);
    return deck;
  }

  const sequence: string[] = [];
  const layouts: any = {};

  (deck.layoutSequence || []).forEach((lid: string) => {
    const layout = deck.layouts[lid];
    if (!layout) return;

    const variant = String(layout.variant || "");
    const isScatter =
      cfg.scatter !== false &&
      (variant === "morph-scatter" || variant === "feature/morph-scatter" || layout.role === "feature" && variant.indexOf("scatter") >= 0);

    if (cfg.cameraPan !== false && layout.role === "cover" && coverHasCameraPanHero(layout)) {
      const { start, end } = expandCoverParallax(layout, cfg);
      const a = lid + "-pan-a";
      const b = lid + "-pan-b";
      start.id = a;
      end.id = b;
      layouts[a] = start;
      layouts[b] = end;
      sequence.push(a, b);
      return;
    }

    if (isScatter) {
      const { start, end } = expandScatter(layout, cfg);
      const a = lid + "-scatter-a";
      const b = lid + "-scatter-b";
      start.id = a;
      end.id = b;
      layouts[a] = start;
      layouts[b] = end;
      sequence.push(a, b);
      return;
    }

    // Non-morph slides: stamp role transition + morphIds for entrances
    const copy = deepClone(layout);
    tagMorphIds(copy.elements || [], copy.role);
    stampFlagshipSlideMotion(copy, cfg);
    layouts[lid] = copy;
    sequence.push(lid);
  });

  deck.layouts = layouts;
  deck.layoutSequence = sequence;
  deck.engine = deck.engine || {};
  deck.engine.motion = {
    ...cfg,
    v: "1.1",
    scenes: sequence.filter((id) => /-pan-|-scatter-/.test(id)),
    parallax: { bgScale: cfg.parallaxScale || 1.25, textShift: cfg.parallaxTextShift || 0.05 },
  };
  deck.engine.v = "1.5-pro-motion";
  if (cfg.ambient) applyAmbientToDeck(deck);
  applyWaveDesign(deck, cfg.wave);
  return deck;
}

/**
 * Flagship motion grammar (Morph off):
 * - Continuity fade (default): slow crossfade everywhere — Landscapes recipe
 * - Problem / solution still push (argument beat) unless continuity forces fade
 * Ambient (Ken Burns / pulse / float) is assigned separately by ambient.ts
 */
function pickRoleTransition(role: string, cfg: MotionConfig): string {
  const r = String(role || "").toLowerCase();
  if (cfg.continuityFade !== false) {
    // Landscapes recipe: almost everything crossfades; keep push only for hard argument turns
    if (r === "problem" || r === "solution" || r === "comparison" || r === "versus") return "push";
    return "fade";
  }
  if (r === "cover" || r === "title" || r === "section" || r === "divider") return "fade";
  if (r === "quote" || r === "testimonial" || r === "closing" || r === "close" || r === "cta") {
    return "fade";
  }
  if (r === "problem" || r === "solution" || r === "comparison" || r === "versus") {
    return "push";
  }
  if (
    r === "stats" ||
    r === "how-it-works" ||
    r === "process" ||
    r === "feature" ||
    r === "agenda" ||
    r === "team" ||
    r === "gallery"
  ) {
    return "wipe";
  }
  return cfg.defaultTransition || "fade";
}

function pickRoleDurationMs(role: string, cfg: MotionConfig): number {
  const r = String(role || "").toLowerCase();
  const base = cfg.durationMs != null ? Number(cfg.durationMs) : 800;
  if (cfg.continuityFade !== false) {
    // Match PowerPoint spd="slow" feel (~1.6–2.0s)
    if (r === "cover" || r === "quote" || r === "testimonial" || r === "closing" || r === "close") {
      return Math.max(base, 1800);
    }
    if (r === "problem" || r === "solution" || r === "comparison") return Math.max(base, 900);
    return Math.max(base, 1600);
  }
  if (r === "cover" || r === "quote" || r === "testimonial" || r === "closing" || r === "close") {
    return Math.max(base, 900);
  }
  if (r === "problem" || r === "solution" || r === "comparison") return Math.max(base, 750);
  return base || 800;
}

/** Stamp role transition without clobbering an author lock or ambient assignment. */
function stampFlagshipSlideMotion(layout: any, cfg: MotionConfig) {
  if (!layout) return;
  const locked = !!(layout.motion && layout.motion.lockTransition);
  const transition = locked
    ? layout.motion.transition
    : pickRoleTransition(layout.role, cfg);
  const durationMs = locked
    ? layout.motion.durationMs || pickRoleDurationMs(layout.role, cfg)
    : pickRoleDurationMs(layout.role, cfg);
  layout.motion = {
    ...(layout.motion || {}),
    transition,
    durationMs,
    continuityFade: cfg.continuityFade !== false,
    entrancesMode: cfg.continuityFade !== false ? "newOnly" : layout.motion?.entrancesMode,
  };
}

/** Shared flagship defaults — Morph retired; Landscapes-style continuity fade on. */
export const FLAGSHIP_MOTION: MotionConfig = {
  morph: false,
  ambient: true,
  continuityFade: true,
  cameraPan: false,
  scatter: false,
  defaultTransition: "fade",
  durationMs: 1600,
};

module.exports = {
  expandMotionScenes,
  expandCoverParallax,
  expandScatter,
  tagMorphIds,
  isFullBleedHero,
  coverHasCameraPanHero,
  limitCameraPanMorphIds,
  pickRoleTransition,
  pickRoleDurationMs,
  stampFlagshipSlideMotion,
  FLAGSHIP_MOTION,
};
