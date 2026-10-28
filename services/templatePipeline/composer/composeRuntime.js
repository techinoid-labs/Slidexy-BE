/**
 * Runtime compose for runPipeline({ mode: "composer" }).
 * Supports --replay <dir> (zero network). Empty compiled spans; fit then collapse.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { inventDirection, searchPexels, downloadPhoto, clampCopy } = require("../thematic");
const { applyParametric } = require("../parametric");
const { renderSlidePng } = require("../../../scripts/slideSvg");
const { safeRm } = require("../safeRm");
const {
  planBrief,
  copyBrief,
  copyFill,
  validatePlan,
  validateCopy,
  listEmptySlots,
  mergeCopyFill,
  migrateLegacyBrief,
  remapCopyToPlan,
} = require("./brief");
const { FONT_PAIRS, OUT_DIR, DESIGN, ANCHORS, getSlacks } = require("./compileKit");
const catalogCaps = require("../catalogCaps");
const PALETTE_ANCHORS = catalogCaps.ANCHORS || ANCHORS;
const { countCanvasLines } = require("./canvasLines");
const { finishDeck } = require("./finishDeck");

const ROOT = path.join(__dirname, "..", "..", "..");

/** Test-only deps injection (HTTP generateTemplate no longer accepts deps). */
let testDeps = null;
function setTestDeps(deps) {
  testDeps = deps || null;
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "composer";
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(DESIGN, "manifest.json"), "utf8"));
}

