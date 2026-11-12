/**
 * Shared kit primitives + render/publish pipeline for hand-designed template families.
 * Each template script only declares its brand, content and layouts.
 */
import * as fs from "fs";
import * as path from "path";

const { renderDeckFromSpec } = require("../../engine/render");
const { validateKitObject } = require("../../engine/validateSchema");
const { renderSlidePng } = require("../slideSvg");
const { exportDeckPptx } = require("../../services/templatePipeline/catalog");
const { expandMotionScenes, FLAGSHIP_MOTION } = require("../../engine/motion");
const {
  asBeat,
  asChrome,
  asLabel,
  asDot,
  asTitle,
  asStage,
  asNone,
  annotateDeck,
  lintMotion,
} = require("../../engine/motionGrammar");
const { createCanvas, loadImage } = require("canvas");

/** Re-export motion grammar markers for template authors. */
export { asBeat, asChrome, asLabel, asDot, asTitle, asStage, asNone, annotateDeck, lintMotion };

export const ROOT = path.join(__dirname, "..", "..");
export const PHOTOS = path.join(ROOT, "engine/cache/photos");

export type El = Record<string, any>;

export type MotionOpts = {
  morph?: boolean;
  ambient?: boolean;
  continuityFade?: boolean;
  cameraPan?: boolean;
  scatter?: boolean;
  defaultTransition?: "fade" | "push" | "wipe" | "morph" | "none";
  durationMs?: number;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  family: string;
  brand: El;
  slides: El[];
  kits: () => { role: string; variant: string }[];
  /**
   * Motion profile. Creative flagships default to FLAGSHIP_MOTION
   * (continuity fade + ambient, Morph off) when omitted.
   */
  motion?: MotionOpts | false;
};

export const text = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  slot: string,
  color = "ink",
  extras: El = {}
): El => ({
  id,
  type: "text",
  x,
  y,
  width: w,
  // Tall-ascender display faces (DM Serif, Instrument Serif) measure ~1.4em per line.
  height: Math.max(h, Math.ceil(fontSize * 1.42)),
  fontSize,
  slot,
  tokenColor: color,
  fontRole: slot === "title" || fontSize >= 70 ? "display" : "body",
  fontWeight: slot === "title" || fontSize >= 48 ? 700 : 400,
  lineHeight: 1.12,
  letterSpacing: 0,
  z: 4,
  ...extras,
});

export const rect = (id: string, x: number, y: number, w: number, h: number, fill: string, extras: El = {}): El => ({
  id,
  type: "shape",
  shape: "rect",
  x,
  y,
  width: w,
  height: h,
  tokenFill: fill,
  z: 1,
  ...extras,
});

export const circle = (id: string, x: number, y: number, size: number, fill: string, extras: El = {}): El => ({
  id,
  type: "shape",
  shape: "ellipse",
  x,
  y,
  width: size,
  height: size,
  tokenFill: fill,
  z: 1,
  ...extras,
});

export const photo = (id: string, x: number, y: number, w: number, h: number, extras: El = {}): El => ({
  id,
  type: "image",
  x,
  y,
  width: w,
  height: h,
  z: 1,
  slot: "photo",
  ...extras,
});

export function writeKit(role: string, variant: string, family: string, elements: El[]) {
  const slots: El = {};
  const fit: El = {};
  const pptxMapping: El = {};
  let requiresPhoto = false;
  for (const e of elements) {
    if (e.type === "text" && e.slot) {
      slots[e.slot] = e.slot.startsWith("copy")
        ? { kind: "text", from: "items" + Number(String(e.slot).replace("copy", "")) }
        : { kind: "text", from: e.slot };
      fit[e.slot] = {
        minFont: e.fontSize,
        maxFont: e.fontSize,
        lineClamp: Math.max(1, Math.floor(e.height / (e.fontSize * 1.15))),
        shrinkMin: 1,
      };
      pptxMapping[e.slot] = { kind: "text" };
    }
    if (e.type === "image" && e.slot === "photo") {
      requiresPhoto = true;
      slots.photo = { kind: "image", from: "photo" };
      pptxMapping.photo = { kind: "picture" };
    }
  }
  const kit = {
    id: `${role}/${variant}`,
    role,
    variant,
    family,
    status: "approved",
    preserveLayout: true,
    requiresPhoto,
    photoSlots: requiresPhoto ? ["photo"] : [],
    slots,
    fit,
    pptxMapping,
    layout: { elements },
  };
  validateKitObject(kit);
  const dir = path.join(ROOT, "kit", role);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, variant + ".json"), JSON.stringify(kit, null, 2));
  return { role, variant };
}

