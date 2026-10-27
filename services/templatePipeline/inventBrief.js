/**
 * Asks the model for one original template idea.
 * Structure (slides/density/align) is biased by Ship/Discard taste.
 * The model invents the subject, title, and palette.
 */

const fs = require("fs");
const path = require("path");
const { biasedStructure, tasteHints, COVER_STYLES, loadTaste, rebuildTasteFromDecks } = require("./learn");
const { readCatalog, planGeneration, applyPlan } = require("./catalogCaps");

function seedTasteIfNeeded() {
  const taste = loadTaste();
  if (taste.reviews > 0) return;
  const dir = path.join(__dirname, "..", "..", "generated-templates");
  if (!fs.existsSync(dir)) return;
  const decks = fs.readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name !== "taste.json" && name !== "rejects.json")
    .map((name) => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); } catch (error) { return null; }
    })
    .filter(Boolean);
  if (decks.some((deck) => deck.status === "ship" || deck.status === "discard")) {
    rebuildTasteFromDecks(decks);
  }
}

function loadEnv() {
  const file = path.join(__dirname, "..", "..", ".env");
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

async function askCustomGenerate(url, prompt) {
  const response = await fetch(url, {
    method: "POST",
    headers: { accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify({
      input: String(prompt || ""),
      max_output_tokens: Number(process.env.CUSTOM_GENERATE_MAX_TOKENS) || 16000,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (body && (body.error || body.detail || body.message)) || "Custom generate request failed.";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  const text = body && (body.output != null ? body.output : body.text != null ? body.text : body.content);
  if (text == null || text === "") throw new Error("The model did not return a design.");
  return String(text);
}

async function askModel(prompt) {
  loadEnv();
  const customUrl = String(process.env.CUSTOM_GENERATE_URL || "http://64.23.174.222:8010/generate").trim();
  if (customUrl) {
    try {
      return await askCustomGenerate(customUrl, prompt);
    } catch (error) {
      const openRouter = process.env.OPENROUTER_API_KEY;
      const google = process.env.API_KEY1 || process.env.GEMINI_API_KEY;
      if (!openRouter && !google) throw error;
      console.warn("custom generate failed (" + (error && error.message ? error.message : error) + "); falling back");
    }
  }
  const openRouter = process.env.OPENROUTER_API_KEY;
  const google = process.env.API_KEY1 || process.env.GEMINI_API_KEY;
  if (openRouter) {
    try {
      const text = await askOpenRouter(openRouter, prompt);
      if (text) return text;
    } catch (error) {
      if (!google) throw error;
    }
  }
  if (google) return askGoogle(google, prompt);
  const error = new Error("No model endpoint is set. Set CUSTOM_GENERATE_URL, or OPENROUTER_API_KEY / API_KEY1 / GEMINI_API_KEY.");
  error.status = 500;
  throw error;
}

async function askOpenRouter(key, prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    const message = (body.error && body.error.message) || "OpenRouter request failed.";
    throw new Error(message);
  }
  const text = body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content;
  if (!text) throw new Error("The model did not return a design.");
  return text;
}

async function askGoogle(key, prompt) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + key;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const body = await response.json();
  if (!response.ok) {
    const message = (body.error && body.error.message) || "Gemini request failed.";
    throw new Error(message);
  }
  const text = body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts && body.candidates[0].content.parts[0].text;
  if (!text) throw new Error("The model did not return a design.");
  return text;
}

async function searchPhoto(query) {
  loadEnv();
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query) return "";
  const url = "https://api.pexels.com/v1/search?orientation=landscape&per_page=1&query=" + encodeURIComponent(query);
  const response = await fetch(url, { headers: { Authorization: key } });
  if (!response.ok) return "";
  const body = await response.json();
  const photo = body.photos && body.photos[0];
  if (!photo) return "";
  return (photo.src && (photo.src.large2x || photo.src.large || photo.src.original)) || "";
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function parseBrief(raw, structure, plan) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The model did not return JSON.");
  const data = JSON.parse(raw.slice(start, end + 1));
  const palette = data.palette || {};
  const fonts = data.fonts || {};
  const cover = COVER_STYLES.includes(data.cover) ? data.cover : structure.preferredCover || "photo";
  if (!data.title || !palette.bg || !palette.ink || !palette.accent || !fonts.display || !fonts.text) {
    throw new Error("The model left out a color, a font, or the title.");
  }
  const brief = {
    name: String(data.idea || data.title).slice(0, 40),
    title: String(data.title).slice(0, 24),
    subtitle: String(data.subtitle || "").slice(0, 60),
    cover,
    density: structure.density,
    align: structure.align,
    close: oneOf(data.close, ["left", "right", "center", "panel"], "left"),
    photoQuery: String(data.photoQuery || data.idea || ""),
    palette: {
      name: String(data.idea || data.title),
      bg: palette.bg,
      surface: palette.surface || palette.bg,
      card: palette.card || "#FFFFFF",
      ink: palette.ink,
      muted: palette.muted || palette.ink,
      rule: palette.rule || palette.muted || palette.ink,
      accent: palette.accent,
      accent2: palette.accent2 || palette.accent,
      onAccent: palette.onAccent || "#FFFFFF",
    },
    fonts: { display: String(fonts.display).trim(), text: String(fonts.text).trim() },
  };
  if (plan && (brief.fonts.display.toLowerCase() !== plan.displayFont.toLowerCase() || brief.fonts.text.toLowerCase() !== plan.textFont.toLowerCase())) {
    throw new Error("The model returned fonts other than the ones the catalog reserved.");
  }
  return brief;
}

const SUBJECT_SEEDS = [
  "coastal pottery studio", "night train timetable", "alpine bakery", "harbor radio room",
  "desert greenhouse", "jazz club backstage", "forest ranger brief", "vintage print shop",
  "city bike workshop", "museum lighting plan", "tea plantation diary", "arctic field lab",
  "rooftop cinema", "river ferry schedule", "stone quarry craft", "library archive night",
  "indie game studio", "botanical dye lab", "mountain rescue brief", "street food night market",
];

async function inventBrief() {
  seedTasteIfNeeded();
  const structure = biasedStructure();
  const plan = planGeneration(readCatalog());
  const subject = SUBJECT_SEEDS[Math.floor(Math.random() * SUBJECT_SEEDS.length)];
  const hints = tasteHints();
  const prompt = `
Invent one presentation template about this subject: ${subject}.
It must feel specific to that subject, not a generic business deck. Do not invent space, cosmic, or galaxy themes.
${hints}
The cover is already chosen: "${plan.cover}".
The fonts are already chosen: display "${plan.displayFont}", text "${plan.textFont}".
The design language is "${plan.designLanguage}". Let the subject and palette suit it.
The palette must read as ${plan.paletteBucket} (light or dark ground, warm, cool, or neutral accent).
Return only JSON with this shape:
{
  "idea": "two or three words",
  "title": "the cover words, 1 to 3 words",
  "subtitle": "one short line",
  "cover": "photo" or "band" or "split" or "browser" or "type" or "stack",
  "photoQuery": "a stock-photo search for a real scene matching the subject, with no text in the picture",
  "close": "left" or "right" or "center" or "panel",
  "palette": {"bg":"#","surface":"#","card":"#","ink":"#","muted":"#","rule":"#","accent":"#","accent2":"#","onAccent":"#"},
  "fonts": {"display":"${plan.displayFont}", "text":"${plan.textFont}"}
}
The cover, close, and fonts are already chosen. Do not invent slides or a different font.
Fixed density: ${structure.density}
Fixed align: ${structure.align}
Use photo for a full-bleed picture with the title on it.
Use band when a solid color bar should cut across the picture and hold the title.
Use split when one half is color and type and the other half is only the photograph.
Use browser when the subject is software or the web.
Use type when one huge word should fill the slide.
Use stack when the title should be enormous and the subtitle small above it.
Ink on bg must be easy to read. For the display font, do not use Inter, Roboto, Open Sans, Lato, Montserrat, or Poppins. Prefer a distinctive display face — condensed grotesque, heavy sans, or a striking serif.
Unique seed: ${Date.now()}-${Math.random().toString(36).slice(2, 8)}
`;
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await askModel(prompt);
      const brief = applyPlan(parseBrief(raw, structure, plan), plan);
      brief.photo = await searchPhoto(brief.photoQuery);
      return brief;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

module.exports = { inventBrief, parseBrief };