function loadCompiled(component, variant, fontPair) {
  const file = path.join(OUT_DIR, component + "-" + variant + "-" + fontPair + ".json");
  if (!fs.existsSync(file)) throw new Error("Missing compiled component " + path.basename(file));
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function paletteFor(bucket) {
  const kit = ANCHORS[bucket] || ANCHORS["light-neutral"];
  const table = PALETTE_ANCHORS;
  const anchor = (table && table[bucket]) || kit;
  const accent = anchor.accent || kit.accent;
  const ink = anchor.ink || kit.ink;
  const bg = anchor.bg || kit.bg;
  // Prefer kit onAccent when present; otherwise pick ink/bg so accent-block hits 4.5:1.
  let onAccent = kit.onAccent || anchor.onAccent || bg;
  try {
    const { contrastRatio } = require("../scoring/analyzeDeck");
    if (contrastRatio(onAccent, accent) < 4.5) {
      onAccent = contrastRatio(ink, accent) >= 4.5 ? ink : bg;
    }
  } catch (error) { /* keep onAccent */ }
  return {
    bg,
    surface: anchor.surface || kit.surface || bg,
    card: anchor.card || kit.card || "#FFFFFF",
    ink,
    muted: anchor.muted || kit.muted || ink,
    rule: anchor.rule || kit.rule || "#d9d0c6",
    accent,
    accent2: anchor.accent2 || kit.accent2 || accent,
    onAccent,
  };
}

function setElementText(el, text) {
  const style = el.textStyle || {};
  const spans = (el.textContent && el.textContent.spans) || [{}];
  const base = spans[0] || {};
  el.textContent = {
    spans: [{
      text: String(text),
      fontFamily: base.fontFamily || style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: base.fontWeight != null ? base.fontWeight : style.fontWeight,
      color: base.color || style.color,
    }],
  };
}

/** Apply brief copy by named slot keys (bullet-1, stat-1, …). No plural-array fallback. */
function applySlotCopy(elements, role, copyBlock, componentId) {
  const block = copyBlock || {};
  (elements || []).forEach((el) => {
    if (!el || el.type !== "text" || !el.textContent) return;
    const id = String(el.id || "");
    const prefix = "composer-" + componentId + "-";
    if (!id.startsWith(prefix)) return;
    const slotKey = (el.slot && el.slot.dataRole) || id.slice(prefix.length);
    if (!Object.prototype.hasOwnProperty.call(block, slotKey)) return;
    let text = block[slotKey];
    if (text == null) return;
    text = String(text);
    if (slotKey === "kicker" || (el.slot && el.slot.dataRole === "kicker")) {
      text = text.toUpperCase();
    }
    setElementText(el, text);
  });
}

function currentText(el) {
  const spans = (el.textContent && el.textContent.spans) || [];
  return spans.map((s) => String(s && s.text != null ? s.text : "")).join("");
}

function setFontSize(el, size) {
  if (!el.textStyle) el.textStyle = {};
  el.textStyle.fontSize = size;
  const spans = (el.textContent && el.textContent.spans) || [];
  spans.forEach((span) => { span.fontSize = size; });
}

/**
 * Fit: one font step down the manifest typeScale, then clamp to capacity lines.
 * Boxes never grow.
 */
function fitDeck(deck, typeScale) {
  const fits = [];
  const scale = (typeScale || []).slice().sort((a, b) => a - b);
  (deck.layoutSequence || []).forEach((layoutId, slideIndex) => {
    const layout = deck.layouts[layoutId];
    (layout && layout.elements || []).forEach((el) => {
      if (!el || el.type !== "text") return;
      if (!currentText(el).trim()) return;
      const measuredLines = el.textMeasure && Number(el.textMeasure.lines);
      if (!Number.isFinite(measuredLines)) return;
      let canvas = countCanvasLines(el, deck.tokens);
      if (canvas.lines <= measuredLines) return;

      const fromSize = Number(el.textStyle && el.textStyle.fontSize) || 16;
      const lower = scale.filter((s) => s < fromSize).sort((a, b) => b - a)[0];
      if (lower != null) {
        setFontSize(el, lower);
        canvas = countCanvasLines(el, deck.tokens);
        fits.push({
          slide: slideIndex + 1,
          elementId: el.id,
          action: "fontStep",
          from: fromSize,
          to: lower,
        });
        if (canvas.lines <= measuredLines) return;
      }

      const cpl = Math.max(1, Number(el.textMeasure && el.textMeasure.charsPerLine) || 40);
      const maxChars = cpl * measuredLines;
      const before = currentText(el);
      const clipped = clampCopy(before.slice(0, maxChars));
      const toText = clipped || before.slice(0, maxChars).trim();
      setElementText(el, toText);
      fits.push({
        slide: slideIndex + 1,
        elementId: el.id,
        action: "clamp",
        from: before.length,
        to: toText.length,
      });
    });
  });
  return fits;
}

function memberHeight(m) {
  if (m.kind === "el") return Number(m.el.height) || 0;
  return Number(m.block.height) || 0;
}

function memberY(m) {
  if (m.kind === "el") return Number(m.el.y) || 0;
  return Number(m.block.y) || 0;
}

function setMemberY(m, y) {
  if (m.kind === "el") m.el.y = y;
  else m.block.y = y;
}

/** Elements whose boxes sit inside a recorded flex block (nested stack members). */
function elementsInBlock(layout, block, excludeIds) {
  const top = Number(block.y) || 0;
  const bottom = top + (Number(block.height) || 0);
  const left = Number(block.x) || 0;
  const right = left + (Number(block.width) || 0);
  const skip = excludeIds || {};
  return (layout.elements || []).filter((el) => {
    if (!el || skip[el.id]) return false;
    const ey = Number(el.y) || 0;
    const ex = Number(el.x) || 0;
    const eh = Number(el.height) || 0;
    return ey >= top - 1 && ey + eh <= bottom + 1 && ex >= left - 1 && ex <= right + 1;
  });
}

/**
 * Collapse each recorded stack: shrink text boxes to actual lines, re-lay with compiled gap.
 * Intervening flex blocks (e.g. stat-grid) keep height and shift nested elements with them.
 * Leaf stacks run first so parent block shifts see final nested heights.
 */
function collapseStacks(deck) {
  const collapses = [];
  const slack = (getSlacks() && getSlacks().HEIGHT_SLACK) || 1.1;
  (deck.layoutSequence || []).forEach((layoutId, slideIndex) => {
    const layout = deck.layouts[layoutId];
    if (!layout) return;
    const byId = {};
    (layout.elements || []).forEach((el) => { byId[el.id] = el; });
    const stacks = (layout.stacks || []).slice().sort((a, b) => {
      const aa = (Number(a.box && a.box.width) || 0) * (Number(a.box && a.box.height) || 0);
      const bb = (Number(b.box && b.box.width) || 0) * (Number(b.box && b.box.height) || 0);
      return aa - bb;
    });
    stacks.forEach((stack) => {
      const blocksById = {};
      (stack.blocks || []).forEach((b) => { blocksById[b.id] = b; });
      const members = [];
      (stack.order || []).forEach((id) => {
        if (byId[id]) members.push({ kind: "el", id, el: byId[id] });
        else if (blocksById[id]) {
          members.push({
            kind: "block",
            id,
            block: blocksById[id],
            orig: {
              x: blocksById[id].x,
              y: blocksById[id].y,
              width: blocksById[id].width,
              height: blocksById[id].height,
            },
          });
        }
      });
      if (!members.length) return;
      // Row stacks (process steps, team members) must not be reflowed as a vertical column.
      if (stack.direction === "row") {
        members.forEach((m) => {
          if (m.kind !== "el" || m.el.type !== "text") return;
          const el = m.el;
          const style = el.textStyle || {};
          const fontSize = Number(style.fontSize) || 16;
          const lineHeight = Number(style.lineHeight) || 1.2;
          const canvas = countCanvasLines(el, deck.tokens);
          const lines = Math.max(1, canvas.lines || 1);
          el.height = Math.round(lines * lineHeight * fontSize * slack * 100) / 100;
          el.textMeasure = Object.assign({}, el.textMeasure || {}, { lines });
        });
        return;
      }
      const gap = Number(stack.gap);
      const useGap = Number.isFinite(gap) ? gap : 28;
      const box = stack.box || {};
      const boxTop = Number(box.y) || memberY(members[0]);
      const boxHeight = Number(box.height) || 0;
      const beforeYs = members.map(memberY);
      const exclude = {};
      members.forEach((m) => { if (m.el) exclude[m.el.id] = true; });

      members.forEach((m) => {
        if (m.kind !== "el" || m.el.type !== "text") return;
        const el = m.el;
        const style = el.textStyle || {};
        const fontSize = Number(style.fontSize) || 16;
        const lineHeight = Number(style.lineHeight) || 1.2;
        const canvas = countCanvasLines(el, deck.tokens);
        const lines = Math.max(1, canvas.lines || 1);
        el.height = Math.round(lines * lineHeight * fontSize * slack * 100) / 100;
        el.textMeasure = Object.assign({}, el.textMeasure || {}, { lines });
      });

      // Snapshot nested element offsets relative to each block before moving.
      members.forEach((m) => {
        if (m.kind !== "block") return;
        m.nested = elementsInBlock(layout, m.orig, exclude).map((el) => ({
          el,
          dy: (Number(el.y) || 0) - (Number(m.orig.y) || 0),
        }));
      });

      let cursor = boxTop;
      members.forEach((m, i) => {
        const toY = Math.round(cursor * 100) / 100;
        setMemberY(m, toY);
        if (m.kind === "block" && m.nested) {
          m.nested.forEach((n) => {
            n.el.y = Math.round((toY + n.dy) * 100) / 100;
          });
          // Keep nested stack boxes in sync for aesthetics / later passes.
          (layout.stacks || []).forEach((other) => {
            if (other === stack || !other.box) return;
            const oy = Number(other.box.y) || 0;
            const ox = Number(other.box.x) || 0;
            if (oy >= (Number(m.orig.y) || 0) - 1
              && oy + (Number(other.box.height) || 0) <= (Number(m.orig.y) || 0) + (Number(m.orig.height) || 0) + 1
              && ox >= (Number(m.orig.x) || 0) - 1
              && ox <= (Number(m.orig.x) || 0) + (Number(m.orig.width) || 0) + 1) {
              other.box.y = Math.round((toY + (oy - (Number(m.orig.y) || 0))) * 100) / 100;
            }
          });
        }
        cursor = toY + memberHeight(m) + (i < members.length - 1 ? useGap : 0);
      });

      const lastBottom = memberY(members[members.length - 1]) + memberHeight(members[members.length - 1]);
      const contentHeight = lastBottom - boxTop;
      const align = stack.align || "start";
      let shift = 0;
      if (boxHeight > 0 && contentHeight < boxHeight) {
        if (align === "center") shift = (boxHeight - contentHeight) / 2;
        else if (align === "end") shift = boxHeight - contentHeight;
      }
      if (shift) {
        members.forEach((m) => {
          setMemberY(m, Math.round((memberY(m) + shift) * 100) / 100);
          if (m.kind === "block" && m.nested) {
            m.nested.forEach((n) => {
              n.el.y = Math.round((n.el.y + shift) * 100) / 100;
            });
          }
        });
      }

      const afterYs = members.map(memberY);
      collapses.push({
        slide: slideIndex + 1,
        stackId: stack.id,
        gap: useGap,
        align,
        shift: Math.round(shift * 100) / 100,
        members: members.map((m, i) => ({
          id: m.id,
          fromY: beforeYs[i],
          toY: afterYs[i],
          deltaY: Math.round((afterYs[i] - beforeYs[i]) * 100) / 100,
          height: memberHeight(m),
        })),
      });
    });
  });
  return collapses;
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

function hardFailCount(analysis) {
  const failures = (analysis && analysis.failures) || [];
  return failures.length;
}

function copyDirIfNeeded(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((name) => {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isFile()) fs.copyFileSync(from, to);
  });
}

function buildDeckFromBrief(brief, direction, prompt, slugName) {
  const fontPair = brief.fontPair;
  const pair = FONT_PAIRS[fontPair] || FONT_PAIRS["corp-calibri"];
  const bucket = brief.paletteBucket || "light-neutral";
  const colors = paletteFor(bucket);
  const layoutSequence = [];
  const layouts = {};
  const photoSlots = [];
  brief.plan.forEach((slide, index) => {
    const compiled = loadCompiled(slide.component, slide.variant, fontPair);
    const layoutId = "slide-" + String(index + 1);
    const elements = JSON.parse(JSON.stringify(compiled.layout.elements));
    const stacks = JSON.parse(JSON.stringify(compiled.layout.stacks || []));
    const copyBlock = (brief.copy && (brief.copy[String(index)] || brief.copy[index] || brief.copy[slide.role])) || {};
    applySlotCopy(elements, slide.role, copyBlock, slide.component);
    elements.forEach((el) => {
      if (el.type === "image" || el.type === "maskedImage") {
        const content = el.imageContent || el.maskedImageContent;
        if (content) {
          photoSlots.push({
            layoutId,
            element: el,
            content,
            role: slide.role,
            component: slide.component,
            isCover: slide.role === "Cover" || slide.component === "cover",
          });
        }
      }
    });
    layoutSequence.push(layoutId);
    layouts[layoutId] = {
      version: 2,
      id: layoutId,
      canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
      elements,
      stacks,
      role: slide.role,
      component: slide.component,
      variant: slide.variant,
    };
  });
  // Cover photo slots first so they claim landscapes before body slides.
  photoSlots.sort((a, b) => {
    if (a.isCover && !b.isCover) return -1;
    if (!a.isCover && b.isCover) return 1;
    return 0;
  });
  const deck = {
    schemaVersion: 2,
    id: slugName,
    name: (direction.profile && direction.profile.brand ? direction.profile.brand + ": " : "") + prompt,
    tokens: {
      color: colors,
      font: { display: pair.display, text: pair.text },
      type: { h1: 64, body: 22 },
    },
    layoutSequence,
    layouts,
  };
  return { deck, photoSlots, fontPair, bucket };
}

async function assignPhotos(photoSlots, slugName, prompt, direction, deps, replay) {
  const search = (deps && deps.searchPexels) || searchPexels;
  const download = (deps && deps.downloadPhoto) || downloadPhoto;
  const photoDir = path.join(ROOT, "generated-templates", "photos", "composer", slugName);
  const photoQueries = [];
  const reuse = [];

  if (replay) {
    const existing = fs.existsSync(photoDir)
      ? fs.readdirSync(photoDir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n)).sort()
      : [];
    photoQueries.push({ query: "(replay)", orientation: "landscape", hits: existing.length });
    for (let i = 0; i < photoSlots.length; i += 1) {
      if (!existing.length) continue;
      const name = existing[i % existing.length];
      if (i >= existing.length) reuse.push({ slot: photoSlots[i].element.id, reused: name });
      photoSlots[i].content.url = "photos/composer/" + slugName + "/" + name;
      photoSlots[i].content.fit = photoSlots[i].content.fit || "cover";
    }
    if (reuse.length) photoQueries[0].reuse = reuse;
    return photoQueries;
  }

  safeRm(photoDir, { recursive: true, force: true });
  fs.mkdirSync(photoDir, { recursive: true });
  const keys = Array.isArray(direction.keywords) ? direction.keywords.filter(Boolean) : [];
  const subjectQ = keys.slice(0, 2).join(" ") || direction.query || prompt;
  const textureQ = (keys[2] || "abstract texture") + " abstract";
  const peopleQ = "people team " + (keys[0] || "office");
  // Pexels color param skipped: searchPexels lives in thematic.js (out of edit scope for 4f).
  const buckets = {
    subject: await search(subjectQ, "landscape"),
    texture: await search(textureQ, "landscape"),
    people: await search(peopleQ, "portrait").catch(() => search(peopleQ, "landscape")),
  };
  photoQueries.push(
    { query: subjectQ, bucket: "subject", orientation: "landscape", hits: (buckets.subject || []).length },
    { query: textureQ, bucket: "texture", orientation: "landscape", hits: (buckets.texture || []).length },
    { query: peopleQ, bucket: "people", orientation: "portrait", hits: (buckets.people || []).length }
  );
  const counters = { subject: 0, texture: 0, people: 0 };
  for (let i = 0; i < photoSlots.length; i += 1) {
    const slot = photoSlots[i];
    const binding = String((slot.content && slot.content.binding) || "");
    const isTeam = slot.component === "team-grid" || /^photo-\d+$/.test(binding);
    const isCover = slot.isCover || slot.component === "cover";
    const bucketName = isTeam ? "people" : (isCover ? "subject" : "subject");
    const hitList = Array.isArray(buckets[bucketName]) ? buckets[bucketName] : [];
    if (!hitList.length) continue;
    const hitIndex = counters[bucketName] % hitList.length;
    counters[bucketName] += 1;
    const hit = hitList[hitIndex];
    if (!hit) continue;
    const name = "photo-" + String(i + 1).padStart(2, "0") + ".jpg";
    const file = path.join(photoDir, name);
    await download(hit.download || hit.url, file);
    slot.content.url = "photos/composer/" + slugName + "/" + name;
    slot.content.fit = slot.content.fit || "cover";
  }
  if (reuse.length) photoQueries[0].reuse = reuse;
  return photoQueries;
}

