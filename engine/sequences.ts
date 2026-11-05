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

export const DECK_SEQUENCES: Record<string, DeckSequence> = {
  /** Cover → Problem → Solution → Product → Roadmap → Traction → Pricing → Team → Closing */
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

  /** Cover → Agenda → Exec Summary → Diagnosis → Chart → Analysis → Actions → Closing */
  "consulting-report": {
    id: "consulting-report",
    label: "Consulting Report",
    beats: [
      { role: "cover", variant: "a", beat: "cover" },
      { role: "report", variant: "agenda", beat: "agenda" },
      { role: "report", variant: "executive-summary", beat: "exec-summary" },
      { role: "report", variant: "consulting-breakdown", beat: "diagnosis" },
      { role: "report", variant: "chart-panel", beat: "evidence" },
      { role: "report", variant: "two-column-text", beat: "analysis" },
      { role: "report", variant: "bulleted-list", beat: "actions" },
      { role: "closing", variant: "b", beat: "closing" },
    ],
  },

  /** Cover → Pain Points → Solution → Case Study → Pricing → Next Steps */
  "sales-proposal": {
    id: "sales-proposal",
    label: "Sales Proposal",
    beats: [
      { role: "cover", variant: "a", beat: "cover" },
      { role: "comparison", variant: "split", beat: "pain-points" },
      { role: "feature", variant: "b", beat: "solution" },
      { role: "testimonial", variant: "a", beat: "case-study" },
      { role: "pricing", variant: "three-tier", beat: "pricing" },
      { role: "closing", variant: "b", beat: "next-steps" },
    ],
  },

  /** Cover → Exec Summary → Audience Personas → Strategy Roadmap → KPIs → Budget */
  "marketing-plan": {
    id: "marketing-plan",
    label: "Marketing Plan",
    beats: [
      { role: "cover", variant: "a", beat: "cover" },
      { role: "report", variant: "executive-summary", beat: "exec-summary" },
      { role: "feature", variant: "b", beat: "personas" },
      { role: "timeline", variant: "horizontal", beat: "roadmap" },
      { role: "stats", variant: "a", beat: "kpis" },
      { role: "report", variant: "data-table", beat: "budget" },
    ],
  },

  /** Cover → Mission → Timeline → Team → Product Masonry → Testimonial → Closing */
  "company-overview": {
    id: "company-overview",
    label: "Company Overview",
    beats: [
      { role: "cover", variant: "a", beat: "cover" },
      { role: "problem", variant: "b", beat: "mission" },
      { role: "timeline", variant: "horizontal", beat: "timeline" },
      { role: "team", variant: "b", beat: "team" },
      { role: "portfolio", variant: "masonry", beat: "product" },
      { role: "testimonial", variant: "a", beat: "testimonial" },
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

export function listSequences(): DeckSequence[] {
  return Object.keys(DECK_SEQUENCES).map((id) => DECK_SEQUENCES[id]);
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
  listSequences,
  selectionsFromSequence,
};
