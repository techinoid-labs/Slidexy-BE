/**
 * Deck archetypes — forced narrative flows that override per-slide layout selection.
 * Beats may list `variants` pools; one is picked deterministically from the deck seed
 * so anti-grid kits mix in without changing slide count.
 */
export type SequenceBeat = {
  role: string;
  /** Default / fallback variant */
  variant: string;
  /** Optional pool — seeded pick replaces `variant` when present */
  variants?: string[];
  beat: string;
};

export type DeckSequence = {
  id: string;
  label: string;
  beats: SequenceBeat[];
};

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

/** Cover pool — structurally distinct silhouettes (not just palette swaps). */
const COVER_POOL = [
  "poster",
  "hard-split",
  "collage",
  "minimal-center",
  "overlay",
  "editorial-overlap",
  "band-horizon",
  "bottom-slab",
  "right-bleed",
  "circle-hero",
  "type-wall",
  "brutalist",
];

/** Prefer anti-grid options: first entries in each pool are the new geometries. */
export const DECK_SEQUENCES: Record<string, DeckSequence> = {
  "pitch-deck": {
    id: "pitch-deck",
    label: "Pitch Deck",
    beats: [
      {
        role: "cover",
        variant: "editorial-overlap",
        variants: COVER_POOL,
        beat: "cover",
      },
      {
        role: "comparison",
        variant: "quadrant",
        variants: ["quadrant"],
        beat: "problem",
      },
      {
        role: "feature",
        variant: "asymmetric",
        variants: ["asymmetric", "floating-card", "typography-hero"],
        beat: "solution",
      },
      { role: "portfolio", variant: "masonry", beat: "product" },
      {
        role: "timeline",
        variant: "zigzag",
        variants: ["zigzag", "horizontal"],
        beat: "roadmap",
      },
      { role: "stats", variant: "hero-split", beat: "traction" },
      {
        role: "pricing",
        variant: "spotlight",
        variants: ["spotlight", "three-tier"],
        beat: "pricing",
      },
      {
        role: "team",
        variant: "cutout",
        variants: ["cutout"],
        beat: "team",
      },
      {
        role: "closing",
        variant: "full-bleed",
        variants: ["full-bleed", "b"],
        beat: "closing",
      },
    ],
  },

  "consulting-report": {
    id: "consulting-report",
    label: "Consulting Report",
    beats: [
      {
        role: "cover",
        variant: "band-horizon",
        variants: COVER_POOL,
        beat: "cover",
      },
      { role: "report", variant: "agenda", beat: "agenda" },
      { role: "report", variant: "executive-summary", beat: "exec-summary" },
      { role: "report", variant: "pull-quote", beat: "diagnosis" },
      { role: "report", variant: "chart-panel", beat: "evidence" },
      { role: "report", variant: "two-column-text", beat: "analysis" },
      {
        role: "report",
        variant: "pull-quote",
        variants: ["pull-quote", "bulleted-list"],
        beat: "actions",
      },
      {
        role: "closing",
        variant: "full-bleed",
        variants: ["full-bleed", "b"],
        beat: "closing",
      },
    ],
  },

  "sales-proposal": {
    id: "sales-proposal",
    label: "Sales Proposal",
    beats: [
      {
        role: "cover",
        variant: "right-bleed",
        variants: COVER_POOL,
        beat: "cover",
      },
      {
        role: "comparison",
        variant: "quadrant",
        variants: ["quadrant"],
        beat: "pain-points",
      },
      {
        role: "feature",
        variant: "floating-card",
        variants: ["floating-card", "asymmetric", "typography-hero"],
        beat: "solution",
      },
      {
        role: "testimonial",
        variant: "cutout",
        variants: ["cutout"],
        beat: "case-study",
      },
      {
        role: "pricing",
        variant: "spotlight",
        variants: ["spotlight", "three-tier"],
        beat: "pricing",
      },
      {
        role: "closing",
        variant: "full-bleed",
        variants: ["full-bleed", "b"],
        beat: "next-steps",
      },
    ],
  },

  "marketing-plan": {
    id: "marketing-plan",
    label: "Marketing Plan",
    beats: [
      {
        role: "cover",
        variant: "bottom-slab",
        variants: COVER_POOL,
        beat: "cover",
      },
      { role: "report", variant: "executive-summary", beat: "exec-summary" },
      {
        role: "feature",
        variant: "asymmetric",
        variants: ["asymmetric", "floating-card", "typography-hero"],
        beat: "personas",
      },
      {
        role: "timeline",
        variant: "zigzag",
        variants: ["zigzag", "horizontal"],
        beat: "roadmap",
      },
      { role: "stats", variant: "a", beat: "kpis" },
      { role: "report", variant: "data-table", beat: "budget" },
    ],
  },

  "company-overview": {
    id: "company-overview",
    label: "Company Overview",
    beats: [
      {
        role: "cover",
        variant: "circle-hero",
        variants: COVER_POOL,
        beat: "cover",
      },
      {
        role: "feature",
        variant: "typography-hero",
        variants: ["typography-hero", "asymmetric", "floating-card"],
        beat: "mission",
      },
      {
        role: "timeline",
        variant: "zigzag",
        variants: ["zigzag", "horizontal"],
        beat: "timeline",
      },
      {
        role: "team",
        variant: "cutout",
        variants: ["cutout"],
        beat: "team",
      },
      { role: "portfolio", variant: "masonry", beat: "product" },
      {
        role: "testimonial",
        variant: "cutout",
        variants: ["cutout"],
        beat: "testimonial",
      },
      {
        role: "closing",
        variant: "full-bleed",
        variants: ["full-bleed", "b"],
        beat: "closing",
      },
    ],
  },
};