async function runOnce(options) {
  const {
    prompt, nonce, direction, brief, fallbacks, outDir, slugName, replay, deps, attempt,
  } = options;
  const manifest = loadManifest();
  const built = buildDeckFromBrief(brief, direction, prompt, slugName);
  const photoQueries = await assignPhotos(built.photoSlots, slugName, prompt, direction, deps, replay);

  applyParametric(built.deck, {
    prompt,
    title: (brief.copy && brief.copy["0"] && brief.copy["0"].title)
      || (brief.copy && brief.copy.Cover && brief.copy.Cover.title),
    density: brief.density || "balanced",
    skipCover: true,
    skipDensity: true,
    skipTypeContrast: true,
  });
  const fits = fitDeck(built.deck, manifest.typeScale || []);
  const collapses = collapseStacks(built.deck);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(built.deck, null, 2) + "\n");
  const slides = renderDeck(built.deck, outDir);
  const report = {
    direction,
    brief,
    fallbacks,
    nonce,
    photoQueries,
    fontPair: built.fontPair,
    bucket: built.bucket,
    vibe: built.bucket,
    fits,
    collapses,
    analysis: null,
    replay: Boolean(replay),
    attempt,
  };
  const finished = await finishDeck(built.deck, outDir, {
    slides,
    report,
    attempt,
    layout: "composer",
  });
  const result = {
    outDir,
    slides: finished.slides,
    report: finished.report || report,
    layout: "composer",
    name: finished.name || built.deck.name,
    deckId: finished.deckId || built.deck.id,
    selection: { vibe: built.bucket, model: direction.model || "composer" },
    analysis: finished.analysis,
    deck: finished.deck,
  };
  if (result.report) result.report.analysis = result.analysis;
  fs.writeFileSync(path.join(outDir, "replacements.json"), JSON.stringify(result.report, null, 2) + "\n");
  return result;
}

