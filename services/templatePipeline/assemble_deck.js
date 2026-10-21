/**
 * Build a 10-slide deck by copying whole slides from the best matching seeds.
 *
 *   node services/templatePipeline/assemble_deck.js "A sustainable fashion brand"
 *
 * Gemini writes the outline and names the design language. Every slide
 * comes from seeds that share that recommendedUse. The highest-scoring
 * seed in the deck supplies the palette and the fonts for every slide.
 * thematic.js then rewrites the copy, photos, and palette.
 */

const fs = require("fs");
const path = require("path");
const { injectTheme, askModel, classifyVibe, liftDarkTextBackdrops } = require("./thematic");
const { analyzeDeck } = require("./scoring/analyzeDeck");

const ROOT = path.join(__dirname, "..", "..");
const LIBRARY = path.join(ROOT, "app-library");
const CANVAS = 1600 * 900;
const ROLES = ["Cover", "Introduction", "Problem", "Features", "Process", "Data", "Testimonial", "Team", "Gallery", "CTA"];
const ROLE_ARCHETYPES = {
  Cover: ["Title slide", "Full-image"],
  Introduction: ["Two-column text", "Title slide"],
  Problem: ["Two-column text", "Full-image"],
  Features: ["Features", "Two-column text"],
  Process: ["Features", "Data/Stats", "Two-column text"],
  Data: ["Data/Stats", "Features"],
  Testimonial: ["Testimonial", "Full-image"],
  Team: ["Full-image", "Features", "Testimonial"],
  Gallery: ["Full-image", "Title slide"],
  CTA: ["CTA", "Title slide"],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function textNode(element) {
  return element && element.type === "rotated" && element.element ? element.element : element;
}

function textBody(element) {
  const node = textNode(element);
  const spans = node && node.textContent && node.textContent.spans;
  if (!Array.isArray(spans)) return "";
  return spans.map((span) => String(span && span.text != null ? span.text : "")).join("");
}

function fontSize(element) {
  const node = textNode(element);
  const sizes = [];
  if (node && node.textStyle && node.textStyle.fontSize) sizes.push(Number(node.textStyle.fontSize) || 0);
  const spans = node && node.textContent && node.textContent.spans;
  if (Array.isArray(spans)) spans.forEach((span) => sizes.push(Number(span && span.fontSize) || 0));
  return sizes.reduce((max, size) => Math.max(max, size), 0);
}

function isText(element) {
  if (!element) return false;
  if (element.type === "text") return true;
  return element.type === "rotated" && element.element && element.element.type === "text";
}

function isImage(element) {
  return element && (element.type === "image" || element.type === "maskedImage" || element.type === "collage");
}

function box(element) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const width = Math.max(0, Number(element.width) || 0);
  const height = Math.max(0, Number(element.height) || 0);
  return { x, y, width, height, right: x + width, bottom: y + height, area: width * height };
}

function rowsOf(items, tolerance) {
  const rows = [];
  items.forEach((item) => {
    const row = rows.find((group) => Math.abs(group.y - item.y) <= tolerance);
    if (row) {
      row.items.push(item);
      row.y = (row.y * (row.items.length - 1) + item.y) / row.items.length;
    } else rows.push({ y: item.y, items: [item] });
  });
  return rows;
}

function columnCount(texts) {
  const centers = texts.map((item) => item.x + item.width / 2).sort((a, b) => a - b);
  if (centers.length < 2) return 1;
  let columns = 1;
  for (let index = 1; index < centers.length; index += 1) {
    if (centers[index] - centers[index - 1] > 180) columns += 1;
  }
  return columns;
}

