/**
 * Reads a shared deck JSON (schemaVersion 2) into the audit slide model used
 * by fromPptx.js: every visible element of every preview slide, in paint
 * order, in 1600x900 canvas pixels, with tokens and bindings resolved.
 */

const SAMPLE_FIGURE = "48%";

function token(value, tokens) {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{(\w+)\.(\w+)\}$/);
  if (!match) return value;
  const group = tokens && tokens[match[1]];
  return group && group[match[2]] !== undefined ? group[match[2]] : value;
}

/** "#RRGGBB", "#AARRGGBB" (Flutter order) or "RRGGBB" to { value, alpha }. */
function colorOf(raw) {
  if (typeof raw !== "string") return null;
  const hex = raw.replace("#", "").trim();
  if (/^[0-9a-f]{6}$/i.test(hex)) return { value: hex.toUpperCase(), alpha: 1 };
  if (/^[0-9a-f]{8}$/i.test(hex)) return { value: hex.slice(2).toUpperCase(), alpha: parseInt(hex.slice(0, 2), 16) / 255 };
  return null;
}

function labeled(lines) {
  return (lines || []).map((line) => {
    const parts = String(line).split(/\s+[\u2014\u2013-]\s+|:\s+/);
    return parts.length > 1 ? { label: parts[0].trim(), detail: parts.slice(1).join(" ").trim() } : null;
  }).filter(Boolean);
}

function textFor(element, slide, layoutId) {
  const content = element.textContent || {};
  const bullets = slide.bullets || [];
  const index = element.itemIndex !== undefined ? element.itemIndex : content.index;
  const items = labeled(bullets);
  if (Array.isArray(content.spans)) return content.spans.map((s) => s.text || "").join("");
  switch (content.binding) {
    case "title":
      return slide.title || "";
    case "bullets":
      return content.join ? bullets.join(" ") : bullets.join("\n");
    case "subtitle":
      return layoutId === "layoutStatHighlight" || element.role === "number" ? SAMPLE_FIGURE : bullets[0] || "";
    case "bullet":
      return bullets[index] || "";
    case "itemNumber":
      return index !== undefined && index < Math.max(items.length, 1) ? (content.pad ? String(index + 1).padStart(2, "0") : String(index + 1)) : "";
    case "labeledLabel":
    case "timelineLabel":
      return items[index] ? items[index].label.split("|").pop().trim() : "";
    case "timelineMarker":
      return items[index] ? items[index].label.split("|")[0].trim() : "";
    case "labeledDetail":
      return items[index] ? items[index].detail : "";
    default:
      return content.key ? content.key : slide.title || "";
  }
}

function visible(element, slide) {
  if (element.visibleWhen === "hasLabeledItem") {
    const index = element.itemIndex !== undefined ? element.itemIndex : element.textContent && element.textContent.index;
    return index === undefined || index < labeled(slide.bullets).length;
  }
  return true;
}

function shadowOf(shape) {
  if (!shape || !shape.shadowColor) return null;
  const offset = Math.hypot(shape.shadowOffsetX || 0, shape.shadowOffsetY || 0);
  const blur = shape.shadowBlur || 0;
  return offset > 0 && blur <= offset * 0.25 ? "hard_offset" : "soft_ambient";
}

