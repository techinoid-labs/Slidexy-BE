/**
 * Content policy: keynote (short) vs report/dense (consulting-grade).
 * Overflow routing: body blocks > 80 words split / bulletize — never shrink below floors.
 *
 * Engine fontSize units are canvas px. PPTX catalog maps them with ×0.6 → true points
 * (1600 canvas / 13.333" / 72). Use ptToEngine() so "14pt" floors stay true PowerPoint points.
 */

export type ContentDensity = "keynote" | "report";

export const TITLE_MAX_WORDS = 8;
export const BODY_MAX_WORDS = 20;
export const REPORT_TITLE_MAX_WORDS = 14;
export const REPORT_BODY_MAX_WORDS = 80;
/** Split when a single body block exceeds this — do not shrink font. */
export const OVERFLOW_SPLIT_WORDS = 80;
export const OVERFLOW_FIRST_CHUNK = 40;

/** True PowerPoint point floors (hard limits). */
export const MIN_READABLE_PT = 14;
export const REPORT_BODY_MIN_PT = 14;
export const REPORT_TITLE_MIN_PT = 24;
export const KEYNOTE_BODY_MIN_PT = 14;
export const KEYNOTE_TITLE_MIN_PT = 24;
export const REPORT_BODY_PREF_PT = 16;
export const AXIS_LABEL_MIN_PT = 12;

/** canvas_px ≈ pt / 0.6  (catalog points() = engine * 0.6) */
export const ENGINE_PER_PT = 1600 / (13.333 * 72);

export function ptToEngine(pt: number): number {
  return Math.ceil(Number(pt) * ENGINE_PER_PT);
}

export function engineToPt(engine: number): number {
  return Math.round(Number(engine) * 0.6 * 10) / 10;
}

export function resolveContentDensity(specOrStyle: any): ContentDensity {
  const style = (specOrStyle && specOrStyle.style) || specOrStyle || {};
  const raw = String(style.contentDensity || style.density || "").toLowerCase();
  if (raw === "report" || raw === "dense" || raw === "consulting") return "report";
  if (style.deckType === "Report") return "report";
  return "keynote";
}

/** Floors returned in engine (canvas) units for fitText / render. */
export function typographyFloors(density: ContentDensity): {
  titleMin: number;
  bodyMin: number;
  bodyPref: number;
  titleMinPt: number;
  bodyMinPt: number;
} {
  const titleMinPt = density === "report" ? REPORT_TITLE_MIN_PT : KEYNOTE_TITLE_MIN_PT;
  const bodyMinPt = density === "report" ? REPORT_BODY_MIN_PT : KEYNOTE_BODY_MIN_PT;
  return {
    titleMin: ptToEngine(titleMinPt),
    bodyMin: ptToEngine(bodyMinPt),
    bodyPref: ptToEngine(density === "report" ? REPORT_BODY_PREF_PT : bodyMinPt),
    titleMinPt,
    bodyMinPt,
  };
}

export function wordCount(text: string): number {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function truncateWords(text: string, maxWords: number): string {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "…";
}

export function takeWords(text: string, start: number, count: number): string {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(start, start + count).join(" ");
}

/** Split a long paragraph into three short bullets (≤12 words each). Keynote only. */
export function toThreeBullets(paragraph: string): string[] {
  const raw = String(paragraph || "").trim();
  if (!raw) return ["—", "—", "—"];
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/[.!?]+$/, ""))
    .filter(Boolean);
  if (sentences.length >= 3) {
    return sentences.slice(0, 3).map((s) => truncateWords(s, 12));
  }
  if (sentences.length === 2) {
    const rest = sentences[1].split(/\s+/).filter(Boolean);
    const mid = Math.ceil(rest.length / 2);
    return [
      truncateWords(sentences[0], 12),
      truncateWords(rest.slice(0, mid).join(" "), 12),
      truncateWords(rest.slice(mid).join(" "), 12),
    ];
  }
  if (sentences.length === 1) {
    const clauses = sentences[0]
      .split(/,\s+|;\s+|\s+—\s+|\s+-\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (clauses.length >= 3) {
      return clauses.slice(0, 3).map((s) => truncateWords(s, 12));
    }
  }
  const words = raw.split(/\s+/).filter(Boolean);
  const chunk = Math.max(1, Math.ceil(words.length / 3));
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    const part = words.slice(i * chunk, (i + 1) * chunk).join(" ");
    if (part) out.push(truncateWords(part, 12));
  }
  while (out.length < 3) out.push(out[out.length - 1] || "—");
  return out.slice(0, 3);
}

