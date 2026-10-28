/**
 * Review console: human review, replay, gallery flags, prompt panel, git-dirty.
 * Paths under docs/template-pipeline/composer/.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const COMPOSER = path.join(ROOT, "docs", "template-pipeline", "composer");
const TMP = path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "tmp");
const REVIEWS = path.join(COMPOSER, "reviews");
const REPLAYS = path.join(COMPOSER, "replays");
const GALLERY = path.join(COMPOSER, "gallery");
const FLAGS = path.join(GALLERY, "flags.json");
const PANEL = path.join(COMPOSER, "panel.json");
const PANEL_RUN = path.join(COMPOSER, "panel-last-run.json");
const PPT_CHECK = path.join(COMPOSER, "ppt-check.json");
const MANIFEST = path.join(ROOT, "design-system", "manifest.json");
const GALLERY_REPORT = path.join(GALLERY, "report.json");

let panelRunning = false;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(id) {
  if (!/^[a-z0-9-]+$/.test(String(id || ""))) throw fail(400, "Unknown deck id");
  return String(id);
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

/** Resolve a job directory: admin tmp first, then composer proof folders. */
function resolveJobDir(id) {
  const safe = assertId(id);
  const tmp = path.join(TMP, safe);
  if (fs.existsSync(path.join(tmp, "deck.json"))) return tmp;
  const composer = path.join(COMPOSER, safe);
  if (fs.existsSync(path.join(composer, "deck.json"))) return composer;
  throw fail(404, "Deck not found");
}

function listJobIds() {
  const ids = new Set();
  if (fs.existsSync(TMP)) {
    fs.readdirSync(TMP).forEach((name) => {
      if (fs.existsSync(path.join(TMP, name, "deck.json"))) ids.add(name);
    });
  }
  if (fs.existsSync(COMPOSER)) {
    fs.readdirSync(COMPOSER).forEach((name) => {
      if (!/^proof-|^_/.test(name) && name !== "reviews" && name !== "replays" && name !== "gallery") return;
      if (fs.existsSync(path.join(COMPOSER, name, "deck.json"))) ids.add(name);
    });
    // Also include any proof-* with deck.json
    fs.readdirSync(COMPOSER).forEach((name) => {
      if (fs.existsSync(path.join(COMPOSER, name, "deck.json"))) ids.add(name);
    });
  }
  return [...ids].sort();
}

function slideUrls(id, dir) {
  const canvas = fs.readdirSync(dir)
    .filter((n) => /^slide-\d{2}\.png$/.test(n))
    .sort()
    .map((name) => ({ name, url: "/api/admin/preview/" + id + "/" + name }));
  const gate = path.join(dir, "_pptx-gate");
  const lo = [];
  const loSources = [dir, gate];
  loSources.forEach((src) => {
    if (!fs.existsSync(src)) return;
    fs.readdirSync(src).forEach((name) => {
      if (!/^lo-slide-\d+\.png$/i.test(name)) return;
      if (lo.some((x) => x.name === name)) return;
      lo.push({ name, url: "/api/admin/preview/" + id + "/" + name });
    });
  });
  lo.sort((a, b) => {
    const na = Number((a.name.match(/\d+/) || [0])[0]);
    const nb = Number((b.name.match(/\d+/) || [0])[0]);
    return na - nb;
  });
  return { canvas, lo };
}