function archetypeOf(layout, index, total) {
  const texts = [];
  const images = [];
  (layout.elements || []).forEach((element) => {
    if (isText(element)) {
      const body = textBody(element).replace(/\s+/g, " ").trim();
      if (!body) return;
      const item = box(element);
      texts.push({ body, size: fontSize(element), x: item.x, y: item.y, width: item.width, height: item.height });
      return;
    }
    if (isImage(element)) images.push(box(element));
  });
  const imageArea = images.reduce((sum, item) => sum + item.area, 0) / CANVAS;
  const numeric = texts.filter((item) => item.body.length <= 8 && /\d/.test(item.body) && !/[a-z]{3,}/i.test(item.body));
  const numericRow = rowsOf(numeric, 80).some((row) => row.items.length >= 2);
  const featureRow = rowsOf(texts, 48).some((row) => row.items.length >= 3);
  const columns = columnCount(texts);
  const maxSize = texts.reduce((max, item) => Math.max(max, item.size), 0);
  if (numeric.length >= 3 || (numeric.length >= 2 && numericRow)) return "Data/Stats";
  if (imageArea >= 0.5 && texts.length <= 6) return "Full-image";
  if (index === 0) return "Title slide";
  if (index === total - 1 && texts.length <= 8 && imageArea < 0.5) return "CTA";
  if (featureRow && numeric.length < 2) return "Features";
  if (columns >= 2 && texts.length >= 4 && imageArea < 0.45) return "Two-column text";
  if (images.length === 1 && imageArea < 0.4 && imageArea > 0.04 && texts.some((item) => item.body.length > 40)) return "Testimonial";
  if (maxSize >= 64 && texts.length <= 5) return "Title slide";
  if (imageArea >= 0.22) return "Full-image";
  return "Two-column text";
}

function readSeeds() {
  return fs.readdirSync(LIBRARY)
    .filter((name) => name.endsWith(".dna.json"))
    .map((name) => {
      const id = name.replace(/\.dna\.json$/, "");
      const dna = loadJson(path.join(LIBRARY, name));
      const deckFile = path.join(LIBRARY, id + ".json");
      if (!fs.existsSync(deckFile) || dna.disabled) return null;
      const deck = loadJson(deckFile);
      const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
      const score = Number(dna.qualityScore);
      const qualityScore = Number.isFinite(score) ? score : 0;
      return {
        id,
        qualityScore,
        recommendedUse: typeof dna.recommendedUse === "string" ? dna.recommendedUse : "",
        deck,
        slides: sequence.map((slideId, index) => ({
          seedId: id,
          slideId,
          index,
          qualityScore,
          recommendedUse: typeof dna.recommendedUse === "string" ? dna.recommendedUse : "",
          archetype: archetypeOf(deck.layouts[slideId] || { elements: [] }, index, sequence.length),
        })),
      };
    })
    .filter(Boolean);
}

function catalogSlides(seeds) {
  const slides = [];
  seeds.forEach((seed) => seed.slides.forEach((slide) => slides.push(slide)));
  return slides;
}

function parseOutline(text) {
  const raw = String(text || "");
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  let data = [];
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch (error) {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const role = ROLES.indexOf(item && item.role) >= 0 ? item.role : "";
    const title = String(item && item.title || "").trim();
    return role ? { role, title } : null;
  }).filter(Boolean).slice(0, 10);
}

function defaultOutline() {
  return ROLES.map((role) => ({ role, title: role }));
}

async function outlineFor(prompt, designLanguage) {
  const request = [
    "Generate a 10-slide presentation outline for: " + prompt + ".",
    "The deck uses one design language: " + designLanguage + ". Every slide must belong to that language.",
    "Return a strict JSON array of 10 objects with role and title.",
    "Each role must be exactly one of: " + ROLES.join(", ") + ".",
    "Use each role once. Start with Cover and end with CTA.",
    "Titles are short slide names for this subject. Return only the JSON array.",
  ].join(" ");
  try {
    const result = await askModel(request);
    const parsed = parseOutline(result.text);
    if (parsed.length === 10 && parsed[0].role === "Cover") return parsed;
  } catch (error) {
    console.log("outline fallback: " + (error && error.message ? error.message : error));
  }
  return defaultOutline();
}