/** True when slide copy is too dense for photo-forward kits. */
export function needsTextHeavyLayout(slide: any): boolean {
  if (wordCount(slide && slide.title) > TITLE_MAX_WORDS) return true;
  const body: string[] = Array.isArray(slide && slide.body) ? slide.body : [];
  if (body.some((b) => wordCount(String(b)) > BODY_MAX_WORDS)) return true;
  const caption = slide && slide.caption;
  if (caption && wordCount(String(caption)) > BODY_MAX_WORDS) return true;
  return false;
}

function longestBodyBlock(slide: any): { index: number; text: string; words: number } | null {
  const body: string[] = Array.isArray(slide && slide.body) ? slide.body : [];
  let best: { index: number; text: string; words: number } | null = null;
  body.forEach((b, i) => {
    const text = String(b || "").trim();
    const words = wordCount(text);
    if (!best || words > best.words) best = { index: i, text, words };
  });
  return best;
}

/**
 * If any body block exceeds OVERFLOW_SPLIT_WORDS, emit two slides:
 * first gets the first chunk; second gets the remainder + " (cont.)" on title.
 * Does NOT shrink fonts — overflow is routed to another slide (or bulletized upstream).
 */
export function splitSlideOnOverflow(slide: any): any[] {
  if (!slide || typeof slide !== "object") return [slide];
  const longest = longestBodyBlock(slide);
  if (!longest || longest.words <= OVERFLOW_SPLIT_WORDS) return [{ ...slide }];

  const words = longest.text.split(/\s+/).filter(Boolean);
  const first = words.slice(0, OVERFLOW_FIRST_CHUNK).join(" ");
  const rest = words.slice(OVERFLOW_FIRST_CHUNK).join(" ");
  const body = Array.isArray(slide.body) ? slide.body.map((b: any) => String(b || "")) : [];

  const firstSlide = {
    ...slide,
    body: body.map((b: string, i: number) => (i === longest.index ? first : b)),
  };

  const baseTitle = String(slide.title || "Continued").replace(/\s*\(cont\.\)\s*$/i, "").trim();
  const contSlide = {
    ...slide,
    title: baseTitle + " (cont.)",
    continued: true,
    body: body.map((b: string, i: number) => (i === longest.index ? rest : b)),
  };

  // Recursively split if remainder still exceeds threshold
  return [firstSlide, ...splitSlideOnOverflow(contSlide)];
}

/** Convert a long prose block into short bullets instead of shrinking type. */
export function paragraphToBullets(paragraph: string, maxBullets = 4): string[] {
  const raw = String(paragraph || "").trim();
  if (!raw) return [];
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 2) {
    return sentences.slice(0, maxBullets).map((s) => "• " + truncateWords(s.replace(/^•\s*/, ""), 22));
  }
  return toThreeBullets(raw).map((b) => (b.startsWith("•") ? b : "• " + b));
}

export function expandOverflowSlides(slides: any[]): any[] {
  const out: any[] = [];
  (slides || []).forEach((s) => {
    splitSlideOnOverflow(s).forEach((part) => out.push(part));
  });
  return out;
}

/**
 * Normalize slide copy.
 * Keynote: titles ≤8 words; body >20 → 3 bullets / truncate.
 * Report: keep consulting-grade prose (up to ~100 words/block); overflow handled by splitSlideOnOverflow.
 */
