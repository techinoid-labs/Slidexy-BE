const fs = require("fs");
const path = require("path");
import { DeckSpec, DeckSpecSlide } from "./types";
const { needsTextHeavyLayout } = require("./content");
const { resolveSequenceId, selectionsFromSequence } = require("./sequences");

const KIT = path.join(__dirname, "..", "kit");
const tokensDoc = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));

export type VariantId = string;

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kitExists(role: string, variant: string): boolean {
  return fs.existsSync(path.join(KIT, role, variant + ".json"));
}

function listVariants(role: string): string[] {
  const dir = path.join(KIT, role);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n: string) => n.endsWith(".json") && n !== "text-heavy.json")
    .map((n: string) => n.replace(/\.json$/, ""));
}

function pickAB(rand: () => number, preferB: boolean, force?: VariantId): VariantId {
  if (force) return force;
  if (preferB) return rand() < 0.7 ? "b" : "a";
  return rand() < 0.55 ? "a" : "b";
}

function loadFamily(role: string, variant: VariantId): string | null {
  const file = path.join(KIT, role, variant + ".json");
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return data.family ? String(data.family) : null;
}

function otherVariant(role: string, current: VariantId, allowed?: string[]): VariantId | null {
  const order = allowed && allowed.length ? allowed : listVariants(role);
  for (const v of order) {
    if (v === current) continue;
    if (kitExists(role, v)) return v;
  }
  return null;
}

export function resolveThemeLock(spec: DeckSpec): any | null {
  const locks = tokensDoc.themeLocks || {};
  const palette = spec.style && spec.style.palette;
  for (const id of Object.keys(locks)) {
    const lock = locks[id];
    if (lock && lock.match && lock.match.palette === palette) {
      return { id, ...lock };
    }
  }
  return null;
}

function clampToAllowed(
  role: string,
  variant: VariantId,
  lock: any | null
): VariantId {
  if (!lock || !lock.allowed) return variant;
  const allowed: string[] = lock.allowed[role] || [];
  if (!allowed.length) return variant;
  if (allowed.indexOf(variant) >= 0 && kitExists(role, variant)) return variant;
  const prefer = lock.prefer && lock.prefer[role];
  if (prefer && allowed.indexOf(prefer) >= 0 && kitExists(role, prefer)) return prefer;
  for (const v of allowed) {
    if (kitExists(role, v)) return v;
  }
  return variant;
}

function looksLikeDate(text: string): boolean {
  const t = String(text || "");
  return (
    /\b(Q[1-4]|FY\d{2,4}|20\d{2}|day\s*\d+|week\s*\d+|month\s*\d+|phase\s*\d+|step\s*\d+)\b/i.test(
      t
    ) || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i.test(t)
  );
}

/** Content-shape detectors for smart layout routing. */
export function detectContentRoute(
  slide: DeckSpecSlide | any
): { role: string; variant: VariantId } | null {
  if (!slide) return null;

  const hasSteps =
    (Array.isArray(slide.steps) && slide.steps.length >= 2) ||
    (Array.isArray(slide.dates) && slide.dates.length >= 2);
  const bodyDates =
    Array.isArray(slide.body) &&
    slide.body.length >= 3 &&
    slide.body.filter((b: any) => looksLikeDate(String(b))).length >= 2;
  if ((hasSteps || bodyDates) && kitExists("timeline", "horizontal")) {
    return { role: "timeline", variant: "horizontal" };
  }

  const hasTiers =
    (Array.isArray(slide.tiers) && slide.tiers.length >= 2) ||
    (Array.isArray(slide.pricing) && slide.pricing.length >= 2);
  const pricingHint =
    /pric|tier|plan|package|starter|growth|enterprise/i.test(String(slide.title || "")) ||
    String(slide.variantHint || "") === "three-tier";
  if ((hasTiers || (pricingHint && Array.isArray(slide.body) && slide.body.length >= 3)) &&
    kitExists("pricing", "three-tier")) {
    return { role: "pricing", variant: "three-tier" };
  }

  const hasBeforeAfter =
    (Array.isArray(slide.before) && slide.before.length > 0 && Array.isArray(slide.after) && slide.after.length > 0) ||
    (Array.isArray(slide.headers) &&
      slide.headers.length >= 2 &&
      /before/i.test(String(slide.headers[0])) &&
      /after/i.test(String(slide.headers[1])));
  if (hasBeforeAfter && kitExists("comparison", "split")) {
    return { role: "comparison", variant: "split" };
  }

  const stats = Array.isArray(slide.stats) ? slide.stats : [];
  const hasHeroStat = stats.length === 1 || !!(slide as any).heroStat;
  const hasChart =
    !!(slide as any).chart &&
    (Array.isArray((slide as any).chart.series) || Array.isArray((slide as any).chart.labels));
  if (hasHeroStat && hasChart && kitExists("stats", "hero-split")) {
    return { role: "stats", variant: "hero-split" };
  }

  const photos = Array.isArray(slide.photoQueries) ? slide.photoQueries.length : 0;
  if (
    photos >= 3 &&
    (slide.role === "portfolio" ||
      slide.role === "feature" ||
      String(slide.variantHint || "") === "masonry") &&
    kitExists("portfolio", "masonry")
  ) {
    return { role: "portfolio", variant: "masonry" };
  }

  return null;
}

