import { FitSlotResult } from "./types";
const {
  MIN_READABLE_PT,
  ptToEngine,
  shouldSplitInsteadOfShrink,
  takeWords,
  OVERFLOW_FIRST_CHUNK,
} = require("./content");

const HARD_FLOOR_ENGINE = ptToEngine(MIN_READABLE_PT);

/** Rough chars-per-line estimate for Arial-ish faces. */
function charsPerLine(width: number, fontSize: number): number {
  const avg = Math.max(4, fontSize * 0.52);
  return Math.max(4, Math.floor(width / avg));
}

function maxLinesForBox(height: number, fontSize: number, lineHeight: number, lineClamp: number): number {
  const byHeight = Math.max(1, Math.floor(height / (fontSize * lineHeight)));
  return Math.max(1, Math.min(lineClamp, byHeight));
}

function wrapParagraph(paragraph: string, width: number, fontSize: number): string[] {
  const cpl = charsPerLine(width, fontSize);
  const words = String(paragraph || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let cur = "";
  words.forEach((w) => {
    const next = cur ? cur + " " + w : w;
    if (next.length > cpl && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

function wrapLines(text: string, width: number, fontSize: number): string[] {
  const paras = String(text || "").split(/\n/);
  const out: string[] = [];
  paras.forEach((p, i) => {
    if (i > 0 && !String(p).trim()) {
      out.push("");
      return;
    }
    const wrapped = wrapParagraph(p, width, fontSize);
    if (wrapped.length) out.push(...wrapped);
    else if (i > 0) out.push("");
  });
  return out;
}

function linesNeeded(text: string, width: number, fontSize: number): number {
  return wrapLines(text, width, fontSize).length;
}

/** Truncate to maxLines with an ellipsis; never exceeds the box. */
function ellipsizeToLines(text: string, width: number, fontSize: number, maxLines: number): string {
  const lines = wrapLines(text, width, fontSize);
  if (lines.length <= maxLines) return lines.join("\n");
  const kept = lines.slice(0, maxLines);
  let last = kept[kept.length - 1] || "";
  const ell = "…";
  while (last.length > 1 && last.length + ell.length > charsPerLine(width, fontSize)) {
    last = last.slice(0, -1).trimEnd();
  }
  last = last.replace(/\s+\S?$/, "").trimEnd();
  if (!last) last = (kept[kept.length - 1] || "…").slice(0, Math.max(1, charsPerLine(width, fontSize) - 1));
  kept[kept.length - 1] = last.endsWith("…") ? last : last + ell;
  return kept.join("\n");
}

/**
 * Fit copy into a box: step font down by 2pt (never below floor), then ellipsis.
 * Single paragraphs over the word cap must be split upstream — never flattened here.
 * Preserve hard newlines (bullet lists) for layout.
 */
export function fitText(
  text: string,
  box: { width: number; height: number },
  rules: {
    minFont?: number;
    maxFont?: number;
    lineClamp?: number;
    shrinkMin?: number;
    lineHeight?: number;
    /** When true, refuse shrink for >80-word blocks (overflow routing). */
    splitOnOverflow?: boolean;
  }
): FitSlotResult {
  const maxFont = rules.maxFont || 48;
  // Hard floor: never below true 14pt (engine canvas units)
  const floor = HARD_FLOOR_ENGINE;
  const requestedMin = rules.minFont != null ? rules.minFont : floor;
  const minFont = Math.max(floor, requestedMin);
  const lineClamp = rules.lineClamp || 4;
  const lineHeight = Number(rules.lineHeight) > 0 ? Number(rules.lineHeight) : 1.5;
  let fontSize = maxFont;
  const raw = String(text || "").trim();

  if (!raw) {
    return { slotId: "", text: "", fontSize: minFont, rejected: false };
  }

  // Overflow routing: never shrink massive prose — keep first chunk at floor; upstream must split
  if (rules.splitOnOverflow !== false && shouldSplitInsteadOfShrink(raw)) {
    const chunk = takeWords(raw, 0, OVERFLOW_FIRST_CHUNK);
    return {
      slotId: "",
      text: chunk,
      fontSize: Math.max(minFont, Math.min(maxFont, minFont + 2)),
      rejected: true,
      reason: "overflow-split",
    };
  }

  while (fontSize >= minFont) {
    const maxLines = maxLinesForBox(box.height, fontSize, lineHeight, lineClamp);
    const lines = linesNeeded(raw, box.width, fontSize);
    const neededH = lines * fontSize * lineHeight;
    if (lines <= maxLines && neededH <= box.height + 1) {
      return { slotId: "", text: raw, fontSize, rejected: false };
    }
    fontSize -= 2;
  }

  fontSize = minFont;
  const maxLines = maxLinesForBox(box.height, fontSize, lineHeight, lineClamp);
  const truncated = ellipsizeToLines(raw, box.width, fontSize, maxLines);
  return {
    slotId: "",
    text: truncated || raw.slice(0, 12) + "…",
    fontSize,
    rejected: false,
    reason: truncated !== raw ? "ellipsis" : undefined,
  };
}

module.exports = { fitText };
