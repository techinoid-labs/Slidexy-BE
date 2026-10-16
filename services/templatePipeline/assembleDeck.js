/**
 * Builds a template from layouts a person already designed.
 * The seed chooses two source decks, copies three slides from the second
 * into the first, then applies a new palette and font pair.
 */

const { loadLibrary } = require("./library");
const { antiTells } = require("./antiTells");
const { PALETTES, FONT_PAIRS, validateDeck } = require("./generateDeck");

const SWAPPABLE = [
  "layoutAgendaList",
  "layoutTimeline",
  "layoutStatHighlight",
  "layoutThreeUp",
  "layoutComparison",
  "layoutTeam",
  "layoutImageLeft",
  "layoutQuoteBanner",
  "layoutClosingCta",
];

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

function paintHex(role, palette) {
  if (palette[role]) return palette[role];
  if (/accent|glow|hot/.test(role)) return palette.accent;
  if (/ink|text/.test(role)) return palette.ink;
  if (/muted/.test(role)) return palette.muted;
  if (/rule|hair|border/.test(role)) return palette.rule;
  if (/card|surface|panel|ghost/.test(role)) return palette.card || palette.surface;
  if (/bg|scrim/.test(role)) return palette.bg;
  return null;
}

function recolor(node, sourceColor, palette) {
  const hexToRole = {};
  Object.entries(sourceColor || {}).forEach(([role, value]) => {
    if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
      hexToRole[value.toLowerCase()] = role;
    }
  });
  const walk = (value) => {
    if (typeof value === "string") {
      const role = hexToRole[value.toLowerCase()];
      if (!role) return value;
      return paintHex(role, palette) || value;
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      const copy = {};
      Object.keys(value).forEach((key) => {
        copy[key] = walk(value[key]);
      });
      return copy;
    }
    return value;
  };
  return walk(node);
}

function paintTokens(tokens, palette, fonts) {
  const next = JSON.parse(JSON.stringify(tokens));
  Object.keys(next.color || {}).forEach((key) => {
    const current = next.color[key];
    if (typeof current === "string" && /^#[0-9a-fA-F]{6}$/.test(current)) {
      const painted = paintHex(key, palette);
      if (painted) next.color[key] = painted;
    }
  });
  next.color.bg = palette.bg;
  next.color.surface = palette.surface;
  next.color.card = palette.card;
  next.color.ink = palette.ink;
  next.color.muted = palette.muted;
  next.color.rule = palette.rule;
  next.color.accent = palette.accent;
  next.color.accent2 = palette.accent2;
  next.color.onAccent = palette.onAccent;
  next.font = { ...(next.font || {}), display: fonts.display, text: fonts.text };
  return next;
}

function previewFor(deck, layoutId, fallbackTitle) {
  const found = (deck.previewSlides || []).find((slide) => slide.layout === layoutId);
  if (!found) return { title: fallbackTitle, bullets: ["One point for this slide"] };
  return { title: found.title, bullets: found.bullets || [] };
}

function plan(seed, library) {
  const rng = mulberry32(seed);
  const parent = library[Math.floor(rng() * library.length)];
  let donor = parent;
  if (library.length > 1) {
    do {
      donor = library[Math.floor(rng() * library.length)];
    } while (donor.id === parent.id);
  }
  const operatorCount = 1 + Math.floor(rng() * 3);
  const operatorPool = ["palette", "fonts", "swap"];
  const operators = [];
  while (operators.length < operatorCount && operatorPool.length) {
    operators.push(operatorPool.splice(Math.floor(rng() * operatorPool.length), 1)[0]);
  }
  const available = SWAPPABLE.filter((id) => parent.layouts[id] && donor.layouts[id]);
  const swaps = [];
  if (operators.includes("swap")) {
    const howMany = 1 + Math.floor(rng() * 3);
    const pool = available.slice();
    while (swaps.length < howMany && pool.length) {
      swaps.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
  }
  const palette = operators.includes("palette")
    ? PALETTES[Math.floor(rng() * PALETTES.length)]
    : null;
  const fonts = operators.includes("fonts")
    ? FONT_PAIRS[Math.floor(rng() * FONT_PAIRS.length)]
    : null;
  return { parent, donor, swaps, palette, fonts, operators };
}

function assembleDeck(seed) {
  const library = loadLibrary();
  if (library.length < 2) return null;
  const numeric = Number.isFinite(Number(seed)) ? (Number(seed) >>> 0) || 1 : 1;
  const choice = plan(numeric, library);
  const { parent, donor, swaps, operators } = choice;
  const palette = choice.palette || {
    name: parent.name,
    bg: parent.tokens.color.bg,
    surface: parent.tokens.color.surface || parent.tokens.color.bg,
    card: parent.tokens.color.card || "#FFFFFF",
    ink: parent.tokens.color.ink,
    muted: parent.tokens.color.muted || parent.tokens.color.ink,
    rule: parent.tokens.color.rule || parent.tokens.color.ink,
    accent: parent.tokens.color.accent,
    accent2: parent.tokens.color.accent2 || parent.tokens.color.accent,
    onAccent: parent.tokens.color.onAccent || "#FFFFFF",
  };
  const fonts = choice.fonts || {
    display: parent.tokens.font.display,
    text: parent.tokens.font.text,
  };

  const layouts = {};
  const sequence = (parent.layoutSequence || []).filter((id) => parent.layouts[id] || donor.layouts[id]);
  sequence.forEach((layoutId) => {
    const source = swaps.includes(layoutId) ? donor : parent;
    layouts[layoutId] = recolor(source.layouts[layoutId], source.tokens.color, palette);
  });

  const id = "gen-" + String(numeric).padStart(4, "0");
  const deck = {
    version: 2,
    schemaVersion: 2,
    id,
    name: palette.name,
    description: palette.name + " — layouts from " + parent.name + " and " + donor.name + ". " + fonts.display + " and " + fonts.text + ".",
    category: "generated",
    visualMode: parent.visualMode || "hybrid",
    seed: numeric,
    geometry: [parent.id, donor.id, swaps.slice().sort().join("+"), (operators || []).slice().sort().join(".")].join("|"),
    sources: { parent: parent.id, donor: donor.id, swaps },
    tokens: paintTokens(parent.tokens, palette, fonts),
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
    layoutSequence: sequence,
    layouts,
    previewSlides: sequence.map((layoutId, index) => {
      const source = swaps.includes(layoutId) ? donor : parent;
      const preview = previewFor(source, layoutId, "Slide");
      return {
        id: id + "-p" + (index + 1),
        layout: layoutId,
        title: preview.title,
        bullets: preview.bullets,
      };
    }),
  };

  const errors = validateDeck(deck);
  if (errors.length) {
    const error = new Error(errors.join("; "));
    error.status = 500;
    throw error;
  }
  const tells = antiTells(deck, parent);
  deck.tells = tells;
  if (tells.length >= 3) {
    const error = new Error("Rejected AI tells: " + tells.join(", "));
    error.status = 422;
    error.tells = true;
    throw error;
  }
  return deck;
}

module.exports = { assembleDeck };