export async function renderTemplate(tpl: Template, publish: boolean) {
  const selections = tpl.kits();
  const example = {
    name: tpl.name,
    description: tpl.description,
    brand: tpl.brand,
    spec: {
      style: { palette: "ink-night", typePair: "modern-segoe", motif: "bar-accent", family: tpl.family },
      slides: tpl.slides,
    },
    selections,
  };
  fs.writeFileSync(path.join(ROOT, "examples", tpl.id + ".json"), JSON.stringify(example, null, 2));

  const output = path.join(ROOT, "out", tpl.id);
  fs.mkdirSync(output, { recursive: true });
  // Drop stale slide PNGs so a shorter Morph-expanded deck can't leave slide-07 behind
  for (const name of fs.readdirSync(output)) {
    if (/^slide-\d+\.png$/i.test(name) || name === "preview.png") {
      fs.unlinkSync(path.join(output, name));
    }
  }

  const deck = await renderDeckFromSpec(example.spec, selections, {
    id: tpl.id,
    brand: tpl.brand,
    photoResolver: async (key: string) => {
      const file = fs.readdirSync(PHOTOS).find((name) => name.startsWith(key));
      if (!file) throw Error("Missing photograph " + key + " for " + tpl.id);
      return { path: path.join(PHOTOS, file), pexelsId: "local:" + key };
    },
  });
  deck.id = tpl.id;
  deck.name = tpl.name;
  deck.description = tpl.description;
  deck.family = tpl.family;

  // Creative flagships get continuity motion by default unless motion: false
  const motionCfg =
    tpl.motion === false
      ? null
      : {
          ...FLAGSHIP_MOTION,
          ...(tpl.motion || {}),
        };
  if (motionCfg) {
    const expanded = expandMotionScenes(deck, motionCfg);
    Object.assign(deck, expanded);
  }
  annotateDeck(deck);
  const lint = lintMotion(deck);
  if (lint.errors.length) {
    throw Error(`${tpl.id} motion lint: ${lint.errors.join("; ")}`);
  }
  if (lint.warnings.length) {
    console.warn(`${tpl.id} motion warnings:\n  - ${lint.warnings.join("\n  - ")}`);
  }
  for (const lid of deck.layoutSequence || []) {
    if (deck.layouts[lid]) deck.layouts[lid].family = tpl.family;
  }

  const count = deck.layoutSequence.length;
  const sheet = createCanvas(1280, 368 * Math.ceil(count / 2));
  const ctx = sheet.getContext("2d");
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  for (const [i, lid] of deck.layoutSequence.entries()) {
    const n = String(i + 1);
    const file = path.join(output, "slide-" + n + ".png");
    const padded = path.join(output, "slide-" + n.padStart(2, "0") + ".png");
    for (const e of deck.layouts[lid].elements) {
      if (e.textContent?.spans.some((s: any) => String(s.text).includes("…"))) {
        throw Error(`${tpl.id} slide ${i + 1} truncated: ${e.id}`);
      }
    }
    const warnings = renderSlidePng(deck, lid, file);
    if (warnings.length) throw Error(`${tpl.id}: ${warnings.join("; ")}`);
    fs.copyFileSync(file, padded);
    ctx.drawImage(await loadImage(file), (i % 2) * 640 + 4, Math.floor(i / 2) * 368 + 4, 632, 355.5);
  }
  fs.writeFileSync(path.join(output, "preview.png"), sheet.toBuffer("image/png"));

  const pptxTemp = path.join(output, tpl.id + ".export.pptx");
  const pptxPath = path.join(output, tpl.id + ".pptx");
  await exportDeckPptx(deck, pptxTemp);
  try {
    fs.copyFileSync(pptxTemp, pptxPath);
    fs.unlinkSync(pptxTemp);
  } catch {
    console.warn(tpl.id + ": kept export pptx (target locked)");
  }
  const pptxForPublish = fs.existsSync(pptxPath) ? pptxPath : pptxTemp;
  fs.writeFileSync(path.join(output, "deck.json"), JSON.stringify(deck, null, 2));
  console.log("PASS", tpl.id, "→", path.relative(ROOT, output));
  if (!publish) return;

  const jobId = `${tpl.id}-release-${Date.now()}`;
  const stage = path.join(ROOT, "docs/template-pipeline/admin-dashboard/tmp", jobId);
  const photoDir = path.join(ROOT, "generated-templates/photos/composer", jobId);
  fs.mkdirSync(stage, { recursive: true });
  fs.mkdirSync(photoDir, { recursive: true });
  const staged = JSON.parse(JSON.stringify(deck));
  for (const lid of staged.layoutSequence) {
    for (const e of staged.layouts[lid].elements) {
      const content = e.imageContent || e.maskedImageContent;
      if (!content?.url) continue;
      const name = path.basename(content.url);
      const source = [
        path.join(ROOT, "generated-templates", content.url),
        path.join(ROOT, "generated-templates/photos/engine-v1", name),
        path.join(PHOTOS, name),
      ].find((p) => fs.existsSync(p));
      if (!source) throw Error("Missing publish photo " + content.url);
      fs.copyFileSync(source, path.join(photoDir, name));
      content.url = `photos/composer/${jobId}/${name}`;
    }
  }
  fs.writeFileSync(path.join(stage, "deck.json"), JSON.stringify(staged, null, 2));
  for (let i = 1; i <= count; i++) {
    const padded = "slide-" + String(i).padStart(2, "0") + ".png";
    fs.copyFileSync(path.join(output, padded), path.join(stage, padded));
  }
  fs.copyFileSync(pptxForPublish, path.join(stage, "deck.pptx"));
  const { publishTemplate } = require("../../services/templatePipeline/adminCatalog");
  const result = await publishTemplate(jobId);
  const { listCatalog, readCatalog, buildPptx } = require("../../services/templatePipeline/catalog");
  if (!listCatalog().some((e: any) => e.id === tpl.id)) throw Error("Missing catalog " + tpl.id);
  if (readCatalog(tpl.id).slides.length !== count) throw Error("Missing previews " + tpl.id);
  const download = await buildPptx(tpl.id);
  if (!download.buffer || download.buffer.length < 1000) throw Error("Empty pptx " + tpl.id);
  fs.writeFileSync(
    path.join(output, "release.json"),
    JSON.stringify({ ...result, verified: { previews: count, downloadBytes: download.buffer.length } }, null, 2)
  );
  console.log("Published", tpl.id);
}

export async function runTemplates(templates: Template[]) {
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
  const picked = only ? templates.filter((t) => t.id === only) : templates;
  if (!picked.length) throw Error("No templates matched");
  const publish = process.argv.includes("--publish-local");
  for (const tpl of picked) await renderTemplate(tpl, publish);
  console.log("Done:", picked.map((t) => t.id).join(", "));
}
