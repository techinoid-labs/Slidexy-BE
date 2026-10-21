const fs = require("fs");
const path = require("path");
const { injectTheme } = require("./thematic");
const { remixSeeds } = require("./mutate_layout");
const { assembleDeck } = require("./assemble_deck");
const { convertPptx } = require("./convert/pptxToDeck");

const ROOT = path.join(__dirname, "..", "..");
const LIBRARY = path.join(ROOT, "app-library");
const TMP = path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "tmp");
const UPLOADS = path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "uploads");
const PUBLISHED = path.join(LIBRARY, "published");
const UPLOAD_LIMIT = 120 * 1024 * 1024;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36) || "deck";
}

function assertId(id) {
  if (!/^[a-z0-9-]+$/.test(String(id || ""))) throw fail(400, "Unknown deck id");
  return String(id);
}

function layoutFile(layoutId) {
  const id = assertId(layoutId);
  const file = path.join(LIBRARY, id + ".json");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw fail(400, "Unknown layout");
  if (readDna(id).disabled) throw fail(400, "Layout is disabled");
  return id;
}

function jobDir(id) {
  const safe = assertId(id);
  const root = path.resolve(TMP);
  const dir = path.resolve(TMP, safe);
  if (dir !== root && !dir.startsWith(root + path.sep)) throw fail(400, "Unknown deck id");
  return dir;
}

function readDna(id) {
  const file = path.join(LIBRARY, id + ".dna.json");
  if (!fs.existsSync(file)) return { id };
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data && typeof data === "object" ? data : { id };
  } catch (error) {
    return { id };
  }
}

function layoutRecord(id) {
  const dna = readDna(id);
  const score = Number(dna.qualityScore);
  return {
    id,
    qualityScore: Number.isFinite(score) ? score : null,
    recommendedUse: typeof dna.recommendedUse === "string" ? dna.recommendedUse : "",
    scoreFailures: Array.isArray(dna.scoreFailures) ? dna.scoreFailures : [],
    disabled: Boolean(dna.disabled),
  };
}

function seedIdFromFilename(filename) {
  const base = path.basename(String(filename || ""), path.extname(String(filename || "")));
  const id = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  if (!/^[a-z0-9-]{2,80}$/.test(id)) throw fail(400, "Use a PowerPoint file name with letters or numbers");
  return id;
}

function ingestPptx(buffer, filename) {
  const name = path.basename(String(filename || ""));
  if (!name || name.startsWith("~$") || !name.toLowerCase().endsWith(".pptx")) {
    throw fail(400, "Upload a .pptx file");
  }
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw fail(400, "That file is not a PowerPoint deck");
  }
  if (buffer.length > UPLOAD_LIMIT) throw fail(413, "That PowerPoint is larger than 120 MB");
  const id = seedIdFromFilename(name);
  const existed = fs.existsSync(path.join(LIBRARY, id + ".json"));
  fs.mkdirSync(UPLOADS, { recursive: true });
  const input = path.join(UPLOADS, id + ".pptx");
  fs.writeFileSync(input, buffer);
  let summary;
  try {
    summary = convertPptx(input, id);
  } catch (error) {
    const message = error && error.message ? error.message : "Could not read that PowerPoint";
    throw fail(400, message);
  } finally {
    fs.rmSync(input, { force: true });
  }
  const dna = path.join(LIBRARY, id + ".dna.json");
  if (fs.existsSync(dna)) fs.rmSync(dna);
  return {
    id,
    slides: summary.slides,
    images: summary.images,
    warnings: summary.warnings,
    replaced: existed,
    layout: layoutRecord(id),
  };
}

function listLayouts() {
  return fs.readdirSync(LIBRARY)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".dna.json"))
    .map((name) => layoutRecord(name.replace(/\.json$/, "")))
    .sort((a, b) => {
      const left = a.qualityScore == null ? -1 : a.qualityScore;
      const right = b.qualityScore == null ? -1 : b.qualityScore;
      if (right !== left) return right - left;
      return a.id < b.id ? -1 : 1;
    });
}

