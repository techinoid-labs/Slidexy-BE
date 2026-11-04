/**
 * Motion scene expansion — Camera Pan (cover parallax) + Scatter (feature grid).
 * Pure deck transforms; OOXML Morph/timing applied later in catalog export.
 */

const { applyAmbientToDeck } = require("./ambient");

export type MotionConfig = {
  morph?: boolean;
  /** Continuous on-slide loops (Pulse / Float / Ken Burns / Teeter). One per slide. */
  ambient?: boolean;
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

function tagMorphIds(elements: any[], role: string) {
  (elements || []).forEach((el) => {
    if (!el || el.morphId) return;
    const slot = String(el.slot || el.id || "");
    if (el.type === "text" && (el.id === "title" || el.slot === "title" || slot === "title")) el.morphId = "title";
    else if (el.type === "text" && (el.id === "caption" || el.slot === "caption" || slot === "caption")) el.morphId = "caption";
    else if (el.type === "text" && (el.id === "body" || el.slot === "body" || /^b\d$/.test(slot))) {
      el.morphId = el.morphId || (/^b\d$/.test(slot) ? "body-" + slot.slice(1) : "body");
    } else if (el.type === "image") {
      if (/^p\d$/.test(slot)) el.morphId = "photo-" + slot.slice(1);
      else el.morphId = "hero";
    } else if (el.type === "text" && /^v\d$/.test(slot)) {
      el.morphId = "stat-" + (Number(slot.slice(1)) - 1);
    } else if (
      el.type === "shape" &&
      (el.id === "neon" ||
        el.id === "accent" ||
        el.id === "pulse-bg" ||
        el.id === "titlePlate" ||
        String(el.id || "").startsWith("accent") ||
        el.motif ||
        el.overlapPlate ||
        el.shapeTreatment === "depth")
    ) {
      if (el.id === "pulse-bg") el.morphId = el.morphId || "pulse-bg";
      else if (String(el.id || "").startsWith("accent") || el.id === "accent" || el.motif) el.morphId = el.morphId || "accent";
      else if (el.id === "titlePlate") el.morphId = el.morphId || "titlePlate";
      else el.morphId = el.morphId || el.id || "plate";
      if (el.overlapPlate || el.shapeTreatment === "depth") el.shapeTreatment = el.shapeTreatment || "depth";
    }
    void role;
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

  (end.elements || []).forEach((el: any) => {
    if (el.type === "image" && (el.morphId === "hero" || el.slot === "cutout" || el.slot === "photoL" || el.id === "cutout" || el.id === "photoL" || el.id === "hero")) {
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

  // Start frame: slightly tighter / opposite pan so Morph has delta
  (start.elements || []).forEach((el: any) => {
    if (el.type === "image" && (el.morphId === "hero" || el.slot === "cutout" || el.slot === "photoL" || el.id === "cutout" || el.id === "photoL")) {
      el.morphId = "hero";
    }
    if (el.type === "shape" && (el.id === "neon" || el.overlapPlate)) {
      el.shapeTreatment = "depth";
      el.morphId = el.morphId || "plate";
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
      if (!layout.motion) {
        layout.motion = {
          transition: pickRoleTransition(layout.role, cfg),
          durationMs: 800,
        };
      }
    });
    deck.engine = deck.engine || {};
    deck.engine.motion = { ...cfg, v: "1.1", scenes: [] };
    deck.engine.v = "1.5-pro-motion";
    if (cfg.ambient) applyAmbientToDeck(deck);
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

    if (cfg.cameraPan !== false && layout.role === "cover") {
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

    // Non-morph slides: stamp default transition + morphIds for entrances
    const copy = deepClone(layout);
    tagMorphIds(copy.elements || [], copy.role);
    if (!copy.motion) {
      copy.motion = {
        transition: pickRoleTransition(copy.role, cfg),
        durationMs: 800,
      };
    }
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
  return deck;
}

function pickRoleTransition(role: string, cfg: MotionConfig): string {
  if (role === "problem" || role === "solution") return cfg.defaultTransition === "morph" ? "push" : cfg.defaultTransition || "push";
  if (role === "closing") return "fade";
  if (role === "stats" || role === "how-it-works") return "wipe";
  return cfg.defaultTransition || "fade";
}

module.exports = { expandMotionScenes, expandCoverParallax, expandScatter, tagMorphIds };
