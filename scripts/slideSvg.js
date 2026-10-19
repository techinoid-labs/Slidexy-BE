/**
 * Draws one deck layout to an SVG string. Shared by the aesthetic scorer.
 */

function token(value, tokens) {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{(\w+)\.(\w+)\}$/);
  if (!match) return value;
  const group = tokens && tokens[match[1]];
  return group && group[match[2]] !== undefined ? group[match[2]] : value;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textOf(element, slide) {
  const content = element.textContent || {};
  if (Array.isArray(content.spans)) return content.spans.map((span) => span.text || "").join("");
  if (content.binding === "title") return slide.title || "";
  if (content.binding === "bullets" || content.binding === "bullet" || content.binding === "subtitle") {
    return (slide.bullets || []).join("  ");
  }
  return "";
}

function slideSvg(deck, layoutId) {
  const slide = (deck.previewSlides || []).find((item) => item.layout === layoutId) || { title: "", bullets: [] };
  const elements = [((deck.layouts[layoutId] || {}).elements || [])].flat().slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  const bg = token("{color.bg}", deck.tokens) || "#f4f7f8";
  const parts = ['<rect width="1600" height="900" fill="' + esc(bg) + '"/>'];
  elements.forEach((element, index) => {
    const opacity = element.opacity == null ? "" : ' opacity="' + element.opacity + '"';
    if (element.type === "shape") {
      const shape = element.shapeContent || {};
      const fill = token(shape.fill, deck.tokens) || "none";
      const params = shape.decorParams || {};
      if (shape.kind === "decor" && shape.decorName === "svg" && params.d) {
        const stroke = params.paint === "stroke";
        parts.push(
          '<svg x="' + element.x + '" y="' + element.y + '" width="' + element.width + '" height="' + element.height
          + '" viewBox="' + esc(params.viewBox || "0 0 100 100") + '" preserveAspectRatio="xMidYMid meet"' + opacity + ">"
          + '<path d="' + esc(params.d) + '" fill="' + (stroke ? "none" : esc(fill)) + '" stroke="' + (stroke ? esc(fill) : "none")
          + '" stroke-width="' + (params.strokeWidth || 3) + '" stroke-linecap="round" stroke-linejoin="round"/>'
          + "</svg>"
        );
        return;
      }
      const radius = shape.kind === "circle" ? Math.min(element.width, element.height) / 2 : (shape.cornerRadius || 0);
      const stroke = token(shape.stroke || shape.strokeColor, deck.tokens);
      parts.push(
        '<rect x="' + element.x + '" y="' + element.y + '" width="' + element.width + '" height="' + element.height
        + '" rx="' + radius + '" fill="' + esc(fill) + '"'
        + (stroke && shape.strokeWidth ? ' stroke="' + esc(stroke) + '" stroke-width="' + shape.strokeWidth + '"' : "")
        + opacity + "/>"
      );
      return;
    }
    if (element.type === "image") {
      const content = element.imageContent || {};
      const duotone = content.treatment === "duotone" ? content.duotone || {} : null;
      const light = duotone ? (token(duotone.light, deck.tokens) || "#0E4D6C") : "#8ea4b0";
      const dark = duotone ? (token(duotone.dark, deck.tokens) || "#122026") : "#3d4a3c";
      const clip = "img" + index;
      const arch = content.treatment === "cutout"
        ? '<path d="M ' + element.x + " " + (element.y + element.height)
          + " L " + element.x + " " + (element.y + element.height * 0.38)
          + " Q " + (element.x + element.width / 2) + " " + (element.y - element.height * 0.08)
          + " " + (element.x + element.width) + " " + (element.y + element.height * 0.38)
          + " L " + (element.x + element.width) + " " + (element.y + element.height) + ' Z"/>'
        : '<rect x="' + element.x + '" y="' + element.y + '" width="' + element.width + '" height="' + element.height + '"/>';
      parts.push(
        '<clipPath id="' + clip + '">' + arch + "</clipPath>"
        + '<g clip-path="url(#' + clip + ')">'
        + '<rect x="' + element.x + '" y="' + element.y + '" width="' + element.width + '" height="' + element.height + '" fill="' + esc(light) + '"/>'
        + '<rect x="' + element.x + '" y="' + (element.y + element.height * 0.62) + '" width="' + element.width + '" height="' + (element.height * 0.38) + '" fill="' + esc(dark) + '" opacity="' + (duotone ? "0.92" : "0.85") + '"/>'
        + "</g>"
      );
      return;
    }
    if (element.type === "text") {
      const label = textOf(element, slide);
      if (!label) return;
      const size = Number(token(element.textStyle && element.textStyle.fontSize, deck.tokens)) || 28;
      const color = token(element.textStyle && element.textStyle.color, deck.tokens) || "#122026";
      const align = (element.textStyle && element.textStyle.textAlign) || "left";
      const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
      const x = align === "center" ? element.x + element.width / 2 : align === "right" ? element.x + element.width - 8 : element.x;
      const clip = "c" + index;
      parts.push(
        '<clipPath id="' + clip + '"><rect x="' + element.x + '" y="' + element.y + '" width="' + element.width + '" height="' + element.height + '"/></clipPath>'
        + '<text x="' + x + '" y="' + (element.y + Math.min(size, element.height) * 0.82) + '" fill="' + esc(color)
        + '" font-size="' + size + '" font-family="Georgia, serif" text-anchor="' + anchor + '" clip-path="url(#' + clip + ')"' + opacity + ">"
        + esc(label) + "</text>"
      );
    }
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">' + parts.join("") + "</svg>\n";
}

module.exports = { slideSvg };