function setLayoutDisabled(id, disabled) {
  const safe = assertId(id);
  const file = path.join(LIBRARY, safe + ".json");
  if (!fs.existsSync(file)) throw fail(404, "Unknown layout");
  const dnaFile = path.join(LIBRARY, safe + ".dna.json");
  const dna = readDna(safe);
  dna.id = dna.id || safe;
  dna.disabled = Boolean(disabled);
  fs.writeFileSync(dnaFile, JSON.stringify(dna, null, 2) + "\n");
  return layoutRecord(safe);
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walkElements(deck, visit) {
  Object.keys(deck.layouts || {}).forEach((id) => {
    const layout = deck.layouts[id];
    (layout.elements || []).forEach(function visitElement(element) {
      if (!element) return;
      visit(element);
      if (element.type === "rotated" && element.element) visitElement(element.element);
      if (Array.isArray(element.children)) element.children.forEach(visitElement);
    });
  });
}

function copyTree(source, dest) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(source).forEach((name) => {
    const from = path.join(source, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  });
}

async function generateTemplate(body) {
  const prompt = String(body && body.prompt || "").trim();
  if (!prompt) throw fail(400, "Prompt is required");
  if (prompt.length > 500) throw fail(400, "Prompt is too long");
  const assemble = Boolean(body && (body.assemble === true || body.assemble === "true" || body.mode === "assemble"));
  const remix = !assemble && Boolean(body && (body.remix === true || body.remix === "true" || body.mode === "frankenstein"));
  const autoLayout = !assemble && !remix && Boolean(body && (body.autoLayout === true || body.autoLayout === "true"));
  const layoutId = assemble || autoLayout ? "" : layoutFile(body && (body.layoutId || body.layout || body.seedA));
  const layoutIdB = remix ? layoutFile(body && (body.layoutIdB || body.seedB)) : "";
  if (remix && layoutId === layoutIdB) throw fail(400, "Pick two different seeds");
  const id = slug((assemble ? "assemble" : remix ? "remix-" + layoutId + "-" + layoutIdB : (layoutId || "auto")) + "-" + prompt) + "-" + Date.now().toString(36);
  const dir = jobDir(id);
  const photoDir = path.join(ROOT, "generated-templates", "photos", "thematic", id);
  fs.mkdirSync(dir, { recursive: true });
  let themed = null;
  try {
    themed = assemble
      ? await assembleDeck(prompt, { out: relative(dir) })
      : remix
        ? await remixSeeds(layoutId, layoutIdB, { prompt, out: relative(dir) })
        : await injectTheme({
          prompt,
          layout: layoutId,
          autoLayout,
          out: relative(dir),
        });
  } catch (error) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(photoDir, { recursive: true, force: true });
    throw error;
  }
  const deck = JSON.parse(fs.readFileSync(path.join(dir, "deck.json"), "utf8"));
  const slides = fs.readdirSync(dir)
    .filter((name) => /^slide-\d{2}\.png$/.test(name))
    .sort()
    .map((name) => ({
      name,
      path: relative(path.join(dir, name)),
      url: "/api/admin/preview/" + id + "/" + name,
    }));
  return {
    id,
    layoutId: themed.layout || layoutId,
    layoutIdB: layoutIdB || "",
    remix: themed.remix || null,
    assembly: themed.assembly || null,
    analysis: themed.analysis || null,
    prompt,
    assetVibe: deck.assetVibe || "",
    name: deck.name || "",
    deck,
    slides,
  };
}

function previewPath(id, name) {
  if (!/^slide-\d{2}\.png$/.test(String(name || ""))) throw fail(400, "Unknown slide");
  const file = path.join(jobDir(id), name);
  if (!fs.existsSync(file)) throw fail(404, "Slide not found");
  return file;
}

function thematicPhotoDirs(deck) {
  const dirs = new Set();
  walkElements(deck, (element) => {
    const content = element.imageContent || element.maskedImageContent;
    if (!content || typeof content.url !== "string") return;
    const match = content.url.match(/^photos\/thematic\/([a-z0-9-]+)\//);
    if (!match) return;
    dirs.add(path.join(ROOT, "generated-templates", "photos", "thematic", match[1]));
  });
  return [...dirs];
}

function publishTemplate(id) {
  const dir = jobDir(id);
  const deckFile = path.join(dir, "deck.json");
  if (!fs.existsSync(deckFile)) throw fail(404, "Deck not found");
  const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
  const publishedId = assertId(String(deck.id || id).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""));
  const dest = path.join(PUBLISHED, publishedId);
  const photoDirs = thematicPhotoDirs(deck);
  walkElements(deck, (element) => {
    const content = element.imageContent || element.maskedImageContent;
    if (!content || typeof content.url !== "string") return;
    if (!/^photos\/thematic\/[a-z0-9-]+\//.test(content.url)) return;
    content.url = "photos/" + path.basename(content.url);
  });
  deck.status = "published";
  deck.publishedAt = new Date().toISOString();
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(dir).filter((name) => /^slide-\d{2}\.png$/.test(name)).forEach((name) => {
    fs.copyFileSync(path.join(dir, name), path.join(dest, name));
  });
  photoDirs.forEach((photoDir) => copyTree(photoDir, path.join(dest, "photos")));
  const catalogFile = path.join(PUBLISHED, publishedId + ".json");
  fs.writeFileSync(catalogFile, JSON.stringify(deck, null, 2) + "\n");
  fs.writeFileSync(path.join(dest, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  fs.rmSync(dir, { recursive: true, force: true });
  photoDirs.forEach((photoDir) => fs.rmSync(photoDir, { recursive: true, force: true }));
  return {
    id: publishedId,
    status: deck.status,
    deckPath: relative(catalogFile),
    imageDir: relative(dest),
  };
}

function discardTemplate(id) {
  const dir = jobDir(id);
  const deckFile = path.join(dir, "deck.json");
  const hadDeck = fs.existsSync(deckFile);
  const photoDirs = hadDeck ? thematicPhotoDirs(JSON.parse(fs.readFileSync(deckFile, "utf8"))) : [];
  photoDirs.push(path.join(ROOT, "generated-templates", "photos", "thematic", assertId(id)));
  fs.rmSync(dir, { recursive: true, force: true });
  photoDirs.forEach((photoDir) => fs.rmSync(photoDir, { recursive: true, force: true }));
  if (!hadDeck) throw fail(404, "Deck not found");
  return { id, discarded: true };
}

module.exports = {
  listLayouts,
  setLayoutDisabled,
  ingestPptx,
  generateTemplate,
  previewPath,
  publishTemplate,
  discardTemplate,
};
