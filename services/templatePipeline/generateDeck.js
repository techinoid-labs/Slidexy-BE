/**
 * Builds one deck template from a numeric seed.
 * Same seed always returns the same file. Colors and type change,
 * and so does where the title, photo, and rows sit.
 */

const { CANVAS, LAYOUT_SEQUENCE, BINDINGS } = require("./deckSchema");

const PALETTES = [
  { name: "Oxblood paper", bg: "#F6F1E8", surface: "#EFE7DA", card: "#FFFFFF", ink: "#1A1512", muted: "#5C5147", rule: "#D8CBB6", accent: "#7B2D26", accent2: "#B08D57", onAccent: "#F6F1E8" },
  { name: "Forest ink", bg: "#F3F6F1", surface: "#E4EBDF", card: "#FFFFFF", ink: "#142116", muted: "#4E5C50", rule: "#C9D4C6", accent: "#1F6B3A", accent2: "#8C5A2B", onAccent: "#F3F6F1" },
  { name: "Night press", bg: "#121418", surface: "#1C2128", card: "#242B33", ink: "#F4F1EA", muted: "#B7B1A6", rule: "#343B44", accent: "#E2B15A", accent2: "#D4784A", onAccent: "#121418" },
  { name: "Clay studio", bg: "#F8F1EC", surface: "#F0E4DA", card: "#FFFFFF", ink: "#2A1814", muted: "#6B5148", rule: "#E2D0C4", accent: "#C4522A", accent2: "#2F5D50", onAccent: "#FFF8F4" },
  { name: "Harbor", bg: "#F4F7F8", surface: "#E6EEEF", card: "#FFFFFF", ink: "#122026", muted: "#4C626A", rule: "#D0DEE2", accent: "#0E4D6C", accent2: "#C46B2F", onAccent: "#F4F7F8" },
  { name: "Plum note", bg: "#F7F3F8", surface: "#EDE4F0", card: "#FFFFFF", ink: "#241526", muted: "#645066", rule: "#DDD0E0", accent: "#7A2F5B", accent2: "#C4893A", onAccent: "#F7F3F8" },
];

const FONT_PAIRS = [
  { display: "Fraunces", text: "Source Sans 3" },
  { display: "Libre Baskerville", text: "Nunito Sans" },
  { display: "Outfit", text: "Literata" },
  { display: "Newsreader", text: "Figtree" },
  { display: "Space Grotesk", text: "Source Serif 4" },
  { display: "Familjen Grotesk", text: "Newsreader" },
];

const TYPE = {
  eyebrow: 18, h1: 72, h2: 48, h3: 32, h4: 26,
  body: 24, caption: 20, stat: 96, micro: 16,
};

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

function optionsFromSeed(seed) {
  const rng = mulberry32(seed);
  const pick = (list) => list[Math.floor(rng() * list.length)];
  return {
    cover: Math.floor(rng() * 3),
    agenda: Math.floor(rng() * 2),
    imageSide: Math.floor(rng() * 2),
    close: Math.floor(rng() * 2),
    quote: Math.floor(rng() * 2),
    palette: pick(PALETTES),
    fonts: pick(FONT_PAIRS),
  };
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
      lineHeight: 1.15,
    },
    textContent: content,
    ...extra,
  };
}

function bound(binding, index) {
  const content = { binding };
  const extra = {};
  if (index !== undefined) {
    extra.itemIndex = index;
    extra.visibleWhen = "hasLabeledItem";
  }
  return { content, extra };
}

function layout(id, elements) {
  return { version: 2, id, canvas: { ...CANVAS }, elements };
}

function ground() {
  return [shape("bg", 0, 0, CANVAS.width, CANVAS.height, "{color.bg}", 0)];
}

