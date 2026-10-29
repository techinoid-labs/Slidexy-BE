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
  | "closing";

export type DeckType = "Pitch" | "Overview" | "Report" | "Proposal";

export interface DeckSpecStyle {
  palette: string;
  typePair: string;
  imageTreatment: string;
  motif: string;
}

export interface DeckSpecSlide {
  role: Role;
  variantHint?: "a" | "b";
  title: string;
  body?: string[];
  stat?: string;
  caption?: string;
  photoQuery?: string;
  photoOrientation?: "landscape" | "portrait" | "square";
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