function convertElement(element, z, slide, layoutId, tokens) {
  const base = {
    id: element.id,
    name: element.id,
    x: element.x,
    y: element.y,
    w: element.width,
    h: element.height,
    rot: element.rotation || 0,
    layer: "slide",
    group: "",
    z,
    role: element.role || null,
  };
  const opacity = element.opacity != null ? element.opacity : 1;
  if (element.type === "text") {
    const style = element.textStyle || {};
    const plain = textFor(element, slide, layoutId).trim();
    if (!plain) return null;
    const size = Number(token(style.fontSize, tokens)) || 24;
    const color = colorOf(token(style.color, tokens));
    const upper = (element.textContent && element.textContent.case === "upper") || style.textTransform === "uppercase";
    const run = {
      text: plain,
      size,
      bold: Number(style.fontWeight || 400) >= 600,
      italic: Boolean(style.italic),
      underline: Boolean(style.underline),
      caps: upper ? "all" : "none",
      spacing: Number(style.letterSpacing || 0),
      baseline: 0,
      font: token(style.fontFamily, tokens) || null,
      color: color ? color.value : null,
      outline: false,
      hollow: false,
      highlight: false,
    };
    const spans = element.textContent && Array.isArray(element.textContent.spans) ? element.textContent.spans : null;
    const runs = spans && spans.length > 1
      ? spans.map((span) => ({
        ...run,
        text: span.text || "",
        size: span.fontSize ? Number(token(span.fontSize, tokens)) : run.size,
        bold: span.fontWeight ? Number(span.fontWeight) >= 600 : run.bold,
        italic: span.italic != null ? Boolean(span.italic) : run.italic,
        font: span.fontFamily ? token(span.fontFamily, tokens) : run.font,
        color: span.color ? (colorOf(token(span.color, tokens)) || {}).value || run.color : run.color,
      }))
      : [run];
    return {
      ...base,
      kind: "text",
      geom: "rect",
      opacity,
      text: {
        paragraphs: [{ runs, align: (style.textAlign || "left").slice(0, 1) }],
        vertical: false,
        bodyRotation: 0,
        plain,
        maxSize: Math.max(...runs.map((r) => r.size)),
      },
      placeholder: null,
    };
  }
  if (element.type === "image") {
    const content = element.imageContent || {};
    const corners = [content.radiusTopLeft, content.radiusTopRight, content.radiusBottomRight, content.radiusBottomLeft].map((r) => Number(r || content.cornerRadius || 0));
    const minSide = Math.min(element.width, element.height);
    let mask = "rect";
    if (corners.every((r) => r >= minSide * 0.45)) mask = "circle_or_oval";
    else if (corners[0] >= minSide * 0.3 && corners[1] >= minSide * 0.3 && corners[2] < minSide * 0.1 && corners[3] < minSide * 0.1) mask = "arch";
    else if (corners.some((r) => r > 0)) mask = "rounded";
    const url = content.url || "";
    const graphic = /\/chrome\/|\.svg$/i.test(url);
    return {
      ...base,
      kind: "image",
      geom: "rect",
      radius: Math.max(...corners) || null,
      stroke: null,
      shadow: null,
      opacity,
      image: {
        target: url || content.binding || null,
        ext: graphic ? "png" : "jpg",
        bytes: 0,
        present: true,
        pixelWidth: 0,
        pixelHeight: 0,
        alpha: false,
        raster: null,
        vector: /\.svg$/i.test(url),
        duotone: false,
        mono: false,
        opacity,
        crop: false,
        content: graphic ? "graphic" : "photo",
        mask,
      },
    };
  }
  if (element.type === "table") {
    return { ...base, kind: "table", geom: "table", opacity };
  }
  if (element.type === "illustration") {
    const body = element.illustrationContent || {};
    const fillColor = colorOf(token(body.fill, tokens));
    const strokeColor = colorOf(token(body.stroke, tokens));
    const fill = fillColor && body.fill !== "none" ? { type: "solid", color: fillColor, alpha: fillColor.alpha * opacity } : null;
    const stroke = strokeColor && body.stroke !== "none"
      ? { width: Number(body.strokeWidth || 2), color: strokeColor, dash: "solid", arrow: false }
      : null;
    return {
      ...base,
      kind: "shape",
      geom: "decor:illustration",
      radius: null,
      stroke,
      shadow: null,
      opacity,
      fill,
      decor: { name: "illustration", params: { d: body.d || "" } },
    };
  }
  if (element.type === "maskedImage") {
    const content = element.maskedImageContent || {};
    const kind = content.clip && content.clip.kind;
    const mask = kind === "ellipse" ? "circle_or_oval" : kind === "arch" ? "arch" : kind === "path" ? "organic" : "rect";
    return {
      ...base,
      kind: "image",
      geom: "rect",
      radius: null,
      stroke: null,
      shadow: null,
      opacity,
      image: {
        target: content.url || content.binding || null,
        ext: "jpg",
        bytes: 0,
        present: true,
        pixelWidth: 0,
        pixelHeight: 0,
        alpha: mask !== "rect",
        raster: null,
        vector: false,
        duotone: false,
        mono: false,
        opacity,
        crop: false,
        content: "photo",
        mask,
      },
    };
  }
  if (element.type === "shape") {
    const shape = element.shapeContent || {};
    const fillColor = colorOf(token(shape.fill, tokens));
    let geom = "rect";
    let radius = null;
    let fill = fillColor ? { type: "solid", color: fillColor, alpha: fillColor.alpha * opacity } : null;
    if (shape.kind === "roundedRect") {
      geom = "roundRect";
      radius = Number(shape.cornerRadius || 0);
    } else if (shape.kind === "circle") {
      geom = "ellipse";
    } else if (shape.kind === "gradient") {
      const stops = (shape.gradientColors || []).map((c) => colorOf(token(c, tokens))).filter(Boolean);
      fill = { type: "gradient", stops, alpha: (stops.length ? Math.max(...stops.map((s) => s.alpha)) : 1) * opacity };
    } else if (shape.kind === "decor") {
      geom = "decor:" + (shape.decorName || "unknown");
      if (fill) fill.alpha = fillColor.alpha * opacity;
    }
    const strokeColor = colorOf(token(shape.strokeColor || shape.stroke, tokens));
    const stroke = strokeColor && (shape.strokeWidth || shape.kind !== "decor")
      ? { width: Number(shape.strokeWidth || 1), color: strokeColor, dash: "solid", arrow: false }
      : null;
    if (!fill && !stroke && shape.kind !== "decor") return null;
    const isLine = Math.min(element.width, element.height) <= 6 && Math.max(element.width, element.height) >= 24;
    return {
      ...base,
      kind: isLine && shape.kind !== "decor" ? "line" : "shape",
      geom: isLine && shape.kind !== "decor" ? "line" : geom,
      radius,
      stroke,
      shadow: shadowOf(shape),
      opacity,
      fill,
      decor: shape.kind === "decor" ? { name: shape.decorName, params: shape.decorParams || {} } : null,
    };
  }
  return null;
}