function readJsonSafe(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function getReviewPayload(id) {
  const safe = assertId(id);
  const dir = resolveJobDir(safe);
  const deck = JSON.parse(fs.readFileSync(path.join(dir, "deck.json"), "utf8"));
  const replacements = readJsonSafe(path.join(dir, "replacements.json"), {});
  const urls = slideUrls(safe, dir);
  return {
    id: safe,
    jobDir: relative(dir),
    qa: deck.qa || (replacements.analysis && {
      score: replacements.analysis.score,
      passed: replacements.analysis.passed,
      total: replacements.analysis.total,
      failures: replacements.analysis.failures,
    }) || null,
    plan: (replacements.brief && replacements.brief.plan) || [],
    fallbacks: replacements.fallbacks || [],
    fits: replacements.fits || [],
    nonce: replacements.nonce || "",
    prompt: replacements.prompt || (deck && deck.name) || "",
    textModelCalls: replacements.textModelCalls,
    copyFill: replacements.copyFill || null,
    slides: urls.canvas,
    loSlides: urls.lo,
    accentRole: replacements.brief && replacements.brief.accentRole,
  };
}

function submitReview(id, body) {
  const safe = assertId(id);
  const dir = resolveJobDir(safe);
  const payload = getReviewPayload(safe);
  const replacements = readJsonSafe(path.join(dir, "replacements.json"), {});
  const review = {
    id: safe,
    prompt: payload.prompt,
    nonce: payload.nonce,
    plan: payload.plan,
    qa: payload.qa,
    timestamp: new Date().toISOString(),
    stockText: Boolean(body && body.stockText),
    spacing: Boolean(body && body.spacing),
    coverPhoto: Boolean(body && body.coverPhoto),
    belowBox: Boolean(body && body.belowBox),
    readsDesigned: Boolean(body && body.readsDesigned),
    worstThree: String((body && body.worstThree) || "").slice(0, 2000),
    fixType: ["kit", "check", "brief", "none"].indexOf(body && body.fixType) >= 0 ? body.fixType : "none",
    kept: Boolean(body && body.kept),
    readsAsDifferent: Boolean(body && body.readsAsDifferent),
    // Snapshot replacements so discard does not lose replay source
    replacements,
  };
  fs.mkdirSync(REVIEWS, { recursive: true });
  const file = path.join(REVIEWS, safe + ".json");
  fs.writeFileSync(file, JSON.stringify(review, null, 2) + "\n");
  return { ok: true, path: relative(file), review };
}

function listReviews() {
  fs.mkdirSync(REVIEWS, { recursive: true });
  return fs.readdirSync(REVIEWS)
    .filter((n) => n.endsWith(".json"))
    .map((name) => {
      const data = readJsonSafe(path.join(REVIEWS, name), null);
      if (!data) return null;
      return {
        id: data.id || name.replace(/\.json$/, ""),
        prompt: data.prompt || "",
        nonce: data.nonce || "",
        score: data.qa && data.qa.score,
        kept: Boolean(data.kept),
        fixType: data.fixType || "none",
        timestamp: data.timestamp || "",
        path: relative(path.join(REVIEWS, name)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

async function replayReview(id, deps) {
  const safe = assertId(id);
  const reviewFile = path.join(REVIEWS, safe + ".json");
  let replacements = null;
  let prompt = "A corporate payroll company";
  if (fs.existsSync(reviewFile)) {
    const review = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
    replacements = review.replacements || null;
    prompt = review.prompt || prompt;
  }
  if (!replacements) {
    const dir = resolveJobDir(safe);
    replacements = readJsonSafe(path.join(dir, "replacements.json"), null);
  }
  if (!replacements) throw fail(404, "No replacements to replay");

  const stamp = Date.now().toString(36);
  const outName = safe + "-" + stamp;
  const staging = path.join(REPLAYS, "_src-" + outName);
  const outDir = path.join(REPLAYS, outName);
  fs.mkdirSync(staging, { recursive: true });
  fs.writeFileSync(path.join(staging, "replacements.json"), JSON.stringify(replacements, null, 2) + "\n");
  // Seed photos from original job if present
  try {
    const srcJob = resolveJobDir(safe);
    const deckPath = path.join(srcJob, "deck.json");
    if (fs.existsSync(deckPath)) {
      fs.copyFileSync(deckPath, path.join(staging, "deck.json"));
    }
  } catch (error) { /* optional */ }

  const { compose } = require("./composeRuntime");
  const result = await compose({
    prompt,
    replay: relative(staging),
    out: relative(outDir),
  }, deps || null);

  // Cleanup staging
  try {
    fs.rmSync(staging, { recursive: true, force: true });
  } catch (error) { /* ignore */ }

  const deck = JSON.parse(fs.readFileSync(path.join(outDir, "deck.json"), "utf8"));
  const urls = slideUrls(outName, outDir);
  // Serve replays via composer path — register preview resolver for replays/
  return {
    id: outName,
    outDir: relative(outDir),
    qa: deck.qa || null,
    textModelCalls: result.report && result.report.textModelCalls,
    slides: urls.canvas,
    loSlides: urls.lo,
    plan: (result.report && result.report.brief && result.report.brief.plan) || [],
  };
}

async function ensureGalleryFresh() {
  const manifestMtime = fs.existsSync(MANIFEST) ? fs.statSync(MANIFEST).mtimeMs : 0;
  const reportMtime = fs.existsSync(GALLERY_REPORT) ? fs.statSync(GALLERY_REPORT).mtimeMs : 0;
  if (!fs.existsSync(GALLERY_REPORT) || reportMtime < manifestMtime) {
    const { main } = require("./gallery");
    await main();
  }
}

async function getGallery() {
  await ensureGalleryFresh();
  const report = readJsonSafe(GALLERY_REPORT, { entries: [] });
  const flags = readJsonSafe(FLAGS, {});
  const entries = (report.entries || []).map((e) => ({
    component: e.component,
    variant: e.variant,
    bucket: e.bucket,
    file: e.file,
    geometryPass: e.geometryPass,
    geometryReasons: e.geometryReasons || [],
    pngUrl: "/api/admin/gallery/png/" + encodeURIComponent(e.file),
    weak: Boolean(flags[e.component + "/" + e.variant]),
  }));
  return { entries, flags, count: entries.length };
}

function setGalleryFlag(body) {
  const component = String(body && body.component || "").trim();
  const variant = String(body && body.variant || "").trim();
  if (!component || !variant) throw fail(400, "component and variant required");
  const key = component + "/" + variant;
  const flags = readJsonSafe(FLAGS, {});
  if (body.weak) flags[key] = true;
  else delete flags[key];
  fs.mkdirSync(GALLERY, { recursive: true });
  fs.writeFileSync(FLAGS, JSON.stringify(flags, null, 2) + "\n");
  return { ok: true, flags, path: relative(FLAGS) };
}

function galleryPngPath(name) {
  const base = path.basename(String(name || ""));
  if (!/^[a-z0-9._-]+\.png$/i.test(base)) throw fail(400, "Unknown gallery png");
  const file = path.join(GALLERY, base);
  if (!fs.existsSync(file)) throw fail(404, "Gallery png not found");
  return file;
}

function defaultPanel() {
  return {
    prompts: [
      { prompt: "A neighborhood dental clinic expanding to a second location", industry: "clinic", mood: "calm clinical", nonce: "panel-clinic" },
      { prompt: "A farm-to-table restaurant pitching a second site", industry: "restaurant", mood: "warm hospitable", nonce: "panel-restaurant" },
      { prompt: "A B2B SaaS startup raising a Series A", industry: "SaaS startup", mood: "sharp confident", nonce: "panel-saas" },
      { prompt: "A regional nonprofit seeking corporate sponsors", industry: "nonprofit", mood: "earnest hopeful", nonce: "panel-nonprofit" },
      { prompt: "A boutique law firm specializing in employment law", industry: "law firm", mood: "precise authoritative", nonce: "panel-law" },
      { prompt: "A boutique fitness studio opening a membership drive", industry: "fitness studio", mood: "energetic clean", nonce: "panel-fitness" },
      { prompt: "A mid-size construction firm bidding on civic work", industry: "construction", mood: "sturdy practical", nonce: "panel-construction" },
      { prompt: "An independent school presenting its five-year plan", industry: "school", mood: "thoughtful academic", nonce: "panel-school" },
      { prompt: "A community bank launching small-business lending", industry: "bank", mood: "trustworthy steady", nonce: "panel-bank" },
      { prompt: "A travel agency packaging slow-travel tours", industry: "travel agency", mood: "curious inviting", nonce: "panel-travel" },
    ],
  };
}

function getPanel() {
  if (!fs.existsSync(PANEL)) {
    fs.mkdirSync(COMPOSER, { recursive: true });
    fs.writeFileSync(PANEL, JSON.stringify(defaultPanel(), null, 2) + "\n");
  }
  const panel = readJsonSafe(PANEL, defaultPanel());
  const lastRun = readJsonSafe(PANEL_RUN, null);
  const ppt = readJsonSafe(PPT_CHECK, { checkedAt: "" });
  return { panel, lastRun, pptCheck: ppt, running: panelRunning, callCostPerDeck: "3–4" };
}

function setPptCheck(body) {
  const checkedAt = String((body && body.checkedAt) || new Date().toISOString()).slice(0, 40);
  fs.mkdirSync(COMPOSER, { recursive: true });
  const data = { checkedAt };
  fs.writeFileSync(PPT_CHECK, JSON.stringify(data, null, 2) + "\n");
  return data;
}

function gitDirtyCount() {
  const r = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
  if (r.error || r.status !== 0) {
    return { count: 0, error: String((r.stderr || r.error || "git status failed")), lines: [] };
  }
  const lines = String(r.stdout || "").split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  return { count: lines.length, lines };
}

async function runPanel(deps) {
  if (panelRunning) throw fail(409, "Panel run already in progress");
  panelRunning = true;
  const panel = getPanel().panel;
  const prompts = panel.prompts || [];
  const results = [];
  const startedAt = new Date().toISOString();
  fs.writeFileSync(PANEL_RUN, JSON.stringify({ status: "running", startedAt, results: [], total: prompts.length }, null, 2) + "\n");
  try {
    const compose = (deps && deps.compose) || require("./composeRuntime").compose;
    for (let i = 0; i < prompts.length; i += 1) {
      const item = prompts[i];
      const outRel = path.join("docs", "template-pipeline", "admin-dashboard", "tmp",
        "panel-" + String(item.nonce || i)).split(path.sep).join("/");
      let result;
      try {
        result = await compose({
          prompt: item.prompt,
          nonce: item.nonce,
          out: outRel,
        }, deps || null);
      } catch (error) {
        const message = String(error && error.message ? error.message : error);
        if (/402/.test(message)) {
          results.push({ prompt: item.prompt, nonce: item.nonce, error: message, stopped: true });
          fs.writeFileSync(PANEL_RUN, JSON.stringify({
            status: "stopped", startedAt, finishedAt: new Date().toISOString(), results, total: prompts.length,
          }, null, 2) + "\n");
          throw fail(402, message);
        }
        results.push({ prompt: item.prompt, nonce: item.nonce, error: message });
        fs.writeFileSync(PANEL_RUN, JSON.stringify({
          status: "running", startedAt, results, total: prompts.length, index: i + 1,
        }, null, 2) + "\n");
        continue;
      }
      const qa = result.analysis || (result.deck && result.deck.qa) || {};
      results.push({
        prompt: item.prompt,
        nonce: item.nonce,
        industry: item.industry,
        id: result.id,
        score: qa.score,
        failures: qa.failures || [],
        textModelCalls: result.report && result.report.textModelCalls,
        plan: (result.report && result.report.brief && result.report.brief.plan) || [],
        outDir: result.outDir ? relative(result.outDir) : outRel,
      });
      fs.writeFileSync(PANEL_RUN, JSON.stringify({
        status: "running", startedAt, results, total: prompts.length, index: i + 1,
      }, null, 2) + "\n");
    }
    const finished = {
      status: "done",
      startedAt,
      finishedAt: new Date().toISOString(),
      results,
      total: prompts.length,
    };
    fs.writeFileSync(PANEL_RUN, JSON.stringify(finished, null, 2) + "\n");
    return finished;
  } finally {
    panelRunning = false;
  }
}

/** Preview file for tmp jobs, composer proofs, or replays. */
function reviewPreviewPath(id, name) {
  const safe = assertId(id);
  const n = String(name || "");
  if (!/^(slide-\d{2}|lo-slide-\d+)\.png$/i.test(n)) throw fail(400, "Unknown slide");
  const candidates = [];
  const tmp = path.join(TMP, safe);
  const composer = path.join(COMPOSER, safe);
  const replay = path.join(REPLAYS, safe);
  [tmp, composer, replay].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    candidates.push(path.join(dir, n));
    candidates.push(path.join(dir, "_pptx-gate", n));
  });
  for (let i = 0; i < candidates.length; i += 1) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  throw fail(404, "Slide not found");
}

function listJobsForReview() {
  return listJobIds().map((id) => {
    try {
      const p = getReviewPayload(id);
      return { id, score: p.qa && p.qa.score, nonce: p.nonce, prompt: p.prompt, slides: (p.slides || []).length };
    } catch (error) {
      return { id, error: error.message };
    }
  });
}

module.exports = {
  getReviewPayload,
  submitReview,
  listReviews,
  replayReview,
  getGallery,
  setGalleryFlag,
  galleryPngPath,
  getPanel,
  runPanel,
  setPptCheck,
  gitDirtyCount,
  reviewPreviewPath,
  listJobsForReview,
  resolveJobDir,
  REVIEWS,
  REPLAYS,
  PANEL,
  FLAGS,
  PPT_CHECK,
  fail,
};
