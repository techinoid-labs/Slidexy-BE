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
const { expandMotionScenes, FLAGSHIP_MOTION, PREMIUM_MOTION } = require("../../engine/motion");
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
  /** Soften PPT transition→entrance handoff when entrances are enabled. */
  blendEntrances?: boolean;
  /** Flagship default "none" = fade-led (no post-transition entrances). */
  entrancesMode?: "none" | "newOnly" | "all";
  maxEntrances?: number;
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
  /** Atelier / paid pack — written onto deck.json for Flutter entitlement. */
  premium?: boolean;
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

/** Isosceles triangle (peak / delta glyph). */
export const triangle = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  extras: El = {}
): El => ({
  id,
  type: "shape",
  shape: "triangle",
  x,
  y,
  width: w,
  height: h,
  tokenFill: fill,
  z: 1,
  ...extras,
});

/** Chevron (flow / bearing glyph). */
export const chevron = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  extras: El = {}
): El => ({
  id,
  type: "shape",
  shape: "chevron",
  x,
  y,
  width: w,
  height: h,
  tokenFill: fill,
  z: 1,
  ...extras,
});

/** Diamond / rhombus (facet glyph). Point-up. */
export const diamond = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  extras: El = {}
): El => ({
  id,
  type: "shape",
  shape: "diamond",
  x,
  y,
  width: w,
  height: h,
  tokenFill: fill,
  z: 1,
  ...extras,
});

/** Flat-top hexagon (hive glyph). */
export const hexagon = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  extras: El = {}
): El => ({
  id,
  type: "shape",
  shape: "hexagon",
  x,
  y,
  width: w,
  height: h,
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

/** Hovering depth motif — soft-edge blur + heavy offset shadow (native PPTX softEdge + outerShdw). */
export const floatingElement = (
  id: string,
  x: number,
  y: number,
  size: number,
  extras: El = {}
): El => {
  const kind = extras.kind || "dot";
  const fill = extras.fill || extras.tokenFill || "surface";
  const blur = extras.blur != null ? Number(extras.blur) : 5;
  const shadow = extras.shadow || { offsetY: 10, blur: 15, opacity: 0.3, color: "#000000" };
  const w = extras.width != null ? Number(extras.width) : kind === "pill" ? size * 2.4 : size;
  const h = extras.height != null ? Number(extras.height) : kind === "pill" ? size * 0.7 : size;
  const { kind: _k, fill: _f, tokenFill: _t, blur: _b, shadow: _s, width: _w, height: _h, ...rest } = extras;
  return {
    ...rest,
    id,
    type: "shape",
    shape: kind === "pill" ? "rect" : "ellipse",
    x,
    y,
    width: w,
    height: h,
    tokenFill: fill,
    radius: kind === "pill" ? Math.min(w, h) / 2 : 0,
    blur,
    shadow,
    z: extras.z != null ? extras.z : 1000,
    foreground: extras.foreground !== false,
  };
};

/** Preset outer shadows for faux-3D lift (maps to PPTX a:outerShdw). */
export const DEPTH_SHADOWS = {
  soft: { offsetY: 10, blur: 22, opacity: 0.16, color: "#000000" },
  lift: { offsetY: 18, blur: 36, opacity: 0.28, color: "#000000" },
  float: { offsetY: 28, blur: 52, opacity: 0.36, color: "#000000" },
  /** Hard cast onto a ground plane (stage / desk). */
  cast: { offsetY: 28, blur: 12, opacity: 0.48, color: "#000000" },
} as const;

export type DepthShadowKey = keyof typeof DEPTH_SHADOWS;

/**
 * Soft elliptical contact shadow under a lifted plate.
 * Prefer this over softEdge cream washes — opacity keeps PPTX from tinting the slide.
 */
export function contactShadow(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { z?: number; opacity?: number; fill?: string; blur?: number } = {}
): El {
  return asChrome(
    rect(id, x, y, w, h, opts.fill || "ink", {
      z: opts.z != null ? opts.z : 2.4,
      opacity: opts.opacity != null ? opts.opacity : 0.18,
      blur: opts.blur != null ? opts.blur : 28,
      shape: "ellipse",
      ignoreContrast: true,
    })
  );
}

export type DepthPlateOpts = {
  z?: number;
  opacity?: number;
  radius?: number;
  morphId?: string;
  fill?: string;
  /** Under-plate stack count (0–2). Each layer offsets down-right and softens. */
  stack?: 0 | 1 | 2;
  /** Shadow preset on the front plate. */
  shadow?: DepthShadowKey | { offsetY: number; blur: number; opacity: number; color?: string };
  /** Soft contact ellipse under the front plate. */
  contact?: boolean;
  /** Diagonal sheen gradient on front. */
  sheen?: boolean;
  /** Stroke on front plate. */
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  /** Soft-edge blur on under plates only (not front). */
  underBlur?: number;
  beat?: boolean;
  /** Entrance preset when this plate is a beat (e.g. fadeUp, zoomSettle). */
  preset?: string;
};

/**
 * Faux-3D plate: optional under-stack + contact shadow + front face + sheen.
 * Use per-family fills/radii so decks stay unique — shared is the depth recipe only.
 */
export function depthPlate(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: DepthPlateOpts = {}
): El[] {
  const z = opts.z != null ? opts.z : 3;
  const opacity = opts.opacity != null ? opts.opacity : 0.92;
  const radius = opts.radius != null ? opts.radius : 8;
  const fill = opts.fill || "surface";
  const stack = opts.stack != null ? opts.stack : 1;
  const shadow =
    typeof opts.shadow === "string"
      ? DEPTH_SHADOWS[opts.shadow]
      : opts.shadow || DEPTH_SHADOWS.lift;
  const out: El[] = [];

  for (let i = stack; i >= 1; i--) {
    const dx = 10 * i;
    const dy = 12 * i;
    out.push(
      asChrome(
        rect(`${id}-under${i}`, x + dx, y + dy, w, h, fill, {
          z: z - 0.2 * i,
          opacity: Math.max(0.12, opacity * (0.35 - i * 0.08)),
          radius,
          blur: opts.underBlur != null ? opts.underBlur : 4 + i * 2,
          ignoreContrast: true,
        })
      )
    );
  }

  if (opts.contact !== false) {
    out.push(
      contactShadow(`${id}-cast`, x + w * 0.08, y + h - 8, w * 0.84, Math.max(28, h * 0.12), {
        z: z - 0.05,
        opacity: 0.2,
        blur: 32,
      })
    );
  }

  const front = rect(id, x, y, w, h, fill, {
    z,
    opacity,
    radius,
    strokeColor: opts.strokeColor,
    strokeWidth: opts.strokeWidth,
    strokeOpacity: opts.strokeOpacity,
    shadow: { ...shadow },
    ignoreContrast: true,
  });
  out.push(
    opts.morphId || opts.beat
      ? asBeat(front, { morphId: opts.morphId || id, preset: opts.preset })
      : asChrome(front)
  );

  if (opts.sheen !== false) {
    out.push(
      asChrome(
        rect(`${id}-sheen`, x, y, w, h, fill, {
          z: z + 0.15,
          opacity: 1,
          radius,
          ignoreContrast: true,
          gradient: {
            angle: 130,
            stops: [
              { hex: "#FFFFFF", pos: 0, alpha: 0 },
              { hex: "#FFFFFF", pos: 0.45, alpha: 0.04 },
              { hex: "#FFFFFF", pos: 1, alpha: 0.1 },
            ],
          },
        } as any)
      )
    );
  }

  return out;
}

export function writeKit(
  role: string,
  variant: string,
  family: string,
  elements: El[],
  extras: { foregroundLayer?: El[] } = {}
) {
  const slots: El = {};
  const fit: El = {};
  const pptxMapping: El = {};
  let requiresPhoto = false;
  const all = [...elements, ...(extras.foregroundLayer || [])];
  for (const e of all) {
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
    layout: {
      elements,
      ...(extras.foregroundLayer && extras.foregroundLayer.length
        ? { foregroundLayer: extras.foregroundLayer }
        : {}),
    },
  };
  validateKitObject(kit);
  const dir = path.join(ROOT, "kit", role);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, variant + ".json"), JSON.stringify(kit, null, 2));
  return { role, variant };
}

