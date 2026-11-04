/**
 * Ambient / looping motion kit selection — exactly ONE effect per slide.
 * Never on Morph start frames; never when the next slide Morphs into view.
 */
const fs = require("fs");
const path = require("path");

export type AmbientEffectId = "pulse" | "float" | "kenBurns" | "teeter";

export type AmbientAssignment = {
  effect: AmbientEffectId;
  kitId: string;
  morphId: string;
  durationMs: number;
  scale?: number;
  degrees?: number;
  autoReverse?: boolean;
  path?: string;
  radiusPx?: number;
  panXPx?: number;
  panYPx?: number;
  transformOrigin?: string;
  containerScale?: number;
  repeatCount: "indefinite";
};

type AmbientKit = {
  id: string;
  effect: AmbientEffectId;
  target?: { prefer?: string[] };
  params?: Record<string, any>;
  roles?: string[];
  families?: string[];
  variants?: string[];
  priority?: number;
};

const KIT_DIR = path.join(__dirname, "..", "kit", "ambient");
const STANDARD_TRANSITIONS = new Set(["fade", "push", "wipe", "none", ""]);

function loadAmbientKits(): AmbientKit[] {
  if (!fs.existsSync(KIT_DIR)) return [];
  return fs
    .readdirSync(KIT_DIR)
    .filter((f: string) => f.endsWith(".json"))
    .map((f: string) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(KIT_DIR, f), "utf8")) as AmbientKit;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as AmbientKit[];
}

function elementMorphIds(layout: any): string[] {
  const ids: string[] = [];
  (layout.elements || []).forEach((el: any) => {
    if (el && el.morphId) ids.push(String(el.morphId));
  });
  return ids;
}

function variantKeyOf(layout: any): string {
  const variant = String(layout.variant || "");
  return variant.includes("/") ? variant.split("/").pop()! : variant;
}

function layoutTransition(layout: any): string {
  if (!layout) return "none";
  if (layout.morphDestination || layout.morphKeyframe === "end") return "morph";
  if (layout.motion && layout.motion.transition) return String(layout.motion.transition);
  return "none";
}

function isMorphLayout(layout: any): boolean {
  if (!layout) return false;
  const t = layoutTransition(layout);
  return t === "morph" || layout.morphDestination === true || layout.morphKeyframe === "end";
}

function allowsAmbientOnSlide(layout: any, nextLayout: any | null): boolean {
  if (!layout) return false;
  // Morph start must stay static for Morph matching
  if (layout.morphKeyframe === "start") return false;
  // Never ambient on a Morph destination (Morph owns the beat)
  if (isMorphLayout(layout)) return false;
  // If the *next* slide Morphs in, this slide is the Morph start — keep static
  if (nextLayout && isMorphLayout(nextLayout)) return false;
  // Only standard transitions (fade / push / wipe / none)
  const t = layoutTransition(layout);
  if (!STANDARD_TRANSITIONS.has(t)) return false;
  if (layout.motion && layout.motion.ambient === false) return false;
  return true;
}

function resolveTarget(kit: AmbientKit, layout: any): string | null {
  const prefer = (kit.target && kit.target.prefer) || [];
  const present = new Set(elementMorphIds(layout));
  const els = layout.elements || [];

  for (const id of prefer) {
    if (!present.has(id)) continue;
    const el = els.find((e: any) => e && e.morphId === id);
    // Pulse must never hit text numbers
    if (kit.effect === "pulse" && el && el.type === "text") continue;
    // Float must never target hairline accents (invisible motion)
    if (
      kit.effect === "float" &&
      el &&
      ((Number(el.width) || 0) < 80 || (Number(el.height) || 0) < 40)
    )
      continue;
    if (el) return id;
  }

  if (kit.effect === "kenBurns") {
    const img = els.find((el: any) => el && el.type === "image" && el.morphId);
    if (img) return img.morphId;
  }
  if (kit.effect === "float") {
    const bigEnough = (el: any) => el && (Number(el.width) || 0) >= 80 && (Number(el.height) || 0) >= 40;
    // Isometric hover: prefer image-card (must be large)
    const vKey = variantKeyOf(layout);
    if (vKey === "isometric" || layout.family === "isometric") {
      const card = els.find((el: any) => el && el.ambientTarget === "image-card" && el.morphId && bigEnough(el));
      if (card) return card.morphId;
      const img = els.find((el: any) => el && el.type === "image" && el.morphId && bigEnough(el));
      if (img) return img.morphId;
    }
    // Prefer large plates over tiny brush accents (8px bars are invisible when floated)
    const plate = els.find(
      (el: any) =>
        el &&
        el.type === "shape" &&
        el.morphId &&
        bigEnough(el) &&
        (el.id === "titlePlate" || el.id === "neon" || el.overlapPlate || el.id === "accent" || el.morphId === "plate")
    );
    if (plate) return plate.morphId;
    const img = els.find((el: any) => el && el.type === "image" && el.morphId && bigEnough(el));
    if (img) return img.morphId;
  }
  if (kit.effect === "pulse") {
    const bg = els.find(
      (el: any) =>
        el &&
        el.type === "shape" &&
        el.morphId &&
        (el.morphId === "pulse-bg" ||
          el.id === "pulse-bg" ||
          el.morphId === "accent" ||
          el.id === "accent" ||
          el.id === "neon")
    );
    if (bg) return bg.morphId;
  }
  return null;
}

