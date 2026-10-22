/**
 * Rewrite a deck's copy and photographs for a new subject.
 *
 *   node services/templatePipeline/thematic.js --prompt "A futuristic AI robotics company." --layout health-medical --density airy --out docs/template-pipeline/thematic-tests/ai-robotics
 *
 * Text is rewritten by Gemini (OpenRouter, then the Gemini API).
 * Photographs come from Pexels. Copy that runs past the line, or ends on a
 * dangling word, is sent back once and otherwise kept as the original line.
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, Image } = require("canvas");
const { renderSlidePng } = require("../../scripts/slideSvg");
const { nudgePalette } = require("./catalogCaps");
const { analyzeDeck } = require("./scoring/analyzeDeck");
const { applyParametric } = require("./parametric");

const ROOT = path.join(__dirname, "..", "..");
const LIBRARY = path.join(ROOT, "app-library");
const STOP = new Set([
  "a", "an", "the", "for", "of", "and", "or", "to", "about", "into", "with", "from",
  "deck", "presentation", "pitch", "business", "plan", "company", "brand", "new",
]);
const DANGLING = new Set([
  "a", "an", "the",
  "and", "or", "but", "nor", "so", "yet",
  "of", "for", "to", "in", "on", "at", "by", "with", "from", "into", "onto", "over", "per", "via", "as",
]);

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function parseArgs(argv) {
  const args = { prompt: "", layout: "", out: "", autoLayout: false, density: "balanced" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--prompt") args.prompt = argv[++i] || "";
    else if (arg.startsWith("--prompt=")) args.prompt = arg.slice("--prompt=".length);
    else if (arg === "--layout") args.layout = argv[++i] || "";
    else if (arg.startsWith("--layout=")) args.layout = arg.slice("--layout=".length);
    else if (arg === "--out") args.out = argv[++i] || "";
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else if (arg === "--density") args.density = argv[++i] || "";
    else if (arg.startsWith("--density=")) args.density = arg.slice("--density=".length);
    else if (arg === "--auto-layout") args.autoLayout = true;
    else throw new Error("Unknown argument " + arg);
  }
  if (!args.prompt) throw new Error("Pass --prompt \"A pitch deck for a sustainable fashion brand\"");
  if (!args.layout && !args.autoLayout) throw new Error("Pass --layout health-medical.json or --auto-layout");
  if (["airy", "balanced", "dense"].indexOf(args.density) < 0) {
    throw new Error("Pass --density airy, balanced, or dense");
  }
  return args;
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "theme";
}

function loadLayout(layout) {
  const named = layout.endsWith(".json") ? layout : layout + ".json";
  const candidates = [
    path.resolve(layout),
    path.join(LIBRARY, named),
    path.join(LIBRARY, path.basename(named)),
  ];
  let file = candidates.find((item) => fs.existsSync(item) && fs.statSync(item).isFile());
  if (!file && fs.existsSync(LIBRARY)) {
    const needle = path.basename(named, ".json").toLowerCase();
    const matches = fs.readdirSync(LIBRARY).filter((name) => name.endsWith(".json") && name.indexOf(".dna.") < 0 && name.toLowerCase().indexOf(needle) >= 0);
    if (matches.length === 1) file = path.join(LIBRARY, matches[0]);
    else if (matches.length > 1) throw new Error("Layout " + layout + " matches more than one seed: " + matches.join(", "));
  }
  if (!file) throw new Error("Layout not found: " + layout);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function eachElement(deck, visit) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  function visitElement(element, parent) {
    if (!element) return;
    visit(element, parent);
    if (element.type === "rotated" && element.element) visitElement(element.element, element);
    if (Array.isArray(element.children)) element.children.forEach((child) => visitElement(child, element));
  }
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    (layout.elements || []).forEach((element) => visitElement(element, null));
  });
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function collectStrings(deck) {
  return prepareCopy(deck).strings;
}

function spanSize(span, element) {
  const size = Number(span.fontSize != null ? span.fontSize : (element.textStyle && element.textStyle.fontSize));
  return Number.isFinite(size) ? size : 0;
}

function sameSize(a, b) {
  return Math.abs(a - b) < 0.75;
}

function adjacentBoxes(a, b) {
  if (!sameSize(a.size, b.size)) return false;
  const yTol = Math.max(8, a.size * 0.25);
  if (Math.abs(a.y - b.y) > yTol) return false;
  const left = a.x <= b.x ? a : b;
  const right = left === a ? b : a;
  const gap = right.x - (left.x + left.width);
  const gapTol = Math.max(16, a.size * 0.5);
  return gap >= -8 && gap <= gapTol;
}

function letter(ch) {
  return /[A-Za-z0-9]/.test(ch || "");
}

function snapCut(value, cursor, end) {
  if (end <= cursor || end >= value.length) return end;
  if (!letter(value[end - 1]) || !letter(value[end])) return end;
  let left = end;
  while (left > cursor && letter(value[left - 1])) left -= 1;
  let right = end;
  while (right < value.length && letter(value[right])) right += 1;
  if (left <= cursor) return Math.min(value.length, right);
  if ((end - left) <= (right - end)) return left;
  return Math.min(value.length, right);
}

function splitProportional(text, lengths) {
  const value = String(text || "");
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let cursor = 0;
  return lengths.map((length, index) => {
    if (index === lengths.length - 1) return value.slice(cursor);
    const share = lengths.slice(0, index + 1).reduce((sum, item) => sum + item, 0) / total;
    let end = Math.round(value.length * share);
    if (end <= cursor && cursor < value.length && length > 0) end = cursor + 1;
    end = Math.max(cursor, Math.min(value.length, end));
    end = snapCut(value, cursor, end);
    const piece = value.slice(cursor, end);
    cursor = end;
    return piece;
  });
}

function prepareCopy(deck) {
  const strings = [];
  const seen = new Set();
  const groups = [];
  function addString(text) {
    if (!String(text || "").trim() || seen.has(text)) return;
    seen.add(text);
    strings.push(text);
  }
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const chunks = [];
    (layout.elements || []).forEach((element) => {
      if (element.type !== "text") return;
      const spans = element.textContent && element.textContent.spans;
      if (!Array.isArray(spans)) return;
      let current = null;
      spans.forEach((span) => {
        const text = String(span.text == null ? "" : span.text);
        if (!text.trim()) return;
        const size = spanSize(span, element);
        if (current && sameSize(current.size, size)) {
          current.parts.push({ span, text, element });
          current.text += text;
          return;
        }
        current = {
          element,
          size,
          x: Number(element.x) || 0,
          y: Number(element.y) || 0,
          width: Number(element.width) || 0,
          parts: [{ span, text, element }],
          text,
        };
        chunks.push(current);
      });
    });
    const pending = chunks.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const used = new Set();
    pending.forEach((chunk) => {
      if (used.has(chunk)) return;
      const members = [chunk];
      used.add(chunk);
      let extended = true;
      while (extended) {
        extended = false;
        const tail = members[members.length - 1];
        pending.forEach((other) => {
          if (extended || used.has(other) || other.element === tail.element) return;
          if (other.x < tail.x - 1) return;
          if (!adjacentBoxes(tail, other)) return;
          members.push(other);
          used.add(other);
          extended = true;
        });
      }
      const parts = members.reduce((list, member) => list.concat(member.parts), []);
      const key = members.map((member) => member.text).join("");
      if (parts.length < 2) {
        addString(key);
        return;
      }
      groups.push({ key, parts });
      addString(key);
    });
  });
  return { strings, groups };
}

function photoQuery(prompt) {
  const words = String(prompt).replace(/[^a-z0-9\s-]/gi, " ").split(/\s+/).filter((word) => word && !STOP.has(word.toLowerCase()));
  return words.join(" ") || String(prompt).trim();
}

function directionPrompt(subject) {
  return [
    "Based on this prompt: " + JSON.stringify(subject) + ", invent one presentation direction.",
    "brand is a company name of 2-4 words. industry is a short industry. mission is one sentence.",
    "mood is a color palette mood that fits that brand, such as dark and neon, warm and earthy, or clean and corporate.",
    "keywords are 2-3 single words a camera can see. Examples: office, software, laptop. concert, guitar, stage. cafe, coffee, barista.",
    "Return JSON only: { \"brand\": \"...\", \"industry\": \"...\", \"mission\": \"...\", \"mood\": \"...\", \"keywords\": [\"...\", \"...\"] }.",
  ].join("\n");
}

function vibePrompt(subject) {
  return [
    "Categorize this presentation prompt into exactly one vibe: Photo-heavy, Text-heavy, or Corporate.",
    "Photo-heavy: the subject is visual, such as travel, food, fashion, photography, hospitality, or nature.",
    "Text-heavy: the subject is a written report, essay, or strategy document.",
    "Corporate: a company, firm, product, or professional service. A cybersecurity firm, a bank, a consultancy, or a software company is Corporate.",
    "Prompt: " + JSON.stringify(subject),
    "Return JSON only: { \"vibe\": \"Photo-heavy\" } or { \"vibe\": \"Text-heavy\" } or { \"vibe\": \"Corporate\" }.",
  ].join("\n");
}

function parseProfile(raw) {
  const fenced = String(raw || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(raw || "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return a company profile");
  const data = JSON.parse(body.slice(start, end + 1));
  const brand = String(data.brand || "").replace(/\s+/g, " ").trim();
  const industry = String(data.industry || "").replace(/\s+/g, " ").trim();
  const mission = String(data.mission || "").replace(/\s+/g, " ").trim();
  const words = brand.split(" ").filter(Boolean);
  if (!brand || !industry || !mission || words.length < 2 || words.length > 4) {
    throw new Error("The company profile needs a 2-4 word brand, an industry, and a mission");
  }
  return { brand, industry, mission };
}

const COPY_RULES = [
  "Write like a slide designer, not an essayist. Maximum 25 words of body text per slide.",
  "A bullet is a phrase, not a sentence. Do not use full stops at the end of bullets.",
  "Never use em dashes. Use a colon, a comma, or a period.",
  "Subtitles must be a single line, maximum 10 words.",
  "Metrics must be written exactly like: '47%: churn, after the onboarding rebuild'.",
];

function buildPrompt(strings, subject, profile) {
  const list = strings.map((text) => ({
    text,
    characters: text.length,
    words: wordCount(text),
  }));
  return [
    "Here is a list of text strings from a slide deck: " + JSON.stringify(list) + ".",
    "Rewrite these strings for a new presentation about: " + subject + ".",
    "Company profile: " + JSON.stringify(profile) + ".",
    "You MUST use the exact brand name provided in every string that refers to the company. Do not invent new names.",
    COPY_RULES.join(" "),
    "Each string is at most 25 words, and at most one sentence. A bullet stays under 12 words and does not end with a period. A subtitle stays under 10 words. If the original is one word, keep one word.",
    "A string that is one word may be replaced by one complete word even when that word is longer. Never delete letters from a word. The layout shrinks the font when a single word is wider than its box.",
    "You MUST return a non-empty replacement for every string. If a string is very short (1-3 characters) or a generic label (like a nav pill), return a shortened version of the original text. DO NOT return an empty string.",
    "NEVER split a word with a space.",
    "Return strict JSON mapping the old string to the new string. The keys must be the original text values, exactly.",
    "Do not include the characters or words fields in the response. Return only the JSON object.",
  ].join(" ");
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
      temperature: 0.4,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    const message = (body.error && body.error.message) || "OpenRouter request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  const text = body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content;
  if (!text) throw new Error("The model did not return text");
  return { text, model: "google/gemini-2.5-flash-lite" };
}

async function askGoogle(key, prompt) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + encodeURIComponent(key);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 8000 },
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    const message = (body.error && body.error.message) || "Gemini request failed";
    throw new Error(message);
  }
  const parts = body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts;
  const text = Array.isArray(parts) ? parts.map((part) => part.text || "").join("") : "";
  if (!text) throw new Error("The model did not return text");
  return { text, model: "gemini-2.5-flash-lite" };
}

async function askModel(prompt) {
  loadEnv();
  const openRouter = process.env.OPENROUTER_API_KEY;
  const google = process.env.API_KEY1 || process.env.GEMINI_API_KEY;
  if (openRouter) {
    try {
      return await askOpenRouter(openRouter, prompt);
    } catch (error) {
      const credit = error.status === 402 || /credit|insufficient/i.test(error.message || "");
      if (!credit || !google) throw error;
    }
  }
  if (google) return askGoogle(google, prompt);
  throw new Error("No model key is set. Add OPENROUTER_API_KEY, API_KEY1, or GEMINI_API_KEY to .env.");
}

const VIBES = ["Photo-heavy", "Text-heavy", "Corporate"];

function parseVibe(raw) {
  const fenced = String(raw || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(raw || "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  let value = "";
  if (start >= 0 && end > start) {
    try {
      value = String(JSON.parse(body.slice(start, end + 1)).vibe || "");
    } catch (error) { /* fall through to a plain match */ }
  }
  if (!value) {
    const match = body.match(/Photo-heavy|Text-heavy|Corporate/i);
    value = match ? match[0] : "";
  }
  const vibe = VIBES.find((item) => item.toLowerCase() === value.toLowerCase());
  if (!vibe) throw new Error("The model did not return a layout vibe");
  return vibe;
}

