/**
 * Text highlight primitive — **double asterisks** → bold + primary accent.
 */
export type HighlightSpan = {
  text: string;
  highlight?: boolean;
  bold?: boolean;
};

const WORDISH = /[\w$%€£¥]/;

/** True when two span texts would glue words without a space. */
function needsSpaceBetween(left: string, right: string): boolean {
  if (!left || !right) return false;
  const a = left[left.length - 1];
  const b = right[0];
  if (/\s/.test(a) || /\s/.test(b)) return false;
  // Keep punctuation tight: "plan." / "(note"
  if (/[([{“"'`]/.test(b)) return false;
  if (/[,.;:!?…)\]}”"']/.test(a)) return false;
  return WORDISH.test(a) && WORDISH.test(b);
}

/** Ensure a space before/after highlight tokens so "the$4.2M" never glues.
 *  Spaces always live on non-highlight spans (never leading/trailing on the accent run).
 */
function padHighlightBoundaries(spans: HighlightSpan[]): HighlightSpan[] {
  if (spans.length < 2) return spans;
  const out: HighlightSpan[] = [];
  for (let i = 0; i < spans.length; i++) {
    const cur = {
      ...spans[i],
      text: String(spans[i].text || "").replace(/^\s+|\s+$/g, ""),
    };
    if (!cur.text && spans[i].highlight) continue;
    const prev = out[out.length - 1];
    if (prev && needsSpaceBetween(prev.text, cur.text || "x")) {
      if (prev.highlight && !cur.highlight) cur.text = " " + cur.text;
      else if (!prev.highlight) prev.text = prev.text + " ";
      else cur.text = " " + cur.text;
    }
    if (cur.text) out.push(cur);
  }
  return out.length ? out : [{ text: " " }];
}

/**
 * Normalize LLM markup: ensure spaces around **tokens** and repair common glitches.
 * `the**$4.2M**plan` → `the **$4.2M** plan`
 */
export function normalizeHighlightMarkup(raw: string): string {
  let text = String(raw || "");
  if (!text) return "";
  // Space before opening ** when glued to a word
  text = text.replace(/([\w$%])\*\*/g, "$1 **");
  // Space after closing ** when glued to a word
  text = text.replace(/\*\*([^*]+)\*\*([\w$%])/g, "**$1** $2");
  // Collapse accidental triple spaces from double-padding
  text = text.replace(/[ \t]{2,}/g, " ");
  return text;
}

/** Split markdown-ish **highlight** markers into styled spans. */
export function parseHighlightSpans(raw: string): HighlightSpan[] {
  const text = normalizeHighlightMarkup(raw);
  if (!text) return [{ text: " " }];
  if (text.indexOf("**") < 0) return [{ text }];

  const out: HighlightSpan[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      out.push({ text: text.slice(last, m.index) });
    }
    out.push({ text: m[1], highlight: true, bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return padHighlightBoundaries(out.length ? out : [{ text }]);
}

/** Strip markers for plain measurement / overflow word counts. */
export function stripHighlightMarkers(raw: string): string {
  return normalizeHighlightMarkup(String(raw || "")).replace(/\*\*([^*]+)\*\*/g, "$1");
}

module.exports = {
  parseHighlightSpans,
  stripHighlightMarkers,
  normalizeHighlightMarkup,
};
