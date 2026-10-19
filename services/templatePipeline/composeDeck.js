/**
 * Builds an original deck. The model invents the idea, palette, fonts,
 * and cover. A reasoning step then gives each body slide a job and a
 * composition for that job. Cover and close stay with the idea.
 */

const { CANVAS } = require("./deckSchema");
const { antiTells } = require("./antiTells");
const { inventBrief } = require("./inventBrief");
const { validateDeck } = require("./generateDeck");
const { readCatalog } = require("./catalogCaps");
const { planReasoning, previewFor, buildStrategy } = require("./reasonDeck");

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function decor(id, x, y, w, h, name, params, fill, z, opacity) {
  const element = {
    id, type: "shape", x, y, width: w, height: h, zIndex: z,
    shapeContent: { kind: "decor", decorName: name, fill, decorParams: params },
  };
  if (opacity != null) element.opacity = opacity;
  return element;
}

function shape(id, x, y, w, h, fill, z, radius) {
  const shapeContent = { kind: radius ? "roundedRect" : "rectangle", fill };
  if (radius) shapeContent.cornerRadius = radius;
  return { id, type: "shape", x, y, width: w, height: h, zIndex: z, shapeContent };
}

function text(id, x, y, w, h, style, content, extra) {
  return {
    id, type: "text", x, y, width: w, height: h, zIndex: 8,
    textStyle: {
      fontFamily: style.font,
      fontSize: style.size,
      fontWeight: style.weight || 500,
      color: style.color,
      textAlign: style.align || "left",
      themeLocked: true,
      lineHeight: style.lineHeight || 1.15,
    },
    textContent: content,
    ...(extra || {}),
  };
}

function item(binding, index) {
  return { content: { binding }, extra: { itemIndex: index, visibleWhen: "hasLabeledItem" } };
}

function layout(id, elements) {
  return { version: 2, id, canvas: { ...CANVAS }, elements };
}

function densityMargin(density, base) {
  if (density === "airy") return Math.max(base, 128);
  if (density === "dense") return Math.min(base, 72);
  return base;
}

function densityType(density, base) {
  if (density === "airy") return base * 1.08;
  if (density === "dense") return base * 0.94;
  return base;
}