function seedScores() {
  return fs.readdirSync(LIBRARY)
    .filter((name) => name.endsWith(".dna.json"))
    .map((name) => {
      const id = name.replace(/\.dna\.json$/, "");
      if (!fs.existsSync(path.join(LIBRARY, id + ".json"))) return null;
      let data = {};
      try {
        data = JSON.parse(fs.readFileSync(path.join(LIBRARY, name), "utf8"));
      } catch (error) {
        return null;
      }
      return {
        id,
        qualityScore: Number(data.qualityScore),
        recommendedUse: typeof data.recommendedUse === "string" ? data.recommendedUse : "",
        disabled: Boolean(data.disabled),
      };
    })
    .filter(Boolean);
}

async function classifyVibe(subject) {
  const result = await askModel(vibePrompt(subject));
  return { vibe: parseVibe(result.text), model: result.model };
}

function decorationDir(vibe) {
  const name = String(vibe || "");
  if (!/^[a-z0-9-]+$/i.test(name)) return "";
  const root = path.resolve(ROOT, "assets", "decorations");
  const dir = path.resolve(root, name);
  const relative = path.relative(root, dir);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return "";
  return dir;
}

function getAvailableVibes() {
  const root = path.resolve(ROOT, "assets", "decorations");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && /^[a-z0-9-]+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function pngNames(vibe) {
  const dir = decorationDir(vibe);
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => /\.png$/i.test(name) && !name.startsWith(".")).sort();
}

function assetVibePrompt(subject, vibes) {
  return [
    "Based on the user's prompt, choose exactly ONE of the following visual vibes for the design assets: " + JSON.stringify(vibes) + ". Return ONLY the exact word.",
    "Choose minimal for a corporate, professional, or minimalist presentation, including a pitch deck, a consultancy, a bank, or a company overview.",
    "Choose tech for a technology company, a software product, or a startup.",
    "Choose organic only for plants, nature, and wellness.",
    "A physical place a person can photograph, such as a cafe, restaurant, hotel, store, or fashion boutique, should choose minimal.",
    "Prompt: " + JSON.stringify(subject),
  ].join("\n");
}

function subjectAssetVibe(subject, vibes) {
  const list = Array.isArray(vibes) ? vibes : [];
  const find = (name) => list.find((vibe) => vibe.toLowerCase() === name);
  const text = String(subject || "");
  if (/\b(tech|software|startup|cyber|robotics|saas)\b/i.test(text) && !/\bcorporate\b/i.test(text)) {
    const tech = find("tech");
    if (tech) return tech;
  }
  if (photographicSubject(text) || /\b(corporate|minimalist|minimal|pitch|consultancy|bank)\b/i.test(text)) {
    const minimal = find("minimal");
    if (minimal) return minimal;
  }
  return "";
}

function photographicSubject(subject) {
  return /\b(coffee|cafe|café|restaurant|bakery|boutique|fashion|hotel|salon|gym|shop|store|brewery|roastery|barbershop|spa)\b/i.test(String(subject || ""));
}

function steerAssetVibe(subject, settled, vibes) {
  const current = settled || { vibe: "", fallback: false };
  const hinted = subjectAssetVibe(subject, vibes);
  if (!hinted || hinted === current.vibe) return current;
  console.log("asset vibe steer " + (current.vibe || "none") + " -> " + hinted);
  return { vibe: hinted, fallback: true };
}

function parseAssetVibe(raw, vibes) {
  const list = Array.isArray(vibes) ? vibes : [];
  const match = (value) => list.find((vibe) => vibe.toLowerCase() === String(value || "").trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, "").replace(/[.,]+$/g, ""));
  const text = String(raw || "").trim();
  const direct = match(text);
  if (direct) return direct;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = match(JSON.parse(body.slice(start, end + 1)).vibe);
      if (parsed) return parsed;
    } catch (error) {
      /* The model was asked for one word. A broken JSON object falls through. */
    }
  }
  const words = body.toLowerCase().match(/[a-z0-9-]+/g) || [];
  const hits = list.filter((vibe) => words.indexOf(vibe.toLowerCase()) >= 0);
  return hits.length === 1 ? hits[0] : "";
}