function pickSlide(slides, role, used) {
  const wanted = ROLE_ARCHETYPES[role] || ["Two-column text"];
  const unused = slides.filter((slide) => !used.has(slide.seedId + ":" + slide.slideId));
  const pool = unused.length ? unused : slides;
  for (let index = 0; index < wanted.length; index += 1) {
    const matches = pool.filter((slide) => slide.archetype === wanted[index]);
    matches.sort((a, b) => b.qualityScore - a.qualityScore || a.index - b.index);
    if (matches.length) return matches[0];
  }
  const rest = pool.slice().sort((a, b) => b.qualityScore - a.qualityScore || a.index - b.index);
  return rest[0] || null;
}

function nearestColor(hex, palette) {
  const options = Object.keys(palette)
    .map((key) => palette[key])
    .filter((value) => /^#[0-9a-f]{6}$/i.test(value || ""));
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  let best = options[0] || hex;
  let bestDistance = Infinity;
  options.forEach((color) => {
    const [cr, cg, cb] = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16));
    const distance = (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2;
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  });
  return best;
}

function paintPalette(node, palette) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => paintPalette(item, palette));
    return;
  }
  Object.keys(node).forEach((key) => {
    if (key === "tokens" || key === "assembly") return;
    const value = node[key];
    if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) node[key] = nearestColor(value, palette);
    else if (value && typeof value === "object") paintPalette(value, palette);
  });
}

function fontFamilyFor(existing, size, display, text) {
  if (existing === "{font.display}") return display;
  if (existing === "{font.text}") return text;
  return size >= 40 ? display : text;
}

function lockFonts(node, display, text) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => lockFonts(item, display, text));
    return;
  }
  if (node.type === "text" || (node.textStyle && node.textContent)) {
    const style = node.textStyle || {};
    const styleSize = Number(style.fontSize) || 0;
    if (style.fontFamily) style.fontFamily = fontFamilyFor(style.fontFamily, styleSize, display, text);
    const spans = node.textContent && node.textContent.spans;
    if (Array.isArray(spans)) {
      spans.forEach((span) => {
        const size = Number(span.fontSize) || styleSize;
        span.fontFamily = fontFamilyFor(span.fontFamily || style.fontFamily, size, display, text);
      });
    }
  }
  Object.keys(node).forEach((key) => {
    const value = node[key];
    if (value && typeof value === "object") lockFonts(value, display, text);
  });
}

function lockTheme(deck, seeds, picks) {
  const winnerPick = picks.slice().sort((a, b) => b.qualityScore - a.qualityScore || (a.seed < b.seed ? -1 : 1))[0];
  const winner = seeds.find((seed) => seed.id === winnerPick.seed);
  const color = clone((winner.deck.tokens && winner.deck.tokens.color) || {});
  const font = clone((winner.deck.tokens && winner.deck.tokens.font) || {});
  const display = font.display || font.text || "Arial";
  const text = font.text || font.display || "Arial";
  font.display = display;
  font.text = text;
  deck.tokens = deck.tokens || {};
  deck.tokens.color = color;
  deck.tokens.font = font;
  deck.theme = deck.theme || {};
  if (color.bg) deck.theme.backgroundColor = color.bg;
  if (color.ink) deck.theme.titleColor = color.ink;
  deck.theme.bodyColor = color.muted || color.ink || deck.theme.bodyColor;
  deck.theme.fontFamily = text;
  paintPalette(deck.layouts, color);
  paintPalette(deck.theme, color);
  lockFonts(deck.layouts, display, text);
  liftDarkTextBackdrops(deck);
  deck.assembly.designLanguage = winner.recommendedUse;
  deck.assembly.themeSeed = winner.id;
  deck.assembly.themeFonts = { display, text };
  deck.assembly.themeColors = color;
}

function orphanCopy(element) {
  const node = element && element.type === "rotated" && element.element && element.element.type === "text"
    ? element.element
    : element;
  if (!node || node.type !== "text") return false;
  const body = textBody(node).replace(/\s+/g, "");
  return body.length > 0 && body.length <= 2 && /[A-Za-z]/.test(body);
}

