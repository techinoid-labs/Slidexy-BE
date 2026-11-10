const fs = require("fs");
const path = require("path");
import {
  DeckSpec,
  DeckType,
  DECK_TYPE_MIN_SLIDES,
  DECK_TYPE_REQUIRED_ROLES,
  GateResult,
  GateSlideResult,
} from "./types";
const { fitText } = require("./fit");
const { queriesForSlots, isTeamPortraitQuery } = require("./photos");

const KIT = path.join(__dirname, "..", "kit");
const MAX_SLIDES = 18;
/** Roles that may repeat (data-dense report kits / overflow continuations). */
const MULTI_ROLE_OK = new Set(["report", "timeline", "comparison", "pricing", "portfolio"]);
/** Secondary text (muted) vs slide bg — WCAG AA + visual floor for dark UIs. */
const MIN_MUTED_CONTRAST = 4.5;

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
  const itemMatch = from.match(/^items(\d+)$/);
  if (itemMatch) return (slide.items && slide.items[Number(itemMatch[1])]) || "";
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

  // roleSequenceOK: each required role appears exactly once (continued overflow slides ignored)
  if (deckType && DECK_TYPE_REQUIRED_ROLES[deckType]) {
    const required = DECK_TYPE_REQUIRED_ROLES[deckType];
    const counts: Record<string, number> = {};
    (spec.slides || []).forEach((s: any) => {
      if (s && s.continued) return;
      counts[s.role] = (counts[s.role] || 0) + 1;
    });
    const roleFails: string[] = [];
    required.forEach((role) => {
      const n = counts[role] || 0;
      if (n !== 1) roleFails.push(role + "×" + n);
    });
    Object.keys(counts).forEach((role) => {
      if (required.indexOf(role as any) < 0 && counts[role] > 1 && !MULTI_ROLE_OK.has(role)) {
        roleFails.push("extra-dup " + role + "×" + counts[role]);
      }
    });
    if (roleFails.length) {
      slides.push({
        slideIndex: -1,
        role: "deck",
        pass: false,
        reasons: [
          "roleSequenceOK failed: need each of [" +
            required.join(", ") +
            "] exactly once; got " +
            roleFails.join("; "),
        ],
      });
    }
  }

  // photoUnique: every resolved query across the deck must be distinct
  const allQueries: string[] = [];
  const queryOwners: Array<{ slideIndex: number; role: string; query: string }> = [];
  spec.slides.forEach((slide, i) => {
    const sel = selections[i] || { role: slide.role, variant: slide.variantHint || "a" };
    const variant = loadVariant(sel.role, sel.variant);
    const slotCount = (variant.photoSlots || []).length;
    if (!slotCount) return;
    queriesForSlots(slide, slotCount).forEach((q: string) => {
      allQueries.push(q);
      queryOwners.push({ slideIndex: i, role: slide.role, query: q });
    });
  });
  const seenQ = new Map<string, number>();
  const dupSlideIndexes = new Set<number>();
  queryOwners.forEach((row) => {
    const key = row.query.trim().toLowerCase();
    if (seenQ.has(key)) {
      dupSlideIndexes.add(row.slideIndex);
      dupSlideIndexes.add(seenQ.get(key) as number);
    } else {
      seenQ.set(key, row.slideIndex);
    }
  });

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

    const slotCount = (variant.photoSlots || []).length;
    if (variant.requiresPhoto || slotCount > 0) {
      const qs = queriesForSlots(slide, Math.max(slotCount, variant.requiresPhoto ? 1 : 0));
      if (!qs.length || qs.some((q: string) => !String(q).trim())) {
        reasons.push("photoPresent: missing photoQuery for " + variant.id);
      } else if (slotCount > 1 && qs.length < slotCount) {
        // team/b + feature/b: optional trailing slots when data < photoSlots
        const membersLen = Array.isArray(slide.members) ? slide.members.length : 0;
        const featureLen = Math.max(
          Array.isArray(slide.body) ? slide.body.length : 0,
          Array.isArray(slide.photoQueries) ? slide.photoQueries.length : 0
        );
        const teamOk =
          slide.role === "team" && membersLen > 0 && qs.length >= Math.min(slotCount, membersLen);
        const featureOk =
          variant.id === "feature/b" &&
          featureLen > 0 &&
          qs.length >= Math.min(slotCount, featureLen);
        if (!teamOk && !featureOk) {
          reasons.push("photoPresent: need " + slotCount + " queries for " + variant.id + ", got " + qs.length);
        }
      }
    }

    if (dupSlideIndexes.has(i)) {
      reasons.push("photoUnique: duplicate photoQuery on this deck");
    }

    // team role: portraits only — reject car / abstract / scene queries
    if (slide.role === "team") {
      const qs = queriesForSlots(slide, Math.max(slotCount, 1));
      qs.forEach((q: string) => {
        if (!isTeamPortraitQuery(q)) {
          reasons.push(
            "teamPortraitOK: query must be a people/headshot portrait (got \"" +
              String(q).slice(0, 60) +
              "\")"
          );
        }
      });
    }

    if (palette) {
      const inkRatio = contrastRatio(palette.ink, palette.bg);
      if (inkRatio < 4.5) reasons.push("contrastOK: ink/bg ratio " + inkRatio.toFixed(2));
      const mutedRatio = contrastRatio(palette.muted, palette.bg);
      if (mutedRatio < MIN_MUTED_CONTRAST) {
        reasons.push(
          "contrastOK: muted/bg ratio " +
            mutedRatio.toFixed(2) +
            " (need ≥" +
            MIN_MUTED_CONTRAST +
            " for labels/roles)"
        );
      }
      const mutedOnSurface = contrastRatio(palette.muted, palette.surface || palette.bg);
      if (mutedOnSurface < MIN_MUTED_CONTRAST) {
        reasons.push(
          "contrastOK: muted/surface ratio " +
            mutedOnSurface.toFixed(2) +
            " (need ≥" +
            MIN_MUTED_CONTRAST +
            ")"
        );
      }
    }

    (variant.layout.elements || []).forEach((el: any) => {
      if (el.type !== "text" || !el.slot) return;
      const slotMeta = (variant.slots && variant.slots[el.slot]) || {};
      const from = slotMeta.from || el.slot;
      const rules: any = {
        minFont: 24,
        maxFont: el.fontSize || 32,
        lineClamp: 8,
        ...((variant.fit && variant.fit[el.slot]) || {}),
      };
      const text = slotText(slide, from);
      if (!text) return;
      rules.splitOnOverflow = !/\n|•/.test(String(text));
      const fitted = fitText(text, { width: el.width, height: el.height }, rules);
      if (fitted.rejected && fitted.reason !== "overflow-split") {
        reasons.push("textFits: " + el.slot + " " + (fitted.reason || "overflow"));
      }
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