function kitMatchesLayout(kit: AmbientKit, layout: any): boolean {
  const role = String(layout.role || "");
  const family = String(layout.family || "");
  const variantKey = variantKeyOf(layout);
  if (kit.variants && kit.variants.length && (kit.variants.indexOf(String(layout.variant)) >= 0 || kit.variants.indexOf(variantKey) >= 0))
    return true;
  if (kit.families && kit.families.length && kit.families.indexOf(family) >= 0) return true;
  if (kit.roles && kit.roles.length && kit.roles.indexOf(role) >= 0) {
    // isometric float-hover kit only for isometric
    if (kit.id === "ambient/teeter" || (kit.families || []).indexOf("isometric") >= 0) {
      return variantKey === "isometric" || family === "isometric";
    }
    // generic float should not steal isometric (teeter/hover kit owns it)
    if (kit.effect === "float" && kit.id === "ambient/float" && (variantKey === "isometric" || family === "isometric")) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Pick exactly one ambient kit for a layout, or null.
 */
export function selectAmbientForLayout(
  layout: any,
  ambientEnabled?: boolean,
  nextLayout?: any | null
): AmbientAssignment | null {
  if (!ambientEnabled || !layout) return null;
  if (!allowsAmbientOnSlide(layout, nextLayout || null)) return null;

  if (layout.motion && layout.motion.ambientEffect) {
    const forced = String(layout.motion.ambientEffect);
    const kits = loadAmbientKits();
    const kit = kits.find((k) => k.effect === forced || k.id === "ambient/" + forced || k.id.endsWith("/" + forced));
    if (kit) {
      const morphId = resolveTarget(kit, layout);
      if (morphId) return assignmentFromKit(kit, morphId, layout);
    }
  }

  const kits = loadAmbientKits()
    .filter((k) => kitMatchesLayout(k, layout))
    .sort((a, b) => (a.priority || 100) - (b.priority || 100));

  for (const kit of kits) {
    const morphId = resolveTarget(kit, layout);
    if (morphId) return assignmentFromKit(kit, morphId, layout);
  }
  return null;
}

function assignmentFromKit(kit: AmbientKit, morphId: string, layout?: any): AmbientAssignment {
  const p = kit.params || {};
  const vKey = layout ? variantKeyOf(layout) : "";
  let path = p.path;
  // Isometric always uses Y-axis hover float
  if ((kit.id === "ambient/teeter" || vKey === "isometric" || (layout && layout.family === "isometric")) && kit.effect === "float") {
    path = p.path || "y-axis";
  }
  return {
    effect: kit.effect,
    kitId: kit.id,
    morphId,
    durationMs: Number(p.durationMs) || 3000,
    scale: p.scale != null ? Number(p.scale) : undefined,
    degrees: p.degrees != null ? Number(p.degrees) : undefined,
    autoReverse: p.autoReverse !== false,
    path,
    radiusPx: p.radiusPx != null ? Number(p.radiusPx) : 8,
    panXPx: p.panXPx != null ? Number(p.panXPx) : undefined,
    panYPx: p.panYPx != null ? Number(p.panYPx) : undefined,
    transformOrigin: p.transformOrigin || (kit.effect === "kenBurns" ? "center" : undefined),
    containerScale: p.containerScale != null ? Number(p.containerScale) : kit.effect === "kenBurns" ? 1.18 : undefined,
    repeatCount: "indefinite",
  };
}

/** Pre-scale Ken Burns image containers 110% about center so zoom never shows slide bg. */
function prepareKenBurnsContainer(layout: any, ambient: AmbientAssignment) {
  if (!ambient || ambient.effect !== "kenBurns") return;
  const scale = Number(ambient.containerScale) || 1.18;
  (layout.elements || []).forEach((el: any) => {
    if (!el || el.morphId !== ambient.morphId) return;
    if (el.type !== "image" && el.type !== "shape") return;
    if (el._kenBurnsPrepared) return;
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    el.width = Math.round(el.width * scale);
    el.height = Math.round(el.height * scale);
    el.x = Math.round(cx - el.width / 2);
    el.y = Math.round(cy - el.height / 2);
    el._kenBurnsPrepared = true;
    el.transformOrigin = "center";
  });
}

/** Stamp ambient on every layout when engine.motion.ambient is true. */
export function applyAmbientToDeck(deck: any): any {
  if (!deck || !deck.engine || !deck.engine.motion || !deck.engine.motion.ambient) return deck;
  const sequence = deck.layoutSequence || [];
  const loops: any[] = [];

  sequence.forEach((lid: string, index: number) => {
    const layout = deck.layouts[lid];
    if (!layout) return;
    const nextLid = sequence[index + 1];
    const nextLayout = nextLid ? deck.layouts[nextLid] : null;
    const ambient = selectAmbientForLayout(layout, true, nextLayout);
    layout.motion = layout.motion || {};
    if (ambient) {
      prepareKenBurnsContainer(layout, ambient);
      layout.motion.ambient = ambient;
      loops.push({
        slideIndex: index + 1,
        layoutId: lid,
        role: layout.role,
        variant: layout.variant,
        transition: layoutTransition(layout),
        nextMorph: !!(nextLayout && isMorphLayout(nextLayout)),
        ...ambient,
      });
    } else {
      layout.motion.ambient = null;
    }
  });

  deck.engine.motion.ambientLoops = loops;
  return deck;
}

module.exports = {
  selectAmbientForLayout,
  applyAmbientToDeck,
  loadAmbientKits,
  allowsAmbientOnSlide,
  prepareKenBurnsContainer,
};
