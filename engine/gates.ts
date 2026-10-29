const fs = require("fs");
const path = require("path");
import { DeckSpec, GateResult, GateSlideResult } from "./types";
const { fitText } = require("./fit");

const KIT = path.join(__dirname, "..", "kit");

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

export function runGates(spec: DeckSpec, selections: Array<{ role: string; variant: string }>, tokens: any): GateResult {
  const slides: GateSlideResult[] = [];
  const titles = new Set<string>();

  if (!spec.slides || spec.slides.length < 4 || spec.slides.length > 14) {
    slides.push({
      slideIndex: -1,
      role: "deck",
      pass: false,
      reasons: ["slideCountOK failed: need 4–14 slides, got " + ((spec.slides && spec.slides.length) || 0)],
    });
  }

  spec.slides.forEach((slide, i) => {
    const reasons: string[] = [];
    const sel = selections[i] || { role: slide.role, variant: slide.variantHint || "a" };
    const variant = loadVariant(sel.role, sel.variant);
    const palette = tokens.palettes[spec.style.palette];

    // noDuplicateTitles
    const key = String(slide.title || "").trim().toLowerCase();
    if (key) {
      if (titles.has(key)) reasons.push("noDuplicateTitles: " + slide.title);
      titles.add(key);
    }

    // photoPresent
    if (variant.requiresPhoto) {
      if (!slide.photoQuery || !String(slide.photoQuery).trim()) {
        reasons.push("photoPresent: missing photoQuery for " + variant.id);
      }
    }

    // contrastOK — ink on bg
    if (palette) {
      const ratio = contrastRatio(palette.ink, palette.bg);
      if (ratio < 4.5) reasons.push("contrastOK: ink/bg ratio " + ratio.toFixed(2));
    }

    // textFits — title + body via fit rules
    (variant.layout.elements || []).forEach((el: any) => {
      if (el.type !== "text" || !el.slot) return;
      const rules = (variant.fit && variant.fit[el.slot]) || { minFont: 16, maxFont: el.fontSize || 32, lineClamp: 4 };
      let text = "";
      if (el.slot === "title") text = slide.title || "";
      else if (el.slot === "caption") text = slide.caption || "";
      else if (el.slot === "stat") text = slide.stat || "";
      else if (el.slot === "body" || el.slot.indexOf("body") === 0 || /^[bcn]\d$/.test(el.slot) || /^s\d$/.test(el.slot)) {
        text = (slide.body || []).join("\n");
      }
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

module.exports = { runGates, contrastRatio };
