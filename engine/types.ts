export type Role =
  | "cover"
  | "agenda"
  | "problem"
  | "solution"
  | "how-it-works"
  | "feature"
  | "stats"
  | "testimonial"
  | "team"
  | "closing"
  | "report"
  | "timeline"
  | "comparison"
  | "pricing"
  | "portfolio";

export type DeckType = "Pitch" | "Overview" | "Report" | "Proposal";

export type ContentDensity = "keynote" | "report";

export interface DeckSpecStyle {
  palette: string;
  typePair: string;
  imageTreatment: string;
  motif: string;
  /** solid | outline — hollow display type when outline */
  typeTreatment?: string;
  /** keynote = short punchy; report = consulting-grade dense copy */
  contentDensity?: ContentDensity;
  /** Deck archetype — overrides per-slide layout selection (e.g. pitch-deck) */
  sequence?: string;
  archetype?: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface TeamMember {
  name: string;
  role: string;
}

export interface TableCell {
  text: string;
  bold?: boolean;
}

export interface DeckSpecSlide {
  role: Role;
  variantHint?:
    | "a"
    | "b"
    | "c"
    | "editorial"
    | "brutalist"
    | "dashboard"
    | "two-column-text"
    | "bulleted-list"
    | "executive-summary"
    | "data-table"
    | "consulting-breakdown"
    | "agenda"
    | "chart-panel"
    | string;
  title: string;
  body?: string[];
  /** Compact agenda / partner labels, independent of body paragraph normalization. */
  items?: string[];
  stats?: StatItem[];
  members?: TeamMember[];
  caption?: string;
  /** Executive-summary key takeaway */
  takeaway?: string;
  /** Consulting-breakdown hero metric (auto-extracted from body when omitted) */
  heroStat?: string;
  /** Two-column sub-headers (e.g. Current State / Regional Differences) */
  headers?: string[];
  columnHeaders?: string[];
  /** Native PPTX table rows (4×4 / 5×5 consulting grids) */
  table?: string[][] | TableCell[][];
  /** Native editable PPTX chart (donut / line / stackedBar) */
  chart?: {
    type?: "donut" | "line" | "stackedBar" | string;
    labels?: string[];
    series?: Array<{ name?: string; values: number[] }>;
    colors?: string[];
    showLegend?: boolean;
    holeSize?: number;
    showPercent?: boolean;
  };
  /** Overflow-routed continuation slide — excluded from roleSequence exact-once */
  continued?: boolean;
  photoQuery?: string;
  /** One query per photo slot for repeater kits (feature/b). */
  photoQueries?: string[];
  photoOrientation?: "landscape" | "portrait" | "square";
  /** Per-slot orientations for mixed-ratio stress (feature grids). */
  photoOrientations?: Array<"landscape" | "portrait" | "square">;
  /** Timeline / roadmap steps (routes to timeline/horizontal). */
  steps?: Array<{ title?: string; body?: string; date?: string; label?: string }>;
  dates?: string[];
  /** Before/After comparison columns (routes to comparison/split). */
  before?: string[];
  after?: string[];
  /** Pricing / package tiers (routes to pricing/three-tier). */
  tiers?: Array<{
    name?: string;
    price?: string;
    features?: string[];
    badge?: string;
    popular?: boolean;
  }>;
  pricing?: Array<{
    name?: string;
    price?: string;
    features?: string[];
    badge?: string;
    popular?: boolean;
  }>;
}

export interface DeckSpec {
  style: DeckSpecStyle;
  slides: DeckSpecSlide[];
}

export interface ValidateResult {
  ok: boolean;
  errors: string[];
}

export interface GateSlideResult {
  slideIndex: number;
  role: string;
  pass: boolean;
  reasons: string[];
}

export interface GateResult {
  pass: boolean;
  slides: GateSlideResult[];
}

export interface FitSlotResult {
  slotId: string;
  text: string;
  fontSize: number;
  rejected: boolean;
  reason?: string;
}

export const DECK_TYPE_MIN_SLIDES: Record<DeckType, number> = {
  Pitch: 9,
  Overview: 8,
  Report: 8,
  Proposal: 8,
};

/** Required roles — each must appear exactly once (extras allowed only if listed). */
export const DECK_TYPE_REQUIRED_ROLES: Record<DeckType, Role[]> = {
  Pitch: ["cover", "problem", "solution", "how-it-works", "feature", "stats", "testimonial", "team", "closing"],
  Overview: ["cover", "problem", "feature", "how-it-works", "team", "stats", "testimonial", "closing"],
  Report: ["cover", "agenda", "problem", "stats", "solution", "feature", "team", "closing"],
  // note: role "report" may appear multiple times as data-dense extras
  Proposal: ["cover", "problem", "solution", "feature", "stats", "team", "testimonial", "closing"],
};

export interface StyleLock {
  palette?: string;
  typePair?: string;
  imageTreatment?: string;
  motif?: string;
}
