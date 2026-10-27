/**
 * Offline one-slide component proof (no LLM, no Pexels).
 *
 *   node services/templatePipeline/composer/proofCover.js --variant word --fontPair corp-calibri
 *   node services/templatePipeline/composer/proofCover.js --component stat-row --variant three-up
 *   node services/templatePipeline/composer/proofCover.js --variant split --photo generated-templates/photos/thematic/phase-3-payroll/landscape-01.jpg
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { createCanvas, Image } = require("canvas");
const { renderSlidePng } = require("../../../scripts/slideSvg");
const { applyParametric } = require("../parametric");
const { analyzeDeck, checkGeometry } = require("../scoring/analyzeDeck");
const { exportDeckPptx } = require("../catalog");
const { FONT_PAIRS, getSlacks } = require("./compileKit");
const { countLoLines } = require("./loLines");
const { countCanvasLines, countDeckCanvasLines } = require("./canvasLines");
const { applyComposerFails } = require("./hardFails");

const ROOT = path.join(__dirname, "..", "..", "..");
const COMPOSER = path.join(ROOT, "app-library", "native", "composer");

const COPY = {
  title: "Apex Payroll Solutions",
  body: "We automate payroll, tax filings, and compliance for growing teams so founders spend less time on spreadsheets and more on people.",
  kicker: "2026",
  bullets: [
    "First bullet point under eighty characters",
    "Second bullet point under eighty characters",
    "Third bullet point under eighty characters",
  ],
  stats: ["47%", "12d", "98%"],
  labels: ["Churn after rebuild", "Median close cycle", "On-time payroll runs"],
  statement: "Payroll should disappear into the workday.",
  number: "99.9%",
  label: "On-time payroll accuracy",
  quote: "We stopped chasing payroll deadlines and started leading again.",
  attribution: "Jordan Lee, COO",
  items: ["Connect systems", "Configure pay", "Approve runs", "File taxes", "Review audits", "Scale hiring"],
  stepTitles: ["Connect", "Configure", "Run", "Review"],
  stepBodies: [
    "Link HRIS and bank details in a guided setup.",
    "Map pay codes, taxes, and approval chains once.",
    "Approve a preview and fund payroll with one click.",
    "Audit trails and filings stay ready for finance.",
  ],
  names: ["Alex Morgan", "Sam Rivera", "Casey Nguyen", "Riley Chen"],
  roles: ["Chief Executive Officer", "Head of Customer Success", "VP of Engineering", "Finance Partner"],
};

function parseArgs(argv) {
  const args = {
    component: "cover",
    variant: "word",
    fontPair: Object.keys(FONT_PAIRS)[0],
    out: "",
    photo: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--component") args.component = argv[++i] || args.component;
    else if (argv[i] === "--variant") args.variant = argv[++i] || args.variant;
    else if (argv[i] === "--fontPair") args.fontPair = argv[++i] || args.fontPair;
    else if (argv[i] === "--out") args.out = argv[++i] || "";
    else if (argv[i] === "--photo") args.photo = argv[++i] || "";
  }
  return args;
}

function stagePhoto(srcRel) {
  const src = path.resolve(ROOT, srcRel);
  if (!fs.existsSync(src)) throw new Error("photo not found: " + src);
  const name = path.basename(src);
  const destDir = path.join(ROOT, "generated-templates", "photos", "composer", "proof");
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, name);
  fs.copyFileSync(src, dest);
  return "photos/composer/proof/" + name;
}

function applyCopy(elements, photoUrl, componentId) {
  const prefix = "composer-" + componentId + "-";
  const next = [];
  (elements || []).forEach((el) => {
    if (!el) return;
    if (el.type === "text" && el.textContent) {
      const id = String(el.id || "");
      if (id.startsWith(prefix)) {
        const slot = id.slice(prefix.length);
        let text = null;
        if (slot === "title") text = COPY.title;
        else if (slot === "body") text = COPY.body;
        else if (slot === "kicker") text = COPY.kicker.toUpperCase();
        else if (slot === "statement") text = COPY.statement;
        else if (slot === "number") text = COPY.number;
        else if (slot === "label") text = COPY.label;
        else if (slot === "quote") text = COPY.quote;
        else if (slot === "attribution") text = COPY.attribution;
        else if (/^bullet-(\d+)$/.test(slot)) text = COPY.bullets[Number(RegExp.$1) - 1];
        else if (/^stat-(\d+)$/.test(slot)) text = COPY.stats[Number(RegExp.$1) - 1];
        else if (/^label-(\d+)$/.test(slot)) text = COPY.labels[Number(RegExp.$1) - 1];
        else if (/^item-(\d+)$/.test(slot)) text = COPY.items[Number(RegExp.$1) - 1];
        else if (/^step-title-(\d+)$/.test(slot)) text = COPY.stepTitles[Number(RegExp.$1) - 1];
        else if (/^step-body-(\d+)$/.test(slot)) text = COPY.stepBodies[Number(RegExp.$1) - 1];
        else if (/^name-(\d+)$/.test(slot)) text = COPY.names[Number(RegExp.$1) - 1];
        else if (/^role-(\d+)$/.test(slot)) text = COPY.roles[Number(RegExp.$1) - 1];
        if (text != null) {
          const style = el.textStyle || {};
          el.textContent.spans = [{
            text: String(text),
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            color: style.color,
          }];
        }
      }
      next.push(el);
      return;
    }
    if (el.type === "image" || el.type === "maskedImage") {
      const content = el.imageContent || el.maskedImageContent;
      if (photoUrl && content) {
        content.url = photoUrl;
        content.fit = content.fit || "cover";
        next.push(el);
        return;
      }
      if (content && content.url) next.push(el);
      return;
    }
    next.push(el);
  });
  return next;
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

function findBin(names, fallbacks) {
  const { execSync } = require("child_process");
  for (let i = 0; i < names.length; i += 1) {
    try {
      const found = execSync("where.exe " + names[i], { encoding: "utf8" }).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
      if (found && fs.existsSync(found)) return found;
    } catch (error) { /* keep looking */ }
  }
  for (let i = 0; i < fallbacks.length; i += 1) {
    if (fs.existsSync(fallbacks[i])) return fallbacks[i];
  }
  return names[0];
}