export function normalizeSlideContent(slide: any, density: ContentDensity = "keynote"): any {
  if (!slide || typeof slide !== "object") return slide;
  const next = { ...slide };
  const titleMax = density === "report" ? REPORT_TITLE_MAX_WORDS : TITLE_MAX_WORDS;
  const bodyMax = density === "report" ? REPORT_BODY_MAX_WORDS : BODY_MAX_WORDS;

  if (next.title) {
    // Preserve "(cont.)" suffix when truncating
    const cont = /\s*\(cont\.\)\s*$/i.test(String(next.title));
    const base = String(next.title).replace(/\s*\(cont\.\)\s*$/i, "").trim();
    next.title = truncateWords(base, titleMax) + (cont ? " (cont.)" : "");
  }

  if (Array.isArray(next.body)) {
    const items = next.body.map((b: any) => String(b || "").trim()).filter(Boolean);
    if (density === "report") {
      // Keep detailed copy; soft-cap only far above slide capacity (split handles true overflow)
      next.body = items.map((b: string) => truncateWords(b, Math.max(bodyMax, OVERFLOW_SPLIT_WORDS)));
    } else {
      const longOnes = items.filter((b: string) => wordCount(b) > BODY_MAX_WORDS);
      if (items.length === 1 && longOnes.length === 1) {
        next.body = toThreeBullets(items[0]);
      } else if (longOnes.length >= 1 && items.length <= 2) {
        next.body = toThreeBullets(items.join(" "));
      } else if (longOnes.length >= 1) {
        next.body = items.slice(0, 6).map((b: string) => {
          const lead = String(b)
            .split(/(?<=[.!?])\s+/)[0]
            .replace(/[.!?]+$/, "")
            .trim();
          return truncateWords(lead || b, 8);
        });
      } else {
        next.body = items.map((b: string) => truncateWords(b, BODY_MAX_WORDS));
      }
    }
  }

  if (next.caption) {
    next.caption = truncateWords(
      String(next.caption),
      density === "report" ? 40 : BODY_MAX_WORDS
    );
  }

  if (next.takeaway) {
    next.takeaway = truncateWords(
      String(next.takeaway),
      density === "report" ? 60 : BODY_MAX_WORDS
    );
  }

  if (Array.isArray(next.stats)) {
    next.stats = next.stats.map((s: any) => ({
      ...s,
      label: s && s.label ? truncateWords(String(s.label), BODY_MAX_WORDS) : s.label,
    }));
  }

  if (Array.isArray(next.members)) {
    next.members = next.members.map((m: any) => ({
      ...m,
      role: m && m.role ? truncateWords(String(m.role), 6) : m.role,
    }));
  }

  return next;
}

export function normalizeDeckSpec(spec: any): any {
  if (!spec || !Array.isArray(spec.slides)) return spec;
  const density = resolveContentDensity(spec);
  const expanded = expandOverflowSlides(spec.slides);
  return {
    ...spec,
    slides: expanded.map((s: any) => normalizeSlideContent(s, density)),
  };
}

/**
 * fitText helper: refuse to shrink when a *single paragraph* exceeds the word cap.
 * Multi-line / already-bulleted blocks are structured — do not flatten them.
 */
export function shouldSplitInsteadOfShrink(text: string): boolean {
  const raw = String(text || "");
  if (/\n/.test(raw) || /•/.test(raw)) return false;
  return wordCount(raw) > OVERFLOW_SPLIT_WORDS;
}

module.exports = {
  TITLE_MAX_WORDS,
  BODY_MAX_WORDS,
  REPORT_TITLE_MAX_WORDS,
  REPORT_BODY_MAX_WORDS,
  OVERFLOW_SPLIT_WORDS,
  OVERFLOW_FIRST_CHUNK,
  MIN_READABLE_PT,
  REPORT_BODY_MIN_PT,
  REPORT_TITLE_MIN_PT,
  KEYNOTE_BODY_MIN_PT,
  KEYNOTE_TITLE_MIN_PT,
  REPORT_BODY_PREF_PT,
  AXIS_LABEL_MIN_PT,
  ENGINE_PER_PT,
  ptToEngine,
  engineToPt,
  resolveContentDensity,
  typographyFloors,
  wordCount,
  truncateWords,
  takeWords,
  toThreeBullets,
  paragraphToBullets,
  needsTextHeavyLayout,
  splitSlideOnOverflow,
  expandOverflowSlides,
  normalizeSlideContent,
  normalizeDeckSpec,
  shouldSplitInsteadOfShrink,
};