function settleAssetVibe(choice, vibes) {
  const list = Array.isArray(vibes) ? vibes : getAvailableVibes();
  const named = list.find((vibe) => vibe.toLowerCase() === String(choice || "").trim().toLowerCase());
  if (named) return { vibe: named, fallback: false };
  return { vibe: "", fallback: Boolean(String(choice || "").trim()) };
}

async function classifyAssetVibe(subject) {
  const vibes = getAvailableVibes();
  console.log("asset vibes " + (vibes.join(", ") || "none"));
  if (!vibes.length) return { vibe: "", model: "", fallback: true };
  let model = "";
  let choice = "";
  try {
    const result = await askModel(assetVibePrompt(subject, vibes));
    model = result.model;
    choice = parseAssetVibe(result.text, vibes);
  } catch (error) {
    choice = "";
  }
  console.log("asset vibe choice " + (choice || "unrecognized"));
  const settled = settleAssetVibe(choice, vibes);
  if (settled.fallback) console.log("asset vibe fallback " + (choice || "unrecognized") + " -> " + settled.vibe);
  const steered = steerAssetVibe(subject, settled, vibes);
  return { vibe: steered.vibe, model, fallback: settled.fallback || steered.fallback };
}

async function chooseLayout(subject, exclude, knownVibe) {
  const skipped = Array.isArray(exclude) ? exclude : [];
  const result = knownVibe && knownVibe.vibe
    ? { vibe: knownVibe.vibe, model: knownVibe.model || "" }
    : await classifyVibe(subject);
  const vibe = result.vibe;
  const ranked = seedScores()
    .filter((seed) => seed.recommendedUse === vibe && !seed.disabled && seed.qualityScore >= 70)
    .sort((a, b) => b.qualityScore - a.qualityScore || (a.id < b.id ? -1 : 1));
  const matches = ranked.filter((seed) => skipped.indexOf(seed.id) < 0);
  if (!matches.length) {
    if (!ranked.length) throw new Error("No enabled " + vibe + " layout scored 70 or above");
    const same = ranked[0];
    return { id: same.id, vibe, qualityScore: same.qualityScore, model: result.model, repeated: true };
  }
  let pick = matches[0];
  if (vibe === "Photo-heavy") {
    let slots = 0;
    try { slots = countLargePhotoSlides(loadLayout(pick.id)); } catch (error) { slots = 0; }
    if (slots < 2) {
      const richer = matches.find((seed) => {
        try { return countLargePhotoSlides(loadLayout(seed.id)) >= 2; } catch (error) { return false; }
      });
      if (richer && richer.id !== pick.id) {
        console.log("photo layout swap " + pick.id + " -> " + richer.id);
        pick = richer;
      }
    }
  }
  return { id: pick.id, vibe, qualityScore: pick.qualityScore, model: result.model };
}

function stringMap(value) {
  const map = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return map;
  Object.keys(value).forEach((key) => {
    const next = value[key];
    if (typeof next === "string") map[key] = next;
    else if (next && typeof next.text === "string") map[key] = next.text;
  });
  return map;
}

function arrayToMap(list) {
  const map = {};
  list.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const from = item.text || item.old || item.from || item.source;
    const to = item.rewrite || item.new || item.to || item.replacement;
    if (typeof from === "string" && typeof to === "string") map[from] = to;
  });
  return map;
}

function parseMap(raw) {
  const fenced = String(raw || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(raw || "");
  const objectStart = body.indexOf("{");
  const objectEnd = body.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    const data = JSON.parse(body.slice(objectStart, objectEnd + 1));
    if (Array.isArray(data)) return arrayToMap(data);
    if (data && typeof data.replacements === "object") return stringMap(data.replacements);
    if (data && typeof data.mapping === "object") return stringMap(data.mapping);
    return stringMap(data);
  }
  const listStart = body.indexOf("[");
  const listEnd = body.lastIndexOf("]");
  if (listStart >= 0 && listEnd > listStart) return arrayToMap(JSON.parse(body.slice(listStart, listEnd + 1)));
  throw new Error("The model did not return JSON");
}

function lookup(map, text) {
  if (Object.prototype.hasOwnProperty.call(map, text)) return map[text];
  const trimmed = text.trim();
  if (Object.prototype.hasOwnProperty.call(map, trimmed)) return map[trimmed];
  return null;
}

function charLimit(source) {
  const length = String(source).length;
  return Math.max(length, Math.round(length * 1.15));
}

function singleWord(text) {
  return cleanCopy(text).split(/\s+/).filter(Boolean).length === 1;
}

function lastWord(text) {
  const parts = String(text || "").trim().split(/\s+/);
  const word = parts[parts.length - 1] || "";
  return word.replace(/[^a-z]/gi, "").toLowerCase();
}

function dangling(text) {
  return DANGLING.has(lastWord(text));
}

function cleanCopy(text) {
  let value = String(text || "").replace(/\r/g, "").replace(/\u2014|\u2013/g, ", ").trim();
  value = value.replace(/\s+,/g, ",").replace(/,{2,}/g, ",");
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length > 0 && words.length <= 12 && value.indexOf(".") === value.length - 1) {
    value = value.slice(0, -1).trim();
  }
  return value;
}

function clampCopy(text) {
  let value = cleanCopy(text);
  const first = value.split(/\.\s+/)[0] || value;
  value = cleanCopy(first);
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length > 25) value = words.slice(0, 25).join(" ");
  if (wordCount(value) <= 12 && value.endsWith(".")) value = value.slice(0, -1).trim();
  return value;
}

function prefixChop(source, text) {
  const from = cleanCopy(source).toLowerCase();
  const to = cleanCopy(text).toLowerCase();
  return Boolean(to) && to.length < from.length && from.startsWith(to);
}

function splitsContiguousWord(source, text) {
  const words = String(source || "").match(/[A-Za-z0-9]{4,}/g) || [];
  const hay = String(text || "").toLowerCase();
  return words.some((word) => {
    const token = word.toLowerCase();
    for (let index = 1; index < token.length; index += 1) {
      if (hay.indexOf(token.slice(0, index) + " " + token.slice(index)) >= 0) return true;
    }
    return false;
  });
}

function acceptable(source, text) {
  const value = cleanCopy(text);
  if (!value) return false;
  const words = wordCount(value);
  if (words > 25) return false;
  if ((value.match(/\. /g) || []).length > 0) return false;
  if (/\.$/.test(value) && words <= 12) return false;
  if (wordCount(source) <= 10 && words > 10) return false;
  if (value.length > charLimit(source) && !(singleWord(source) && singleWord(value))) return false;
  if (dangling(value)) return false;
  if (prefixChop(source, value)) return false;
  if (splitsContiguousWord(source, value)) return false;
  return true;
}

function cutInsideWord(left, right) {
  const from = String(left || "");
  const to = String(right || "");
  if (!from || !to) return false;
  return letter(from[from.length - 1]) && letter(to[0]);
}

function retryPrompt(items, profile) {
  const brand = profile && profile.brand ? profile.brand : "";
  const lines = items.map((item) => [
    "This text was too long. Rewrite this exact string to mean the same thing, but under " + item.limit + " characters.",
    "String: " + JSON.stringify(item.draft),
    "JSON key: " + JSON.stringify(item.from),
  ].join(" "));
  return lines.join("\n") + (brand ? "\nWhen the string names the company, use the brand \"" + brand + "\"." : "") + "\n" + COPY_RULES.join(" ") + "\nYou MUST return a non-empty replacement for every string. DO NOT return an empty string.\nNEVER split a word with a space. Never delete letters from a word. A one-word string must stay one complete word; the layout shrinks the font to fit.\nReturn strict JSON mapping each JSON key to its rewritten string.";
}