async function rasterizePptx(pptxPath, outDir) {
  const os = require("os");
  const userInstall = path.join(os.tmpdir(), "lo-profile-proof-" + Date.now());
  fs.mkdirSync(userInstall, { recursive: true });
  const { spawnSync } = require("child_process");
  const sofficeBin = findBin(["soffice.com"], [
    "C:\\Program Files\\LibreOffice\\program\\soffice.com",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",
  ]);
  const pdftoppmBin = findBin(["pdftoppm"], []);
  const envArg = "-env:UserInstallation=file:///" + userInstall.replace(/\\/g, "/");
  const soffice = spawnSync(sofficeBin, [
    "--headless",
    "--norestore",
    envArg,
    "--convert-to", "pdf",
    "--outdir", outDir,
    pptxPath,
  ], { encoding: "utf8", cwd: outDir, shell: false });
  if (soffice.error || soffice.status !== 0) {
    return {
      ok: false,
      sofficeBin,
      soffice: (soffice.stderr || "") + (soffice.stdout || "") + (soffice.error ? String(soffice.error) : ""),
      status: soffice.status,
    };
  }
  const pdfName = path.basename(pptxPath, ".pptx") + ".pdf";
  const pdfPath = path.join(outDir, pdfName);
  const ppm = spawnSync(pdftoppmBin, ["-png", "-scale-to-x", "1600", "-scale-to-y", "900", "-singlefile", pdfPath, path.join(outDir, "lo-slide")], { encoding: "utf8" });
  if (ppm.error || ppm.status !== 0) {
    return {
      ok: false,
      soffice: "ok",
      pdftoppmBin,
      pdftoppm: (ppm.stderr || "") + (ppm.stdout || "") + (ppm.error ? String(ppm.error) : ""),
    };
  }
  return { ok: true, loSlide: path.join(outDir, "lo-slide.png"), pdfPath, sofficeBin, pdftoppmBin, userInstall };
}

