const fs = require("fs");
const path = require("path");
import { DeckSpec, DeckType, DECK_TYPE_MIN_SLIDES, GateResult, GateSlideResult } from "./types";
const { fitText } = require("./fit");

const KIT = path.join(__dirname, "..", "kit");
const MAX_SLIDES = 14;

function loadVariant(role: string, variant: string) {
  const file = path.join(KIT, role, variant + ".json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function relativeLuminance(hex: string): number {
  const h = String(hex || "").replace("#", "");
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function slotText(slide: any, from: string): string {
  if (!from) return "";
  if (from === "title") return slide.title || "";
  if (from === "caption") return slide.caption || "";
  if (from === "body") return (slide.body || []).join("\n");
  const bodyM = String(from).match(/^body(\d)$/);
  if (bodyM) return (slide.body && slide.body[Number(bodyM[1])]) || "";
  const statsM = String(from).match(/^stats(\d)\.(value|label)$/);
  if (statsM) {
    const item = slide.stats && slide.stats[Number(statsM[1])];
    return (item && item[statsM[2]]) || "";
  }
  const memM = String(from).match(/^members(\d)\.(name|role)$/);
  if (memM) {
    const item = slide.members && slide.members[Number(memM[1])];
    return (item && item[memM[2]]) || "";
  }
  if (from === "memberLine") {
    return (slide.members || [])
      .map((m: any) => (m.name || "") + (m.role ? " — " + m.role : ""))
      .join("\n");
  }
  if (from === "statValue0") return (slide.stats && slide.stats[0] && slide.stats[0].value) || "";
  if (from === "statLabel0") return (slide.stats && slide.stats[0] && slide.stats[0].label) || "";
  return "";
}

export function runGates(
  spec: DeckSpec,
  selections: Array<{ role: string; variant: string }>,
  tokens: any,
  deckType?: DeckType
): GateResult {
  const slides: GateSlideResult[] = [];
  const titles = new Set<string>();
  const count = (spec.slides && spec.slides.length) || 0;
  const minRequired =
    deckType && DECK_TYPE_MIN_SLIDES[deckType] != null ? DECK_TYPE_MIN_SLIDES[deckType] : 4;

  if (count < minRequired || count > MAX_SLIDES) {
    const hint = deckType
      ? deckType + " needs ≥" + minRequired + " and ≤" + MAX_SLIDES
      : "need " + minRequired + "–" + MAX_SLIDES;
    slides.push({
      slideIndex: -1,
      role: "deck",
      pass: false,
      reasons: ["slideCountOK failed: " + hint + ", got " + count],
    });
  }

  spec.slides.forEach((slide, i) => {
    const reasons: string[] = [];
    const sel = selections[i] || { role: slide.role, variant: slide.variantHint || "a" };
    const variant = loadVariant(sel.role, sel.variant);
    const palette = tokens.palettes[spec.style.palette];

    const key = String(slide.title || "").trim().toLowerCase();
    if (key) {
      if (titles.has(key)) reasons.push("noDuplicateTitles: " + slide.title);
      titles.add(key);
    }

    if (variant.requiresPhoto) {
      if (!slide.photoQuery || !String(slide.photoQuery).trim()) {
        reasons.push("photoPresent: missing photoQuery for " + variant.id);
      }
    }

    if (palette) {
      const ratio = contrastRatio(palette.ink, palette.bg);
      if (ratio < 4.5) reasons.push("contrastOK: ink/bg ratio " + ratio.toFixed(2));
    }

    (variant.layout.elements || []).forEach((el: any) => {
      if (el.type !== "text" || !el.slot) return;
      const slotMeta = (variant.slots && variant.slots[el.slot]) || {};
      const from = slotMeta.from || el.slot;
      const rules = (variant.fit && variant.fit[el.slot]) || { minFont: 16, maxFont: el.fontSize || 32, lineClamp: 4 };
      const text = slotText(slide, from);
      if (!text) return;
      const fitted = fitText(text, { width: el.width, height: el.height }, rules);
      if (fitted.rejected) reasons.push("textFits: " + el.slot + " " + (fitted.reason || "overflow"));
    });

    slides.push({
      slideIndex: i,
      role: slide.role,
      pass: reasons.length === 0,
      reasons,
    });
  });

  return { pass: slides.every((s) => s.pass), slides };
}

module.exports = { runGates, contrastRatio, slotText };