async function composeDeck(seed) {
  const numeric = Number.isFinite(Number(seed)) ? (Number(seed) >>> 0) || 1 : 1;
  const rng = mulberry32(numeric);
  const idea = await inventBrief();
  const palette = idea.palette;
  const fonts = idea.fonts;
  const margin = densityMargin(idea.density, pick(rng, [72, 96, 128]));
  const radius = pick(rng, [0, 8, 28]);
  const imageSplit = pick(rng, [0.38, 0.48, 0.58, 0.68]);
  const typeScale = densityType(idea.density, pick(rng, [0.88, 1, 1.14]));
  const groundMode = idea.groundMode || "noise";

  const m = margin;
  const r = radius;
  const D = "{font.display}";
  const F = "{font.text}";
  const ink = "{color.ink}";
  const muted = "{color.muted}";
  const accent = "{color.accent}";
  const card = "{color.card}";
  const bg = "{color.bg}";
  const on = "{color.onAccent}";
  const W = CANVAS.width;
  const H = CANVAS.height;
  const inner = W - m * 2;
  const titleAlign = idea.align === "center" ? "center" : "left";
  const titleX = idea.align === "asymmetric" ? m + Math.round(inner * 0.12) : m;
  const titleW = idea.align === "asymmetric" ? Math.round(inner * 0.78) : idea.align === "center" ? inner : Math.min(inner, 1200);

  const bgShape = () => shape("bg", 0, 0, W, H, bg, 0);
  const wash = () => {
    if (groundMode === "flat") return null;
    if (groundMode === "noise") {
      return decor("grain", 0, 0, W, H, "noise", { density: 0.45, dotSize: 1.4, seed: numeric % 40 }, "{color.ink}", 1, 0.14);
    }
    if (groundMode === "dotGrid") {
      return decor("wash", 0, 0, W, H, "dotGrid", { spacing: 28, dotSize: 1.7 }, "{color.ink}", 1, 0.22);
    }
    if (groundMode === "lineGrid") {
      return decor("wash", 0, 0, W, H, "lineGrid", { spacing: 56, strokeWidth: 1 }, "{color.ink}", 1, 0.16);
    }
    if (groundMode === "glow") {
      return decor("wash", 0, 0, W, H, "glow", { centerX: 0.82, centerY: 0.18, radius: 0.72 }, "{color.accent}", 1, 0.45);
    }
    return decor("wash", 0, 0, W, H, "meshGradient", {
      colors: ["{color.accent}", "{color.accent2}"],
      points: [[0.08, 0.12], [0.92, 0.2], [0.45, 1.05]],
      radius: 0.65,
    }, "{color.accent}", 1, 0.28);
  };
  const ground = () => {
    const layer = wash();
    return layer ? [bgShape(), layer] : [bgShape()];
  };

  function photo(id, x, y, w, h, url, z) {
    return {
      id, type: "image", role: "image",
      x, y, width: w, height: h, zIndex: z,
      imageContent: { binding: "image", url, fit: "cover", alignX: 0.5, alignY: 0.5 },
    };
  }

  function ideaCover() {
    if (idea.cover === "band") {
      return [
        photo("photo", 0, 0, W, H, idea.photo, 1),
        shape("band", 0, 280, W, 300, bg, 4),
        text("title", 70, 320, 1460, 150, { font: D, size: 110, weight: 750, color: ink, align: "center" }, { binding: "title" }),
        text("body", 360, 490, 880, 50, { font: F, size: 26, color: muted, align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.cover === "split") {
      return [
        shape("field", 0, 0, W, H, bg, 0),
        shape("panel", 0, 0, 760, H, accent, 1),
        text("title", 56, 260, 650, 240, { font: D, size: 96, weight: 750, color: on }, { binding: "title" }),
        text("body", 56, 530, 620, 70, { font: F, size: 26, color: on }, { binding: "bullets" }),
        photo("photo", 760, 0, 840, H, idea.photo, 2),
      ];
    }
    if (idea.cover === "stack") {
      return [
        shape("field", 0, 0, W, H, bg, 0),
        text("body", 80, 180, 1200, 50, { font: F, size: 28, color: accent }, { binding: "bullets" }),
        text("title", 60, 260, 1480, 340, { font: D, size: 150, weight: 800, color: ink }, { binding: "title" }),
      ];
    }
    if (idea.cover === "photo") {
      const veil = shape("scrim", 0, 0, W, H, "#000000", 3);
      veil.opacity = 0.35;
      return [
        photo("photo", 0, 0, W, H, idea.photo, 1),
        veil,
        text("title", 120, 320, 1360, 180, { font: D, size: 120, weight: 600, color: "#F4F1EA", align: "center" }, { binding: "title" }),
        text("body", 360, 520, 880, 60, { font: F, size: 28, color: "#F4F1EA", align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.cover === "browser") {
      return [
        ...ground(),
        text("title", m, 70, inner, 90, { font: D, size: 72, weight: 650, color: ink }, { binding: "title" }),
        shape("chrome", m, 190, inner, 620, card, 2, 18),
        shape("bar", m, 190, inner, 56, "{color.surface}", 3, 18),
        shape("dot1", m + 22, 208, 18, 18, "#E11D48", 4, 9),
        shape("dot2", m + 48, 208, 18, 18, "#F59E0B", 4, 9),
        shape("dot3", m + 74, 208, 18, 18, "#16A34A", 4, 9),
        photo("photo", m + 16, 260, inner - 32, 530, idea.photo, 4),
      ];
    }
    const ghost = text("ghost", 80, 180, 1440, 260, { font: D, size: 200, weight: 800, color: "{color.surface}", align: "left" }, { spans: [{ text: idea.title }] });
    ghost.opacity = 0.35;
    return [
      shape("bg", 0, 0, W, H, bg, 0),
      ghost,
      text("title", 80, 280, 1440, 280, { font: D, size: 160, weight: 800, color: ink }, { binding: "title" }),
      text("body", 80, 600, 700, 50, { font: F, size: 28, color: muted }, { binding: "bullets" }),
    ];
  }

  function close() {
    if (idea.close === "panel") {
      return [
        ...ground(),
        shape("panel", m, 180, inner, 540, accent, 2, r),
        text("title", m + 60, 320, inner - 120, 160, { font: D, size: "{type.h1}", weight: 650, color: on, align: "center" }, { binding: "title" }),
        text("body", m + 200, 520, inner - 400, 70, { font: F, size: "{type.body}", color: on, align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.close === "center") {
      return [
        ...ground(),
        shape("rule", W / 2 - 60, 280, 120, 6, accent, 3),
        text("title", m, 320, inner, 160, { font: D, size: "{type.h1}", weight: 650, color: ink, align: "center" }, { binding: "title" }),
        text("body", m + 200, 520, inner - 400, 70, { font: F, size: "{type.body}", color: muted, align: "center" }, { binding: "bullets" }),
      ];
    }
    const align = idea.close === "right" ? "right" : "left";
    const x = idea.close === "right" ? W - m - 1000 : m;
    return [
      ...ground(),
      shape("rule", idea.close === "right" ? W - m - 120 : m, 300, 120, 6, accent, 3),
      text("title", x, 340, 1000, 160, { font: D, size: "{type.h1}", weight: 650, color: ink, align }, { binding: "title" }),
      text("body", x, 530, 700, 70, { font: F, size: "{type.body}", color: muted, align }, { binding: "bullets" }),
    ];
  }

  const coverCopy = { title: idea.title, bullets: [idea.subtitle] };
  const closeCopy = { title: "Begin here", bullets: ["Take the first step"] };

  const reasoning = planReasoning(readCatalog(), rng);
  const kit = {
    ground, shape, text, photo, item, m, r, W, H, D, F,
    ink, muted, accent, card, bg, on, photoUrl: idea.photo,
  };
  const sequence = ["layoutTitleFocus", ...reasoning.map((step) => step.layoutId), "layoutClosingCta"];
  const id = "gen-" + String(numeric).padStart(4, "0");
  const taste = {
    cover: idea.cover,
    density: idea.density,
    align: idea.align,
    slides: reasoning.map((step) => step.layoutId),
    groundMode,
    designLanguage: idea.designLanguage || "editorial",
  };
  const deck = {
    version: 2,
    schemaVersion: 2,
    id,
    name: idea.name,
    description: idea.name + " — " + fonts.display + " and " + fonts.text + ".",
    category: idea.name,
    visualMode: "hybrid",
    seed: numeric,
    taste,
    reasoning,
    geometry: [
      idea.cover, idea.density, idea.align, idea.list, idea.timeline, idea.stat,
      idea.compare, idea.imageSide, idea.imageMode, idea.three, idea.team, idea.text, idea.quote, idea.close,
      margin, radius, imageSplit, groundMode, idea.designLanguage || "editorial",
      idea.name, reasoning.map((step) => step.strategy).join("~"),
    ].join("."),
    tokens: {
      color: {
        bg: palette.bg,
        surface: palette.surface,
        card: palette.card,
        ink: palette.ink,
        muted: palette.muted,
        rule: palette.rule,
        accent: palette.accent,
        accent2: palette.accent2,
        onAccent: palette.onAccent,
      },
      font: { display: fonts.display, text: fonts.text },
      type: {
        eyebrow: 18,
        h1: Math.round(84 * typeScale),
        h2: Math.round(52 * typeScale),
        h3: Math.round(34 * typeScale),
        h4: Math.round(26 * typeScale),
        body: Math.round(24 * typeScale),
        caption: 20,
        stat: Math.round(120 * typeScale),
        micro: 16,
      },
    },
    theme: {
      name: palette.name,
      backgroundColor: "{color.bg}",
      fontFamily: "{font.text}",
      titleFontSize: 40,
      titleColor: "{color.ink}",
      titleBold: true,
      titleItalic: false,
      bodyFontSize: 20,
      bodyColor: "{color.muted}",
      bodyBold: false,
      bodyItalic: false,
    },
    layoutSequence: sequence.slice(),
    layouts: Object.fromEntries(sequence.map((layoutId) => {
      if (layoutId === "layoutTitleFocus") return [layoutId, layout(layoutId, ideaCover())];
      if (layoutId === "layoutClosingCta") return [layoutId, layout(layoutId, close())];
      const step = reasoning.find((item) => item.layoutId === layoutId);
      return [layoutId, layout(layoutId, buildStrategy(step.strategy, kit))];
    })),
    previewSlides: sequence.map((layoutId, index) => {
      const step = reasoning.find((item) => item.layoutId === layoutId);
      const copy = step ? previewFor(step.strategy) : (layoutId === "layoutClosingCta" ? closeCopy : coverCopy);
      return {
        id: id + "-p" + (index + 1),
        layout: layoutId,
        title: copy.title,
        bullets: copy.bullets,
      };
    }),
  };

  const errors = validateDeck(deck);
  if (errors.length) {
    const error = new Error(errors.join("; "));
    error.status = 500;
    throw error;
  }
  const tells = antiTells(deck, null, deck.taste && deck.taste.designLanguage);
  deck.tells = tells;
  if (tells.length >= 3) {
    const error = new Error("Rejected AI tells: " + tells.join(", "));
    error.status = 422;
    error.tells = true;
    throw error;
  }
  return deck;
}

module.exports = { composeDeck };

