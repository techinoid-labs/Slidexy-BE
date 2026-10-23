/**
 * Build a 10-slide deck from the native archetypes. No PPTX seed is loaded.
 * The library holds 11 roles. This deck uses 10 and leaves Next on disk.
 *
 *   node services/templatePipeline/thematic-native.js --prompt "Corporate Payroll" --out docs/template-pipeline/native/corporate-payroll-10
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { askModel, searchPexels, downloadPhoto } = require("./thematic");
const { renderNativeDeck } = require("../../scripts/slideSvg");
const { exportDeckPptx } = require("./catalog");
const { checkGeometry } = require("./scoring/analyzeDeck");
const { measureWidth } = require("./fitText");

const ROOT = path.join(__dirname, "..", "..");
const NATIVE = path.join(ROOT, "app-library", "native");
const LIBRARY = ["cover", "contents", "about", "problem", "solution", "proof", "market", "model", "people", "next", "close"];
const DECK = ["cover", "contents", "about", "problem", "solution", "proof", "market", "model", "people", "close"];
const FILES = {
  cover: "native-cover.json",
  contents: "native-contents.json",
  about: "native-about.json",
  problem: "native-problem.json",
  solution: "native-solution.json",
  proof: "native-proof.json",
  market: "native-market.json",
  model: "native-model.json",
  people: "native-people.json",
  next: "native-next.json",
  close: "native-close.json",
  split: "native-split.json",
  data: "native-data.json",
};

const NICHES = ["corporate", "elegant", "gradient", "infographic", "cartoon"];
const NICHE_DIR = path.join(ROOT, "app-library", "niches");

function parseArgs(argv) {
  const args = { prompt: "", out: "", creative: false, niche: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--prompt") args.prompt = argv[++index] || "";
    else if (arg.startsWith("--prompt=")) args.prompt = arg.slice("--prompt=".length);
    else if (arg === "--out") args.out = argv[++index] || "";
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else if (arg === "--creative") args.creative = true;
    else if (arg === "--niche") args.niche = argv[++index] || "";
    else if (arg.startsWith("--niche=")) args.niche = arg.slice("--niche=".length);
    else throw new Error("Unknown argument " + arg);
  }
  if (!args.prompt) throw new Error("Pass --prompt \"Corporate Payroll\"");
  return args;
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "native";
}

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function clean(text) {
  return String(text || "")
    .replace(/\u2014|\u2013/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

const DANGLING = new Set(["a", "an", "the", "of", "and", "or", "to", "for", "with", "by", "in", "on", "at", "from", "all"]);

function trimTail(text) {
  let list = words(text);
  while (list.length > 1 && DANGLING.has(list[list.length - 1].toLowerCase().replace(/[^a-z]/g, ""))) {
    list = list.slice(0, -1);
  }
  return list.join(" ");
}

function clipWords(text, max) {
  const value = clean(text).replace(/^["'`]+|["'`]+$/g, "").replace(/\.+$/, "");
  return words(value).slice(0, max).join(" ");
}

function phrase(value, max, fallback) {
  return trimTail(clipWords(value, max)) || fallback;
}

function asLine(item) {
  if (item == null) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") return item.text || item.line || item.phrase || item.bullet || item.title || "";
  return String(item);
}

function listFrom(slide, keys) {
  const source = slide || {};
  for (let index = 0; index < keys.length; index += 1) {
    const value = source[keys[index]];
    if (Array.isArray(value) && value.length) return value.map(asLine);
  }
  return [];
}

function phrases(list, count, maxEach, fallbacks) {
  const source = Array.isArray(list) ? list : [];
  return Array.from({ length: count }, (_, index) => phrase(source[index], maxEach, fallbacks[index]));
}

function aboutSubject(subject) {
  return /\b(payroll|office|finance|saas|corporate|accounting)\b/i.test(subject || "");
}

function relevantQuery(subject, hint, kind) {
  const generic = /\b(office|desk|headshot|meeting|corporate team)\b/i.test(hint || "");
  if (generic && !aboutSubject(subject)) return kind === "people" ? subject + " portrait" : subject;
  return hint || subject;
}

function fitList(list, max) {
  let guard = 0;
  while (words(list.join(" ")).length > max && guard < 80) {
    guard += 1;
    let index = list.length - 1;
    while (index > 0 && words(list[index]).length <= 1) index -= 1;
    const trimmed = words(list[index]).slice(0, -1).join(" ");
    if (!trimmed) break;
    list[index] = trimTail(trimmed);
  }
  return list.map((item) => trimTail(item) || item);
}

function triples(source, fallbacks, titleMax, lineMax) {
  const list = Array.isArray(source) ? source : [];
  return fallbacks.map((fallback, index) => {
    const item = list[index] || {};
    return {
      title: phrase(item.title, titleMax, fallback.title),
      line: phrase(item.line, lineMax, fallback.line),
    };
  });
}

function loadArchetype(name, style) {
  const base = FILES[name];
  if (!base) throw new Error("Unknown native layout " + name);
  const creative = path.join(NATIVE, "creative", base);
  const file = style === "creative" && fs.existsSync(creative) ? creative : path.join(NATIVE, base);
  const body = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!body.layout || !Array.isArray(body.layout.elements)) throw new Error("Native layout is missing elements: " + name);
  return body;
}

function nightSubject(subject) {
  return /\b(creative|tech|technology|software|startup|ai|digital|fashion|apparel|beauty|art|music|studio|magazine|editorial)\b/i.test(subject || "");
}

function styleOf(raw, subject) {
  const named = String(raw && (raw.style || raw.layoutStyle || raw.theme) || "").toLowerCase();
  if (/creative|editorial/.test(named)) return "creative";
  if (/corporate|structured/.test(named)) return "corporate";
  if (/\b(fashion|apparel|beauty|cuisine|food|travel|hotel|music|art|studio|magazine|wedding|lifestyle|photography)\b/i.test(subject || "")) return "creative";
  return "corporate";
}

function parseJson(raw) {
  const fenced = String(raw || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(raw || "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return JSON");
  return JSON.parse(body.slice(start, end + 1));
}

function orderOf(value) {
  const list = Array.isArray(value) ? value.map((item) => String(item || "").toLowerCase()) : [];
  const picked = [];
  list.forEach((item) => {
    if (DECK.indexOf(item) >= 0 && picked.indexOf(item) < 0) picked.push(item);
  });
  DECK.forEach((item) => {
    if (picked.indexOf(item) < 0) picked.push(item);
  });
  return picked;
}

function settleCopy(raw, subject) {
  const slides = raw && raw.slides ? raw.slides : {};
  const topic = phrase(subject, 4, "this work");
  const cover = slides.cover || {};
  const contents = slides.contents || {};
  const about = slides.about || {};
  const problem = slides.problem || {};
  const solution = slides.solution || {};
  const proof = slides.proof || {};
  const market = slides.market || {};
  const model = slides.model || {};
  const people = slides.people || {};
  const close = slides.close || {};
  const copy = {
    brand: phrase(raw && raw.brand, 4, "Northline"),
    photoQuery: phrase(raw && raw.photoQuery, 6, "modern office team"),
    peopleQuery: phrase(raw && raw.peopleQuery, 6, "professional headshot"),
    cover: {
      title: phrase(cover.title, 6, "Pay, on time"),
      subtitle: phrase(cover.subtitle, 10, "Payroll for growing teams"),
    },
    contents: {
      title: phrase(contents.title, 4, "Agenda"),
      items: phrases(contents.items, 8, 3, ["The firm", "The problem", "The offer", "The proof", "The market", "The model", "The people", "The close"]),
    },
    about: {
      title: phrase(about.title, 6, "Who we are"),
      leftTitle: phrase(about.leftTitle, 4, "The firm"),
      leftBody: phrase(about.leftBody, 14, "What " + topic + " makes and who it is for"),
      rightTitle: phrase(about.rightTitle, 4, "The work"),
      rightBody: phrase(about.rightBody, 14, "How " + topic + " is made and delivered"),
    },
    problem: {
      title: phrase(problem.title, 6, "The hard part"),
      bullets: phrases(listFrom(problem, ["bullets", "points", "items", "lines", "phrases"]), 3, 8, ["The old way wastes time", "The cost is hard to see", "Buyers have a better option"]),
    },
    solution: {
      title: phrase(solution.title, 6, "What we run"),
      columns: triples(solution.columns, [
        { title: "Make", line: "Built for " + topic },
        { title: "Sell", line: "Reached through the right channel" },
        { title: "Keep", line: "Customers stay because it lasts" },
      ], 3, 8),
    },
    proof: {
      stat: phrase(proof.stat, 3, "2x"),
      quote: phrase(proof.quote, 12, topic + " is the reason customers switch"),
      source: phrase(proof.source, 4, "Customer notes"),
    },
    market: {
      title: phrase(market.title, 6, "Who it is for"),
      bullets: phrases(listFrom(market, ["bullets", "points", "items", "lines", "phrases"]), 3, 8, ["People who want " + topic, "Buyers comparing the old option", "A market ready to switch"]),
    },
    model: {
      title: phrase(model.title, 6, "How it works"),
      steps: triples(model.steps, [
        { title: "Make", line: "The product is prepared" },
        { title: "Offer", line: "Customers find " + topic },
        { title: "Repeat", line: "They come back for the next one" },
      ], 3, 8),
    },
    people: {
      title: phrase(people.title, 4, "The team"),
      members: (Array.isArray(people.members) ? people.members : []).concat([{}, {}, {}, {}]).slice(0, 4).map((item, index) => {
        const fallback = [
          { name: "Amina Shah", role: "Director" },
          { name: "Leo Park", role: "Design lead" },
          { name: "Nora Ellis", role: "Client partner" },
          { name: "Samir Cole", role: "Operations" },
        ][index];
        return {
          name: phrase(item.name, 3, fallback.name),
          role: phrase(item.role, 3, fallback.role),
        };
      }),
    },
    close: {
      title: phrase(close.title, 3, "Thank you"),
      lines: phrases(close.lines, 3, 6, ["hello@northline.com", "northline.com", "New York"]),
    },
  };
  copy.contents.items = fitList(copy.contents.items, 25);
  const aboutBodies = fitList([copy.about.leftBody, copy.about.rightBody], 25);
  copy.about.leftBody = aboutBodies[0];
  copy.about.rightBody = aboutBodies[1];
  copy.problem.bullets = fitList(copy.problem.bullets, 25);
  const solutionLines = fitList(copy.solution.columns.map((entry) => entry.line), 25);
  copy.solution.columns.forEach((item, index) => { item.line = solutionLines[index]; });
  copy.market.bullets = fitList(copy.market.bullets, 25);
  const modelLines = fitList(copy.model.steps.map((entry) => entry.line), 25);
  copy.model.steps.forEach((item, index) => { item.line = modelLines[index]; });
  return copy;
}

function promptFor(subject) {
  return [
    "You are writing a 10-slide deck for: " + subject,
    "Every line must be about that subject. Do not mention payroll, tax, or an office unless the subject is a payroll or office business.",
    "Return one JSON object and nothing else.",
    "style: corporate or creative. Choose corporate for a structured business such as payroll, finance, software, legal, or operations. Choose creative for fashion, food, travel, art, beauty, or any editorial brand. The value is exactly corporate or exactly creative.",
    "niche: exactly one of corporate, elegant, gradient, infographic, cartoon. corporate for operations and finance. elegant for luxury, law, jewelry, and weddings. gradient for apps, startups, and technology. infographic for research, data, and statistics. cartoon for children, games, and playful products.",
    "order: a permutation of cover, contents, about, problem, solution, proof, market, model, people, close. Use each once. Do not add a slide.",
    "brand: two or three words, no em dash.",
    "photoQuery: three or four words for a wide photograph of the subject itself. A fashion brand needs clothing or a studio, not an office. No text in the picture.",
    "peopleQuery: three or four words for a portrait of one person who works in this field. No text in the picture.",
    "slides.cover.title: exactly two words, each at most 11 letters. It is set at 200px, one word on each line. slides.cover.subtitle: up to 10 words.",
    "slides.contents.title: up to 3 words. slides.contents.items: exactly 8 short phrases, no final period, together at most 25 words.",
    "slides.about.title: up to 6 words. leftTitle and rightTitle: up to 4 words. leftBody and rightBody together at most 25 words.",
    "slides.problem.title: up to 6 words. bullets: exactly 3 phrases, no final period, together at most 25 words.",
    "slides.solution.title: up to 6 words. columns: exactly 3 objects with title up to 3 words and line up to 8 words. The three lines together stay at or under 25 words.",
    "slides.proof.stat: a short figure such as 99.9% or 48 hrs. quote: up to 12 words, no quotation marks. source: up to 4 words.",
    "slides.market.title: up to 6 words. slides.market.bullets: exactly 3 phrases about who buys this. The key must be bullets.",
    "slides.model.title: up to 6 words. steps: exactly 3 objects with title and line, same limits as solution columns.",
    "slides.people.title: up to 3 words. members: exactly 4 objects with name and role.",
    "slides.close.title: Thank you, or two words. lines: an email, a website, and a city.",
    "No em dashes. No exclamation marks. Bullets are phrases with no final period. Do not mention slides, templates, or design.",
  ].join("\n");
}

function setText(layout, id, value) {
  const element = (layout.elements || []).find((item) => item && item.id === id);
  if (!element || !element.textContent || !Array.isArray(element.textContent.spans) || !element.textContent.spans[0]) {
    throw new Error("Missing text box " + id);
  }
  element.textContent.spans[0].text = value;
}

function setPhoto(layout, id, url) {
  const element = (layout.elements || []).find((item) => item && item.id === id);
  if (!element || element.type !== "image") throw new Error("Missing photo " + id);
  element.imageContent = Object.assign({}, element.imageContent, { url, fit: "cover", alignX: 0.5, alignY: 0.5 });
}

function setPhotoIf(layout, id, url) {
  const element = (layout.elements || []).find((item) => item && item.id === id);
  if (!element || element.type !== "image" || !url) return;
  element.imageContent = Object.assign({}, element.imageContent, { url, fit: "cover", alignX: 0.5, alignY: 0.5 });
}

function coverLines(title) {
  const parts = String(title || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [parts[0] || "", ""];
  if (parts.length === 2) return parts;
  const limits = [1360, 1440];
  const lines = [[], []];
  let line = 0;
  parts.forEach((word) => {
    const trial = lines[line].concat(word).join(" ");
    if (line === 0 && lines[0].length && measureWidth("Poppins Bold", trial, 200) > limits[0]) line = 1;
    if (line === 1 && lines[1].length && measureWidth("Poppins Bold", lines[1].concat(word).join(" "), 200) > limits[1]) return;
    lines[line].push(word);
  });
  return [lines[0].join(" "), lines[1].join(" ")];
}

function applyCopy(layout, name, copy) {
  if (name === "cover") {
    const lines = coverLines(copy.cover.title);
    setText(layout, "native-cover-title", lines[0]);
    setText(layout, "native-cover-title-line", lines[1]);
    setText(layout, "native-cover-subtitle", copy.cover.subtitle);
    return;
  }
  if (name === "contents") {
    setText(layout, "native-contents-title", copy.contents.title);
    copy.contents.items.forEach((item, index) => setText(layout, "native-contents-item-" + (index + 1), item));
    return;
  }
  if (name === "about") {
    setText(layout, "native-about-title", copy.about.title);
    setText(layout, "native-about-left-title", copy.about.leftTitle);
    setText(layout, "native-about-left-body", copy.about.leftBody);
    setText(layout, "native-about-right-title", copy.about.rightTitle);
    setText(layout, "native-about-right-body", copy.about.rightBody);
    return;
  }
  if (name === "problem") {
    setText(layout, "native-problem-title", copy.problem.title);
    copy.problem.bullets.forEach((bullet, index) => setText(layout, "native-problem-bullet-" + (index + 1), bullet));
    return;
  }
  if (name === "solution") {
    setText(layout, "native-solution-title", copy.solution.title);
    copy.solution.columns.forEach((item, index) => {
      setText(layout, "native-solution-title-" + (index + 1), item.title);
      setText(layout, "native-solution-line-" + (index + 1), item.line);
    });
    return;
  }
  if (name === "proof") {
    setText(layout, "native-proof-stat", copy.proof.stat);
    setText(layout, "native-proof-quote", copy.proof.quote);
    setText(layout, "native-proof-source", copy.proof.source);
    return;
  }
  if (name === "market") {
    setText(layout, "native-market-title", copy.market.title);
    copy.market.bullets.forEach((bullet, index) => setText(layout, "native-market-bullet-" + (index + 1), bullet));
    return;
  }
  if (name === "model") {
    setText(layout, "native-model-title", copy.model.title);
    copy.model.steps.forEach((item, index) => {
      setText(layout, "native-model-title-" + (index + 1), item.title);
      setText(layout, "native-model-line-" + (index + 1), item.line);
    });
    return;
  }
  if (name === "people") {
    setText(layout, "native-people-title", copy.people.title);
    copy.people.members.forEach((item, index) => {
      setText(layout, "native-people-name-" + (index + 1), item.name);
      setText(layout, "native-people-role-" + (index + 1), item.role);
    });
    return;
  }
  setText(layout, "native-close-title", copy.close.title);
  copy.close.lines.forEach((line, index) => setText(layout, "native-close-line-" + (index + 1), line));
}

function assignPhotos(layout, name, photos) {
  if (!photos) return;
  if (name === "problem") setPhoto(layout, "native-problem-photo", photos.problem);
  if (name === "market") setPhoto(layout, "native-market-photo", photos.market);
  if (name === "people" && photos.people) photos.people.forEach((url, index) => setPhoto(layout, "native-people-photo-" + (index + 1), url));
  ["cover", "contents", "about", "solution", "proof", "model", "close"].forEach((role) => {
    if (name === role) setPhotoIf(layout, "native-" + role + "-photo", photos[role]);
  });
}

const NIGHT = "#111111";
const WHITE = "#FFFFFF";
const NEON = "#00FF88";
const NIGHT_MUTED = "#C6C6C6";

function findEl(layout, id) {
  return (layout.elements || []).find((item) => item && item.id === id);
}

function setBox(element, x, y, width, height) {
  element.x = x;
  element.y = y;
  element.width = width;
  element.height = height;
}

function setType(element, size, weight, family, color) {
  element.textStyle.fontFamily = family;
  element.textStyle.fontSize = size;
  element.textStyle.fontWeight = weight;
  element.textStyle.lineHeight = 0.9;
  if (color) element.textStyle.color = color;
  const span = element.textContent.spans[0];
  span.fontFamily = family;
  span.fontSize = size;
  span.fontWeight = weight;
  if (color) span.color = color;
}

function readText(element) {
  return element && element.textContent && element.textContent.spans[0] ? String(element.textContent.spans[0].text || "") : "";
}

function writeText(element, value) {
  element.textContent.spans[0].text = value;
}

function splitHead(text) {
  const parts = String(text || "").trim().split(/\s+/).filter(Boolean);
  return [parts[0] || "", parts.slice(1).join(" ")];
}

function ensureLine(layout, id, fromId) {
  const existing = findEl(layout, id);
  if (existing) return existing;
  const from = findEl(layout, fromId);
  const line = JSON.parse(JSON.stringify(from));
  line.id = id;
  layout.elements.push(line);
  return line;
}

function placeCircle(layout, fill) {
  let arc = findEl(layout, "native-signature");
  if (!arc) {
    arc = {
      id: "native-signature",
      type: "shape",
      zIndex: 5,
      shapeContent: { kind: "circle", fill, cornerRadius: 0 },
    };
    layout.elements.push(arc);
  }
  setBox(arc, 1316, -180, 600, 600);
  arc.zIndex = 5;
  arc.opacity = 0.1;
  arc.shapeContent.kind = "circle";
  arc.shapeContent.fill = fill;
  arc.shapeContent.cornerRadius = 0;
}

function trackLabel(element) {
  if (!element || element.type !== "text") return;
  if (!/role|source/.test(element.id || "")) return;
  const span = element.textContent.spans[0];
  span.text = String(span.text || "").toUpperCase();
  element.textStyle.letterSpacing = 2;
  span.letterSpacing = 2;
}

function paintNight(layout) {
  (layout.elements || []).forEach((element) => {
    if (element.type === "shape") {
      const fill = element.shapeContent && element.shapeContent.fill;
      if (element.id === "native-signature") return;
      if ((element.id || "").endsWith("-field")) element.shapeContent.fill = NIGHT;
      else if (fill === "#163A5F") element.shapeContent.fill = NEON;
      else if (fill === "#F3F1EC" || fill === "#FFFFFF") element.shapeContent.fill = "#161616";
      else if (fill === "#1A2332") element.shapeContent.fill = "#000000";
      return;
    }
    if (element.type !== "text") return;
    const span = element.textContent.spans[0];
    const id = element.id || "";
    const color = /num-|stat/.test(id) ? NEON : /role|source/.test(id) ? NIGHT_MUTED : WHITE;
    span.color = color;
    element.textStyle.color = color;
  });
}

function dramatize(layout, name, night) {
  const accent = night ? NEON : "#163A5F";
  const onPhoto = night ? WHITE : "#F3F1EC";
  placeCircle(layout, accent);
  if (name === "cover") {
    const title = findEl(layout, "native-cover-title");
    const line = ensureLine(layout, "native-cover-title-line", "native-cover-title");
    const [first, rest] = splitHead([readText(title), readText(line)].filter(Boolean).join(" "));
    writeText(title, first);
    writeText(line, rest);
    setBox(title, 56, 250, 1460, 280);
    setBox(line, 56, 540, 1400, 140);
    setType(title, 180, 900, "Poppins Bold", onPhoto);
    setType(line, 80, 300, "Open Sauce Light", onPhoto);
    const scrim = findEl(layout, "native-cover-scrim");
    if (scrim) setBox(scrim, 0, 220, 1600, 680);
    const subtitle = findEl(layout, "native-cover-subtitle");
    if (subtitle) setBox(subtitle, 56, 760, 1100, 56);
  }
  if (name === "problem") {
    const photo = findEl(layout, "native-problem-photo");
    if (photo) setBox(photo, -100, -100, 1800, 1100);
    const title = findEl(layout, "native-problem-title");
    const line = ensureLine(layout, "native-problem-title-line", "native-problem-title");
    const [first, rest] = splitHead(readText(title));
    writeText(title, first);
    writeText(line, rest);
    setBox(title, 64, 64, 1200, 280);
    setBox(line, 64, 352, 1100, 130);
    setType(title, 180, 900, "Poppins Bold", onPhoto);
    setType(line, 80, 300, "Open Sauce Light", onPhoto);
    ["native-problem-bullet-1", "native-problem-bullet-2", "native-problem-bullet-3"].forEach((id, index) => {
      const bullet = findEl(layout, id);
      if (bullet) setBox(bullet, 64, 520 + index * 72, 860, 60);
    });
    const scrim = findEl(layout, "native-problem-scrim");
    if (scrim) setBox(scrim, 0, 0, 1000, 900);
  }
  (layout.elements || []).forEach(trackLabel);
  if (night) paintNight(layout);
}

function guessNiche(subject) {
  const text = String(subject || "").toLowerCase();
  if (/kid|child|playful|cartoon|toy|game/.test(text)) return "cartoon";
  if (/luxury|law|legal|jewelry|wedding|spa|boutique|couture/.test(text)) return "elegant";
  if (/infographic|statistic|survey|research|census/.test(text)) return "infographic";
  if (/app|startup|software|saas|digital|tech/.test(text)) return "gradient";
  return "corporate";
}

function nicheName(value, parsed, subject) {
  const named = String(value || "").trim().toLowerCase();
  if (named === "abstract") return "cartoon";
  if (NICHES.indexOf(named) >= 0) return named;
  const fromModel = String(parsed && (parsed.niche || parsed.vibe) || "").trim().toLowerCase();
  if (NICHES.indexOf(fromModel) >= 0) return fromModel;
  return guessNiche(subject);
}

function loadNiche(name) {
  const file = path.join(NICHE_DIR, name + ".json");
  if (!fs.existsSync(file)) throw new Error("Unknown niche " + name);
  const niche = JSON.parse(fs.readFileSync(file, "utf8"));
  niche.id = niche.id || name;
  return niche;
}

function paintTextNiche(element, niche) {
  const style = element.textStyle || {};
  const id = String(element.id || "");
  const size = Number(style.fontSize) || 0;
  const weight = Number(style.fontWeight) || 0;
  const display = size >= 48 || weight >= 700;
  const family = display ? niche.fonts.display : niche.fonts.text;
  const color = /stat|num-/.test(id) ? niche.colors.accent
    : /role|source/.test(id) ? niche.colors.muted
    : niche.colors.ink;
  style.fontFamily = family;
  style.color = color;
  element.textStyle = style;
  const spans = (element.textContent && element.textContent.spans) || [];
  spans.forEach((span) => {
    const spanSize = Number(span.fontSize) || size;
    const spanWeight = Number(span.fontWeight) || weight;
    const spanDisplay = spanSize >= 48 || spanWeight >= 700;
    span.fontFamily = spanDisplay ? niche.fonts.display : niche.fonts.text;
    span.color = color;
  });
}

function paintShapeNiche(element, niche) {
  const shape = element.shapeContent || {};
  element.shapeContent = shape;
  const id = String(element.id || "");
  const full = Number(element.width) >= 1500 && Number(element.height) >= 800;
  const circle = shape.kind === "circle" || shape.kind === "ellipse";
  const rule = Math.min(Number(element.width) || 0, Number(element.height) || 0) <= 8;
  if (id.indexOf("field") >= 0 || full) {
    shape.fill = niche.colors.bg;
    shape.cornerRadius = 0;
    shape.strokeWidth = 0;
    if (niche.gradient && Array.isArray(niche.gradient.stops) && niche.gradient.stops.length > 1) {
      shape.gradient = niche.gradient;
      shape.fill = niche.gradient.stops[0].hex;
    } else delete shape.gradient;
    return;
  }
  delete shape.gradient;
  if (circle || id.indexOf("signature") >= 0) {
    shape.fill = niche.colors.signature || niche.colors.accent;
    return;
  }
  if (rule) {
    shape.fill = niche.colors.signature || niche.colors.accent;
    shape.cornerRadius = 0;
    shape.strokeWidth = 0;
    if (Number(niche.strokeWidth) > 0 && Number(element.width) > Number(element.height)) {
      element.height = Number(niche.strokeWidth);
    }
    return;
  }
  shape.fill = niche.colors.card || niche.colors.surface || niche.colors.bg;
  shape.cornerRadius = Number(niche.cornerRadius) || 0;
  if (Number(niche.strokeWidth) > 0) {
    shape.stroke = niche.stroke || niche.colors.signature || niche.colors.accent;
    shape.strokeWidth = Number(niche.strokeWidth);
  } else shape.strokeWidth = 0;
}

function inkBox(element) {
  const style = element.textStyle || {};
  const span = element.textContent && element.textContent.spans && element.textContent.spans[0];
  const text = span ? String(span.text || "") : "";
  const size = Number(style.fontSize) || Number(span && span.fontSize) || 28;
  const family = style.fontFamily || (span && span.fontFamily) || "Poppins";
  let width = Number(element.width) || 0;
  try {
    width = Math.min(width, measureWidth(family, text, size));
  } catch (error) {
    width = Number(element.width) || 0;
  }
  let x = Number(element.x) || 0;
  const align = style.textAlign || "left";
  if (align === "center") x += ((Number(element.width) || 0) - width) / 2;
  if (align === "right") x += (Number(element.width) || 0) - width;
  return { x, y: Number(element.y) || 0, w: Math.max(0, width), h: Math.min(Number(element.height) || size, size * 1.35) };
}

function boxesHit(a, b) {
  const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return width * height > 0;
}

function stickerFiles(folder) {
  const dir = path.resolve(ROOT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => /\.png$/i.test(name))
    .sort()
    .slice(0, 2)
    .map((name) => String(folder).replace(/\\/g, "/").replace(/\/$/, "") + "/" + name);
}

function placeStickers(layout, niche) {
  const folder = (niche.assets && niche.assets.folder)
    || ((niche.id === "cartoon" || niche.id === "abstract") ? "assets/decorations/creative" : "");
  if (!folder) return 0;
  const files = stickerFiles(folder);
  if (!files.length) return 0;
  const slots = (niche.assets && niche.assets.slots) || [
    { x: 1448, y: 742, w: 136, h: 136 },
    { x: 24, y: 720, w: 150, h: 150 },
  ];
  const inks = (layout.elements || []).filter((element) => element && element.type === "text").map(inkBox);
  let placed = 0;
  slots.forEach((slot) => {
    if (placed >= files.length) return;
    const box = { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    if (inks.some((ink) => boxesHit(box, ink))) return;
    layout.elements.push({
      id: "native-sticker-" + (placed + 1),
      type: "image",
      x: slot.x,
      y: slot.y,
      width: slot.w,
      height: slot.h,
      zIndex: 3,
      imageContent: { url: files[placed], fit: "contain", alignX: 0.5, alignY: 0.5 },
    });
    placed += 1;
  });
  return placed;
}

function addBars(layout, niche, copy) {
  if (!niche.charts || !layout || layout.id !== "native-proof") return;
  const stat = (layout.elements || []).find((element) => element && element.id === "native-proof-stat");
  if (stat) stat.width = Math.min(Number(stat.width) || 800, 800);
  const labels = ((copy && copy.solution && copy.solution.columns) || []).map((entry) => words(entry && entry.title).slice(0, 2).join(" "));
  while (labels.length < 3) labels.push(["Now", "Next", "Later"][labels.length]);
  const ratios = [0.92, 0.68, 0.46];
  const fills = [niche.colors.accent, niche.colors.accent2, niche.colors.accent];
  const radius = Number(niche.cornerRadius) || 0;
  ratios.forEach((ratio, index) => {
    const y = 300 + index * 96;
    const width = Math.round(460 * ratio);
    layout.elements.push({
      id: "native-proof-track-" + (index + 1),
      type: "shape",
      x: 960,
      y,
      width: 460,
      height: 28,
      zIndex: 3,
      shapeContent: { kind: "rect", fill: niche.colors.rule, cornerRadius: radius },
    });
    layout.elements.push({
      id: "native-proof-bar-" + (index + 1),
      type: "shape",
      x: 960,
      y,
      width,
      height: 28,
      zIndex: 4,
      shapeContent: { kind: "rect", fill: fills[index], cornerRadius: radius },
    });
    layout.elements.push({
      id: "native-proof-bar-label-" + (index + 1),
      type: "text",
      x: 960,
      y: y + 32,
      width: 460,
      height: 28,
      zIndex: 6,
      textStyle: {
        fontFamily: niche.fonts.text,
        fontSize: 16,
        fontWeight: 600,
        color: niche.colors.ink,
        textAlign: "left",
        lineHeight: 1.1,
        letterSpacing: 0,
      },
      textContent: {
        spans: [{
          text: labels[index],
          fontFamily: niche.fonts.text,
          fontSize: 16,
          fontWeight: 600,
          color: niche.colors.ink,
        }],
      },
    });
  });
}

function applyNiche(layout, niche, copy) {
  (layout.elements || []).forEach((element) => {
    if (!element) return;
    if (element.type === "shape") paintShapeNiche(element, niche);
    else if (element.type === "text") paintTextNiche(element, niche);
  });
  addBars(layout, niche, copy);
  if (Number(niche.strokeWidth) > 0) {
    layout.elements.push({
      id: "native-niche-frame",
      type: "shape",
      x: 36,
      y: 36,
      width: 1528,
      height: 828,
      zIndex: 2,
      shapeContent: {
        kind: "rect",
        fill: "none",
        stroke: niche.stroke || niche.colors.signature || niche.colors.accent,
        strokeWidth: Number(niche.strokeWidth),
        cornerRadius: 0,
      },
    });
  }
  return placeStickers(layout, niche);
}

function buildDeck(order, copy, photos, subject, style, creative, niche) {
  const theme = style === "creative" ? "creative" : "corporate";
  const night = Boolean(creative) && nightSubject(subject);
  const source = loadArchetype("cover", theme);
  const layouts = {};
  order.forEach((name) => {
    const archetype = loadArchetype(name, theme);
    const layout = JSON.parse(JSON.stringify(archetype.layout));
    applyCopy(layout, name, copy);
    if (creative) dramatize(layout, name, night);
    if (photos) assignPhotos(layout, name, photos);
    if (niche) applyNiche(layout, niche, copy);
    layout.role = archetype.role;
    layouts[layout.id] = layout;
  });
  const sequence = order.map((name) => loadArchetype(name, theme).layout.id);
  const tokens = JSON.parse(JSON.stringify(source.tokens));
  if (night && !niche) {
    tokens.color.bg = NIGHT;
    tokens.color.surface = NIGHT;
    tokens.color.ink = WHITE;
    tokens.color.muted = NIGHT_MUTED;
    tokens.color.accent = NEON;
    tokens.color.accent2 = NEON;
    tokens.color.onAccent = NIGHT;
  }
  if (niche) {
    tokens.color = Object.assign({}, tokens.color, niche.colors);
    tokens.font = Object.assign({}, tokens.font, niche.fonts);
  }
  return {
    schemaVersion: 2,
    id: slug(copy.brand),
    name: copy.brand + ": " + String(subject || "").replace(/\.+$/, ""),
    description: "Native " + (niche ? niche.id : (creative ? "creative" : theme)) + " deck for " + String(subject || "").replace(/\.+$/, ""),
    source: "native",
    tokens,
    theme: {
      backgroundColor: tokens.color.bg,
      fontFamily: tokens.font.text,
      titleColor: tokens.color.ink,
      bodyColor: tokens.color.ink,
    },
    layoutSequence: sequence,
    layouts,
    previewSlides: sequence.map((id) => ({ layout: id, title: "", bullets: [] })),
    native: {
      order,
      brand: copy.brand,
      photoQuery: copy.photoQuery,
      peopleQuery: copy.peopleQuery,
      library: LIBRARY,
      style: theme,
      creative: Boolean(creative),
      night: Boolean(night && !niche),
      niche: niche ? niche.id : "",
    },
  };
}

function rgbOf(hex) {
  const value = String(hex || "").replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) || 0);
}

async function toneFile(file, mode, shadow, highlight) {
  const image = await loadImage(file);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  const dark = rgbOf(shadow);
  const light = rgbOf(highlight);
  for (let index = 0; index < data.length; index += 4) {
    const tone = (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722) / 255;
    if (mode === "gray") {
      const gray = Math.round(tone * 255);
      data[index] = gray;
      data[index + 1] = gray;
      data[index + 2] = gray;
    } else {
      data[index] = Math.round(dark[0] + (light[0] - dark[0]) * tone);
      data[index + 1] = Math.round(dark[1] + (light[1] - dark[1]) * tone);
      data[index + 2] = Math.round(dark[2] + (light[2] - dark[2]) * tone);
    }
  }
  ctx.putImageData(frame, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/jpeg", { quality: 0.9 }));
}

async function collectPhotos(queries, orientation, count) {
  const hits = [];
  const seen = new Set();
  for (let index = 0; index < queries.length; index += 1) {
    const found = await searchPexels(queries[index], orientation);
    found.forEach((hit) => {
      if (seen.has(hit.download)) return;
      seen.add(hit.download);
      hits.push(hit);
    });
    if (hits.length >= count) break;
  }
  if (hits.length < count) throw new Error("Need " + count + " " + orientation + " photos");
  return hits.slice(0, count);
}

async function savePhoto(hit, outDir, name) {
  const slugName = slug(path.basename(outDir));
  const url = "photos/native/" + slugName + "/" + name;
  const file = path.join(ROOT, "generated-templates", url);
  const bytes = await downloadPhoto(hit.download, file);
  return { url, bytes, photographer: hit.photographer, page: hit.page, alt: hit.alt };
}

async function savePhotos(copy, outDir, style, subject, treat) {
  const creative = style === "creative";
  const scenes = creative
    ? [copy.photoQuery, subject, "editorial " + (subject || copy.photoQuery)]
    : [copy.photoQuery, "modern office interior", "business meeting room"];
  const portraitsQuery = creative
    ? [copy.peopleQuery, subject + " portrait", "editorial portrait"]
    : [copy.peopleQuery, "professional headshot", "office portrait"];
  const landscapes = await collectPhotos(scenes, "landscape", creative ? 5 : 2);
  const portraits = await collectPhotos(portraitsQuery, "portrait", 4);
  const saved = [];
  for (let index = 0; index < landscapes.length; index += 1) {
    saved.push(await savePhoto(landscapes[index], outDir, "landscape-" + String(index + 1).padStart(2, "0") + ".jpg"));
  }
  const people = [];
  for (let index = 0; index < portraits.length; index += 1) {
    people.push(await savePhoto(portraits[index], outDir, "portrait-" + String(index + 1).padStart(2, "0") + ".jpg"));
  }
  const url = (index) => saved[index] ? saved[index].url : saved[0].url;
  if (treat && style === "creative") {
    const night = nightSubject(subject);
    const shadow = night ? NIGHT : "#163A5F";
    const highlight = night ? NEON : "#F3F1EC";
    const photoFile = (item) => path.join(ROOT, "generated-templates", item.url);
    if (saved[1]) await toneFile(photoFile(saved[1]), "duotone", shadow, highlight);
    if (saved[2]) await toneFile(photoFile(saved[2]), "duotone", shadow, highlight);
    for (let index = 0; index < people.length; index += 1) {
      await toneFile(photoFile(people[index]), "gray");
    }
  }
  return {
    cover: creative ? url(0) : "",
    problem: creative ? url(1) : url(0),
    market: creative ? url(2) : url(1),
    contents: creative ? url(2) : "",
    about: creative ? url(0) : "",
    solution: creative ? url(3) : "",
    proof: creative ? url(3) : "",
    model: creative ? url(4) : "",
    close: creative ? url(4) : "",
    people: people.map((item) => item.url),
    credits: saved.concat(people).map((item) => ({
      photographer: item.photographer,
      page: item.page,
      alt: item.alt,
      url: item.url,
    })),
  };
}

function geometryReport(deck) {
  return (deck.layoutSequence || []).map((id, index) => {
    const geometry = checkGeometry(deck, id);
    return { slide: index + 1, layout: id, pass: geometry.pass, reasons: geometry.reasons };
  });
}

async function draftCopy(subject) {
  let drafted = await askModel(promptFor(subject));
  try {
    return { parsed: parseJson(drafted.text), model: drafted.model };
  } catch (error) {
    drafted = await askModel(promptFor(subject) + "\nReturn one JSON object and nothing else.");
    return { parsed: parseJson(drafted.text), model: drafted.model };
  }
}

async function generate(options) {
  const subject = String(options.prompt || "").trim();
  const outDir = options.out
    ? path.resolve(ROOT, options.out)
    : path.join(ROOT, "docs", "template-pipeline", "native", slug(subject));
  const drafted = await draftCopy(subject);
  const order = orderOf(drafted.parsed.order);
  const creative = options.creative === true;
  const mood = creative ? "creative" : styleOf(drafted.parsed, subject);
  const style = creative ? "creative" : "corporate";
  const niche = loadNiche(nicheName(options.niche, drafted.parsed, subject));
  const copy = settleCopy(drafted.parsed, subject);
  copy.photoQuery = relevantQuery(subject, copy.photoQuery, "scene");
  copy.peopleQuery = relevantQuery(subject, copy.peopleQuery, "people");
  if (order.length !== 10) throw new Error("Native deck must have 10 slides");
  console.log("style " + style + (mood !== style ? " mood " + mood : "") + (creative ? " creative-mode" : "") + (creative && nightSubject(subject) && !niche ? " night" : ""));
  console.log("niche " + niche.id + (options.niche ? " requested" : " classified"));
  console.log("order " + order.join(" -> "));
  console.log("brand " + copy.brand);
  console.log("pexels \"" + copy.photoQuery + "\" / \"" + copy.peopleQuery + "\"");
  const saved = await savePhotos(copy, outDir, style, subject, creative);
  const deck = buildDeck(order, copy, saved, subject, style, creative, niche);
  deck.native.model = drafted.model;
  deck.native.photos = saved.credits;
  deck.native.geometry = geometryReport(deck);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  const slides = renderNativeDeck(deck, outDir);
  const pptx = await exportDeckPptx(deck, path.join(outDir, deck.id + ".pptx"));
  console.log("wrote " + path.relative(ROOT, outDir) + " (" + slides.length + " slides)");
  deck.native.geometry.forEach((item) => {
    if (!item.pass) console.log("geometry slide " + item.slide + " " + item.reasons.join(", "));
  });
  return { outDir, slides, pptx, deck, copy, order, layout: "native" };
}

if (require.main === module) {
  generate(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { generate, settleCopy, orderOf, buildDeck, styleOf, nicheName, LIBRARY, DECK, NICHES };
