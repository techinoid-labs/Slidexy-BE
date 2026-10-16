/**
 * Flags the patterns that make a deck look machine-made.
 * A template with three or more is rejected.
 * A serif-on-cream look is allowed when the human seed already had it.
 */

const SERIF = /fraunces|playfair|newsreader|libre baskerville|cormorant|lora|source serif/i;

function isWarmLight(hex) {
  if (typeof hex !== "string") return false;
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r > 220 && g > 200 && b > 170 && r >= b && (r - b) > 12;
}

function hasKicker(layout) {
  return (layout.elements || []).some((element) => {
    const role = String(element.role || "").toLowerCase();
    if (role === "eyebrow" || role === "kicker") return true;
    const spans = (element.textContent && element.textContent.spans) || [];
    return spans.some((span) => {
      const text = span && span.text;
      return typeof text === "string"
        && text.length > 2
        && text.length < 28
        && text === text.toUpperCase()
        && /[A-Z]/.test(text);
    });
  });
}

function antiTells(deck, parent) {
  const tells = [];
  const sequence = deck.layoutSequence || [];
  const kickerSlides = sequence.filter((id) => deck.layouts[id] && hasKicker(deck.layouts[id])).length;
  if (sequence.length && kickerSlides / sequence.length > 0.4) tells.push("kicker-on-most-slides");

  const counts = (deck.previewSlides || []).map((slide) => (slide.bullets || []).length).filter((n) => n > 0);
  if (counts.length >= 4 && counts.every((n) => n === counts[0])) tells.push("same-bullet-count");

  const titles = (deck.previewSlides || []).map((slide) => slide.title || "").filter(Boolean);
  const formula = titles.filter((title) => /^([A-Z][a-z]+)(\s+[A-Z][a-z]+){2,6}(:| — )/.test(title)).length;
  if (titles.length >= 4 && formula / titles.length > 0.8) tells.push("same-title-formula");

  const closer = titles[titles.length - 1] || "";
  if (/thank you/i.test(closer)) tells.push("thank-you-closer");

  const cover = deck.layouts && deck.layouts.layoutTitleFocus;
  if (cover && (cover.elements || []).some((element) => /page|counter/i.test(String(element.id || "") + String(element.role || "")))) {
    tells.push("page-counter-on-title");
  }

  const display = (deck.tokens.font && deck.tokens.font.display) || "";
  const bg = (deck.tokens.color && deck.tokens.color.bg) || "";
  const parentDisplay = parent && parent.tokens && parent.tokens.font && parent.tokens.font.display || "";
  const parentBg = parent && parent.tokens && parent.tokens.color && parent.tokens.color.bg || "";
  const inherited = SERIF.test(parentDisplay) && isWarmLight(parentBg);
  if (SERIF.test(display) && isWarmLight(bg) && !inherited) tells.push("serif-on-cream");

  return tells;
}

module.exports = { antiTells };