async function compose(options, deps) {
  deps = deps || testDeps || null;
  const settings = options || {};
  const prompt = String(settings.prompt || "").trim();
  if (!prompt) throw new Error("Prompt is required");

  const replayPath = settings.replay || (deps && deps.replay) || "";
  let replay = null;
  if (replayPath) {
    const dir = path.resolve(ROOT, replayPath);
    const repFile = path.join(dir, "replacements.json");
    if (!fs.existsSync(repFile)) throw new Error("replay dir missing replacements.json: " + dir);
    replay = { dir, report: JSON.parse(fs.readFileSync(repFile, "utf8")) };
  }

  const invent = (deps && deps.inventDirection) || inventDirection;
  const planFn = (deps && deps.planBrief) || planBrief;
  const copyFn = (deps && deps.copyBrief) || copyBrief;
  const fillFn = (deps && deps.copyFill) || copyFill;

  let direction;
  let nonce;
  let fallbacks = [];
  let callCount = 0;
  let brief;
  let copyFillReport = { fired: false };

  const manifest = loadManifest();

  if (replay) {
    direction = replay.report.direction;
    nonce = replay.report.nonce || settings.nonce || "replay";
    fallbacks = replay.report.fallbacks || [];
    // Map legacy role-keyed copy (proof-4f-a/b) into index-keyed shape.
    const migrated = migrateLegacyBrief(replay.report.brief);
    if (migrated && migrated._migratedFromRoleCopy) {
      fallbacks = fallbacks.concat([{ field: "replay.copy", got: "role-keyed", used: "index-keyed", reason: "migrated legacy 4f brief" }]);
    }
    const oldPlan = (migrated && migrated.plan) || [];
    const oldCopy = (migrated && migrated.copy) || {};
    // Re-apply hard plan repairs (e.g. narrative band) and remap copy to new indices.
    const planResult = validatePlan(migrated, manifest, prompt || (replay.report.prompt || ""), nonce);
    const remapped = remapCopyToPlan(oldPlan, oldCopy, planResult.plan.plan);
    const copyResult = validateCopy(remapped, planResult.plan, manifest);
    brief = Object.assign({}, planResult.plan, { copy: copyResult.copy });
    fallbacks = fallbacks.concat(planResult.fallbacks).concat(copyResult.fallbacks);
  } else {
    nonce = settings.nonce || crypto.randomBytes(8).toString("hex");
    direction = await invent(prompt);
    callCount += 1;

    const planRaw = await planFn(prompt, direction, manifest, nonce, deps);
    callCount += 1;
    const planResult = validatePlan(planRaw, manifest, prompt, nonce);
    fallbacks = planResult.fallbacks.slice();

    const copyRaw = await copyFn(prompt, direction, planResult.plan, manifest, deps);
    callCount += 1;
    const copyResult = validateCopy(copyRaw, planResult.plan, manifest);
    fallbacks = fallbacks.concat(copyResult.fallbacks);

    brief = Object.assign({}, planResult.plan, { copy: copyResult.copy });
  }

  const slugName = slug(
    settings.outSlug
    || (direction && direction.profile && direction.profile.brand)
    || (replay && path.basename(replay.dir))
    || prompt
  );
  const photoSlug = replay
    ? (function () {
      const deckPath = path.join(replay.dir, "deck.json");
      if (!fs.existsSync(deckPath)) return slugName;
      const d = JSON.parse(fs.readFileSync(deckPath, "utf8"));
      let found = "";
      Object.keys(d.layouts || {}).some((id) => {
        return (d.layouts[id].elements || []).some((el) => {
          const c = el.imageContent || el.maskedImageContent;
          const m = c && c.url && String(c.url).match(/^photos\/composer\/([^/]+)\//); // eslint-disable-line
          if (m) { found = m[1]; return true; }
          return false;
        });
      });
      return found || slugName;
    }())
    : slugName;

  const outDir = settings.out
    ? path.resolve(ROOT, settings.out)
    : path.join(ROOT, "docs", "template-pipeline", "composer", slugName);
  const relOut = path.relative(ROOT, outDir).split(path.sep).join("/");
  if (relOut === "docs/template-pipeline/native" || relOut.startsWith("docs/template-pipeline/native/")) {
    throw new Error("composer out refuses docs/template-pipeline/native/");
  }

  let chosen = await runOnce({
    prompt,
    nonce,
    direction,
    brief,
    fallbacks,
    outDir,
    slugName: photoSlug,
    replay: Boolean(replay),
    deps,
    attempt: 1,
  });
  callCount = replay ? 0 : callCount;

  // Copy-fill for remaining empty required slots (one shot, cap 4 total calls).
  if (!replay && callCount < 4) {
    const empties = listEmptySlots(brief, brief.copy, manifest);
    if (empties.length) {
      try {
        const fillRaw = await fillFn(prompt, empties, deps);
        callCount += 1;
        const merged = mergeCopyFill(brief.copy, fillRaw, empties, manifest, brief);
        brief.copy = merged.copy;
        fallbacks = fallbacks.concat(merged.fallbacks);
        copyFillReport = { fired: true, slots: empties.map((t) => t.index + "." + t.key) };
        chosen = await runOnce({
          prompt,
          nonce,
          direction,
          brief,
          fallbacks,
          outDir,
          slugName: photoSlug,
          replay: false,
          deps,
          attempt: 1,
        });
      } catch (error) {
        copyFillReport = {
          fired: true,
          error: String(error && error.message ? error.message : error),
          slots: empties.map((t) => t.index + "." + t.key),
        };
      }
    }
  }

  chosen.report.refinement = { fired: false, note: "component-swap refinement removed in 4f-1" };
  chosen.report.copyFill = copyFillReport;
  chosen.report.textModelCalls = replay ? 0 : callCount;
  chosen.report.brief = brief;
  chosen.report.fallbacks = fallbacks;
  fs.writeFileSync(path.join(chosen.outDir, "replacements.json"), JSON.stringify(chosen.report, null, 2) + "\n");

  const slideMeta = chosen.slides.map((file) => ({
    name: path.basename(file),
    path: path.relative(ROOT, file).split(path.sep).join("/"),
    url: file,
  }));

  return {
    id: photoSlug,
    layoutId: "composer",
    layoutIdB: "",
    remix: null,
    assembly: null,
    analysis: chosen.analysis,
    prompt,
    vibe: chosen.report.bucket,
    name: chosen.name,
    deck: chosen.deck,
    slides: slideMeta,
    pptxUrl: "",
    outDir: chosen.outDir,
    report: chosen.report,
  };
}

module.exports = { compose, loadManifest, paletteFor, slug, fitDeck, collapseStacks, applySlotCopy, setTestDeps };
