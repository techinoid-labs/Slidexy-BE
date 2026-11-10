/**
 * Prompt → family / SEL routing for AI compose.
 * Short-term differentiator vs Gamma: pick a metaphor system, then bind content.
 *
 *   import { routeFamily, applyCreativeDefaults } from "./familyRouter";
 */
import { FAMILY_SEL, FamilySel, SelUnitId, familySel } from "./sel";

export type RouteHit = {
  family: string;
  metaphor: string;
  units: SelUnitId[];
  confidence: number;
  reasons: string[];
  motion: FamilySel["motion"];
};

const KEYWORDS: Record<string, string[]> = {
  darkroom: ["photo", "photography", "film", "darkroom", "print", "ilford", "exposure", "aperture", "contact sheet", "proof"],
  grade: ["color grade", "grading", "lut", "edit suite", "timeline", "waveform", "davinci", "nodes", "render queue", "b-roll"],
  gulhane: ["transit", "tram", "metro", "station", "route", "timetable", "fare", "istanbul", "destination"],
  gridlock: ["race", "pit", "f1", "formula", "telemetry", "lap", "compound", "sector", "radio", "grid"],
  hearth: ["interior", "home", "fireplace", "real estate", "listing", "rooms", "materials", "folio", "viewing"],
  oxide: ["mural", "street art", "spray", "stencil", "graffiti", "atelier", "pigment", "wall"],
  lantern: ["cafe", "coffee shop", "night", "counter", "menu", "open late", "mosaic"],
  rosso: ["garage", "ferrari", "supercar", "automotive", "horsepower", "ignition", "bay"],
  abyss: ["abyss", "sonar", "dive", "bathysphere", "deep sea", "trench", "submarine", "porthole", "pressure"],
  eclipse: ["eclipse", "planetarium", "orbit", "constellation", "totality", "observatory", "celestial", "vault"],
  voltaic: ["foundry", "molten", "pour", "slag", "forge", "voltaic", "smelter", "heat", "ignite"],
  prism: ["prism", "stained glass", "spectrum", "refract", "rose window", "shard", "crypt", "glass"],
  jukebox: ["jukebox", "diner", "vinyl", "song", "setlist", "needle", "reel", "credits"],
  carnival: ["carnival", "fair", "ferris", "booth", "prize", "ticket", "awning", "lot"],
  parlor: ["parlor", "letterpress", "stationery", "wax seal", "calling card", "tea", "invitation"],
  linen: ["linen", "postcard", "stamp", "postage", "ribbon", "send", "desk", "mail"],
  marquee: ["marquee", "theater", "theatre", "stage", "curtain", "spotlight", "stub", "encore"],
  strike: ["bowling", "strike", "spare", "lane", "pins", "league", "alley"],
  apiary: ["apiary", "honey", "hive", "bees", "comb", "jar", "keeper"],
  newsstand: ["newsstand", "magazine", "masthead", "issue", "print", "rack", "vendor", "sunday"],
  vitrine: ["vitrine", "museum", "plinth", "gallery case", "caption", "curated", "on view", "exhibit"],
  dossier: ["dossier", "clip", "brief", "folio", "binder", "case file", "filed", "index tab"],
  mezzanine: ["mezzanine", "white cube", "installation", "didactic", "hang", "pedestal", "install view"],
  platepress: ["platepress", "printmaker", "etching", "litho", "aquatint", "edition", "ink well", "press pull"],
  tidewater: ["regatta", "paddle", "harbour", "coastal", "buoy", "water", "boat"],
  roast: ["coffee", "roast", "bean", "brew", "espresso", "origin"],
  idea: ["workshop", "sticky", "brainstorm", "affinity", "dot vote", "notes"],
};

/**
 * Classify a user brief into the best creative family + SEL set.
 */
export function routeFamily(prompt: string): RouteHit {
  const text = String(prompt || "").toLowerCase();
  const scores: { family: string; score: number; hits: string[] }[] = [];

  for (const [family, words] of Object.entries(KEYWORDS)) {
    const hits = words.filter((w) => text.includes(w));
    if (hits.length) scores.push({ family, score: hits.length, hits });
  }
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (!best) {
    const fallback = FAMILY_SEL[0];
    return {
      family: fallback.family,
      metaphor: fallback.metaphor,
      units: fallback.units,
      confidence: 0.15,
      reasons: ["no keyword match — defaulted to first SEL family"],
      motion: fallback.motion,
    };
  }

  const sel = familySel(best.family) || FAMILY_SEL.find((f) => f.family === best.family);
  const confidence = Math.min(0.95, 0.35 + best.score * 0.15);
  return {
    family: best.family,
    metaphor: sel?.metaphor || best.family,
    units: sel?.units || [],
    confidence,
    reasons: best.hits.map((h) => `keyword:${h}`),
    motion: sel?.motion || { cover: "fade", feature: "entrances", close: "pulse" },
  };
}

/** Recommended creative mutators after compose (mutate_creative.js). */
export const CREATIVE_DEFAULTS = {
  operators: ["highlight_word", "overlap_depth"] as const,
  /** text_mask_image is Tier A preview-rich; enable only for flagship PPTX demos until export parity. */
  optionalTierA: ["text_mask_image"] as const,
  pipeline: [
    "routeFamily(prompt)",
    "select kits from FAMILY_SEL units",
    "renderDeckFromSpec",
    "expandMotionScenes(family.motion)",
    "applyCreative(highlight_word, overlap_depth)",
    "export PPTX + preview",
  ],
};

export function applyCreativeDefaults(): typeof CREATIVE_DEFAULTS {
  return CREATIVE_DEFAULTS;
}

/** List all routable families for gallery / admin. */
export function listRoutableFamilies() {
  return FAMILY_SEL.map((f) => ({
    family: f.family,
    metaphor: f.metaphor,
    units: f.units,
    keywords: KEYWORDS[f.family] || [],
    motion: f.motion,
  }));
}