export function resolveSequenceId(spec: any): string | null {
  if (!spec) return null;
  const fromStyle = spec.style && (spec.style.sequence || spec.style.archetype);
  const fromRoot = spec.sequence || spec.archetype;
  const id = String(fromStyle || fromRoot || "").trim();
  return id && DECK_SEQUENCES[id] ? id : null;
}

// Explicit opt-in families generated from the design guides; default pools stay unchanged.
for (const sequence of require("./design-guide-catalog.json").sequences) {
  DECK_SEQUENCES[sequence.id] = sequence;
}

export function getSequence(id: string): DeckSequence | null {
  return DECK_SEQUENCES[id] || null;
}

export function listSequences(): DeckSequence[] {
  return Object.keys(DECK_SEQUENCES).map((id) => DECK_SEQUENCES[id]);
}

function pickVariant(beat: SequenceBeat, rand: () => number): string {
  const pool = Array.isArray(beat.variants) && beat.variants.length ? beat.variants : [beat.variant];
  const idx = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  return pool[idx] || beat.variant;
}

/**
 * Force selections from a sequence; pads/truncates to slide count.
 * Pass `seed` to sample variant pools (anti-grid diversity across decks).
 */
export function selectionsFromSequence(
  sequenceId: string,
  slideCount: number,
  seed?: string
): Array<{ role: string; variant: string; beat?: string }> {
  const seq = getSequence(sequenceId);
  if (!seq) return [];
  const out: Array<{ role: string; variant: string; beat?: string }> = [];
  for (let i = 0; i < slideCount; i++) {
    const beat = seq.beats[Math.min(i, seq.beats.length - 1)];
    const slideRand = mulberry32(
      hashSeed(String(seed || sequenceId) + "|beat|" + i + "|" + beat.beat)
    );
    const variant =
      seed != null
        ? pickVariant(beat, slideRand)
        : Array.isArray(beat.variants) && beat.variants.length
          ? beat.variants[0]
          : beat.variant;
    out.push({ role: beat.role, variant, beat: beat.beat });
  }
  return out;
}

module.exports = {
  DECK_SEQUENCES,
  resolveSequenceId,
  getSequence,
  listSequences,
  selectionsFromSequence,
};
