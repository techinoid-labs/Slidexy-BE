/**
 * Design measurements on the audit slide model (fromPptx.js / fromDeck.js).
 * The same rules run on every source, so reference decks and ours are
 * counted the same way. Eight dimensions, as in DESIGN_GAP_AUDIT.md:
 * background, decoration, components, image treatment, typography,
 * composition, cohesion, imperfection.
 */

const { maskShape, rasterContent, rasterTone } = require("./png");

const W = 1600;
const H = 900;
const AREA = W * H;

const HOUSEKEEPING = /presentation template (uses|is free)|this (presentation )?template is free|resource page|use these design resources|free templates for all your presentation needs|fonts in this presentation|design elements \/ icons|how to use this presentation|presentation as a (powerpoint|google slides?) template|template in 3 steps/i;
const SCRIPT_FONT = /script|hand(?!el)|brush|marker|caveat|kalam|pacifico|dancing|satisfy|homemade|shadows into|amatic|sacramento|allura|great vibes|parisienne|kaushan|signature|reenie|gloria|indie flower|rock salt|yellowtail|cookie|dafoe|pinyon|tangerine|nothing you could do/i;
const NUMERIC = /^\s*[#№]?\s*\d{1,3}\s*[.)]?\s*$/;
const FIGURE = /\d/;
const QUOTE_GLYPH = /^[\s\u201c\u201d"\u2018\u2019'\u00ab\u00bb]+$/;
const ORGANIC_PRESET = /wave|cloud|teardrop|moon|heart|blob|irregularSeal|flowChartPunchedTape|chord|pie|smiley/i;
const OUTLINE_PRESET = /donut|blockArc|^arc$|noSmoking|frame/i;

const DECOR_FAMILY = {
  icon: "icon",
  noise: "texture",
  dotGrid: "pattern",
  lineGrid: "pattern",
  meshGradient: "glow",
  glow: "glow",
  rings: "outline",
  arc: "outline",
  blob: "organic",
  waves: "organic",
  illustration: "illustration",
};

const PLAIN_TREATMENTS = new Set(["rounded", "bleed", "full_bleed"]);

// ---------- geometry helpers ----------

function area(e) {
  return Math.max(0, e.w) * Math.max(0, e.h);
}

function clipArea(e) {
  const x0 = Math.max(0, e.x);
  const y0 = Math.max(0, e.y);
  const x1 = Math.min(W, e.x + e.w);
  const y1 = Math.min(H, e.y + e.h);
  return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
}

function inter(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
}

function inside(inner, outer, tol = 4) {
  return inner.x >= outer.x - tol && inner.y >= outer.y - tol
    && inner.x + inner.w <= outer.x + outer.w + tol && inner.y + inner.h <= outer.y + outer.h + tol;
}

function centerIn(inner, outer) {
  const cx = inner.x + inner.w / 2;
  const cy = inner.y + inner.h / 2;
  return cx >= outer.x && cx <= outer.x + outer.w && cy >= outer.y && cy <= outer.y + outer.h;
}

function edgesTouched(e, tol = 6) {
  return [e.x <= tol, e.y <= tol, e.x + e.w >= W - tol, e.y + e.h >= H - tol].filter(Boolean).length;
}

function bleeds(e) {
  const full = area(e);
  if (!full) return false;
  const visible = clipArea(e);
  return visible > 0 && (full - visible) / full >= 0.03;
}

function tilted(e) {
  if (!e.rot) return false;
  if (e.geom === "ellipse" || e.geom === "ring" || e.geom === "decor:glow" || e.geom === "decor:noise") return false;
  if (e.kind === "shape" && Math.abs(e.w - e.h) <= Math.max(e.w, e.h) * 0.05 && /ellipse|circle|donut|ring|star|sun|gear|flower/i.test(e.geom)) return false;
  const a = Math.abs(e.rot) % 90;
  const off = Math.min(a, 90 - a);
  return off >= 1 && off <= 20;
}

function gap(a, b) {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.hypot(dx, dy);
}

// ---------- color helpers ----------

function hexOf(color, scheme) {
  if (!color) return null;
  const value = typeof color === "string" ? color : color.value;
  if (!value) return null;
  if (value.startsWith("scheme:")) return (scheme && scheme[value.slice(7)]) || null;
  if (/^[0-9A-F]{6}$/i.test(value)) return value.toUpperCase();
  const names = { black: "000000", white: "FFFFFF" };
  return names[String(value).toLowerCase()] || null;
}

function rgb(hex) {
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function colorDistance(a, b) {
  const x = rgb(a);
  const y = rgb(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

function fillVisible(e) {
  return Boolean(e.fill && e.fill.type !== "image" && (e.fill.alpha == null || e.fill.alpha > 0.03));
}

function strokeVisible(e) {
  return Boolean(e.stroke && e.stroke.width >= 0.4 && (!e.stroke.color || e.stroke.color.alpha == null || e.stroke.color.alpha > 0.03));
}

function fillHex(e, scheme) {
  if (!e.fill) return null;
  if (e.fill.type === "solid") return hexOf(e.fill.color, scheme);
  if (e.fill.type === "gradient" && e.fill.stops && e.fill.stops.length) return hexOf(e.fill.stops[0], scheme);
  return null;
}

// ---------- element classes ----------

function imageClass(e) {
  const im = e.image || {};
  if (im.content) return im.content;
  if (im.vector) return "graphic";
  if (im.raster) {
    const c = rasterContent(im.raster);
    return c === "flat" ? "graphic" : c;
  }
  if (im.ext === "jpg" || im.ext === "jpeg") return "photo";
  if (!im.present) return "unknown";
  const pixels = (im.pixelWidth || 0) * (im.pixelHeight || 0);
  if (pixels && pixels < 40000) return "graphic";
  return pixels && im.bytes / pixels >= 0.5 ? "photo" : "graphic";
}

function photoMask(e) {
  if (e.image && e.image.mask) return e.image.mask;
  if (e.geom === "ellipse") return "circle_or_oval";
  if (e.geom === "roundRect" || /^round/.test(e.geom || "")) return "rounded";
  if (e.geom === "organic" || e.geom === "curved" || e.geom === "compound" || ORGANIC_PRESET.test(e.geom || "")) return "organic";
  if (e.geom && !["rect", "line"].includes(e.geom)) return "geometric";
  return e.image && e.image.raster ? maskShape(e.image.raster) : "rect";
}

function decorFamily(e) {
  if (e.cls === "text") return "type";
  if (e.cls === "graphic") {
    const aspect = e.w / Math.max(1, e.h);
    return area(e) <= 0.03 * AREA && aspect >= 0.4 && aspect <= 2.5 ? "icon" : "illustration";
  }
  if (e.cls === "sticker") return "sticker";
  if (e.cls === "texture") return "texture";
  if (e.cls === "gradient") return "glow";
  const geom = e.geom || "rect";
  if (geom.startsWith("decor:")) return DECOR_FAMILY[geom.slice(6)] || "geometric";
  if (e.kind === "line" || geom === "line" || Math.min(e.w, e.h) <= 6) return "rule";
  if (OUTLINE_PRESET.test(geom) || geom === "ring") return "outline";
  if (!fillVisible(e) && strokeVisible(e)) return "outline";
  if (geom === "organic" || geom === "curved" || geom === "compound" || ORGANIC_PRESET.test(geom)) return "organic";
  if (e.fill && e.fill.type === "gradient") return "glow";
  return "geometric";
}

function runsOf(e) {
  return e.text ? e.text.paragraphs.flatMap((p) => p.runs) : [];
}

function sizeOf(e) {
  return e.text ? e.text.maxSize || 0 : 0;
}

/** Large short figure plus only smaller labels. A photo or extra body keeps it a card. */
function statBlock(container, bodySize) {
  if (container.holdsVisual.length) return false;
  const figure = container.holds.find((text) => {
    const plain = text.text.plain.trim();
    return FIGURE.test(plain) && plain.length <= 14 && sizeOf(text) >= 40 && sizeOf(text) >= bodySize * 1.8;
  });
  if (!figure) return false;
  const labels = container.holds.filter((text) => text !== figure && sizeOf(text) < sizeOf(figure));
  return labels.length > 0 && labels.length === container.holds.length - 1;
}

// ---------- per-slide analysis ----------

/** Axis-aligned box of a rotated element. */
function rotatedBox(e) {
  if (!e.rot) return e;
  const rad = (Math.abs(e.rot) * Math.PI) / 180;
  const w = Math.abs(e.w * Math.cos(rad)) + Math.abs(e.h * Math.sin(rad));
  const h = Math.abs(e.w * Math.sin(rad)) + Math.abs(e.h * Math.cos(rad));
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  return { ...e, x: cx - w / 2, y: cy - h / 2, w, h };
}

function prepare(slide, scheme) {
  const els = slide.elements
    .filter((e) => e.w > 0.5 || e.h > 0.5)
    .map((e) => rotatedBox({ ...e }))
    .filter((e) => clipArea({ ...e, w: Math.max(e.w, 1), h: Math.max(e.h, 1) }) > 0);
  for (const e of els) {
    if (e.kind === "text") e.cls = "text";
    else if (e.kind === "image") {
      const c = imageClass(e);
      e.cls = c === "unknown" ? "graphic" : c;
      if (e.cls === "photo") {
        e.mask = photoMask(e);
        if ((e.mask === "cutout" || e.mask === "shaped") && area(e) <= 0.06 * AREA) e.cls = "sticker";
      }
    } else if (["table", "chart", "diagram", "object"].includes(e.kind)) e.cls = "data";
    else if (e.kind === "line") e.cls = "line";
    else e.cls = fillVisible(e) || strokeVisible(e) || (e.geom || "").startsWith("decor:") ? "shape" : "invisible";
  }
  return els.filter((e) => e.cls !== "invisible");
}

function opaqueFull(e) {
  if (e.cls === "photo" || e.cls === "graphic" || e.cls === "texture" || e.cls === "gradient") {
    const clear = e.image && e.image.raster ? e.image.raster.clearFraction : 0;
    return (e.opacity == null || e.opacity >= 0.9) && (!e.image || e.image.opacity == null || e.image.opacity >= 0.9) && clear < 0.1;
  }
  if (e.cls === "shape" && !(e.geom || "").startsWith("decor:")) return fillVisible(e) && (e.fill.alpha == null || e.fill.alpha >= 0.9);
  return false;
}

function systemOfLayer(e) {
  if (!e) return "flat";
  if (e.cls === "photo") return "photo";
  if (e.cls === "texture") return "texture";
  if (e.cls === "gradient") return "gradient";
  if (e.cls === "graphic") return e.image && e.image.raster && e.image.raster.lumaStd <= 12 ? "texture" : "pattern";
  const geom = e.geom || "";
  if (geom.startsWith("decor:")) {
    const family = DECOR_FAMILY[geom.slice(6)];
    return family === "texture" ? "texture" : family === "pattern" ? "pattern" : family === "glow" ? "gradient" : "pattern";
  }
  if (e.fill && e.fill.type === "gradient") return "gradient";
  if (e.fill && e.fill.type === "pattern") return "pattern";
  return "flat";
}

function analyzeBackground(slide, els, scheme) {
  const full = els.filter((e) => e.cls !== "text" && e.cls !== "data" && clipArea(e) >= 0.85 * AREA);
  let baseIndex = -1;
  full.forEach((e, i) => {
    if (opaqueFull(e)) baseIndex = i;
  });
  const base = baseIndex >= 0 ? full[baseIndex] : null;
  const overlays = full.slice(baseIndex + 1);
  const systems = new Set();
  let baseSystem;
  let baseColor = null;
  if (base) {
    baseSystem = systemOfLayer(base);
    baseColor = fillHex(base, scheme);
  } else if (slide.background) {
    const bg = slide.background;
    if (bg.type === "image") {
      const pseudo = { kind: "image", image: bg.image, w: W, h: H };
      const c = imageClass(pseudo);
      baseSystem = c === "photo" ? "photo" : c === "texture" ? "texture" : c === "gradient" ? "gradient" : "pattern";
    } else if (bg.type === "gradient") baseSystem = "gradient";
    else if (bg.type === "pattern") baseSystem = "pattern";
    else baseSystem = "flat";
    baseColor = bg.color ? hexOf(bg.color, scheme) : null;
  } else baseSystem = "flat";
  systems.add(baseSystem);
  for (const o of overlays) {
    const s = systemOfLayer(o);
    if (s !== "flat") systems.add(s);
  }
  const blocks = els.filter((e) => !full.includes(e)
    && ((e.cls === "shape" && fillVisible(e) && !(e.geom || "").startsWith("decor:")) || e.cls === "photo")
    && clipArea(e) >= 0.2 * AREA
    && (edgesTouched(e) >= 2 || e.w >= W * 0.95 || e.h >= H * 0.95));
  const colorBlocks = blocks.filter((e) => e.cls === "shape" && (!baseColor || !fillHex(e, scheme) || colorDistance(fillHex(e, scheme), baseColor) > 20));
  const photoSplits = blocks.filter((e) => e.cls === "photo" && !["cutout", "shaped", "organic"].includes(e.mask));
  if (colorBlocks.length) systems.add("color_block");
  if (photoSplits.length) systems.add("photo_split");
  const glows = els.filter((e) => !full.includes(e) && clipArea(e) >= 0.05 * AREA
    && (e.cls === "gradient" || (e.cls === "shape" && e.fill && e.fill.type === "gradient") || /decor:(glow|meshGradient)/.test(e.geom || "")));
  const partialPatterns = els.filter((e) => !full.includes(e) && clipArea(e) >= 0.08 * AREA
    && (/decor:(dotGrid|lineGrid|noise)/.test(e.geom || "") || e.cls === "texture"));
  if (glows.length) systems.add("glow");
  if (partialPatterns.length) systems.add(partialPatterns.some((e) => e.cls === "texture" || /noise/.test(e.geom)) ? "texture" : "pattern");
  const layers = 1 + overlays.length + colorBlocks.length + photoSplits.length + glows.length + partialPatterns.length;
  const order = ["photo", "texture", "gradient", "pattern", "glow", "color_block", "photo_split", "flat"];
  const primary = order.find((s) => systems.has(s) && s !== "flat") || "flat";
  return {
    base: baseSystem,
    primary,
    systems: [...systems],
    layers: Math.min(layers, 8),
    baseColor,
    backgroundIds: new Set([...full, ...colorBlocks, ...photoSplits.filter((p) => clipArea(p) >= 0.85 * AREA)].map((e) => e.id + ":" + e.z)),
    fullIds: new Set(full.map((e) => e.id + ":" + e.z)),
  };
}

function key(e) {
  return e.id + ":" + e.z;
}

function analyzeSlide(slide, scheme, deckBodySize) {
  const els = prepare(slide, scheme);
  const bg = analyzeBackground(slide, els, scheme);
  const isBg = (e) => bg.backgroundIds.has(key(e));
  const texts = els.filter((e) => e.cls === "text");
  const bgHex = bg.baseColor || "FFFFFF";

  const backdropOf = (t) => {
    const under = els.filter((o) => o !== t && o.z < t.z && o.cls !== "text" && centerIn(t, o)).sort((a, b) => b.z - a.z)[0];
    if (!under) return bg.baseColor || (slide.background && slide.background.type === "solid" ? bgHex : null);
    return under.cls === "shape" && fillVisible(under) && under.fill.type === "solid" && (under.fill.alpha == null || under.fill.alpha >= 0.9) ? fillHex(under, scheme) : null;
  };
  for (const t of texts) {
    const runs = runsOf(t);
    const color = runs.map((r) => hexOf(r.color, scheme)).find(Boolean);
    const backdrop = backdropOf(t);
    const lowContrast = color && backdrop ? contrast(color, backdrop) < 1.6 : false;
    t.ghost = (t.opacity != null && t.opacity < 0.6) || (sizeOf(t) >= 80 && lowContrast) || (QUOTE_GLYPH.test(t.text.plain) && sizeOf(t) >= 48);
  }
  const realTexts = texts.filter((t) => !t.ghost);
  const sizes = realTexts.map(sizeOf);
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const bodyRuns = realTexts.flatMap((t) => runsOf(t).map((r) => ({ size: r.size, chars: r.text.length })));
  const bodySize = weightedMedian(bodyRuns.filter((r) => r.size < Math.max(40, deckBodySize * 1.5))) || deckBodySize || 20;

  // containers: a visible shape that holds text
  const shapes = els.filter((e) => e.cls === "shape" && !isBg(e) && !(e.geom || "").startsWith("decor:") && e.geom !== "line");
  for (const s of shapes) {
    const frameOnly = !fillVisible(s) && strokeVisible(s) && clipArea(s) >= 0.3 * AREA;
    s.holds = frameOnly ? [] : realTexts.filter((t) => centerIn(t, s) && area(t) <= area(s) * 1.05 && t.z > s.z);
    s.holdsVisual = frameOnly ? [] : els.filter((o) => o !== s && (o.cls === "graphic" || o.cls === "photo") && inside(o, s, 2) && o.z > s.z);
  }
  const containers = shapes.filter((s) => s.holds.length > 0);
  const photos = els.filter((e) => e.cls === "photo");

  // image treatment helpers, not decoration
  const treatmentHelpers = new Set();
  const photoInfo = photos.map((p) => {
    const t = new Set();
    if (p.mask && p.mask !== "rect") t.add(p.mask);
    if (tilted(p)) t.add("tilted");
    if (p.shadow) t.add("shadow");
    if (strokeVisible(p)) t.add("frame");
    const tone = p.image && p.image.raster ? rasterTone(p.image.raster) : null;
    if ((p.image && p.image.duotone) || tone === "tinted") t.add("duotone_tint");
    if ((p.image && p.image.mono) || tone === "mono") t.add("mono");
    const opacity = Math.min(p.opacity == null ? 1 : p.opacity, p.image && p.image.opacity != null ? p.image.opacity : 1);
    if (opacity < 0.9) t.add("faded");
    for (const o of els) {
      if (o === p || o.cls === "text" || o.cls === "photo") continue;
      const behind = o.z < p.z;
      const above = o.z > p.z;
      const ov = inter(o, p);
      if (o.cls === "shape" || o.cls === "line") {
        if (!fillVisible(o) && strokeVisible(o) && inside(p, o, 40) && area(o) <= area(p) * 1.6) {
          t.add("frame");
          treatmentHelpers.add(key(o));
        } else if (behind && fillVisible(o) && !isBg(o) && inside(p, o, 2) && area(o) <= area(p) * 1.8 && area(o) >= area(p) * 1.02) {
          t.add("mat");
          treatmentHelpers.add(key(o));
        } else if (behind && fillVisible(o) && !isBg(o) && !inside(p, o, 2) && ov >= 0.3 * area(p) && area(o) >= area(p) * 0.6 && area(o) <= area(p) * 1.6) {
          t.add("offset_block");
          treatmentHelpers.add(key(o));
        } else if (above && fillVisible(o) && ov >= 0.6 * area(p) && ((o.fill.alpha != null && o.fill.alpha < 0.95) || o.fill.type === "gradient")) {
          t.add("overlay");
          treatmentHelpers.add(key(o));
        }
      } else if (above && (o.cls === "sticker" || o.cls === "texture" || o.cls === "graphic") && area(o) <= 0.03 * AREA && ov > 0 && !inside(o, p, -10)) {
        t.add("tape_sticker");
      }
    }
    const full = clipArea(p) >= 0.85 * AREA;
    if (full) t.add("full_bleed");
    else if (bleeds(p)) t.add("bleed");
    const textOver = realTexts.some((x) => inter(x, p) >= 0.4 * area(x) && x.z > p.z);
    return {
      id: key(p),
      background: full,
      area: clipArea(p) / AREA,
      treatments: [...t],
      nonPlain: [...t].some((name) => !PLAIN_TREATMENTS.has(name)),
      textOver,
    };
  });

  // decoration
  const decorative = els.filter((e) => {
    if (isBg(e) || treatmentHelpers.has(key(e))) return false;
    if (e.cls === "text") return e.ghost;
    if (e.cls === "photo" || e.cls === "data") return false;
    if (e.cls === "shape" && e.holds && e.holds.length) return false;
    if (e.cls === "shape" && e.holdsVisual && e.holdsVisual.length) return false;
    return true;
  });
  for (const d of decorative) d.family = decorFamily(d);
  const groups = new Map();
  for (const d of decorative) {
    const color = d.cls === "shape" || d.cls === "line" ? fillHex(d, scheme) || hexOf(d.stroke && d.stroke.color, scheme) || "" : (d.image && d.image.target) || "";
    const groupKey = [d.family, d.geom || d.cls, color, Math.round(Math.log2(Math.max(1, area(d))))].join("|");
    groups.set(groupKey, (groups.get(groupKey) || 0) + 1);
  }

  // molecules
  const molecules = [];
  const add = (type) => molecules.push(type);
  for (const c of containers) {
    const words = c.holds.map((t) => t.text.plain);
    const maxSide = Math.max(c.w, c.h);
    if (c.holds.length === 1 && NUMERIC.test(words[0]) && maxSide <= 170) add("number_badge");
    else if (c.holds.length === 1 && c.h <= 110 && words[0].length <= 32 && c.w / Math.max(1, c.h) >= 1.6) add("pill_tag");
    else if (c.holds.length === 1 && sizeOf(c.holds[0]) >= 28 && c.w <= c.holds[0].w + 70 && c.h <= c.holds[0].h + 60) add("highlight_label");
    else if (c.w >= W * 0.8 && c.h <= H * 0.45) add("band");
    else if (statBlock(c, bodySize)) add("stat_block");
    else if ((c.holds.length >= 2 || c.holdsVisual.length) && area(c) <= 0.5 * AREA && area(c) >= 0.012 * AREA) add("card");
  }
  const icons = els.filter((e) => (e.cls === "graphic" && area(e) <= 0.03 * AREA) || e.geom === "decor:icon");
  for (const icon of icons) {
    const label = realTexts.find((t) => gap(icon, t) <= 50 && t.text.plain.length <= 90 && !inside(icon, t));
    if (label) add("icon_label");
  }
  const loose = realTexts.filter((t) => !containers.some((c) => c.holds.includes(t)));
  for (const t of loose) {
    const plain = t.text.plain;
    if (NUMERIC.test(plain) && sizeOf(t) >= bodySize * 1.3 && realTexts.some((o) => o !== t && gap(o, t) <= 200)) add("index_numeral");
    else if (FIGURE.test(plain) && plain.length <= 14 && sizeOf(t) >= 40 && sizeOf(t) >= bodySize * 1.8
      && realTexts.some((o) => o !== t && sizeOf(o) < sizeOf(t) && gap(o, t) <= 160)) add("stat_block");
  }
  if (texts.some((t) => QUOTE_GLYPH.test(t.text.plain)) || realTexts.some((t) => /^[\u201c"\u00ab]/.test(t.text.plain.trim()) && t.text.plain.length >= 20)) add("quote_block");
  for (const d of els.filter((e) => e.cls === "data")) add(d.kind === "table" ? "table" : "chart");
  if (els.some((e) => /donut|blockArc|ring|decor:arc|decor:rings/.test(e.geom || "") && Math.min(e.w, e.h) >= 60)) add("progress_ring");
  const bars = shapes.filter((s) => !s.holds.length && s.h > s.w * 1.2 && s.w >= 12 && s.w <= 200);
  for (const b of bars) {
    const peers = bars.filter((o) => Math.abs(o.w - b.w) <= b.w * 0.08 && Math.abs(o.y + o.h - (b.y + b.h)) <= 6);
    if (peers.length >= 3 && new Set(peers.map((o) => Math.round(o.h / 4))).size >= 2) {
      add("bar_chart");
      break;
    }
  }
  const lines = els.filter((e) => e.cls === "line" || (e.cls === "shape" && Math.min(e.w, e.h) <= 6 && Math.max(e.w, e.h) >= 300));
  for (const line of lines) {
    const horizontal = line.w >= line.h;
    const length = horizontal ? line.w : line.h;
    if (length < 400) continue;
    const markers = els.filter((e) => e !== line && e.cls !== "text" && Math.max(e.w, e.h) <= 90 && area(e) > 0
      && (horizontal
        ? Math.abs(e.y + e.h / 2 - (line.y + line.h / 2)) <= 24 && e.x + e.w / 2 >= line.x && e.x + e.w / 2 <= line.x + line.w
        : Math.abs(e.x + e.w / 2 - (line.x + line.w / 2)) <= 24 && e.y + e.h / 2 >= line.y && e.y + e.h / 2 <= line.y + line.h));
    if (markers.length >= 3) {
      add("timeline");
      break;
    }
  }
  for (const p of photos) {
    if (realTexts.some((t) => t.text.plain.length <= 60 && sizeOf(t) <= maxSize * 0.6 && t.y >= p.y + p.h - 30 && t.y - (p.y + p.h) <= 40 && t.x < p.x + p.w && t.x + t.w > p.x)) add("captioned_photo");
    if ((p.mask === "circle_or_oval") && clipArea(p) <= 0.12 * AREA) add("avatar");
  }
  const byX = new Map();
  for (const t of realTexts) {
    const k = Math.round(t.x / 8);
    if (!byX.has(k)) byX.set(k, []);
    byX.get(k).push(t);
  }
  let listFound = false;
  for (const column of byX.values()) {
    const bySize = new Map();
    for (const t of column) {
      const k = Math.round(sizeOf(t) / 3);
      if (!bySize.has(k)) bySize.set(k, []);
      bySize.get(k).push(t);
    }
    for (const group of bySize.values()) {
      const sized = group.sort((a, b) => a.y - b.y);
      if (sized.length < 3) continue;
      const steps = sized.slice(1).map((t, i) => t.y - sized[i].y);
      const mean = steps.reduce((s, n) => s + n, 0) / steps.length;
      if (mean > 0 && steps.every((s) => Math.abs(s - mean) <= mean * 0.2)) listFound = true;
    }
  }
  if (listFound) add("list");
  const titleText = realTexts.find((t) => sizeOf(t) === maxSize);
  if (titleText) {
    const eyebrow = realTexts.find((t) => t !== titleText && t.text.plain.length <= 32 && sizeOf(t) <= maxSize * 0.5
      && t.y + t.h <= titleText.y + 10 && titleText.y - (t.y + t.h) <= 120 && Math.abs(t.x - titleText.x) <= 60);
    if (eyebrow) add("eyebrow");
  }
  const topRow = realTexts.filter((t) => t.y + t.h <= 100 && sizeOf(t) <= 24);
  if (topRow.length >= 3) add("nav_bar");

  // typography
  const typo = new Set();
  const ratio = bodySize ? maxSize / bodySize : 0;
  if (ratio >= 4) typo.add("scale_contrast");
  for (const t of realTexts) {
    const runs = runsOf(t).filter((r) => r.text.trim().length >= 2);
    if (runs.length >= 2) {
      const sizesIn = runs.map((r) => r.size);
      const fonts = new Set(runs.map((r) => r.font).filter(Boolean));
      const colors = new Set(runs.map((r) => hexOf(r.color, scheme)).filter(Boolean));
      if (Math.max(...sizesIn) / Math.max(1, Math.min(...sizesIn)) >= 1.2 || fonts.size > 1 || colors.size > 1
        || new Set(runs.map((r) => r.bold)).size > 1 || new Set(runs.map((r) => r.italic)).size > 1) {
        typo.add("mixed_runs");
        if (sizeOf(t) >= 40) typo.add("mixed_headline");
      }
    }
    if (runsOf(t).some((r) => r.baseline && Math.abs(r.baseline) >= 5 && r.text.trim().length >= 2)) typo.add("baseline_shift");
    const letters = t.text.plain.replace(/[^A-Za-z]/g, "");
    const upper = letters.length >= 4 && (letters === letters.toUpperCase() || runsOf(t).some((r) => r.caps === "all"));
    if (upper && runsOf(t).some((r) => r.spacing >= 1)) typo.add("tracked_caps");
    if (upper && sizeOf(t) >= 40) typo.add("caps_display");
    if ((t.rot && Math.abs(t.rot) >= 1) || t.text.vertical || (t.text.bodyRotation && Math.abs(t.text.bodyRotation) >= 1)) typo.add("rotated_text");
    if (runsOf(t).some((r) => r.outline || r.hollow)) typo.add("outline_text");
    if (runsOf(t).some((r) => r.highlight)) typo.add("highlight");
    if (FIGURE.test(t.text.plain) && t.text.plain.replace(/\s/g, "").length <= 8 && (sizeOf(t) >= 110 || sizeOf(t) >= bodySize * 4)) typo.add("big_numerals");
    if (photos.some((p) => inter(t, p) >= 0.4 * area(t) && t.z > p.z)) typo.add("text_on_image");
    if (runsOf(t).some((r) => r.font && SCRIPT_FONT.test(r.font))) typo.add("script_accent");
    if (sizeOf(t) >= 36 && runsOf(t).some((r) => r.italic)) typo.add("italic_accent");
    const crossing = els.some((o) => o !== t && (o.cls === "shape" || o.cls === "photo") && !isBg(o) && inter(t, o) > 0.05 * area(t) && !centerIn(t, o) && area(o) > area(t) * 0.3);
    if (crossing && sizeOf(t) >= 36) typo.add("breaks_the_box");
  }
  if (molecules.includes("highlight_label")) typo.add("highlight");
  if (texts.some((t) => t.ghost)) typo.add("ghost_type");
  const heads = realTexts.filter((t) => sizeOf(t) >= 40 && sizeOf(t) >= maxSize * 0.6);
  if (heads.length >= 2 && heads.some((a) => heads.some((b) => a !== b && gap(a, b) <= 200
    && (Math.max(sizeOf(a), sizeOf(b)) / Math.min(sizeOf(a), sizeOf(b)) >= 1.15
      || (runsOf(a)[0] || {}).font !== (runsOf(b)[0] || {}).font
      || (runsOf(a)[0] || {}).color !== (runsOf(b)[0] || {}).color)))) typo.add("split_headline");

  // composition
  const content = els.filter((e) => !isBg(e) && (e.cls === "text" ? !e.ghost : ["photo", "data", "sticker"].includes(e.cls) || (e.cls === "shape" && e.holds && e.holds.length) || (e.cls === "graphic" && area(e) > 0.03 * AREA)));
  const signature = gridSignature(content);
  const overlaps = pairsOverlap(els.filter((e) => !isBg(e) && !treatmentHelpers.has(key(e))));
  const bleedEls = els.filter((e) => !bg.fullIds.has(key(e)) && bleeds(e));
  const tiltEls = els.filter((e) => tilted(e) && !bg.fullIds.has(key(e)));
  const massX = centerOfMass(content);
  const coverage = coverageOf(els.filter((e) => !isBg(e)));
  const archetype = archetypeOf({ bg, content, photos, realTexts, containers, els });

  // imperfection
  const imperfection = new Set();
  if (tiltEls.length) imperfection.add("tilt");
  if (bleedEls.length) imperfection.add("bleed");
  if (overlaps.decorOnContent || overlaps.partial) imperfection.add("overlap");
  if (decorative.some((d) => ["organic", "sticker", "illustration"].includes(d.family)) || photos.some((p) => ["cutout", "organic"].includes(p.mask))) imperfection.add("organic");
  if (massX !== null && Math.abs(massX - W / 2) >= 120) imperfection.add("asymmetric");
  if (typo.has("script_accent") || decorative.some((d) => d.family === "texture")) imperfection.add("handmade");

  return {
    index: slide.index,
    role: slide.role || null,
    text: slide.text,
    background: { primary: bg.primary, systems: bg.systems, layers: bg.layers, base: bg.base },
    decoration: {
      count: decorative.length,
      groups: groups.size,
      families: [...new Set(decorative.map((d) => d.family))],
      edgeAnchored: decorative.filter((d) => edgesTouched(d) >= 1 || bleeds(d)).length,
    },
    molecules,
    photos: photoInfo,
    stickers: els.filter((e) => e.cls === "sticker").length,
    typography: {
      features: [...typo],
      maxSize: Math.round(maxSize),
      bodySize: Math.round(bodySize),
      ratio: Math.round(ratio * 10) / 10,
      fonts: [...new Set(realTexts.flatMap((t) => runsOf(t).map((r) => r.font)).filter(Boolean))],
    },
    composition: {
      signature,
      archetype,
      overlap: overlaps.partial > 0,
      layered: overlaps.partial + overlaps.decorOnContent,
      bleed: bleedEls.length > 0,
      tilt: tiltEls.length > 0,
      coverage: Math.round(coverage * 100) / 100,
      massOffset: massX === null ? null : Math.round(Math.abs(massX - W / 2)),
    },
    imperfection: [...imperfection],
    palette: paletteOf(els, scheme),
    radii: radiusClasses(els, containers),
    strokes: els.filter((e) => (e.cls === "shape" || e.cls === "line") && strokeVisible(e) && !isBg(e)).map((e) => Math.round(e.stroke.width * 2) / 2),
    shadows: els.filter((e) => e.shadow && !isBg(e)).map((e) => e.shadow),
    shapeFamilies: [...new Set(decorative.map((d) => d.family).filter((f) => ["rule", "geometric", "organic", "outline", "pattern", "illustration", "sticker", "texture"].includes(f)))],
    visualElements: decorative.filter((d) => d.cls !== "text").length + containers.length + els.filter((e) => e.cls === "data").length,
    breaks: bleedEls.length + tiltEls.length,
    motifs: decorative.map((d) => motifKey(d, scheme)),
    chrome: els.filter((e) => !bg.fullIds.has(key(e)) && (e.cls === "text" ? sizeOf(e) <= 24 : e.cls !== "photo")).map((e) => chromeKey(e)),
    leftEdge: realTexts.length ? Math.round(Math.min(...realTexts.map((t) => t.x))) : null,
    depth: stackDepth(els.filter((e) => !isBg(e))),
    decorList: decorative.map((d) => `${d.family}:${d.cls === "shape" || d.cls === "line" ? d.geom : d.cls}@${Math.round(d.x)},${Math.round(d.y)} ${Math.round(d.w)}x${Math.round(d.h)}`),
    counts: {
      elements: els.length,
      texts: realTexts.length,
      photos: photos.length,
      containers: containers.length,
      decorative: decorative.length,
    },
  };
}

function weightedMedian(items) {
  const list = items.filter((i) => i.size > 0 && i.chars > 0).sort((a, b) => a.size - b.size);
  const total = list.reduce((s, i) => s + i.chars, 0);
  let acc = 0;
  for (const i of list) {
    acc += i.chars;
    if (acc >= total / 2) return i.size;
  }
  return 0;
}

function gridSignature(content) {
  const cols = 4;
  const rows = 3;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = { x: (c * W) / cols, y: (r * H) / rows, w: W / cols, h: H / rows };
      const cellArea = area(cell);
      let code = ".";
      for (const e of content) {
        if (inter(e, cell) < cellArea * 0.2) continue;
        const kind = e.cls === "photo" || e.cls === "sticker" ? "P" : e.cls === "text" ? "T" : "C";
        if (kind === "P" || (kind === "C" && code !== "P") || code === ".") code = kind;
      }
      cells.push(code);
    }
  }
  return cells.join("");
}

function pairsOverlap(els) {
  let partial = 0;
  let decorOnContent = 0;
  const solid = els.filter((e) => e.cls !== "text" || !e.ghost);
  for (let i = 0; i < solid.length; i += 1) {
    for (let j = i + 1; j < solid.length; j += 1) {
      const a = solid[i];
      const b = solid[j];
      const ov = inter(a, b);
      if (!ov) continue;
      const small = Math.min(area(a), area(b)) || 1;
      if (ov < small * 0.04) continue;
      if (inside(a, b, 2) || inside(b, a, 2)) {
        const outer = area(a) >= area(b) ? a : b;
        const inner = outer === a ? b : a;
        const contentPair = (inner.cls === "sticker" || inner.cls === "graphic" || inner.cls === "shape") && (outer.cls === "photo");
        if (contentPair) decorOnContent += 1;
        continue;
      }
      const kinds = [a.cls, b.cls];
      if (kinds.includes("text") && kinds.every((k) => k === "text" || k === "line")) continue;
      partial += 1;
    }
  }
  return { partial, decorOnContent };
}

function centerOfMass(content) {
  let total = 0;
  let sum = 0;
  for (const e of content) {
    const a = clipArea(e);
    total += a;
    sum += a * (Math.max(0, e.x) + Math.min(W, e.x + e.w)) / 2;
  }
  return total ? sum / total : null;
}

/**
 * How many elements stack at the busiest tenth of the covered canvas.
 */
function stackDepth(els) {
  const cols = 64;
  const rows = 36;
  const depths = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = ((c + 0.5) * W) / cols;
      const y = ((r + 0.5) * H) / rows;
      const n = els.filter((e) => x >= e.x && x <= e.x + e.w && y >= e.y && y <= e.y + e.h).length;
      if (n) depths.push(n);
    }
  }
  if (!depths.length) return 0;
  depths.sort((a, b) => a - b);
  return depths[Math.floor(depths.length * 0.9)];
}

function coverageOf(els) {
  const cols = 64;
  const rows = 36;
  let hit = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = ((c + 0.5) * W) / cols;
      const y = ((r + 0.5) * H) / rows;
      if (els.some((e) => x >= e.x && x <= e.x + e.w && y >= e.y && y <= e.y + e.h)) hit += 1;
    }
  }
  return hit / (cols * rows);
}

function archetypeOf({ bg, content, photos, realTexts, containers, els }) {
  if (bg.base === "photo") return "full_bleed_photo";
  const collage = photos.length + els.filter((e) => e.cls === "sticker").length >= 3
    && (photos.some((p) => tilted(p)) || photos.some((p, i) => photos.some((q, j) => j > i && inter(p, q) > 0)));
  if (collage) return "collage";
  const splits = content.concat(els.filter((e) => e.cls === "shape" && fillVisible(e)))
    .filter((e) => (e.cls === "photo" || e.cls === "shape") && clipArea(e) >= 0.22 * AREA && clipArea(e) < 0.85 * AREA
      && ((e.y <= 6 && e.y + e.h >= H - 6) || (e.x <= 6 && e.x + e.w >= W - 6)));
  if (splits.length) return "split";
  const tiles = containers.concat(photos).filter((e) => clipArea(e) >= 0.02 * AREA);
  for (const t of tiles) {
    const peers = tiles.filter((o) => Math.abs(area(o) - area(t)) <= area(t) * 0.2 && (Math.abs(o.y - t.y) <= 10 || Math.abs(o.x - t.x) <= 10));
    if (peers.length >= 3) return "grid";
  }
  if (!photos.length && realTexts.length <= 3 && realTexts.length && Math.max(...realTexts.map(sizeOf)) >= 44) {
    const centered = realTexts.every((t) => Math.abs(t.x + t.w / 2 - W / 2) <= 80);
    return centered ? "centered_statement" : "statement";
  }
  if (realTexts.length && realTexts.every((t) => Math.abs(t.x + t.w / 2 - W / 2) <= 80)) return "centered";
  return "asymmetric";
}

function paletteOf(els, scheme) {
  const out = [];
  for (const e of els) {
    if (e.cls === "text") {
      for (const r of runsOf(e)) {
        const hex = hexOf(r.color, scheme);
        if (hex) out.push({ hex, weight: r.text.length * r.size * r.size * 0.5 });
      }
    } else if (e.cls === "shape" || e.cls === "line") {
      const fill = fillVisible(e) ? fillHex(e, scheme) : null;
      if (fill) out.push({ hex: fill, weight: clipArea(e) * Math.min(1, e.fill.alpha == null ? 1 : e.fill.alpha) });
      if (e.fill && e.fill.type === "gradient") for (const s of e.fill.stops || []) {
        const hex = hexOf(s, scheme);
        if (hex) out.push({ hex, weight: clipArea(e) / Math.max(1, e.fill.stops.length) });
      }
      const stroke = strokeVisible(e) ? hexOf(e.stroke.color, scheme) : null;
      if (stroke) out.push({ hex: stroke, weight: Math.max(e.w, e.h) * e.stroke.width * 2 });
    }
  }
  return out;
}

function radiusClasses(els, containers) {
  const out = [];
  for (const e of containers.concat(els.filter((x) => x.cls === "photo" && clipArea(x) < 0.85 * AREA))) {
    const minSide = Math.min(e.w, e.h);
    if (e.cls === "photo") {
      out.push(e.mask === "circle_or_oval" ? "round" : e.mask === "rounded" ? "rounded" : e.mask === "rect" ? "sharp" : "shaped");
    } else if (e.geom === "ellipse") out.push("round");
    else if (e.radius && e.radius >= minSide * 0.45) out.push("round");
    else if (e.radius && e.radius >= 2) out.push("rounded");
    else if (e.geom === "rect") out.push("sharp");
    else out.push("shaped");
  }
  return out;
}

function motifKey(d, scheme) {
  if (d.cls === "graphic" || d.cls === "sticker" || d.cls === "texture" || d.cls === "gradient") return "img|" + ((d.image && d.image.target) || d.family);
  const color = fillHex(d, scheme) || hexOf(d.stroke && d.stroke.color, scheme) || "";
  return [d.family, d.geom, color.slice(0, 1) + color.slice(2, 3) + color.slice(4, 5), Math.round(Math.log2(Math.max(1, area(d))))].join("|");
}

function chromeKey(e) {
  return [e.cls, Math.round(e.x / 12), Math.round(e.y / 12), Math.round(e.w / 12), Math.round(e.h / 12)].join("|");
}

// ---------- deck level ----------

function inferRoles(slides) {
  slides.forEach((s, i) => {
    if (s.role) return;
    if (i === 0) s.role = "cover";
    else if (i === slides.length - 1) s.role = "closing";
  });
}

function deckBodySize(slides) {
  const runs = [];
  for (const s of slides) {
    for (const e of s.elements) {
      if (e.kind !== "text") continue;
      for (const p of e.text.paragraphs) for (const r of p.runs) runs.push({ size: r.size, chars: r.text.length });
    }
  }
  return weightedMedian(runs) || 20;
}

function share(list, test) {
  return list.length ? list.filter(test).length / list.length : 0;
}

function mean(list) {
  return list.length ? list.reduce((s, n) => s + n, 0) / list.length : 0;
}

function clusterPalette(entries) {
  const clusters = [];
  for (const { hex, weight } of entries.sort((a, b) => b.weight - a.weight)) {
    const found = clusters.find((c) => colorDistance(c.hex, hex) < 28);
    if (found) found.weight += weight;
    else clusters.push({ hex, weight });
  }
  const total = clusters.reduce((s, c) => s + c.weight, 0) || 1;
  return clusters.map((c) => ({ hex: c.hex, share: c.weight / total })).sort((a, b) => b.share - a.share);
}

/**
 * Analyzes one deck model. Housekeeping slides (template credits, font
 * lists, resource pages, how-to pages) are dropped first.
 */
function analyzeDeck(model, meta = {}) {
  const kept = model.slides.filter((s) => !HOUSEKEEPING.test(s.text || ""));
  inferRoles(kept);
  const body = deckBodySize(kept);
  const slides = kept.map((s) => analyzeSlide(s, model.scheme || {}, body));
  for (const s of slides) {
    if (s.role === "cover" || s.role === "closing") continue;
    const statement = s.counts.texts <= 4 && s.counts.photos === 0 && s.counts.containers <= 1
      && !s.molecules.some((m) => ["table", "chart", "bar_chart", "card", "list", "timeline"].includes(m))
      && s.typography.maxSize >= 44
      && s.text.replace(/\s+/g, " ").length <= 220;
    s.role = statement ? "title" : "content";
  }
  const contentSlides = slides.filter((s) => s.role === "content");
  const covers = slides.filter((s) => s.role === "cover");
  const titleLike = slides.filter((s) => s.role === "title" || s.role === "closing");

  const allPhotos = slides.flatMap((s) => s.photos);
  const treatmentCounts = {};
  for (const p of allPhotos) for (const t of p.treatments) treatmentCounts[t] = (treatmentCounts[t] || 0) + 1;

  const molecules = contentSlides.flatMap((s) => s.molecules);
  const moleculeCounts = countBy(molecules);
  const topMolecule = Object.entries(moleculeCounts).sort((a, b) => b[1] - a[1])[0];

  const families = countBy(slides.flatMap((s) => s.decoration.families));
  const backgrounds = countBy(slides.map((s) => s.background.primary));
  const systemsUsed = new Set(slides.flatMap((s) => s.background.systems.filter((x) => x !== "flat")));

  const typoCounts = countBy(slides.flatMap((s) => s.typography.features));
  const fonts = new Set(slides.flatMap((s) => s.typography.fonts));

  const palette = clusterPalette(slides.flatMap((s) => s.palette));
  const meaningful = palette.filter((c) => c.share >= 0.01);
  const radii = countBy(slides.flatMap((s) => s.radii));
  const radiusTotal = Object.values(radii).reduce((a, b) => a + b, 0);
  const motifSlides = new Map();
  slides.forEach((s, i) => new Set(s.motifs).forEach((m) => {
    if (!motifSlides.has(m)) motifSlides.set(m, new Set());
    motifSlides.get(m).add(i);
  }));
  const recurring = [...motifSlides.values()].filter((set) => set.size >= 3 && set.size >= slides.length * 0.25).length;
  const chromeSlides = new Map();
  slides.forEach((s, i) => new Set(s.chrome).forEach((c) => {
    if (!chromeSlides.has(c)) chromeSlides.set(c, new Set());
    chromeSlides.get(c).add(i);
  }));
  const chrome = [...chromeSlides.values()].filter((set) => set.size >= Math.max(3, slides.length * 0.5)).length;
  const edges = contentSlides.map((s) => s.leftEdge).filter((n) => n !== null);
  const edgeMean = mean(edges);

  const signatures = new Set(slides.map((s) => s.composition.signature));
  const archetypes = countBy(slides.map((s) => s.composition.archetype));

  const imageSlides = slides.filter((s) => s.photos.length);
  const treatedSlides = imageSlides.filter((s) => s.photos.some((p) => p.nonPlain));
  const moleculeSlideShare = {};
  for (const type of new Set(slides.flatMap((s) => s.molecules))) {
    moleculeSlideShare[type] = slides.filter((s) => s.molecules.includes(type)).length / slides.length;
  }
  const maxMoleculeSlideShare = Math.max(0, ...Object.values(moleculeSlideShare));
  const strokeWidths = countBy(slides.flatMap((s) => s.strokes));
  const shadowStyles = countBy(slides.flatMap((s) => s.shadows));
  const radiusKinds = Object.keys(radii).filter((k) => k !== "shaped");
  const shapeFamilies = new Set(slides.flatMap((s) => s.shapeFamilies));
  const playKinds = ["highlight", "big_numerals", "mixed_headline", "outline_text"];
  const titleSlides = slides.filter((s) => s.role === "cover" || s.role === "title");
  const breakSlides = slides.filter((s) => s.breaks > 0).length;
  const targets = {
    layeredDepth: slides.every((s) => s.background.layers + (s.depth > 0 ? 1 : 0) >= 2) && slides.some((s) => s.background.layers + s.depth >= 3),
    decorativeDensity: mean(contentSlides.map((s) => s.decoration.count)) >= 4 && mean(titleSlides.map((s) => s.decoration.count)) <= 1,
    decorativeDensityContentOnly: mean(contentSlides.map((s) => s.decoration.count)) >= 4,
    componentVariety: Object.keys(moleculeSlideShare).length >= 4 && maxMoleculeSlideShare <= 0.4,
    imageTreatment: imageSlides.length ? treatedSlides.length / imageSlides.length >= 0.6 : null,
    typographicPlay: slides.some((s) => s.typography.features.some((f) => playKinds.includes(f))),
    cohesionRadius: radiusKinds.length <= 1,
    cohesionStroke: Object.keys(strokeWidths).length <= 1,
    cohesionShadow: Object.keys(shadowStyles).length <= 1,
    cohesionShapeFamily: shapeFamilies.size <= 1,
    surpriseExactlyOne: breakSlides === 1,
    surpriseAtLeastOne: breakSlides >= 1,
    antiThinness: slides.every((s) => s.visualElements > 0),
  };

  return {
    ...meta,
    slideCount: slides.length,
    dropped: model.slides.length - kept.length,
    roles: countBy(slides.map((s) => s.role)),
    background: {
      primary: backgrounds,
      systemsUsed: [...systemsUsed],
      flatShare: share(slides, (s) => s.background.primary === "flat"),
      meanLayers: mean(slides.map((s) => s.background.layers)),
    },
    decoration: {
      perContentSlide: mean(contentSlides.map((s) => s.decoration.count)),
      groupsPerContentSlide: mean(contentSlides.map((s) => s.decoration.groups)),
      perCover: mean(covers.map((s) => s.decoration.count)),
      perTitleSlide: mean(titleLike.map((s) => s.decoration.count)),
      families,
      familyCount: Object.keys(families).length,
      edgeAnchoredShare: (() => {
        const total = slides.reduce((n, s) => n + s.decoration.count, 0);
        return total ? slides.reduce((n, s) => n + s.decoration.edgeAnchored, 0) / total : 0;
      })(),
    },
    components: {
      types: Object.keys(moleculeCounts).length,
      counts: moleculeCounts,
      perContentSlide: contentSlides.length ? molecules.length / contentSlides.length : 0,
      topShare: topMolecule && molecules.length ? topMolecule[1] / molecules.length : 0,
      top: topMolecule ? topMolecule[0] : null,
      maxSlideShare: maxMoleculeSlideShare,
    },
    images: {
      photos: allPhotos.length,
      imageSlides: imageSlides.length,
      treatedSlideShare: imageSlides.length ? treatedSlides.length / imageSlides.length : null,
      backgroundPhotos: allPhotos.filter((p) => p.background).length,
      nonPlainShare: allPhotos.length ? share(allPhotos, (p) => p.nonPlain) : null,
      treatments: treatmentCounts,
      treatmentKinds: Object.keys(treatmentCounts).filter((t) => !PLAIN_TREATMENTS.has(t)).length,
      textOverShare: allPhotos.length ? share(allPhotos, (p) => p.textOver) : null,
      stickers: slides.reduce((n, s) => n + s.stickers, 0),
    },
    typography: {
      featureCounts: typoCounts,
      featureKinds: Object.keys(typoCounts).length,
      slidesWithPlay: share(slides, (s) => s.typography.features.some((f) => f !== "scale_contrast" && f !== "caps_display")),
      featuresPerSlide: mean(slides.map((s) => s.typography.features.length)),
      meanRatio: mean(slides.map((s) => s.typography.ratio).filter((r) => r > 0)),
      maxTitle: Math.max(0, ...slides.map((s) => s.typography.maxSize)),
      fonts: [...fonts],
    },
    composition: {
      uniqueSignatures: signatures.size,
      signatureRatio: slides.length ? signatures.size / slides.length : 0,
      archetypes,
      archetypeKinds: Object.keys(archetypes).length,
      overlapShare: share(slides, (s) => s.composition.overlap),
      bleedShare: share(slides, (s) => s.composition.bleed),
      tiltShare: share(slides, (s) => s.composition.tilt),
      meanCoverage: mean(slides.map((s) => s.composition.coverage)),
      meanDepth: mean(slides.map((s) => s.depth)),
      leftEdgeSpread: edges.length ? Math.sqrt(mean(edges.map((x) => (x - edgeMean) ** 2))) : null,
      breakSlides,
    },
    cohesion: {
      paletteSize: meaningful.length,
      topThreeShare: palette.slice(0, 3).reduce((s, c) => s + c.share, 0),
      palette: meaningful.slice(0, 8).map((c) => "#" + c.hex),
      fontCount: fonts.size,
      dominantRadiusShare: radiusTotal ? Math.max(...Object.values(radii)) / radiusTotal : null,
      radii,
      recurringMotifs: recurring,
      recurringChrome: chrome,
      strokeWidths: Object.keys(strokeWidths).length,
      shadowStyles: Object.keys(shadowStyles).length,
      radiusKinds: radiusKinds.length,
      shapeFamilies: shapeFamilies.size,
    },
    targets,
    imperfection: {
      counts: countBy(slides.flatMap((s) => s.imperfection)),
      slidesWithAny: share(slides, (s) => s.imperfection.length > 0),
      slidesWithTwo: share(slides, (s) => s.imperfection.length >= 2),
      perSlide: mean(slides.map((s) => s.imperfection.length)),
    },
    slides,
  };
}

function countBy(list) {
  const out = {};
  for (const item of list) out[item] = (out[item] || 0) + 1;
  return out;
}

module.exports = {
  analyzeDeck,
  analyzeSlide,
  HOUSEKEEPING,
  contrast,
  hexOf,
  W,
  H,
};