async function inventDirection(subject) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await askModel(directionPrompt(subject));
      const profile = parseProfile(result.text);
      const mood = parseMood(result.text);
      const keywords = parseKeywords(result.text);
      if (!mood) throw new Error("The model did not return a mood");
      return {
        profile,
        mood,
        keywords,
        query: keywords.length ? keywords.join(" ") : photoQuery(subject),
        model: result.model,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function rewriteStrings(strings, subject, profile) {
  const first = await askModel(buildPrompt(strings, subject, profile));
  let map = parseMap(first.text);
  let model = first.model;
  const missing = strings.filter((text) => lookup(map, text) == null);
  if (missing.length && missing.length < strings.length) {
    const second = await askModel(buildPrompt(missing, subject, profile));
    map = Object.assign(map, parseMap(second.text));
    model = model + "+" + second.model;
  }
  return { map, model };
}

async function settleCopy(strings, map, profile) {
  const accepted = {};
  const notes = {};
  const pending = [];
  strings.forEach((from) => {
    const raw = lookup(map, from);
    if (raw == null) {
      accepted[from] = from;
      notes[from] = { replaced: false, rejected: false };
      return;
    }
    const draft = cleanCopy(raw);
    if (!draft) {
      accepted[from] = "";
      notes[from] = { replaced: true, rejected: false, deleted: true };
      return;
    }
    if (acceptable(from, draft)) {
      accepted[from] = draft;
      notes[from] = { replaced: true, rejected: false };
      return;
    }
    pending.push({ from, draft, limit: charLimit(from) });
  });
  let model = "";
  if (pending.length) {
    const retry = await askModel(retryPrompt(pending, profile));
    model = retry.model;
    let retried = {};
    try {
      retried = parseMap(retry.text);
    } catch (error) {
      retried = {};
    }
    pending.forEach((item) => {
      const next = cleanCopy(lookup(retried, item.from) || "");
      if (acceptable(item.from, next)) {
        accepted[item.from] = next;
        notes[item.from] = { replaced: true, rejected: false, retried: true };
      } else {
        const clamped = clampCopy(next || item.draft || item.from);
        accepted[item.from] = clamped || item.from;
        notes[item.from] = { replaced: clamped !== item.from, rejected: !clamped, retried: true, clamped: true };
      }
    });
  }
  return { accepted, notes, model };
}

function applyText(deck, accepted, notes, groups) {
  const replacements = [];
  const seen = new Set();
  const assigned = new Set();
  (groups || []).forEach((group) => {
    const from = group.key;
    const to = Object.prototype.hasOwnProperty.call(accepted, from) ? accepted[from] : from;
    let pieces = splitProportional(to, group.parts.map((part) => part.text.length));
    const broken = pieces.some((piece, index) => {
      if (!index) return false;
      const previous = group.parts[index - 1];
      const part = group.parts[index];
      if (previous.element && part.element && previous.element !== part.element) return false;
      return cutInsideWord(pieces[index - 1], piece);
    });
    const written = broken ? from : to;
    if (broken) {
      pieces = group.parts.map((part) => part.text);
      notes[from] = { replaced: false, rejected: true, retried: Boolean(notes[from] && notes[from].retried) };
    }
    group.parts.forEach((part, index) => {
      part.span.text = pieces[index];
      assigned.add(part.span);
    });
    if (seen.has(from)) return;
    seen.add(from);
    const note = notes[from] || { replaced: false, rejected: false };
    replacements.push({
      from,
      to: written,
      fromChars: from.length,
      toChars: written.length,
      fromWords: wordCount(from),
      toWords: wordCount(written),
      replaced: note.replaced,
      rejected: note.rejected,
      retried: Boolean(note.retried),
      clamped: false,
    });
  });
  eachElement(deck, (element) => {
    if (element.type !== "text") return;
    const spans = element.textContent && element.textContent.spans;
    if (!Array.isArray(spans)) return;
    spans.forEach((span) => {
      if (assigned.has(span)) return;
      const from = String(span.text == null ? "" : span.text);
      if (!from.trim()) return;
      const to = Object.prototype.hasOwnProperty.call(accepted, from) ? accepted[from] : from;
      span.text = to;
      if (seen.has(from)) return;
      seen.add(from);
      const note = notes[from] || { replaced: false, rejected: false };
      replacements.push({
        from,
        to,
        fromChars: from.length,
        toChars: to.length,
        fromWords: wordCount(from),
        toWords: wordCount(to),
        replaced: note.replaced,
        rejected: note.rejected,
        retried: Boolean(note.retried),
        clamped: false,
      });
    });
  });
  return replacements;
}

function textHostNode(element) {
  if (!element) return null;
  if (element.type === "text") return element;
  if (element.type === "rotated" && element.element && element.element.type === "text") return element.element;
  return null;
}

function hostText(element) {
  const node = textHostNode(element);
  if (!node) return "";
  const spans = node.textContent && node.textContent.spans;
  if (!Array.isArray(spans)) return "";
  return spans.map((span) => String(span.text == null ? "" : span.text)).join("").replace(/\s+/g, " ").trim();
}

function hostSize(element) {
  const node = textHostNode(element);
  if (!node) return 0;
  const spans = (node.textContent && node.textContent.spans) || [];
  const sizes = spans.map((span) => spanSize(span, node));
  if (node.textStyle && node.textStyle.fontSize) sizes.push(Number(node.textStyle.fontSize) || 0);
  return sizes.reduce((max, size) => Math.max(max, size), 0);
}

function hostImportance(element) {
  return hostSize(element) * 1000 + wordCount(hostText(element)) * 10 - (Number(element.y) || 0) / 1000;
}

function pruneSlideText(deck) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  let removed = 0;
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const hosts = [];
    function collect(list) {
      (list || []).forEach((element) => {
        if (!element) return;
        if (textHostNode(element)) hosts.push({ list, element });
        if (Array.isArray(element.children)) collect(element.children);
      });
    }
    collect(layout.elements);
    function drop(host) {
      const index = host.list.indexOf(host.element);
      if (index < 0) return;
      host.list.splice(index, 1);
      host.removed = true;
      removed += 1;
    }
    hosts.forEach((host) => {
      if (!hostText(host.element)) drop(host);
    });
    let live = hosts.filter((host) => !host.removed);
    const wordsOf = (list) => list.reduce((sum, host) => sum + wordCount(hostText(host.element)), 0);
    if (wordsOf(live) <= 25) return;
    live.sort((a, b) => hostImportance(b.element) - hostImportance(a.element));
    let kept = live.slice(0, 4);
    while (kept.length > 1 && wordsOf(kept) > 25) kept.pop();
    const keep = new Set(kept);
    live.forEach((host) => {
      if (!keep.has(host)) drop(host);
    });
  });
  console.log("text boxes removed " + removed);
  return removed;
}