/** Deterministic variant from content shape + seeded shuffle. */
export function selectVariant(
  slide: DeckSpecSlide,
  deckSeed: string,
  slideIndex: number,
  lock?: any | null
): { role: string; variant: VariantId } {
  const rand = mulberry32(hashSeed(deckSeed + ":" + slideIndex + ":" + slide.role));
  const hint = slide.variantHint as VariantId | undefined;
  const bodyLen = (slide.body || []).length;
  const statsLen = (slide.stats || []).length;
  const membersLen = (slide.members || []).length;
  const hasPhoto =
    !!(slide.photoQuery && String(slide.photoQuery).trim()) ||
    (Array.isArray(slide.photoQueries) && slide.photoQueries.length > 0);

  // Smart content→layout routing (wins over random, loses to explicit sequence)
  const routed = detectContentRoute(slide);
  if (routed && (!hint || String(hint) === routed.variant || String(hint) === "auto")) {
    return routed;
  }

  // Named new-kit hints
  if (hint === "horizontal" && kitExists("timeline", "horizontal")) {
    return { role: "timeline", variant: "horizontal" };
  }
  if (hint === "split" && kitExists("comparison", "split")) {
    return { role: "comparison", variant: "split" };
  }
  if (hint === "three-tier" && kitExists("pricing", "three-tier")) {
    return { role: "pricing", variant: "three-tier" };
  }
  if (hint === "masonry" && kitExists("portfolio", "masonry")) {
    return { role: "portfolio", variant: "masonry" };
  }
  if (hint === "hero-split" && kitExists("stats", "hero-split")) {
    return { role: "stats", variant: "hero-split" };
  }

  let variant: VariantId = "a";
  let role = slide.role;
  const textHeavy = needsTextHeavyLayout(slide);
  const hasTextHeavyKit = kitExists(slide.role, "c");
  const prefer = lock && lock.prefer && lock.prefer[slide.role];

  // Theme prefer / named hints win early
  if (hint && kitExists(slide.role, String(hint))) {
    variant = String(hint);
  } else if (prefer && kitExists(slide.role, prefer)) {
    variant = prefer;
  } else {
    switch (slide.role) {
      case "stats":
        if (hint === "c" || hint === "a" || hint === "b" || hint === "dashboard" || hint === "hero-split")
          variant = hint;
        else if (statsLen === 1 && (slide as any).chart && kitExists("stats", "hero-split"))
          variant = "hero-split";
        else if (statsLen === 2 && !hasPhoto) variant = "a";
        else if (!hasPhoto && statsLen >= 1 && rand() < 0.45) variant = "c";
        else if (statsLen === 1 && !hasPhoto) variant = rand() < 0.55 ? "c" : "a";
        else if (hasPhoto && statsLen === 1) variant = rand() < 0.6 ? "b" : "a";
        else variant = pickAB(rand, false);
        break;
      case "feature":
        if (
          hint === "a" ||
          hint === "b" ||
          hint === "c" ||
          hint === "editorial" ||
          hint === "morph-scatter" ||
          hint === "isometric"
        )
          variant = hint as VariantId;
        else if (textHeavy && hasTextHeavyKit) variant = "c";
        else if (bodyLen >= 4 || (Array.isArray(slide.photoQueries) && slide.photoQueries.length >= 4))
          variant = "b";
        else variant = pickAB(rand, false, "a");
        break;
      case "problem":
      case "solution":
        if (hint === "a" || hint === "b" || hint === "c" || hint === "editorial") variant = hint as VariantId;
        else if (textHeavy && hasTextHeavyKit) variant = "c";
        else if (!hasPhoto) variant = pickAB(rand, true, slide.role === "problem" ? "b" : undefined);
        else variant = pickAB(rand, false, "a");
        break;
      case "closing":
        variant = pickAB(rand, true, hint || "b");
        break;
      case "agenda":
        variant = hasPhoto ? pickAB(rand, true, hint) : pickAB(rand, false, hint || "a");
        break;
      case "testimonial":
        if (hint === "a" || hint === "b" || hint === "c" || hint === "brutalist") variant = hint as VariantId;
        else variant = pickAB(rand, bodyLen <= 2);
        break;
      case "team":
        if (hint === "a" || hint === "b" || hint === "c") variant = hint as VariantId;
        else variant = membersLen >= 3 ? pickAB(rand, true, "b") : pickAB(rand, false, "a");
        break;
      case "cover":
        if (hint === "a" || hint === "b" || hint === "brutalist") variant = hint as VariantId;
        else variant = pickAB(rand, false, hint);
        break;
      case "how-it-works":
        if (hint === "a" || hint === "b" || hint === "c" || hint === "dashboard") variant = hint as VariantId;
        else if (textHeavy && hasTextHeavyKit) variant = "c";
        else variant = hasPhoto ? pickAB(rand, false, "a") : pickAB(rand, true, "b");
        break;
      case "timeline":
        variant = kitExists("timeline", "horizontal") ? "horizontal" : "a";
        break;
      case "comparison":
        variant = kitExists("comparison", "split") ? "split" : "a";
        break;
      case "pricing":
        variant = kitExists("pricing", "three-tier") ? "three-tier" : "a";
        break;
      case "portfolio":
        variant = kitExists("portfolio", "masonry") ? "masonry" : "a";
        break;
      case "report": {
        const reportVariants = [
          "two-column-text",
          "bulleted-list",
          "executive-summary",
          "data-table",
          "consulting-breakdown",
          "agenda",
          "chart-panel",
        ];
        if (hint && reportVariants.indexOf(String(hint)) >= 0 && kitExists("report", String(hint))) {
          variant = String(hint);
        } else if ((slide as any).chart) {
          variant = "chart-panel";
        } else if (Array.isArray((slide as any).table) && (slide as any).table.length) {
          variant = "data-table";
        } else if ((slide as any).takeaway) {
          variant = "executive-summary";
        } else if (hint === "agenda" || String(slide.title || "").toLowerCase().indexOf("agenda") >= 0) {
          variant = "agenda";
        } else if (
          bodyLen === 1 &&
          String((Array.isArray(slide.body) && slide.body[0]) || "").length > 160
        ) {
          variant = "consulting-breakdown";
        } else if (bodyLen >= 4) {
          variant = "bulleted-list";
        } else if (bodyLen >= 2) {
          variant = "two-column-text";
        } else {
          variant = reportVariants[Math.floor(rand() * reportVariants.length)];
        }
        break;
      }
      default:
        variant = hint || (rand() < 0.5 ? "a" : "b");
    }
  }

  if (!kitExists(role, variant)) {
    variant = kitExists(role, "a") ? "a" : listVariants(role)[0] || "a";
  }

  variant = clampToAllowed(role, variant, lock || null);

  return { role, variant };
}