function buildLayouts(opt) {
  const D = "{font.display}";
  const T = "{font.text}";
  const ink = "{color.ink}";
  const muted = "{color.muted}";
  const accent = "{color.accent}";
  const card = "{color.card}";
  const centered = opt.cover === 1;
  const titleX = centered ? 200 : 96;
  const titleW = centered ? 1200 : 900;
  const align = centered ? "center" : "left";
  const rail = centered
    ? shape("rail", 740, 200, 120, 8, accent, 4)
    : shape("rail", 96, 200, 120, 8, accent, 4);

  const title = layout("layoutTitleFocus", [
    ...ground(),
    ...(opt.cover === 2 ? [shape("side", 1180, 0, 420, 900, "{color.surface}", 1)] : []),
    rail,
    text("eyebrow", titleX, 230, titleW, 36, { font: T, size: "{type.eyebrow}", weight: 700, color: accent, align }, { spans: [{ text: "TEMPLATE" }] }),
    text("title", titleX, 280, titleW, 140, { font: D, size: "{type.h1}", weight: 650, color: ink, align }, { binding: "title" }),
    text("body", titleX, 450, titleW, 100, { font: T, size: "{type.body}", color: muted, align }, { binding: "bullets" }),
  ]);

  const agendaItems = [0, 1, 2, 3].flatMap((i) => {
    const y = 220 + i * 150;
    const cardOn = opt.agenda === 1;
    const row = [];
    if (cardOn) row.push(shape("card" + i, 80, y, 1440, 130, card, 2, 16));
    const b = bound("itemNumber", i);
    const label = bound("labeledLabel", i);
    const detail = bound("labeledDetail", i);
    row.push(
      text("n" + i, 110, y + 28, 80, 48, { font: D, size: "{type.h3}", weight: 700, color: accent }, b.content, b.extra),
      text("al" + i, 210, y + 24, 500, 40, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
      text("ad" + i, 210, y + 68, 1100, 40, { font: T, size: "{type.body}", color: muted }, detail.content, detail.extra),
    );
    return row;
  });
  const agenda = layout("layoutAgendaList", [
    ...ground(),
    text("title", 96, 70, 1200, 90, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    ...agendaItems,
  ]);

  const timeline = layout("layoutTimeline", [
    ...ground(),
    shape("line", 160, 430, 1280, 4, "{color.rule}", 2),
    text("title", 96, 70, 1200, 90, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    ...[0, 1, 2, 3].flatMap((i) => {
      const x = 160 + i * 340;
      const marker = bound("timelineMarker", i);
      const label = bound("timelineLabel", i);
      const detail = bound("labeledDetail", i);
      return [
        shape("dot" + i, x, 414, 36, 36, accent, 4, 18),
        text("m" + i, x - 10, 360, 80, 40, { font: D, size: "{type.h4}", weight: 700, color: accent }, marker.content, marker.extra),
        text("tl" + i, x - 20, 480, 280, 40, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
        text("td" + i, x - 20, 530, 280, 80, { font: T, size: "{type.caption}", color: muted }, detail.content, detail.extra),
      ];
    }),
  ]);

  const stat = layout("layoutStatHighlight", [
    ...ground(),
    text("title", 96, 80, 900, 100, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    text("stat", 96, 280, 700, 180, { font: D, size: "{type.stat}", weight: 700, color: accent }, { binding: "subtitle" }),
    text("body", 96, 500, 800, 160, { font: T, size: "{type.body}", color: muted }, { binding: "bullets" }),
  ]);

  const three = layout("layoutThreeUp", [
    ...ground(),
    text("title", 96, 70, 1200, 90, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    ...[0, 1, 2].flatMap((i) => {
      const x = 96 + i * 490;
      const label = bound("labeledLabel", i);
      const detail = bound("labeledDetail", i);
      return [
        shape("card" + i, x, 240, 450, 520, card, 2, 18),
        text("n" + i, x + 32, 280, 80, 48, { font: D, size: "{type.h3}", weight: 700, color: accent }, bound("itemNumber", i).content, bound("itemNumber", i).extra),
        text("al" + i, x + 32, 360, 380, 80, { font: D, size: "{type.h3}", weight: 650, color: ink }, label.content, label.extra),
        text("ad" + i, x + 32, 460, 380, 220, { font: T, size: "{type.body}", color: muted }, detail.content, detail.extra),
      ];
    }),
  ]);

  const comparison = layout("layoutComparison", [
    ...ground(),
    text("title", 96, 70, 1400, 90, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    shape("left", 80, 220, 700, 580, card, 2, 18),
    shape("right", 820, 220, 700, 580, "{color.surface}", 2, 18),
    text("ll", 120, 260, 600, 60, { font: D, size: "{type.h3}", weight: 650, color: ink }, bound("labeledLabel", 0).content, bound("labeledLabel", 0).extra),
    text("ld", 120, 340, 600, 400, { font: T, size: "{type.body}", color: muted }, bound("labeledDetail", 0).content, bound("labeledDetail", 0).extra),
    text("rl", 860, 260, 600, 60, { font: D, size: "{type.h3}", weight: 650, color: ink }, bound("labeledLabel", 1).content, bound("labeledLabel", 1).extra),
    text("rd", 860, 340, 600, 400, { font: T, size: "{type.body}", color: muted }, bound("labeledDetail", 1).content, bound("labeledDetail", 1).extra),
  ]);

  const team = layout("layoutTeam", [
    ...ground(),
    text("title", 96, 70, 1200, 90, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    ...[0, 1, 2, 3].flatMap((i) => {
      const x = 80 + (i % 4) * 380;
      const label = bound("labeledLabel", i);
      const detail = bound("labeledDetail", i);
      return [
        shape("card" + i, x, 240, 350, 480, card, 2, 18),
        shape("avatar" + i, x + 115, 280, 120, 120, "{color.surface}", 3, 60),
        text("al" + i, x + 24, 430, 300, 50, { font: D, size: "{type.h4}", weight: 650, color: ink, align: "center" }, label.content, label.extra),
        text("ad" + i, x + 24, 490, 300, 160, { font: T, size: "{type.caption}", color: muted, align: "center" }, detail.content, detail.extra),
      ];
    }),
  ]);

  const imageLeft = opt.imageSide === 0;
  const image = layout("layoutImageLeft", [
    ...ground(),
    {
      id: "photo", type: "image", role: "image",
      x: imageLeft ? 0 : 860, y: 0, width: 740, height: 900, zIndex: 2,
      imageContent: { binding: "image", fit: "cover", alignX: 0.5, alignY: 0.5 },
      visibleWhen: "hasImage",
    },
    text("title", imageLeft ? 820 : 80, 180, 680, 160, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    text("body", imageLeft ? 820 : 80, 380, 680, 280, { font: T, size: "{type.body}", color: muted }, { binding: "bullets" }),
  ]);

  const textOnly = layout("layoutTextOnly", [
    ...ground(),
    shape("rule", 96, 200, 80, 8, accent, 3),
    text("title", 96, 230, 1300, 140, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
    text("body", 96, 400, 1100, 320, { font: T, size: "{type.body}", color: muted }, { binding: "bullets" }),
  ]);

  const quote = layout("layoutQuoteBanner", [
    ...ground(),
    shape("bar", opt.quote === 0 ? 96 : 80, opt.quote === 0 ? 200 : 160, opt.quote === 0 ? 160 : 8, opt.quote === 0 ? 8 : 400, accent, 3),
    text("title", 120, 240, 1360, 280, { font: D, size: "{type.h2}", weight: 600, color: ink }, { binding: "title" }),
    text("body", 120, 560, 1000, 80, { font: T, size: "{type.body}", color: muted }, { binding: "bullets" }),
  ]);

  const closeAlign = opt.close === 1 ? "center" : "left";
  const closeX = opt.close === 1 ? 200 : 96;
  const closing = layout("layoutClosingCta", [
    ...ground(),
    text("title", closeX, 280, 1200, 160, { font: D, size: "{type.h1}", weight: 650, color: ink, align: closeAlign }, { binding: "title" }),
    text("body", closeX, 470, 900, 80, { font: T, size: "{type.body}", color: muted, align: closeAlign }, { binding: "bullets" }),
  ]);

  return {
    layoutTitleFocus: title,
    layoutAgendaList: agenda,
    layoutTimeline: timeline,
    layoutStatHighlight: stat,
    layoutThreeUp: three,
    layoutComparison: comparison,
    layoutTeam: team,
    layoutImageLeft: image,
    layoutTextOnly: textOnly,
    layoutQuoteBanner: quote,
    layoutClosingCta: closing,
  };
}

const PREVIEWS = [
  ["layoutTitleFocus", "Field notes", ["A short brief for this look"]],
  ["layoutAgendaList", "What we will cover", ["Place — Where the work happens", "People — Who it is for", "Proof — What changed", "Next — The first step"]],
  ["layoutTimeline", "How it unfolds", ["Start — Name the job", "Build — Make the first cut", "Show — Put it in front of someone", "Keep — Leave it in use"]],
  ["layoutStatHighlight", "One number", ["The figure that matters"]],
  ["layoutThreeUp", "Three parts", ["See — Look at the real thing", "Make — Shape a response", "Share — Hand it to someone"]],
  ["layoutComparison", "Two ways", ["Before — The old habit", "After — The new one"]],
  ["layoutTeam", "Who holds it", ["Lead — Sets the direction", "Make — Does the work", "Tell — Writes it down", "Host — Welcomes people"]],
  ["layoutImageLeft", "Beside the picture", ["One point next to the photograph"]],
  ["layoutTextOnly", "Say it plain", ["A single idea, written out"]],
  ["layoutQuoteBanner", "A line worth keeping", ["Said in the room"]],
  ["layoutClosingCta", "Begin here", ["Take the first step"]],
];

function geometryKey(opt) {
  return [opt.cover, opt.agenda, opt.imageSide, opt.close, opt.quote].join(".");
}

async function generateDeck(seed) {
  return require("./composeDeck").composeDeck(seed);
}

function buildSimpleDeck(seed) {
  const numeric = Number.isFinite(Number(seed)) ? (Number(seed) >>> 0) : 1;
  const opt = optionsFromSeed(numeric || 1);
  const palette = opt.palette;
  const id = "gen-" + String(numeric).padStart(4, "0");
  const tokens = {
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
    font: { display: opt.fonts.display, text: opt.fonts.text },
    type: { ...TYPE },
  };
  const deck = {
    version: 2,
    schemaVersion: 2,
    id,
    name: palette.name,
    description: palette.name + " — " + opt.fonts.display + " and " + opt.fonts.text + ".",
    category: "generated",
    visualMode: "hybrid",
    seed: numeric,
    geometry: geometryKey(opt),
    tokens,
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
    layoutSequence: LAYOUT_SEQUENCE.slice(),
    layouts: buildLayouts(opt),
    previewSlides: PREVIEWS.map(([layoutId, title, bullets], index) => ({
      id: id + "-p" + (index + 1),
      layout: layoutId,
      title,
      bullets,
    })),
  };
  const errors = validateDeck(deck);
  if (errors.length) {
    const error = new Error(errors.join("; "));
    error.status = 500;
    throw error;
  }
  return deck;
}

function contrast(hexA, hexB) {
  const lum = (hex) => {
    const h = hex.replace("#", "");
    const channels = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function validateDeck(deck) {
  const errors = [];
  if (deck.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (!Array.isArray(deck.layoutSequence) || deck.layoutSequence.length < 2) {
    errors.push("layoutSequence is too short");
  }
  for (const layoutId of deck.layoutSequence || []) {
    const body = deck.layouts && deck.layouts[layoutId];
    if (!body) {
      errors.push("missing layout " + layoutId);
      continue;
    }
    for (const element of body.elements || []) {
      const box = [element.x, element.y, element.width, element.height];
      if (box.some((n) => typeof n !== "number")) {
        errors.push(layoutId + " " + element.id + " has a bad box");
        continue;
      }
      if (element.x < 0 || element.y < 0 || element.x + element.width > CANVAS.width + 1 || element.y + element.height > CANVAS.height + 1) {
        errors.push(layoutId + " " + element.id + " sits outside the slide");
      }
      const binding = element.textContent && element.textContent.binding;
      if (binding && !BINDINGS.has(binding)) errors.push("unknown binding " + binding);
      const imageBinding = element.imageContent && element.imageContent.binding;
      if (imageBinding && !BINDINGS.has(imageBinding)) errors.push("unknown binding " + imageBinding);
    }
  }
  const color = deck.tokens && deck.tokens.color;
  if (color && contrast(color.ink, color.bg) < 4.5) errors.push("ink on background is too faint");
  if (color && contrast(color.accent, color.bg) < 3) errors.push("accent on background is too faint");
  return errors;
}

module.exports = {
  generateDeck,
  validateDeck,
  geometryKey,
  optionsFromSeed,
  PALETTES,
  FONT_PAIRS,
};
