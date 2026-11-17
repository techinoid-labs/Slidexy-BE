/**
 * Slidexy Atelier — premium pack registry.
 * Only decks that pass the communication-first ship bar.
 * Keep in sync with docs/template-pipeline/ATELIER-PACK.md
 */
export const ATELIER_PACK_IDS = [
  "lumen-stage", // void · beam · keynote
] as const;

export type AtelierPackId = (typeof ATELIER_PACK_IDS)[number];

export const ATELIER_DISPLAY_NAMES: Record<AtelierPackId, string> = {
  "lumen-stage": "LUMEN STAGE",
};

/**
 * Draft exclusives — not premium until they pass the ship bar
 * (photo-led cover, type carries talk, motif accents only).
 */
export const ATELIER_DRAFT_IDS = [
  "carta-folio", // beige paper · wine · framed photo · condensed type
  "ferrotype",
  "sumi-field",
  "kiln-slab",
  "noir-ledger",
  "porcelain-brief",
  "signal-atlas",
  "cosmic-depth",
  "vellum-register",
] as const;

export function isAtelierPackId(id: string): id is AtelierPackId {
  return (ATELIER_PACK_IDS as readonly string[]).includes(id);
}