function slideRole(layoutId, index, count) {
  if (index === 0 || layoutId === "layoutTitleFocus") return "cover";
  if (index === count - 1 || layoutId === "layoutClosingCta") return "closing";
  if (layoutId === "layoutQuoteBanner" || layoutId === "layoutSection") return "title";
  return "content";
}

/**
 * Deck JSON to audit slides. One slide per preview slide, so every layout in
 * the sequence is seen with the sample copy the studio shows.
 */
function readDeck(deck) {
  const tokens = deck.tokens || {};
  const previews = deck.previewSlides && deck.previewSlides.length
    ? deck.previewSlides
    : (deck.layoutSequence || []).map((layout) => ({ layout, title: "Slide title", bullets: ["Label \u2014 A short detail line"] }));
  const backgroundColor = colorOf(token((deck.theme && deck.theme.backgroundColor) || "{color.bg}", tokens));
  const slides = previews.map((slide, index) => {
    const layoutId = slide.layout || slide.layoutId;
    const layout = deck.layouts && deck.layouts[layoutId];
    const source = layout ? layout.elements || [] : [];
    const ordered = source
      .map((element, order) => ({ element, order }))
      .sort((a, b) => (a.element.zIndex || 0) - (b.element.zIndex || 0) || a.order - b.order);
    const elements = [];
    for (const { element } of ordered) {
      if (!visible(element, slide)) continue;
      const pieces = element.type === "collage"
        ? (element.collageContent.cells || []).map((cell, index) => ({
          id: element.id + "-" + index,
          type: "image",
          x: element.x + cell.x,
          y: element.y + cell.y,
          width: cell.width,
          height: cell.height,
          zIndex: element.zIndex || 0,
          imageContent: { url: cell.url, binding: cell.binding, fit: cell.fit || "cover" },
        }))
        : [element.type === "rotated" && element.element
          ? { ...element.element, id: element.element.id || element.id, rotation: element.degrees || 0 }
          : element];
      for (const piece of pieces) {
        const converted = convertElement(piece, elements.length + 1, slide, layoutId, tokens);
        if (converted) elements.push(converted);
      }
    }
    return {
      index,
      part: layoutId,
      layout: layoutId,
      role: slideRole(layoutId, index, previews.length),
      background: backgroundColor ? { type: "solid", color: backgroundColor } : null,
      elements,
      text: elements.filter((e) => e.kind === "text").map((e) => e.text.plain).join(" | "),
    };
  });
  return { complete: true, slideSize: { cx: 1600, cy: 900 }, scheme: {}, slides };
}

module.exports = { readDeck, colorOf, token };
