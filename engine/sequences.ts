/**
 * Deck archetypes — forced narrative flows that override per-slide layout selection.
 */
export type SequenceBeat = {
  role: string;
  variant: string;
  beat: string;
};

export type DeckSequence = {
  id: string;
  label: string;
  beats: SequenceBeat[];
};

/** Pitch narrative: Cover → Problem → Solution → Product → Traction → Pricing → Team → Closing.
 *  Comparison + Timeline are inserted so new structural kits appear in the flow.
 */
export const DECK_SEQUENCES: Record<string, DeckSequence> = {
  "pitch-deck": {
    id: "pitch-deck",
    label: "Pitch Deck",
    beats: [
      { role: "cover", variant: "a", beat: "cover" },
      { role: "comparison", variant: "split", beat: "problem" },
      { role: "feature", variant: "b", beat: "solution" },
      { role: "portfolio", variant: "masonry", beat: "product" },
      { role: "timeline", variant: "horizontal", beat: "roadmap" },
      { role: "stats", variant: "hero-split", beat: "traction" },
      { role: "pricing", variant: "three-tier", beat: "pricing" },
      { role: "team", variant: "b", beat: "team" },
      { role: "closing", variant: "b", beat: "closing" },
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

export function getSequence(id: string): DeckSequence | null {
  return DECK_SEQUENCES[id] || null;
}

/** Force selections from a sequence; pads/truncates to slide count. */
export function selectionsFromSequence(
  sequenceId: string,
  slideCount: number
): Array<{ role: string; variant: string; beat?: string }> {
  const seq = getSequence(sequenceId);
  if (!seq) return [];
  const out: Array<{ role: string; variant: string; beat?: string }> = [];
  for (let i = 0; i < slideCount; i++) {
    const beat = seq.beats[Math.min(i, seq.beats.length - 1)];
    out.push({ role: beat.role, variant: beat.variant, beat: beat.beat });
  }
  return out;
}

module.exports = {
  DECK_SEQUENCES,
  resolveSequenceId,
  getSequence,
  selectionsFromSequence,
};