function parseKeywords(raw) {
  const fenced = String(raw || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(raw || "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    const loose = body.match(/keywords?\s*[:=]\s*([^\n]+)/i);
    if (!loose) return [];
    const words = [];
    loose[1].toLowerCase().replace(/[^a-z0-9,\s-]/g, " ").split(/[\s,]+/).forEach((word) => {
      if (!word || STOP.has(word) || words.indexOf(word) >= 0 || words.length >= 3) return;
      words.push(word);
    });
    return words;
  }
  const parsed = JSON.parse(body.slice(start, end + 1));
  let list = parsed.keywords || parsed.keyword || [];
  if (typeof list === "string") list = list.split(",");
  if (!Array.isArray(list)) return [];
  const words = [];
  list.forEach((item) => {
    String(item || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).forEach((word) => {
      if (!word || STOP.has(word) || words.indexOf(word) >= 0 || words.length >= 3) return;
      words.push(word);
    });
  });
  return words;
}

function parseMood(raw) {
  const fenced = String(raw || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(raw || "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return String(raw || "").replace(/\s+/g, " ").trim();
  const data = JSON.parse(body.slice(start, end + 1));
  return String(data.mood || data.palette || "").replace(/\s+/g, " ").trim();
}

function moodBucket(mood) {
  const text = String(mood || "").toLowerCase();
  if (/\bdark\b|\bnoir\b|\bnight\b/.test(text)) return "dark-neutral";
  if (/earth|brown|green|organic|natural|rustic|warm/.test(text)) return "light-warm";
  return "light-neutral";
}

function rgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length < 6) return [0, 0, 0];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(hexA, hexB) {
  const a = luminance(hexA);
  const b = luminance(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex, toward, amount) {
  const a = rgb(hex);
  const b = rgb(toward);
  const channels = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
  return "#" + channels.map((channel) => channel.toString(16).padStart(2, "0")).join("");
}

function readableOn(against) {
  const light = "#F6F1E8";
  const dark = "#1A1612";
  return contrast(light, against) >= contrast(dark, against) ? light : dark;
}

function fillRole(hex) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = luminance(hex);
  if (sat < 28) {
    if (lum >= 0.75) return "card";
    return "ink";
  }
  if (r > 180 && g > 140 && b < 120 && lum > 0.4) return "bg";
  return "accent";
}

function finishNeutral(palette, bucket) {
  const tone = String(bucket || "").split("-")[1];
  if (tone !== "neutral") return palette;
  const channels = rgb(palette.bg);
  if (Math.max.apply(null, channels) - Math.min.apply(null, channels) < 36) return palette;
  const target = String(bucket).startsWith("dark") ? "#161616" : "#f3f1ee";
  let bg = palette.bg;
  let ink = palette.ink;
  for (let step = 0; step < 8; step += 1) {
    bg = mix(bg, target, 0.5);
    if (contrast(ink, bg) < 4.5) ink = luminance(bg) >= 0.35 ? "#1A1612" : "#F6F1E8";
    const next = rgb(bg);
    if (Math.max.apply(null, next) - Math.min.apply(null, next) < 24) break;
  }
  let accent = palette.accent;
  if (contrast(accent, bg) < 3) {
    accent = mix(accent, luminance(bg) >= 0.35 ? "#1A1612" : "#F6F1E8", 0.45);
  }
  return { ...palette, bg, ink, accent, surface: bg };
}

function paintPalette(palette, bucket) {
  const dark = bucket.startsWith("dark");
  let card = palette.card || "#FFFFFF";
  if (dark && luminance(card) >= 0.35) card = mix(palette.bg, "#ffffff", 0.16);
  if (!dark && luminance(card) < 0.55) card = mix(palette.bg, "#ffffff", 0.72);
  const onAccent = readableOn(palette.accent);
  return { ...palette, card, surface: palette.bg, onAccent };
}

function applyMood(deck, mood, forcedBucket) {
  const bucket = forcedBucket || moodBucket(mood);
  const current = (deck.tokens && deck.tokens.color) || {};
  const nudged = nudgePalette({
    bg: current.bg || "#FBD523",
    surface: current.surface || current.bg || "#FBD523",
    card: current.card || "#FFFFFF",
    ink: current.ink || "#1C1916",
    muted: current.muted || current.ink || "#1C1916",
    rule: current.rule || "#D9D0C6",
    accent: current.accent || "#1E3A32",
    accent2: current.accent2 || current.accent || "#1E3A32",
    onAccent: current.onAccent || "#FFFFFF",
  }, bucket);
  const palette = paintPalette(finishNeutral(nudged, bucket), bucket);
  const onAccent = palette.onAccent;
  function nextFill(hex) {
    const role = fillRole(hex);
    if (role === "bg") return palette.bg;
    if (role === "card") return palette.card;
    if (role === "accent") return palette.accent;
    return palette.ink;
  }
  function nextText(hex) {
    return luminance(hex) < 0.5 ? palette.ink : onAccent;
  }
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    Object.keys(node).forEach((key) => {
      const value = node[key];
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
        if (key === "fill" || key === "backgroundColor") node[key] = nextFill(value);
        else if (key === "color" || key === "titleColor" || key === "bodyColor") node[key] = nextText(value);
      } else if (value && typeof value === "object" && key !== "tokens") {
        visit(value);
      }
    });
  };
  visit(deck.layouts);
  if (deck.theme) visit(deck.theme);
  deck.tokens = deck.tokens || {};
  deck.tokens.color = {
    ...palette,
    bg: palette.bg,
    surface: palette.bg,
    card: palette.card,
    ink: palette.ink,
    muted: palette.ink,
    accent: palette.accent,
    accent2: palette.accent,
    onAccent,
  };
  liftDarkTextBackdrops(deck);
  repairChipText(deck);
  guardPhotoText(deck, deck.tokens.color);
  if (deck.assembly) liftDarkShapes(deck);
  return { mood: forcedBucket || mood, bucket, palette: deck.tokens.color };
}

function elementCenter(element) {
  return {
    x: (Number(element.x) || 0) + (Number(element.width) || 0) / 2,
    y: (Number(element.y) || 0) + (Number(element.height) || 0) / 2,
  };
}

function containsPoint(element, point) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const width = Number(element.width) || 0;
  const height = Number(element.height) || 0;
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
}

function solidFill(element) {
  if (!element) return "";
  if (element.type === "shape") return element.shapeContent && element.shapeContent.fill;
  if (element.type === "illustration") return element.illustrationContent && element.illustrationContent.fill;
  return "";
}

function isFullBleed(element) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const right = x + (Number(element.width) || 0);
  const bottom = y + (Number(element.height) || 0);
  return x <= 8 && y <= 8 && right >= 1592 && bottom >= 892;
}

function averageLuminance(file) {
  const image = new Image();
  image.src = fs.readFileSync(file);
  if (!image.width || !image.height) return null;
  const canvas = createCanvas(24, 14);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 24, 14);
  const data = ctx.getImageData(0, 0, 24, 14).data;
  let sum = 0;
  const count = data.length / 4;
  for (let index = 0; index < data.length; index += 4) {
    sum += (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
  }
  return sum / count;
}

function scrimBrightPhotos(deck) {
  if (!deck || !deck.assembly) return;
  const palette = deck.tokens && deck.tokens.color;
  const bg = palette && palette.bg;
  if (!bg || luminance(bg) < 0.7) return;
  const light = palette.onAccent && luminance(palette.onAccent) > 0.7 ? palette.onAccent : "#F6F1E8";
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const elements = layout.elements || [];
    const added = [];
    elements.forEach((element) => {
      if (element.type !== "image" && element.type !== "maskedImage") return;
      if (!isFullBleed(element)) return;
      const content = element.imageContent || element.maskedImageContent;
      const url = content && content.url;
      if (!url || String(url).includes("://")) return;
      const file = path.join(ROOT, "generated-templates", url);
      if (!fs.existsSync(file)) return;
      let level = null;
      try {
        level = averageLuminance(file);
      } catch (error) {
        level = null;
      }
      if (level == null || level >= 0.45) return;
      const scrimId = "scrim-" + (element.id || id);
      if (elements.some((item) => item.id === scrimId)) return;
      const photoZ = Number(element.zIndex) || 0;
      const above = elements.map((item) => Number(item.zIndex) || 0).filter((z) => z > photoZ);
      const ceiling = above.length ? Math.min.apply(null, above) : photoZ + 1;
      added.push({
        id: scrimId,
        type: "shape",
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        zIndex: photoZ + (ceiling - photoZ) / 2,
        opacity: 0.4,
        shapeContent: { kind: "rectangle", fill: "#000000" },
      });
      elements.forEach((item) => {
        const node = item.type === "rotated" && item.element ? item.element : item;
        if (!node || node.type !== "text") return;
        const point = elementCenter(item.type === "rotated" ? item : node);
        if (!containsPoint(element, point)) return;
        paintTextColor(node, light, "rgba(0,0,0,0.45)");
      });
      console.log("scrim " + id + " " + element.id);
    });
    if (added.length) layout.elements = elements.concat(added);
  });
}

function layoutIsPhotoHeavy(deck) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  return ids.some((id) => {
    const elements = deck.layouts && deck.layouts[id] && deck.layouts[id].elements;
    return (elements || []).some((element) => (element.type === "image" || element.type === "maskedImage") && isFullBleed(element));
  });
}

function textColor(element) {
  const spans = element.textContent && element.textContent.spans;
  const span = Array.isArray(spans) ? spans.find((item) => item && item.color) : null;
  return (span && span.color) || (element.textStyle && element.textStyle.color) || "#1A1612";
}

function paintTextColor(element, color, shadow) {
  if (element.textStyle) {
    element.textStyle.color = color;
    if (shadow) element.textStyle.shadowColor = shadow;
  }
  const spans = element.textContent && element.textContent.spans;
  if (!Array.isArray(spans)) return;
  spans.forEach((span) => {
    span.color = color;
    if (shadow) span.shadowColor = shadow;
  });
}

function topUnder(elements, element, point) {
  const under = elements.filter((other) => other !== element
    && (Number(other.zIndex) || 0) <= (Number(element.zIndex) || 0)
    && containsPoint(other, point));
  under.sort((a, b) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
  return under[0] || null;
}

function repairChipText(deck) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const elements = (deck.layouts[id] && deck.layouts[id].elements) || [];
    elements.forEach((element) => {
      const text = textBox(element);
      if (!text) return;
      const point = elementCenter(text.box);
      const top = topUnder(elements, text.box, point);
      const fill = solidFill(top);
      if (!/^#[0-9a-f]{6}$/i.test(fill || "")) return;
      if (contrast(textColor(text.node), fill) >= 4.5) return;
      paintTextColor(text.node, readableOn(fill));
    });
  });
}

function guardPhotoText(deck, palette) {
  if (!palette || luminance(palette.bg) < 0.7 || !layoutIsPhotoHeavy(deck)) return;
  const shadow = "rgba(255,255,255,0.8)";
  const ink = "#1A1612";
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const elements = (deck.layouts[id] && deck.layouts[id].elements) || [];
    elements.forEach((element) => {
      if (element.type !== "text") return;
      const point = elementCenter(element);
      const top = topUnder(elements, element, point);
      const fill = solidFill(top);
      if (/^#[0-9a-f]{6}$/i.test(fill || "") && luminance(fill) < 0.35 && contrast(textColor(element), fill) >= 3) return;
      const onPhoto = top && (top.type === "image" || top.type === "maskedImage");
      if (!onPhoto && luminance(textColor(element)) < 0.45) return;
      paintTextColor(element, ink, shadow);
    });
  });
}

