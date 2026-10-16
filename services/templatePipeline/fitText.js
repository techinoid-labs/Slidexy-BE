/**
 * Checks that the sample title and bullets fit the box they are bound to.
 * Font size tokens such as "{type.h1}" are read from the deck.
 */

function fontSize(tokens, value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.startsWith("{type.") && value.endsWith("}")) {
    const key = value.slice(6, -1);
    const size = tokens.type && tokens.type[key];
    if (typeof size === "number") return size;
  }
  return 28;
}

function capacity(element, size) {
  const perLine = Math.max(1, Math.floor(element.width / (size * 0.55)));
  const lines = Math.max(1, Math.floor(element.height / (size * 1.2)));
  return Math.floor(perLine * lines * 0.9);
}

function textOverflow(deck) {
  const problems = [];
  (deck.previewSlides || []).forEach((slide) => {
    const layout = deck.layouts && deck.layouts[slide.layout];
    if (!layout) return;
    (layout.elements || []).forEach((element) => {
      if (element.type !== "text") return;
      const binding = element.textContent && element.textContent.binding;
      const size = fontSize(deck.tokens, element.textStyle && element.textStyle.fontSize);
      const room = capacity(element, size);
      if (binding === "title" && (slide.title || "").length > room) {
        problems.push(slide.layout + " title");
      }
      if (binding === "bullets") {
        const text = (slide.bullets || []).join(" ");
        if (text.length > room) problems.push(slide.layout + " body");
      }
    });
  });
  return problems;
}

module.exports = { textOverflow };