function assembleDeck(prompt, options) {
  const subject = String(prompt || "").trim();
  if (!subject) throw new Error("Prompt is required");
  return classifyVibe(subject).then((classified) => outlineFor(subject, classified.vibe).then((outline) => {
    const designLanguage = classified.vibe;
    const seeds = readSeeds().filter((seed) => seed.recommendedUse === designLanguage);
    const slides = catalogSlides(seeds);
    if (!slides.length) throw new Error("No " + designLanguage + " seeds in app-library");
    console.log("design language " + designLanguage);
    const used = new Set();
    const picks = outline.map((item) => {
      const chosen = pickSlide(slides, item.role, used);
      if (!chosen) throw new Error("No " + designLanguage + " slide for " + item.role);
      used.add(chosen.seedId + ":" + chosen.slideId);
      return {
        role: item.role,
        title: item.title || item.role,
        seed: chosen.seedId,
        sourceSlide: chosen.slideId,
        archetype: chosen.archetype,
        qualityScore: chosen.qualityScore,
        recommendedUse: chosen.recommendedUse,
      };
    });
    const byId = {};
    seeds.forEach((seed) => { byId[seed.id] = seed.deck; });
    const cover = byId[picks[0].seed];
    const deck = {
      schemaVersion: cover.schemaVersion || 2,
      id: "assembled",
      name: "",
      source: "assembled",
      tokens: clone(cover.tokens || {}),
      theme: clone(cover.theme || {}),
      layoutSequence: [],
      layouts: {},
      assembly: { prompt: subject, designLanguage, outline, picks },
    };
    picks.forEach((pick, index) => {
      const source = byId[pick.seed];
      const layout = clone(source.layouts[pick.sourceSlide]);
      const id = "slide-" + (index + 1);
      layout.id = id;
      layout.elements = (layout.elements || []).filter((element) => !orphanCopy(element));
      deck.layouts[id] = layout;
      deck.layoutSequence.push(id);
      pick.slide = index + 1;
    });
    lockTheme(deck, seeds, picks);
    return themeAssembled(deck, subject, options);
  }));
}

async function themeAssembled(deck, prompt, options) {
  const out = options && options.out;
  console.log("theme lock " + deck.assembly.themeSeed + " " + deck.assembly.themeFonts.display + " / " + deck.assembly.themeFonts.text);
  console.log("outline");
  deck.assembly.picks.forEach((pick) => {
    console.log("slide " + pick.slide + " " + pick.role + " <- " + pick.seed + " " + pick.sourceSlide + " (" + pick.archetype + ", " + pick.qualityScore + ")");
  });
  const themed = await injectTheme({
    prompt,
    layout: "assembled",
    deck,
    out,
  });
  const saved = JSON.parse(fs.readFileSync(path.join(themed.outDir, "deck.json"), "utf8"));
  saved.assembly = saved.assembly || deck.assembly;
  const analysis = await analyzeDeck(saved, themed.slides);
  console.log("assemble score " + analysis.score + " (" + analysis.passed + "/" + analysis.total + ")");
  saved.assembly.analysis = {
    score: analysis.score,
    passed: analysis.passed,
    total: analysis.total,
    failures: analysis.failures,
  };
  fs.writeFileSync(path.join(themed.outDir, "deck.json"), JSON.stringify(saved, null, 2) + "\n");
  return {
    outDir: themed.outDir,
    slides: themed.slides,
    report: themed.report,
    layout: "assembled",
    name: themed.name,
    deckId: themed.deckId,
    assembly: saved.assembly,
    analysis: saved.assembly.analysis,
  };
}

if (require.main === module) {
  const prompt = process.argv.slice(2).join(" ").trim() || "A sustainable fashion brand";
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "deck";
  const out = path.join("docs", "template-pipeline", "slide-assemblies", slug);
  assembleDeck(prompt, { out }).then((result) => {
    console.log(JSON.stringify({
      name: result.name,
      out: result.outDir,
      score: result.analysis.score,
      passed: result.analysis.passed,
      total: result.analysis.total,
      failures: result.analysis.failures,
      picks: result.assembly.picks,
    }, null, 2));
  }).catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { assembleDeck, readSeeds, archetypeOf };
