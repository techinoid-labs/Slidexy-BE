import { DeckSpec, DeckSpecSlide } from "./types";

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

function pickAB(rand: () => number, preferB: boolean, force?: "a" | "b"): "a" | "b" {
  if (force) return force;
  if (preferB) return rand() < 0.7 ? "b" : "a";
  return rand() < 0.55 ? "a" : "b";
}

/** Deterministic variant from content shape + seeded shuffle. */
export function selectVariant(
  slide: DeckSpecSlide,
  deckSeed: string,
  slideIndex: number
): { role: string; variant: "a" | "b" } {
  const rand = mulberry32(hashSeed(deckSeed + ":" + slideIndex + ":" + slide.role));
  const hint = slide.variantHint;
  const bodyLen = (slide.body || []).length;
  const statsLen = (slide.stats || []).length;
  const membersLen = (slide.members || []).length;
  const hasPhoto = !!(slide.photoQuery && String(slide.photoQuery).trim());

  let variant: "a" | "b" = "a";

  switch (slide.role) {
    case "stats":
      if (!hasPhoto) variant = hint || "a";
      else if (statsLen === 1 && !hint) variant = rand() < 0.6 ? "b" : "a";
      else variant = pickAB(rand, false, hint || "a");
      break;
    case "feature":
      variant = bodyLen >= 3 ? pickAB(rand, true, hint || "b") : pickAB(rand, false, hint || "a");
      break;
    case "problem":
    case "solution":
    case "closing":
      if (!hasPhoto) variant = slide.role === "problem" || slide.role === "closing" ? pickAB(rand, true, hint || "b") : pickAB(rand, true, hint);
      else variant = pickAB(rand, false, hint || "a");
      break;
    case "agenda":
      variant = hasPhoto ? pickAB(rand, true, hint) : pickAB(rand, false, hint || "a");
      break;
    case "testimonial":
      variant = pickAB(rand, bodyLen <= 2, hint);
      break;
    case "team":
      variant = membersLen >= 3 ? pickAB(rand, true, hint || "b") : pickAB(rand, false, hint || "a");
      break;
    case "cover":
      variant = pickAB(rand, false, hint);
      break;
    case "how-it-works":
      variant = hasPhoto ? pickAB(rand, false, hint || "a") : pickAB(rand, true, hint || "b");
      break;
    default:
      variant = hint || (rand() < 0.5 ? "a" : "b");
  }

  return { role: slide.role, variant };
}

export function selectAll(spec: DeckSpec, prompt: string): Array<{ role: string; variant: "a" | "b" }> {
  const seed = prompt + "|" + spec.style.palette + "|" + spec.style.typePair;
  return spec.slides.map((slide, i) => selectVariant(slide, seed, i));
}

module.exports = { selectVariant, selectAll, hashSeed };