/**
 * Pick variants for the whole deck. Theme locks restrict creative vs corporate kits.
 * Deck sequences (e.g. pitch-deck) override individual selection entirely.
 * Never place two adjacent slides from the same composition family (except text-heavy).
 */
export function selectAll(spec: DeckSpec, prompt: string): Array<{ role: string; variant: VariantId }> {
  const seed = prompt + "|" + spec.style.palette + "|" + spec.style.typePair;
  const lock = resolveThemeLock(spec);
  // Inject lock typeTreatment onto style when absent
  if (lock && lock.typeTreatment && !(spec.style as any).typeTreatment) {
    (spec.style as any).typeTreatment = lock.typeTreatment;
  }

  const sequenceId = resolveSequenceId(spec);
  if (sequenceId) {
    const forced = selectionsFromSequence(sequenceId, (spec.slides || []).length);
    // Align slide roles to sequence beats so render loads the correct kits
    forced.forEach((sel: any, i: number) => {
      if (spec.slides[i]) {
        (spec.slides[i] as any).role = sel.role;
        (spec.slides[i] as any).variantHint = sel.variant;
      }
    });
    return forced.map((s: any) => ({ role: s.role, variant: s.variant }));
  }

  const out: Array<{ role: string; variant: VariantId }> = [];
  let prevFamily: string | null = null;

  spec.slides.forEach((slide, i) => {
    let sel = selectVariant(slide, seed, i, lock);
    // Keep slide.role in sync when smart routing remaps the kit family
    if (sel.role !== slide.role) {
      (slide as any).role = sel.role;
    }
    let family = loadFamily(sel.role, sel.variant);
    if (family && family === prevFamily && family !== "text-heavy") {
      const allowed = lock && lock.allowed && lock.allowed[sel.role];
      const other = otherVariant(sel.role, sel.variant, allowed);
      if (other) {
        const otherFamily = loadFamily(sel.role, other);
        if (otherFamily !== family) {
          sel = { role: sel.role, variant: other };
          family = otherFamily;
        }
      }
    }
    out.push(sel);
    prevFamily = family;
  });

  return out;
}

module.exports = {
  selectVariant,
  selectAll,
  hashSeed,
  loadFamily,
  resolveThemeLock,
  listVariants,
  detectContentRoute,
};
