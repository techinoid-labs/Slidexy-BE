/**
 * Keeps any one font, cover, ground, palette bucket, or design language
 * from exceeding 20% of the catalog. The sampler consults this before a
 * deck is invented. With only two ground modes the cap cannot be met, so
 * ground modes are a set of six.
 */

const fs = require("fs");
const path = require("path");
const { COVER_STYLES } = require("./learn");

const CAP = 0.2;
const DIR = path.join(__dirname, "..", "..", "generated-templates");

const GROUND_MODES = ["flat", "noise", "meshGradient", "dotGrid", "glow", "lineGrid"];
const DESIGN_LANGUAGES = ["editorial", "photographic", "technical", "geometric", "typographic", "spotlight"];
const DISPLAY_FONTS = [
  "Fraunces", "Newsreader", "Libre Baskerville", "Source Serif 4", "Literata",
  "Outfit", "Familjen Grotesk", "Space Grotesk", "Syne", "Manrope", "Instrument Serif", "DM Serif Display",
];
const TEXT_FONTS = [
  "Source Sans 3", "Nunito Sans", "Figtree", "Literata", "Newsreader",
  "Source Serif 4", "Outfit", "Manrope", "Sora", "Work Sans", "Spectral", "IBM Plex Sans",
];

const AXES = ["displayFont", "textFont", "fontPairing", "cover", "groundMode", "paletteBucket", "designLanguage"];

function readCatalog() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((name) => name.endsWith(".json") && name !== "taste.json" && name !== "rejects.json")
    .map((name) => {
      try { return JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8")); } catch (error) { return null; }
    })
    .filter(Boolean);
}

function canonical(name, list) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  const found = list.find((item) => item.toLowerCase() === raw.toLowerCase());
  return found || raw;
}

function rgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length < 6) return [0, 0, 0];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function paletteBucket(bg, accent) {
  const light = luminance(bg) >= 0.35 ? "light" : "dark";
  const [r, g, b] = rgb(accent);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let tone = "neutral";
  if (max - min >= 28 && max > 0) {
    let hue;
    if (max === r) hue = (g - b) / (max - min);
    else if (max === g) hue = 2 + (b - r) / (max - min);
    else hue = 4 + (r - g) / (max - min);
    hue = ((hue * 60) % 360 + 360) % 360;
    tone = hue >= 80 && hue < 260 ? "cool" : "warm";
  }
  return light + "-" + tone;
}

function groundOf(deck) {
  if (deck.taste && GROUND_MODES.includes(deck.taste.groundMode)) return deck.taste.groundMode;
  const layouts = deck.layouts || {};
  for (const layout of Object.values(layouts)) {
    const wash = (layout.elements || []).find((element) => element.width >= 1500 && element.height >= 800
      && element.shapeContent && element.shapeContent.kind === "decor");
    if (wash && GROUND_MODES.includes(wash.shapeContent.decorName)) return wash.shapeContent.decorName;
  }
  const anyDecor = Object.values(layouts).some((layout) => (layout.elements || []).some((element) => element.shapeContent && element.shapeContent.kind === "decor" && element.width >= 1500));
  return anyDecor ? "" : "flat";
}

function featuresOf(deck) {
  const displayFont = canonical(deck.tokens && deck.tokens.font && deck.tokens.font.display, DISPLAY_FONTS);
  const textFont = canonical(deck.tokens && deck.tokens.font && deck.tokens.font.text, TEXT_FONTS);
  const cover = deck.taste && COVER_STYLES.includes(deck.taste.cover) ? deck.taste.cover : "";
  const color = (deck.tokens && deck.tokens.color) || {};
  return {
    displayFont,
    textFont,
    fontPairing: displayFont && textFont ? displayFont + " / " + textFont : "",
    cover,
    groundMode: groundOf(deck),
    paletteBucket: color.bg ? paletteBucket(color.bg, color.accent || color.bg) : "",
    designLanguage: deck.taste && DESIGN_LANGUAGES.includes(deck.taste.designLanguage) ? deck.taste.designLanguage : "",
  };
}

function tally(decks, axis) {
  const counts = {};
  let total = 0;
  for (const deck of decks) {
    const key = featuresOf(deck)[axis];
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
    total += 1;
  }
  return { counts, total };
}

/** A choice stays legal when adding it would not push its share over 20%. */
function roomFor(counts, total, key) {
  return ((counts[key] || 0) + 1) / (total + 1) <= CAP + 1e-9;
}

let capWarned = false;

function pickCapped(counts, total, keys, rng) {
  const random = rng || Math.random;
  const open = keys.filter((key) => roomFor(counts, total, key));
  let pool = open;
  if (!pool.length) {
    const leastCount = Math.min(...keys.map((key) => counts[key] || 0));
    const leastShare = total ? leastCount / total : 0;
    // Six equal choices sit at about 17%, but the next deck makes one of
    // them 2/7. That step is allowed, and the share falls back under 20%
    // as the rest catch up. A catalog whose least-used choice is already
    // over 20% has no such path, so generation stops.
    if (total > 0 && leastShare > CAP + 1e-9) {
      const error = new Error("Every catalog choice is already at the 20% cap.");
      error.code = "catalog-saturated";
      error.status = 409;
      throw error;
    }
    pool = keys.filter((key) => (counts[key] || 0) === leastCount);
    if (total > 0 && !capWarned) {
      capWarned = true;
      console.warn("Catalog cap: the next deck cannot stay under 20% on this axis, so the least-used choice is used.");
    }
  }
  const least = Math.min(...pool.map((key) => counts[key] || 0));
  const tied = pool.filter((key) => (counts[key] || 0) === least);
  return tied[Math.floor(random() * tied.length)];
}