async function searchPexels(query, orientation) {
  loadEnv();
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set");
  const url = "https://api.pexels.com/v1/search?per_page=10&orientation=" + orientation + "&query=" + encodeURIComponent(query);
  const response = await fetch(url, { headers: { Authorization: key } });
  if (!response.ok) throw new Error("Pexels search failed (" + response.status + ")");
  const body = await response.json();
  const photos = (body.photos || []).slice(0, 5).map((photo) => ({
    orientation,
    download: (photo.src && (photo.src.large2x || photo.src.large || photo.src.original)) || "",
    photographer: photo.photographer || "",
    page: photo.url || "",
    alt: photo.alt || "",
    width: photo.width,
    height: photo.height,
  })).filter((photo) => photo.download);
  if (!photos.length) throw new Error("Pexels returned no " + orientation + " photo for \"" + query + "\"");
  return photos;
}

async function downloadPhoto(url, file) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Photo download failed (" + response.status + ")");
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  return buffer.length;
}

function nextPhoto(files, counts, wide) {
  const key = wide ? "landscape" : "portrait";
  const pool = files[key];
  const index = counts[key];
  counts[key] += 1;
  return pool[index % pool.length].url;
}

const SLIDE_AREA = 1600 * 900;
const transparencyCache = new Map();

function originalImageFile(url) {
  if (!url || /:\/\//.test(String(url))) return "";
  const file = path.join(ROOT, "generated-templates", String(url).replace(/^\/+/, ""));
  return fs.existsSync(file) ? file : "";
}

function imageHasTransparency(file) {
  if (transparencyCache.has(file)) return transparencyCache.get(file);
  let transparent = false;
  try {
    const image = new Image();
    image.src = fs.readFileSync(file);
    if (image.width && image.height) {
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height).data;
      const stride = Math.max(4, Math.floor(data.length / 4 / 4000)) * 4;
      let seen = 0;
      let clear = 0;
      for (let index = 3; index < data.length; index += stride) {
        seen += 1;
        if (data[index] < 128) clear += 1;
      }
      transparent = seen > 0 && clear / seen >= 0.01;
    }
  } catch (error) {
    transparent = false;
  }
  transparencyCache.set(file, transparent);
  return transparent;
}

function customClip(content) {
  const clip = content && content.clip;
  return Boolean(clip && clip.kind === "path" && clip.d);
}

function imageInk(file) {
  if (inkCache.has(file)) return inkCache.get(file);
  let ink = null;
  try {
    const image = new Image();
    image.src = fs.readFileSync(file);
    if (image.width && image.height) {
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height).data;
      const step = image.width * image.height > 1500000 ? 2 : 1;
      let sampled = 0;
      let opaque = 0;
      for (let y = 0; y < image.height; y += step) {
        const row = y * image.width;
        for (let x = 0; x < image.width; x += step) {
          sampled += 1;
          if (data[(row + x) * 4 + 3] > 16) opaque += 1;
        }
      }
      ink = { opaqueRatio: sampled ? opaque / sampled : 1 };
    }
  } catch (error) {
    ink = null;
  }
  inkCache.set(file, ink);
  return ink;
}

function decorationImage(element, content) {
  if (element && element.forcePhoto) return false;
  if (element && (element.isDecoration === true || element.originalRole === "decoration")) return true;
  const width = Number(element.width) || 0;
  const height = Number(element.height) || 0;
  const small = width > 0 && height > 0 && width * height < SLIDE_AREA * 0.1;
  const file = originalImageFile(content && content.url);
  const transparent = Boolean(file && imageHasTransparency(file));
  if (small || transparent || customClip(content)) {
    element.isDecoration = true;
    if (!element.originalRole) element.originalRole = "decoration";
    return true;
  }
  return false;
}

const assetSizeCache = new Map();
const inkCache = new Map();
const LARGE_PHOTO = SLIDE_AREA * 0.18;

function roundBox(value) {
  return Math.round(value * 100) / 100;
}

function assetPixelSize(url) {
  if (assetSizeCache.has(url)) return assetSizeCache.get(url);
  let size = null;
  try {
    const rel = String(url || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const root = path.resolve(ROOT, "assets", "decorations");
    const file = path.resolve(ROOT, rel);
    const relative = path.relative(root, file);
    if (!relative.startsWith("..") && !path.isAbsolute(relative) && fs.existsSync(file)) {
      const image = new Image();
      image.src = fs.readFileSync(file);
      if (image.width > 0 && image.height > 0) size = { width: image.width, height: image.height };
    }
  } catch (error) {
    size = null;
  }
  assetSizeCache.set(url, size);
  return size;
}

function fitDecorationBox(target, pixels, ink) {
  const width = Number(target.width) || 0;
  const height = Number(target.height) || 0;
  const assetWidth = pixels && Number(pixels.width);
  const assetHeight = pixels && Number(pixels.height);
  if (!(width > 0 && height > 0 && assetWidth > 0 && assetHeight > 0)) return;
  const assetRatio = assetWidth / assetHeight;
  let nextWidth = width;
  let nextHeight = height;
  if (assetRatio > width / height) nextHeight = width / assetRatio;
  else nextWidth = height * assetRatio;
  const ratio = ink && Number(ink.opaqueRatio);
  if (ratio > 0.02 && ratio < 0.98) {
    const fittedArea = nextWidth * nextHeight;
    const inkArea = width * height * ratio;
    if (inkArea > 0 && inkArea < fittedArea) {
      const scale = Math.sqrt(inkArea / fittedArea);
      nextWidth *= scale;
      nextHeight *= scale;
    }
  }
  nextWidth = Math.max(1, nextWidth);
  nextHeight = Math.max(1, nextHeight);
  const x = Number(target.x) || 0;
  const y = Number(target.y) || 0;
  target.x = roundBox(x + (width - nextWidth) / 2);
  target.y = roundBox(y + (height - nextHeight) / 2);
  target.width = roundBox(nextWidth);
  target.height = roundBox(nextHeight);
}

function pictureSlots(deck) {
  const slots = [];
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  function visit(slideId, element) {
    if (!element) return;
    if (element.type === "collage" && element.collageContent && Array.isArray(element.collageContent.cells)) {
      element.collageContent.cells.forEach((cell) => {
        if (!cell) return;
        const area = (Number(cell.width) || 0) * (Number(cell.height) || 0);
        if (area > 0) slots.push({ slideId, element: cell, content: cell, area });
      });
    }
    if ((element.type === "image" || element.type === "maskedImage") && (element.imageContent || element.maskedImageContent)) {
      const content = element.imageContent || element.maskedImageContent;
      const area = (Number(element.width) || 0) * (Number(element.height) || 0);
      if (area > 0) slots.push({ slideId, element, content, area });
    }
    if (element.type === "rotated" && element.element) visit(slideId, element.element);
    if (Array.isArray(element.children)) element.children.forEach((child) => visit(slideId, child));
  }
  ids.forEach((slideId) => {
    const layout = deck.layouts && deck.layouts[slideId];
    if (!layout) return;
    (layout.elements || []).forEach((element) => visit(slideId, element));
  });
  return slots;
}

function countLargePhotoSlides(deck) {
  const slides = new Set();
  pictureSlots(deck).forEach((slot) => {
    if (slot.area >= LARGE_PHOTO && !decorationImage(slot.element, slot.content)) slides.add(slot.slideId);
  });
  return slides.size;
}

function forcePhotoSlides(deck, minimum) {
  const slots = pictureSlots(deck);
  const covered = new Set();
  slots.forEach((slot) => {
    if (slot.area >= LARGE_PHOTO && !decorationImage(slot.element, slot.content)) covered.add(slot.slideId);
  });
  const before = covered.size;
  const bySlide = new Map();
  slots.forEach((slot) => {
    if (covered.has(slot.slideId)) return;
    if (decorationImage(slot.element, slot.content)) return;
    const current = bySlide.get(slot.slideId);
    if (!current || slot.area > current.area) bySlide.set(slot.slideId, slot);
  });
  const ranked = Array.from(bySlide.values()).sort((a, b) => b.area - a.area);
  let added = 0;
  ranked.forEach((slot) => {
    if (covered.size >= minimum) return;
    slot.element.forcePhoto = true;
    covered.add(slot.slideId);
    added += 1;
  });
  console.log("photo slides " + before + (added ? " forced " + added : ""));
  return added;
}

function sameBox(a, b) {
  if (!a || !b) return false;
  return Math.abs((Number(a.x) || 0) - (Number(b.x) || 0)) < 1
    && Math.abs((Number(a.y) || 0) - (Number(b.y) || 0)) < 1
    && Math.abs((Number(a.width) || 0) - (Number(b.width) || 0)) < 1
    && Math.abs((Number(a.height) || 0) - (Number(b.height) || 0)) < 1;
}

function decorationFiles() {
  return [];
}

function minimalistRequest(layoutVibe, subject) {
  if (/^minimalist$/i.test(String(layoutVibe || ""))) return true;
  return /\bminimalist\b/i.test(String(subject || ""));
}

function decorationKind(element, content) {
  const width = Math.abs(Number(element && element.width) || 0);
  const height = Math.abs(Number(element && element.height) || 0);
  if (width > 0 && height > 0 && (width > 5 * height || height > 5 * width)) return "line";
  const clip = content && content.clip;
  if (clip && (clip.kind === "ellipse" || clip.kind === "circle")) return "circle";
  if (width * height >= SLIDE_AREA * 0.25) return "block";
  if (width > 0 && height > 0 && Math.min(width, height) / Math.max(width, height) >= 0.85) return "circle";
  return "open";
}

function assetFits(kind, name) {
  const stem = String(name || "").toLowerCase();
  const has = (word) => stem.indexOf(word) >= 0;
  if (kind === "line") return has("line") || has("grid");
  if (kind === "circle") return has("circle") || has("sphere");
  if (kind === "block") return has("blob") || has("texture");
  return true;
}

function removeDecoration(deck, target) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  function walk(list) {
    if (!Array.isArray(list)) return false;
    for (let index = 0; index < list.length; index += 1) {
      const element = list[index];
      if (!element) continue;
      if (element === target || (element.type === "rotated" && element.element === target)) {
        list.splice(index, 1);
        return true;
      }
      if (element.type === "collage" && element.collageContent && Array.isArray(element.collageContent.cells)) {
        const cellIndex = element.collageContent.cells.indexOf(target);
        if (cellIndex >= 0) {
          element.collageContent.cells.splice(cellIndex, 1);
          return true;
        }
      }
      if (Array.isArray(element.children) && walk(element.children)) return true;
    }
    return false;
  }
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (layout) walk(layout.elements);
  });
}