function inspectPptx(pptxPath) {
  const buffer = fs.readFileSync(pptxPath);
  const entries = [];
  let offset = 0;
  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const comp = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const name = buffer.slice(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    const data = buffer.slice(dataStart, dataStart + compSize);
    entries.push({ name, comp, data });
    offset = dataStart + compSize;
  }
  let mediaNames = entries.filter((e) => /^ppt\/media\//i.test(e.name)).map((e) => e.name);
  let slideXml = "";
  const slideEntry = entries.find((e) => /ppt\/slides\/slide1\.xml$/i.test(e.name));
  if (slideEntry) {
    try {
      slideXml = (slideEntry.comp === 0 ? slideEntry.data : zlib.inflateRawSync(slideEntry.data)).toString("utf8");
    } catch (error) {
      slideXml = "";
    }
  }
  if (!mediaNames.length || !slideXml) {
    const os = require("os");
    const { spawnSync } = require("child_process");
    const tmp = path.join(os.tmpdir(), "pptx-inspect-" + Date.now());
    fs.mkdirSync(tmp, { recursive: true });
    const expand = spawnSync("tar", ["-xf", pptxPath, "-C", tmp], { encoding: "utf8" });
    if (expand.status === 0) {
      const mediaDir = path.join(tmp, "ppt", "media");
      mediaNames = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir).map((n) => "ppt/media/" + n) : [];
      const slidePath = path.join(tmp, "ppt", "slides", "slide1.xml");
      if (fs.existsSync(slidePath)) slideXml = fs.readFileSync(slidePath, "utf8");
    }
  }
  const picCount = (slideXml.match(/<p:pic[\s>]/g) || []).length;
  const spCount = (slideXml.match(/<p:sp[\s>]/g) || []).length;
  const childOrder = [];
  const spTree = slideXml.match(/<p:spTree[\s\S]*?<\/p:spTree>/);
  if (spTree) {
    const re = /<(p:sp|p:pic|p:cxnSp|p:grpSp)\b/g;
    let m;
    while ((m = re.exec(spTree[0]))) childOrder.push(m[1]);
  }
  return { mediaCount: mediaNames.length, mediaNames, picCount, spCount, childOrder, slideXmlLen: slideXml.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!FONT_PAIRS[args.fontPair]) throw new Error("Unknown fontPair " + args.fontPair);
  const compiledPath = path.join(COMPOSER, args.component + "-" + args.variant + "-" + args.fontPair + ".json");
  if (!fs.existsSync(compiledPath)) throw new Error("Missing compiled JSON " + compiledPath);
  const compiled = JSON.parse(fs.readFileSync(compiledPath, "utf8"));
  const layoutId = "slide-1";
  const needsPhoto = (compiled.layout.elements || []).some((el) => el.type === "image" || el.type === "maskedImage");
  const photoUrl = args.photo
    ? stagePhoto(args.photo)
    : (needsPhoto ? stagePhoto("generated-templates/photos/thematic/phase-3-payroll/landscape-01.jpg") : "");
  const elements = applyCopy(JSON.parse(JSON.stringify(compiled.layout.elements)), photoUrl, args.component);
  const deck = {
    schemaVersion: 2,
    id: "proof-" + args.component + "-" + args.variant,
    name: "Proof " + args.component + " " + args.variant,
    tokens: {
      color: {
        bg: "#f3f1ee",
        surface: "#f3f1ee",
        card: "#FFFFFF",
        ink: "#1c1916",
        muted: "#5c564e",
        rule: "#d9d0c6",
        accent: "#8a8175",
        accent2: "#8a8175",
        onAccent: "#f3f1ee",
      },
      font: {
        display: FONT_PAIRS[args.fontPair].display,
        text: FONT_PAIRS[args.fontPair].text,
      },
      type: { h1: 120, body: 28 },
    },
    layoutSequence: [layoutId],
    layouts: {
      [layoutId]: {
        version: 2,
        id: layoutId,
        canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
        elements,
      },
    },
  };

  applyParametric(deck, {
    prompt: "Apex Payroll Solutions proof",
    title: COPY.title,
    density: "balanced",
    skipCover: true,
    skipDensity: true,
    skipTypeContrast: true,
  });
  (deck.layouts[layoutId].elements || []).forEach((el) => {
    if (!el || el.type !== "text") return;
    const canvas = countCanvasLines(el, deck.tokens);
    const lines = Math.max(1, canvas.lines || 1);
    const style = el.textStyle || {};
    const slack = getSlacks().HEIGHT_SLACK || 1.1;
    const needed = Math.round(lines * (Number(style.lineHeight) || 1.2) * (Number(style.fontSize) || 16) * slack * 100) / 100;
    if (needed > (Number(el.height) || 0)) el.height = needed;
    el.textMeasure = Object.assign({}, el.textMeasure || {}, { lines });
  });

  const outDir = args.out
    ? path.resolve(ROOT, args.out)
    : path.join(ROOT, "docs", "template-pipeline", "composer", "proof-" + args.component + "-" + args.variant);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");

  const slides = renderDeck(deck, outDir);
  let analysis = await analyzeDeck(deck, slides, { vision: false });
  analysis = applyComposerFails(analysis, deck);
  const { runPptxGate, applyPptxGate } = require("./pptxGate");
  const gate = await runPptxGate(deck, outDir);
  analysis = applyPptxGate(analysis, gate);
  const geometry = checkGeometry(deck, layoutId);
  deck.qa = {
    score: analysis.score,
    passed: analysis.passed,
    total: analysis.total,
    failures: analysis.failures,
    attempt: 1,
    mode: "manual",
  };
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "analysis.json"), JSON.stringify({ analysis, geometry }, null, 2) + "\n");

  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  const pptxInspect = inspectPptx(pptxPath);

  const buildChrome = path.join(ROOT, "docs", "template-pipeline", "composer", "_build", args.component + "-" + args.variant + "-" + args.fontPair, "chrome.png");
  const coverChrome = path.join(ROOT, "docs", "template-pipeline", "composer", "_build", "cover-" + args.variant + "-" + args.fontPair, "chrome.png");
  const chromeSrc = fs.existsSync(buildChrome) ? buildChrome : coverChrome;
  if (fs.existsSync(chromeSrc)) {
    fs.copyFileSync(chromeSrc, path.join(outDir, "chrome.png"));
  }

  const raster = await rasterizePptx(pptxPath, outDir);
  const canvasLines = countDeckCanvasLines(deck, layoutId);
  const loLines = raster.pdfPath && fs.existsSync(raster.pdfPath)
    ? countLoLines(raster.pdfPath, deck, layoutId)
    : { ok: false, elements: {} };

  const live = deck.layouts[layoutId].elements;
  const title = live.find((el) => el.id === "composer-" + args.component + "-title");
  const body = live.find((el) => el.id === "composer-" + args.component + "-body");
  const inches = (px, axis) => (Number(px) || 0) * (axis === "x" ? 13.333 / 1600 : 7.5 / 900);
  const points = (px) => Math.max(1, Math.round((Number(px) || 16) * 72 * 13.333 / 1600));

  const lineTable = {};
  ["title", "body"].forEach((role) => {
    const el = live.find((e) => e.id === "composer-" + args.component + "-" + role);
    if (!el) return;
    lineTable[role] = {
      chromeMeasure: el.textMeasure && el.textMeasure.lines,
      nodeCanvas: canvasLines[el.id] && canvasLines[el.id].lines,
      libreOffice: loLines.elements && loLines.elements[el.id] && loLines.elements[el.id].lines,
    };
  });

  const summary = {
    outDir: path.relative(ROOT, outDir).split(path.sep).join("/"),
    component: args.component,
    fontPair: args.fontPair,
    variant: args.variant,
    photoUrl: photoUrl || null,
    geometry,
    analysis,
    titleBoxInches: title ? { w: inches(title.width, "x"), h: inches(title.height, "y"), fontPt: points(title.textStyle.fontSize) } : null,
    bodyBoxInches: body ? { w: inches(body.width, "x"), h: inches(body.height, "y"), fontPt: points(body.textStyle.fontSize), chromeLines: body.textMeasure && body.textMeasure.lines } : null,
    lineTable,
    canvasLines,
    loLines,
    pptxInspect,
    paths: {
      chrome: path.join(outDir, "chrome.png"),
      slide: slides[0],
      lo: raster.loSlide || path.join(outDir, "lo-slide.png"),
      pptx: pptxPath,
      pdf: raster.pdfPath || null,
    },
    raster,
  };
  fs.writeFileSync(path.join(outDir, "proof-summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { stagePhoto, COPY, applyCopy };