function planGeneration(decks, rng) {
  const random = rng || Math.random;
  const take = (axis, keys) => {
    const { counts, total } = tally(decks || [], axis);
    return pickCapped(counts, total, keys, random);
  };
  let displayFont = take("displayFont", DISPLAY_FONTS);
  let textFont = take("textFont", TEXT_FONTS.filter((font) => font !== displayFont));
  if (textFont === displayFont) textFont = TEXT_FONTS.find((font) => font !== displayFont) || textFont;
  const pairingCounts = tally(decks || [], "fontPairing");
  const pairing = displayFont + " / " + textFont;
  if (!roomFor(pairingCounts.counts, pairingCounts.total, pairing)) {
    const open = TEXT_FONTS.filter((font) => font !== displayFont && roomFor(pairingCounts.counts, pairingCounts.total, displayFont + " / " + font));
    if (open.length) textFont = pickCapped(pairingCounts.counts, pairingCounts.total, open.map((font) => displayFont + " / " + font), random).split(" / ")[1];
  }
  return {
    cover: take("cover", COVER_STYLES),
    groundMode: take("groundMode", GROUND_MODES),
    designLanguage: take("designLanguage", DESIGN_LANGUAGES),
    displayFont,
    textFont,
    paletteBucket: take("paletteBucket", ["light-warm", "light-cool", "light-neutral", "dark-warm", "dark-cool", "dark-neutral"]),
  };
}

function mix(hex, toward, amount) {
  const a = rgb(hex);
  const b = rgb(toward);
  const channels = a.map((c, i) => Math.round(c + (b[i] - c) * amount));
  return "#" + channels.map((c) => c.toString(16).padStart(2, "0")).join("");
}

function contrast(hexA, hexB) {
  const a = luminance(hexA);
  const b = luminance(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Moves a palette into the requested bucket without dropping ink/bg contrast
 * below 4.5. Returns the original palette when a nudge cannot keep contrast.
 */
function nudgePalette(palette, bucket) {
  if (!palette || !bucket || paletteBucket(palette.bg, palette.accent) === bucket) return palette;
  const [light, tone] = bucket.split("-");
  let bg = palette.bg;
  let ink = palette.ink;
  const bgTarget = light === "light" ? "#f7f4ee" : "#14161c";
  for (let step = 0; step < 12; step += 1) {
    bg = mix(bg, bgTarget, 0.4);
    if (contrast(ink, bg) < 4.5) ink = luminance(bg) >= 0.35 ? "#1a1612" : "#f6f1e8";
    if ((luminance(bg) >= 0.35) === (light === "light")) break;
  }
  const accentTarget = tone === "cool" ? "#2f6f8f" : tone === "warm" ? "#b85a2a" : "#8a8175";
  let accent = palette.accent;
  for (let step = 0; step < 8; step += 1) {
    accent = mix(accent, accentTarget, 0.45);
    if (paletteBucket(bg, accent) === bucket) break;
  }
  const accentInk = tone === "cool" ? "#0e2430" : tone === "warm" ? "#3a140c" : "#2c2824";
  const accentPaper = tone === "cool" ? "#d5eaf2" : tone === "warm" ? "#f3d2c2" : "#e4dfd6";
  for (let step = 0; step < 8 && contrast(accent, bg) < 3; step += 1) {
    accent = mix(accent, luminance(bg) >= 0.35 ? accentInk : accentPaper, 0.5);
  }
  if (paletteBucket(bg, accent) !== bucket) accent = mix(accent, accentTarget, 0.65);
  const next = { ...palette, bg, ink, accent };
  if (paletteBucket(next.bg, next.accent) !== bucket) return palette;
  if (contrast(next.ink, next.bg) < 4.5 || contrast(next.accent, next.bg) < 3) return palette;
  return next;
}

function applyPlan(brief, plan) {
  const palette = nudgePalette(brief.palette, plan.paletteBucket);
  return {
    ...brief,
    cover: plan.cover,
    groundMode: plan.groundMode,
    designLanguage: plan.designLanguage,
    fonts: { display: plan.displayFont, text: plan.textFont },
    palette,
  };
}

function shares(decks) {
  const out = {};
  for (const axis of AXES) {
    const { counts, total } = tally(decks, axis);
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    out[axis] = {
      total,
      top: ranked[0] ? ranked[0][0] : null,
      topShare: ranked[0] && total ? ranked[0][1] / total : 0,
      counts,
    };
  }
  return out;
}

module.exports = {
  CAP,
  AXES,
  GROUND_MODES,
  DESIGN_LANGUAGES,
  DISPLAY_FONTS,
  TEXT_FONTS,
  readCatalog,
  featuresOf,
  paletteBucket,
  planGeneration,
  pickCapped,
  nudgePalette,
  applyPlan,
  shares,
  roomFor,
  tally,
};