function assignImages(deck, files, vibe, options) {
  const counts = { landscape: 0, portrait: 0, decorations: 0, removed: 0 };
  forcePhotoSlides(deck, 2);
  void vibe;
  void options;
  console.log("decorations kept from the seed");
  eachElement(deck, (element) => {
    if (element.type === "collage") {
      const cells = element.collageContent && element.collageContent.cells;
      if (!Array.isArray(cells)) return;
      cells.forEach((cell) => {
        if (!cell || !cell.url || String(cell.url).indexOf("assets/decorations/") === 0) return;
        const standIn = { width: cell.width, height: cell.height, isDecoration: cell.isDecoration, originalRole: cell.originalRole, forcePhoto: cell.forcePhoto };
        if (decorationImage(standIn, cell)) return;
        const wide = (Number(cell.width) || 0) >= (Number(cell.height) || 0);
        cell.url = nextPhoto(files, counts, wide);
      });
      return;
    }
    if (element.type !== "image" && element.type !== "maskedImage") return;
    const content = element.imageContent || element.maskedImageContent;
    if (!content || decorationImage(element, content)) return;
    const wide = (Number(element.width) || 0) >= (Number(element.height) || 0);
    content.url = nextPhoto(files, counts, wide);
  });
  return counts;
}

function panelFill(palette, bg) {
  const bgLum = luminance(bg);
  const ranked = [palette.card, palette.surface].filter((hex) => /^#[0-9a-f]{6}$/i.test(hex || "") && luminance(hex) > bgLum + 0.02);
  if (palette.card && ranked.indexOf(palette.card) >= 0) return palette.card;
  ranked.sort((a, b) => luminance(b) - luminance(a));
  return ranked[0] || "";
}

function textBox(element) {
  if (!element) return null;
  if (element.type === "text") return { box: element, node: element };
  if (element.type === "rotated" && element.element && element.element.type === "text") {
    return { box: element, node: element.element };
  }
  return null;
}

function paintOwnedText(element, color) {
  const node = element.type === "rotated" && element.element && element.element.type === "text" ? element.element : element;
  if (!node || node.type !== "text") return;
  if (node.textStyle) node.textStyle.color = color;
  const spans = node.textContent && node.textContent.spans;
  if (Array.isArray(spans)) spans.forEach((span) => { span.color = color; });
}

function textColorOf(element) {
  const node = element.type === "rotated" && element.element && element.element.type === "text" ? element.element : element;
  const spans = node && node.textContent && node.textContent.spans;
  const raw = (spans && spans[0] && spans[0].color) || (node && node.textStyle && node.textStyle.color) || "";
  return /^#[0-9a-f]{6}$/i.test(raw || "") ? raw : "";
}

function liftDarkShapes(deck) {
  const color = (deck.tokens && deck.tokens.color) || {};
  const bg = color.bg || (deck.theme && deck.theme.backgroundColor) || "";
  if (!/^#[0-9a-f]{6}$/i.test(bg) || luminance(bg) >= 0.3) return 0;
  let panel = "";
  if (/^#[0-9a-f]{6}$/i.test(color.card || "") && luminance(color.card) >= 0.3) panel = color.card;
  else if (/^#[0-9a-f]{6}$/i.test(color.surface || "") && luminance(color.surface) >= 0.3) panel = color.surface;
  else {
    panel = /^#[0-9a-f]{6}$/i.test(color.card || "") ? color.card : "#F4F1EC";
    for (let step = 0; step < 6 && luminance(panel) < 0.3; step += 1) panel = mix(panel, "#F4F1EC", 0.5);
  }
  const ink = readableOn(panel);
  let changed = 0;
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const elements = [];
    function visit(list) {
      (list || []).forEach((element) => {
        if (!element) return;
        elements.push(element);
        if (element.type === "rotated" && element.element) visit([element.element]);
        if (Array.isArray(element.children)) visit(element.children);
      });
    }
    visit(layout.elements);
    elements.forEach((element) => {
      const fill = solidFill(element);
      if (!/^#[0-9a-f]{6}$/i.test(fill || "") || isFullBleed(element) || luminance(fill) >= 0.3) return;
      if (element.type === "shape" && element.shapeContent) element.shapeContent.fill = panel;
      else if (element.type === "illustration" && element.illustrationContent) element.illustrationContent.fill = panel;
      else return;
      changed += 1;
      elements.forEach((item) => {
        const text = item.type === "text" || (item.type === "rotated" && item.element && item.element.type === "text");
        if (!text) return;
        const box = item.type === "rotated" ? item : item;
        if (!containsPoint(element, elementCenter(box))) return;
        const current = textColorOf(item);
        if (current && contrast(current, panel) >= 4.5) return;
        paintOwnedText(item, ink);
      });
    });
  });
  if (changed) console.log("lifted " + changed + " dark shapes off the background");
  return changed;
}

function liftDarkTextBackdrops(deck) {
  const palette = deck.tokens && deck.tokens.color;
  if (!palette) return 0;
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  let changed = 0;
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const elements = layout.elements || [];
    const page = elements.find((element) => element.type === "shape" && isFullBleed(element) && /^#[0-9a-f]{6}$/i.test(solidFill(element) || ""));
    const bg = (page && solidFill(page)) || (deck.theme && deck.theme.backgroundColor) || palette.bg;
    if (!bg || luminance(bg) >= 0.4) return;
    const panel = panelFill(palette, bg);
    if (!panel) return;
    elements.forEach((element) => {
      if (element.type !== "shape" || element === page || isFullBleed(element)) return;
      const fill = solidFill(element);
      if (!/^#[0-9a-f]{6}$/i.test(fill || "") || luminance(fill) >= 0.28) return;
      const backsText = elements.some((item) => {
        const text = textBox(item);
        if (!text) return false;
        if ((Number(element.zIndex) || 0) > (Number(text.box.zIndex) || 0)) return false;
        return containsPoint(element, elementCenter(text.box));
      });
      if (!backsText) return;
      element.shapeContent.fill = panel;
      changed += 1;
    });
  });
  if (changed) console.log("lifted " + changed + " dark text panels");
  repairChipText(deck);
  return changed;
}

function renderDeck(deck, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const slides = [];
  (deck.layoutSequence || []).forEach((layoutId, index) => {
    const file = path.join(dir, "slide-" + String(index + 1).padStart(2, "0") + ".png");
    renderSlidePng(deck, layoutId, file);
    slides.push(file);
  });
  return slides;
}

async function themeOnce(options) {
  const subject = String(options.prompt || "").trim();
  let layout = options.layout || "";
  let selection = null;
  if (options.autoLayout) {
    selection = await chooseLayout(subject, options.excludeLayouts, options.knownVibe);
    layout = selection.id;
    console.log("auto-layout " + selection.vibe + " -> " + layout + " " + selection.qualityScore + (selection.repeated ? " (same seed)" : ""));
  }
  const outDir = options.out
    ? path.resolve(ROOT, options.out)
    : path.join(ROOT, "docs", "template-pipeline", "thematic-tests", slug(subject));
  const deck = options.deck ? JSON.parse(JSON.stringify(options.deck)) : loadLayout(layout);
  if (options.deck) layout = layout || deck.id || "remix";
  const seedTokens = JSON.parse(JSON.stringify(deck.tokens || {}));
  const prepared = prepareCopy(deck);
  const strings = prepared.strings;
  const direction = await inventDirection(subject);
  console.log("direction " + direction.profile.brand + " / " + direction.mood + " / " + (direction.keywords.join(" ") || direction.query));
  if (selection) console.log("vibe " + selection.vibe);
  const paletteShift = applyMood(deck, direction.mood, options.forcedBucket);
  if (options.forcedBucket) console.log("palette forced " + paletteShift.bucket);
  else console.log("palette " + paletteShift.mood + " -> " + paletteShift.bucket);
  console.log("rewrite " + strings.length + " strings");
  const rewritten = await rewriteStrings(strings, subject, direction.profile);
  const settled = await settleCopy(strings, rewritten.map, direction.profile);
  const replacements = applyText(deck, settled.accepted, settled.notes, prepared.groups);
  pruneSlideText(deck);
  const query = direction.query;
  console.log("pexels \"" + query + "\"");
  const [landscapeHits, portraitHits] = await Promise.all([
    searchPexels(query, "landscape"),
    searchPexels(query, "portrait"),
  ]);
  const photoSlug = slug(path.basename(outDir));
  const photoDir = path.join(ROOT, "generated-templates", "photos", "thematic", photoSlug);
  fs.rmSync(photoDir, { recursive: true, force: true });
  async function saveSet(hits, prefix) {
    const saved = [];
    for (let index = 0; index < hits.length; index += 1) {
      const name = prefix + "-" + String(index + 1).padStart(2, "0") + ".jpg";
      const bytes = await downloadPhoto(hits[index].download, path.join(photoDir, name));
      saved.push({
        file: "photos/thematic/" + photoSlug + "/" + name,
        url: "photos/thematic/" + photoSlug + "/" + name,
        bytes,
        photographer: hits[index].photographer,
        page: hits[index].page,
        alt: hits[index].alt,
      });
    }
    return saved;
  }
  const landscape = await saveSet(landscapeHits, "landscape");
  const portrait = await saveSet(portraitHits, "portrait");
  const counts = assignImages(deck, { landscape, portrait }, "", {
    layoutVibe: selection ? selection.vibe : "",
    subject,
  });
  scrimBrightPhotos(deck);
  const photoUrl = (landscape[0] && landscape[0].url) || (portrait[0] && portrait[0].url) || "";
  const parametric = applyParametric(deck, {
    prompt: subject,
    density: options.density || "balanced",
    seedTokens,
    title: direction.profile.brand,
    photoUrl,
  });
  console.log("parametric cover " + parametric.coverName + " / density " + parametric.density + " x" + parametric.marginFactor + " / signature " + parametric.signature);
  if (parametric.densityReverted.length) console.log("density reverted slides " + parametric.densityReverted.join(", ") + " after geometry check");
  if (parametric.textOverlaps.length) console.log("text overlap remains on slides " + parametric.textOverlaps.join(", "));
  const brand = direction.profile.brand;
  deck.name = brand + ": " + subject;
  deck.id = slug(brand);
  deck.description = "Themed for " + subject;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  const report = {
    prompt: subject,
    layout,
    parametric,
    vibe: selection ? selection.vibe : "",
    autoLayout: Boolean(options.autoLayout),
    model: [direction.model, rewritten.model, settled.model].filter(Boolean).join("+"),
    profile: direction.profile,
    mood: paletteShift,
    photoKeywords: direction.keywords,
    photoQuery: query,
    photos: {
      landscape: landscape.map((photo) => ({
        file: photo.file,
        bytes: photo.bytes,
        photographer: photo.photographer,
        page: photo.page,
        alt: photo.alt,
      })),
      portrait: portrait.map((photo) => ({
        file: photo.file,
        bytes: photo.bytes,
        photographer: photo.photographer,
        page: photo.page,
        alt: photo.alt,
      })),
      landscapeSlots: counts.landscape,
      portraitSlots: counts.portrait,
      decorations: counts.decorations,
    },
    replacements,
    missed: replacements.filter((item) => !item.replaced && !item.rejected).length,
    rejected: replacements.filter((item) => item.rejected).length,
  };
  fs.writeFileSync(path.join(outDir, "replacements.json"), JSON.stringify(report, null, 2) + "\n");
  if (fs.existsSync(outDir)) {
    fs.readdirSync(outDir).filter((name) => /^slide-\d{2}\.png$/.test(name)).forEach((name) => fs.rmSync(path.join(outDir, name)));
  }
  console.log("render " + (deck.layoutSequence || []).length + " slides");
  const slides = renderDeck(deck, outDir);
  console.log("wrote " + path.relative(ROOT, outDir) + " (" + replacements.filter((item) => item.replaced).length + " strings, " + (counts.landscape + counts.portrait) + " images, " + counts.removed + " decorations removed)");
  return { outDir, slides, report, layout, name: deck.name, deckId: deck.id, selection };
}

const QA_SCORE = 80;
const QA_TRIES = 3;
const PALETTE_BUCKETS = ["light-neutral", "light-warm", "dark-neutral"];

async function injectTheme(options) {
  const settings = options || {};
  if (settings.qa === false) return themeOnce(settings);
  const exclude = [];
  const usedBuckets = [];
  let knownVibe = null;
  let lastScore = 0;
  let lastDir = "";
  for (let attempt = 1; attempt <= QA_TRIES; attempt += 1) {
    const forcedBucket = attempt === 1
      ? (settings.forcedBucket || "")
      : (PALETTE_BUCKETS.find((bucket) => usedBuckets.indexOf(bucket) < 0) || PALETTE_BUCKETS[0]);
    let result;
    try {
      result = await themeOnce(Object.assign({}, settings, {
        excludeLayouts: exclude.slice(),
        knownVibe,
        forcedBucket,
      }));
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      if (/No enabled /.test(message)) throw error;
      if (attempt === QA_TRIES) throw error;
      console.log("qa retry " + attempt + " after " + message);
      continue;
    }
    lastDir = result.outDir;
    if (result.selection) knownVibe = { vibe: result.selection.vibe, model: result.selection.model };
    const generated = JSON.parse(fs.readFileSync(path.join(result.outDir, "deck.json"), "utf8"));
    const analysis = await analyzeDeck(generated, result.slides || []);
    lastScore = analysis.score;
    const summary = {
      score: analysis.score,
      passed: analysis.passed,
      total: analysis.total,
      failures: analysis.failures,
      attempt,
    };
    result.analysis = summary;
    result.report.analysis = summary;
    generated.qa = summary;
    fs.writeFileSync(path.join(result.outDir, "deck.json"), JSON.stringify(generated, null, 2) + "\n");
    fs.writeFileSync(path.join(result.outDir, "replacements.json"), JSON.stringify(result.report, null, 2) + "\n");
    console.log("qa score " + analysis.score + " attempt " + attempt + " (" + analysis.passed + "/" + analysis.total + ")");
    if (analysis.score >= QA_SCORE) return result;
    if (attempt === QA_TRIES) break;
    console.log("qa retry " + attempt + " below " + QA_SCORE);
    if (result.layout && result.layout !== "assembled" && result.layout.indexOf("+") < 0) exclude.push(result.layout);
    const bucket = result.report && result.report.mood && result.report.mood.bucket;
    if (bucket && usedBuckets.indexOf(bucket) < 0) usedBuckets.push(bucket);
  }
  if (lastDir) fs.rmSync(lastDir, { recursive: true, force: true });
  throw new Error("No deck scored " + QA_SCORE + " or above (last score " + lastScore + ")");
}

if (require.main === module) {
  injectTheme(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { injectTheme, askModel, classifyVibe, photoQuery, collectStrings, chooseLayout, splitsContiguousWord, splitProportional, liftDarkTextBackdrops, liftDarkShapes, fitDecorationBox, getAvailableVibes, settleAssetVibe, parseAssetVibe, steerAssetVibe, countLargePhotoSlides, forcePhotoSlides, photographicSubject, decorationKind, assetFits, assignImages, minimalistRequest, removeDecoration, subjectAssetVibe, pruneSlideText };