export async function renderTemplate(tpl: Template, publish: boolean, resolveImage?: (query: string) => Promise<{path:string; pexelsId:string}>) {
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
    photoResolver: resolveImage || (async (key: string) => {
      const file = fs.readdirSync(PHOTOS).find((name) => name.startsWith(key));
      if (!file) throw Error("Missing photograph " + key + " for " + tpl.id);
      return { path: path.join(PHOTOS, file), pexelsId: "local:" + key };
    }),
  });
  deck.id = tpl.id;
  deck.name = tpl.name;
  deck.description = tpl.description;
  deck.family = tpl.family;
  if (tpl.premium) deck.premium = true;

  // Premium → role-aware entrances (newOnly). Other flagships stay fade-led.
  const motionCfg =
    tpl.motion === false
      ? null
      : {
          ...(tpl.premium ? PREMIUM_MOTION : FLAGSHIP_MOTION),
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

  const pptxPath = path.join(output, tpl.id + ".pptx");
  // Unique temp name so a locked *.export.pptx (open in PowerPoint) cannot block regen.
  const pptxTemp = path.join(output, tpl.id + ".export-" + Date.now() + ".pptx");
  await exportDeckPptx(deck, pptxTemp);
  let pptxForPublish = pptxTemp;
  try {
    fs.copyFileSync(pptxTemp, pptxPath);
    pptxForPublish = pptxPath;
    try {
      fs.unlinkSync(pptxTemp);
    } catch {
      /* ignore */
    }
  } catch {
    console.warn(tpl.id + ": wrote " + path.basename(pptxTemp) + " (target .pptx locked)");
  }
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
