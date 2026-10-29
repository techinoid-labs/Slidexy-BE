import { FitSlotResult } from "./types";

/** Rough chars-per-line estimate for Arial-ish faces. */
function charsPerLine(width: number, fontSize: number): number {
  const avg = fontSize * 0.52;
  return Math.max(4, Math.floor(width / avg));
}

function linesNeeded(text: string, width: number, fontSize: number): number {
  const cpl = charsPerLine(width, fontSize);
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  let lines = 1;
  let cur = 0;
  words.forEach((w) => {
    const add = (cur ? 1 : 0) + w.length;
    if (cur + add > cpl) {
      lines += 1;
      cur = w.length;
    } else {
      cur += add;
    }
  });
  return lines;
}

export function fitText(
  text: string,
  box: { width: number; height: number },
  rules: { minFont?: number; maxFont?: number; lineClamp?: number; shrinkMin?: number }
): FitSlotResult {
  const maxFont = rules.maxFont || 48;
  const minFont = rules.minFont || 16;
  const lineClamp = rules.lineClamp || 4;
  const lineHeight = 1.2;
  let fontSize = maxFont;
  let working = String(text || "");

  while (fontSize >= minFont) {
    const lines = linesNeeded(working, box.width, fontSize);
    const neededH = lines * fontSize * lineHeight;
    if (lines <= lineClamp && neededH <= box.height + 1) {
      return { slotId: "", text: working, fontSize, rejected: false };
    }
    fontSize -= 2;
  }

  // clamp words
  const words = working.split(/\s+/).filter(Boolean);
  while (words.length > 1) {
    words.pop();
    working = words.join(" ");
    const lines = linesNeeded(working, box.width, minFont);
    const neededH = lines * minFont * lineHeight;
    if (lines <= lineClamp && neededH <= box.height + 1) {
      return { slotId: "", text: working, fontSize: minFont, rejected: false };
    }
  }

  if (!working) {
    return { slotId: "", text: "", fontSize: minFont, rejected: true, reason: "empty after clamp" };
  }

  // still overflowing — reject
  const lines = linesNeeded(working, box.width, minFont);
  const neededH = lines * minFont * lineHeight;
  if (lines > lineClamp || neededH > box.height + 1) {
    return {
      slotId: "",
      text: working,
      fontSize: minFont,
      rejected: true,
      reason: "text does not fit after shrink/clamp",
    };
  }
  return { slotId: "", text: working, fontSize: minFont, rejected: false };
}

module.exports = { fitText };
