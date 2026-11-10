const fs = require("fs");
const path = require("path");
import { DeckSpec } from "./types";
const { fitText } = require("./fit");
const { safePhoto, queriesForSlots } = require("./photos");
const {
  normalizeSlideContent,
  expandOverflowSlides,
  resolveContentDensity,
  typographyFloors,
  MIN_READABLE_PT,
  ptToEngine,
  AXIS_LABEL_MIN_PT,
} = require("./content");
const { selectAll } = require("./selectVariant");
const { applyBrandTokens } = require("./brand");
const {
  normalizeKit,
  validateKitObject,
  validateTokensObject,
  enforceLockedGeometry,
  SchemaValidationError,
} = require("./validateSchema");
const {
  applyGlobalPrimitives,
  enrichPalette,
  typographyLimits,
  dataVizRules,
  getTheme,
  resolveCatalogWorld,
  catalogCardRadius,
} = require("./primitives");
const { parseHighlightSpans, stripHighlightMarkers } = require("./highlight");
const { extractHeroStat } = require("./heroStat");
const { getAssetService } = require("./asset-service");
const {
  inferTextStyleRole,
  resolveTextStyle,
  normalizeTreatment,
  guardDepthTreatment,
  isDepthTreatment,
} = require("./textStyles");

/** Map style.imageTreatment → photo tone for theme catalog worlds. */
function resolveImageTone(treatment: string, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const t = String(treatment || "");
  if (t === "contrast-bw" || t === "bw-harsh") return "bw-harsh";
  if (t === "sepia-duotone") return "sepia";
  if (t === "navy-duotone") return "navy-duotone";
  if (t === "neon-tint") return "neon";
  if (t === "color-soft") return "color-soft";
  return undefined;
}

const ROOT = path.join(__dirname, "..");
const KIT = path.join(ROOT, "kit");
const PHOTO_PUB = path.join(ROOT, "generated-templates", "photos", "engine-v1");
const ASSET_PUB = path.join(ROOT, "generated-templates", "photos", "smart-assets");
const tokensDoc = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));
validateTokensObject(tokensDoc, "engine/tokens.json");

/** Copy cached smart-asset into generated-templates so PNG/PPTX resolvers can find it. */
function publishAsset(absPath: string): string {
  fs.mkdirSync(ASSET_PUB, { recursive: true });
  const name = path.basename(absPath);
  const dest = path.join(ASSET_PUB, name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(absPath).size) {
    fs.copyFileSync(absPath, dest);
  }
  return "photos/smart-assets/" + name;
}

/** PPTX-native masks: circle, roundedRect, rect, arch, pill. */
function resolveMask(el: any): { kind: string; cornerRadius: number } | null {
  const mask = String(el.mask || "").trim();
  const radius = Number(el.radius) || 0;
  if (mask === "circle" || mask === "ellipse") {
    return { kind: "ellipse", cornerRadius: Math.min(el.width, el.height) / 2 };
  }
  if (mask === "pill") {
    // Stadium / pill — fully rounded ends (OOXML adj 50000)
    return { kind: "pill", cornerRadius: Math.min(el.width, el.height) / 2 };
  }
  if (mask === "arch") {
    // Editorial arch — soft roundRect (distinct from generic roundedRect)
    return { kind: "arch", cornerRadius: radius || 28000 };
  }
  if (mask === "roundedRect") {
    return { kind: "rect", cornerRadius: radius || 24 };
  }
  if (mask === "rect") return { kind: "rect", cornerRadius: 0 };
  if (radius > 0) {
    const isCircle = radius >= Math.min(el.width, el.height) / 2 - 1;
    return isCircle
      ? { kind: "ellipse", cornerRadius: radius }
      : { kind: "rect", cornerRadius: radius };
  }
  return null;
}

function loadVariant(role: string, variant: string) {
  const file = path.join(KIT, role, variant + ".json");
  const kit = JSON.parse(fs.readFileSync(file, "utf8"));
  normalizeKit(kit);
  validateKitObject(kit, "kit/" + role + "/" + variant + ".json");
  return kit;
}

function packBullets(items: any[]): string {
  return (items || [])
    .map((b: any) => String(b || "").trim())
    .filter(Boolean)
    .map((b: string) => (/^•|^-/.test(b) ? b.replace(/^-+\s*/, "• ") : "• " + b))
    .join("\n");
}

function resolveSteps(slide: any): any[] {
  if (Array.isArray(slide.steps) && slide.steps.length) return slide.steps;
  const dates = Array.isArray(slide.dates) ? slide.dates : [];
  const body = Array.isArray(slide.body) ? slide.body : [];
  if (!dates.length && !body.length) return [];
  const n = Math.max(dates.length, Math.min(4, body.length));
  const out: any[] = [];
  for (let i = 0; i < n; i++) {
    const raw = String(body[i] || "");
    const parts = raw.split(/\s+[—–-]\s+/);
    out.push({
      date: dates[i] || "",
      title: parts[0] || raw || "Step " + (i + 1),
      body: parts.slice(1).join(" — ") || "",
    });
  }
  return out;
}

function resolveTiers(slide: any): any[] {
  if (Array.isArray(slide.tiers) && slide.tiers.length) return slide.tiers;
  if (Array.isArray(slide.pricing) && slide.pricing.length) return slide.pricing;
  return [];
}

function slotText(slide: any, from: string): string {
  if (!from) return "";
  if (from === "title") return slide.title || "";
  const itemMatch = from.match(/^items(\d+)$/);
  if (itemMatch) return (slide.items && slide.items[Number(itemMatch[1])]) || "";
  if (from === "caption") return slide.caption || "";
  if (from === "takeaway")
    return (
      slide.takeaway ||
      (Array.isArray(slide.body) && slide.body[0]) ||
      slide.caption ||
      ""
    );
  if (from === "heroStat") {
    if (slide.heroStat) return String(slide.heroStat);
    const source = Array.isArray(slide.body) && slide.body[0] ? slide.body[0] : slide.caption || "";
    return extractHeroStat(String(source)).hero;
  }
  if (from === "body") {
    return packBullets(slide.body || []);
  }
  if (from === "before") {
    if (Array.isArray(slide.before) && slide.before.length) return packBullets(slide.before);
    return packBullets((slide.body || []).slice(0, Math.ceil((slide.body || []).length / 2)));
  }
  if (from === "after") {
    if (Array.isArray(slide.after) && slide.after.length) return packBullets(slide.after);
    const body = slide.body || [];
    return packBullets(body.slice(Math.ceil(body.length / 2)));
  }
  const headerM = String(from).match(/^headers(\d)$/);
  if (headerM) {
    const headers = slide.headers || slide.columnHeaders || [];
    const idx = Number(headerM[1]);
    if (headers && headers[idx]) return headers[idx];
    if (idx === 0 && (slide.before || slide.after)) return "Before";
    if (idx === 1 && (slide.before || slide.after)) return "After";
    return "";
  }
  const bodyM = String(from).match(/^body(\d)$/);
  if (bodyM) return (slide.body && slide.body[Number(bodyM[1])]) || "";
  const statsM = String(from).match(/^stats(\d)\.(value|label)$/);
  if (statsM) {
    const item = slide.stats && slide.stats[Number(statsM[1])];
    return (item && item[statsM[2]]) || "";
  }
  const stepsM = String(from).match(/^steps(\d)\.(title|body|date|label)$/);
  if (stepsM) {
    const step = resolveSteps(slide)[Number(stepsM[1])];
    if (!step) return "";
    const key = stepsM[2] === "label" ? "title" : stepsM[2];
    return String(step[key] || "");
  }
  const tiersM = String(from).match(/^tiers(\d)\.(name|price|features|badge)$/);
  if (tiersM) {
    const tier = resolveTiers(slide)[Number(tiersM[1])];
    if (!tier) {
      if (tiersM[2] === "badge" && Number(tiersM[1]) === 1) return "Most Popular";
      return "";
    }
    if (tiersM[2] === "features") {
      const feats = Array.isArray(tier.features) ? tier.features : [];
      return packBullets(feats);
    }
    if (tiersM[2] === "badge") {
      if (tier.badge) return String(tier.badge);
      if (tier.popular || Number(tiersM[1]) === 1) return "Most Popular";
      return "";
    }
    return String(tier[tiersM[2]] || "");
  }
  const memM = String(from).match(/^members(\d)\.(name|role)$/);
  if (memM) {
    const item = slide.members && slide.members[Number(memM[1])];
    return (item && item[memM[2]]) || "";
  }
  if (from === "memberLine") {
    return (slide.members || [])
      .map((m: any) => (m.name || "") + (m.role ? " — " + m.role : ""))
      .join("\n");
  }
  if (from === "memberCard") {
    const m = slide.members && slide.members[0];
    if (!m) return "";
    return (m.name || "") + (m.role ? "\n" + m.role : "");
  }
  return "";
}

function slideTable(slide: any): string[][] {
  const raw = slide && slide.table;
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map((row: any) => {
    if (!Array.isArray(row)) return [String(row || "")];
    return row.map((cell: any) => {
      if (cell && typeof cell === "object") return String(cell.text != null ? cell.text : "");
      return String(cell != null ? cell : "");
    });
  });
}

function publishPhoto(absPath: string): string {
  fs.mkdirSync(PHOTO_PUB, { recursive: true });
  const name = path.basename(absPath);
  const dest = path.join(PHOTO_PUB, name);
  if (!fs.existsSync(dest)) fs.copyFileSync(absPath, dest);
  return "photos/engine-v1/" + name;
}

function paletteDarkHex(palette: any): string {
  const bg = palette.bg || "#111111";
  const ink = palette.ink || "#111111";
  return relativeLuminance(bg) <= relativeLuminance(ink) ? bg : ink;
}

/** WCAG relative luminance (sRGB). */
function relativeLuminance(hex: string): number {
  const h = String(hex || "").replace("#", "");
  if (h.length < 6) return 0.5;
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLin(parseInt(h.slice(0, 2), 16));
  const g = toLin(parseInt(h.slice(2, 4), 16));
  const b = toLin(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * If fg/bg fail WCAG AA (4.5:1 normal, 3:1 large), flip to white or near-black —
 * whichever contrasts better against the local background.
 */
function ensureContrast(fg: string, bg: string, largeText: boolean): string {
  const min = largeText ? 3 : 4.5;
  if (contrastRatio(fg, bg) >= min) return fg;
  const white = "#FFFFFF";
  const black = "#0A0A0A";
  return contrastRatio(white, bg) >= contrastRatio(black, bg) ? white : black;
}

type ContrastRegion = {
  z: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

function collectContrastRegions(layoutEls: any[], palette: any): ContrastRegion[] {
  const regions: ContrastRegion[] = [];
  const slideBg = palette.bg || "#FFFFFF";
  const photoProxy = palette.dark ? "#141414" : "#2A2A2A";
  for (const el of layoutEls || []) {
    if (!el || el.x == null || el.y == null || el.width == null || el.height == null) continue;
    if (el.type === "shape") {
      const fillKey = el.tokenFill || "surface";
      let color =
        fillKey === "card_bg"
          ? palette.card_bg || palette.surface || slideBg
          : palette[fillKey] || palette.surface || slideBg;
      const opacity = el.opacity != null ? Number(el.opacity) : 1;
      if (opacity < 1 && opacity >= 0) {
        // Approximate translucent wash over slide bg
        const mix = (a: string, b: string, t: number) => {
          const pa = String(a).replace("#", "");
          const pb = String(b).replace("#", "");
          if (pa.length < 6 || pb.length < 6) return a;
          const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
          const m = (i: number) => Math.round(ch(pa, i) * t + ch(pb, i) * (1 - t));
          const hex = (n: number) => n.toString(16).padStart(2, "0");
          return "#" + hex(m(0)) + hex(m(2)) + hex(m(4));
        };
        color = mix(String(color), slideBg, opacity);
      }
      regions.push({
        z: Number(el.z) || 0,
        x: Number(el.x),
        y: Number(el.y),
        w: Number(el.width),
        h: Number(el.height),
        color: String(color),
      });
    } else if (el.type === "image") {
      regions.push({
        z: Number(el.z) || 0,
        x: Number(el.x),
        y: Number(el.y),
        w: Number(el.width),
        h: Number(el.height),
        color: photoProxy,
      });
    }
  }
  return regions;
}

function bgBehindText(
  regions: ContrastRegion[],
  x: number,
  y: number,
  width: number,
  height: number,
  slideBg: string
): string {
  const cx = x + width / 2;
  const cy = y + height / 2;
  let best: ContrastRegion | null = null;
  for (const r of regions) {
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
      if (!best || r.z >= best.z) best = r;
    }
  }
  return best ? best.color : slideBg;
}

/** Organic underline = chain of soft ellipses (editable shapes, not a brush raster). */
function brushStrokeShapes(
  el: any,
  fill: string,
  zBase: number,
  pptxGroup?: string
): any[] {
  const count = Math.max(3, Math.min(7, Math.round(el.width / 36)));
  const out: any[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const wobble = Math.sin(i * 1.7) * (el.height * 0.35);
    const w = el.width / count + 8;
    out.push({
      id: el.id + "-brush-" + i,
      type: "shape",
      x: el.x + t * (el.width - w * 0.6),
      y: el.y + wobble,
      width: w,
      height: el.height * (0.85 + (i % 2) * 0.25),
      zIndex: zBase,
      opacity: el.opacity != null ? el.opacity : 0.92,
      pptxGroup,
      shapeContent: {
        kind: "circle",
        fill,
        cornerRadius: 0,
      },
    });
  }
  return out;
}

function ghostStepNumber(
  slideIndex: number,
  role: string,
  palette: any,
  typePair: any
): any | null {
  if (role !== "agenda" && role !== "how-it-works") return null;
  const label = String(slideIndex + 1).padStart(2, "0");
  const color = palette.ink || "#FFFFFF";
  return {
    id: "ghost-step",
    type: "text",
    x: 40,
    y: 40,
    width: 900,
    height: 520,
    zIndex: 0,
    opacity: 0.1,
    textStyle: {
      fontFamily: typePair.display,
      fontSize: 320,
      fontWeight: 700,
      color,
      textAlign: "left",
      verticalAlign: "top",
      lineHeight: 1,
    },
    textContent: {
      spans: [
        {
          text: label,
          fontFamily: typePair.display,
          fontSize: 320,
          fontWeight: 700,
          color,
        },
      ],
    },
  };
}

export async function renderDeckFromSpec(
  spec: DeckSpec,
  selections: Array<{ role: string; variant: string }>,
  options?: { id?: string; usedPexelsIds?: Set<string>; brand?: any;
    photoResolver?: typeof safePhoto }
): Promise<any> {
  const worldKey = String(spec.style.palette || "");
  const world = resolveCatalogWorld(worldKey);
  const basePalette = enrichPalette(tokensDoc.palettes[spec.style.palette], worldKey);
  const typePairKey =
    (world && world.typePair) || spec.style.typePair;
  const baseTypePair = tokensDoc.typePairs[typePairKey] || tokensDoc.typePairs[spec.style.typePair];
  const branded = applyBrandTokens(basePalette, baseTypePair, options && options.brand);
  const palette = enrichPalette(branded.palette, worldKey);
  const typePair = {
    ...branded.typePair,
    letterSpacing:
      (branded.typePair && branded.typePair.letterSpacing) != null
        ? branded.typePair.letterSpacing
        : world && world.typography
          ? world.typography.letterSpacing
          : 0,
    titleLetterSpacing:
      (branded.typePair && branded.typePair.titleLetterSpacing) != null
        ? branded.typePair.titleLetterSpacing
        : world && world.typography
          ? world.typography.titleLetterSpacing
          : 0,
  };
  const treatmentRaw =
    (world && world.imageTreatment) ||
    (spec.style.imageTreatment === "duotone" ? "tint" : spec.style.imageTreatment);
  const treatment = treatmentRaw === "duotone" ? "tint" : treatmentRaw;
  const defaultImageTone =
    (world && world.imageTone) || resolveImageTone(String(treatment || ""));
  const typeTreatment = normalizeTreatment((spec.style as any).typeTreatment);
  const rawMotif = (world && world.motif) || spec.style.motif || "bar-accent";
  const motifId =
    rawMotif === "brush-stroke" || rawMotif === "bar-accent" ? "refined" : rawMotif;
  const deckId = (options && options.id) || "kit-v1";
  const density = resolveContentDensity(spec);
  const floors = typographyFloors(density);
  const typoLimits = typographyLimits();
  const viz = dataVizRules();
  const theme = getTheme();
  const cardRadius = catalogCardRadius(palette, world);
  // Overflow routing before layout — >80-word body blocks become continued slides
  const preparedSlides = expandOverflowSlides(spec.slides || []).map((s: any) =>
    normalizeSlideContent(s, density)
  );
  let resolvedSelections = selections || [];
  if (resolvedSelections.length !== preparedSlides.length) {
    const preparedSpec = { ...spec, slides: preparedSlides };
    resolvedSelections = selectAll(preparedSpec, deckId + "|overflow");
    preparedSlides.forEach((slide: any, idx: number) => {
      if (slide.variantHint && resolvedSelections[idx]) {
        resolvedSelections[idx] = { role: slide.role, variant: String(slide.variantHint) };
      }
    });
  }
  const layouts: any = {};
  const layoutSequence: string[] = [];
  const usedPexelsIds: Set<string> = (options && options.usedPexelsIds) || new Set();
  const photoByQuery: Record<string, string> = {};

  async function photoRel(
    query: string,
    orientation: string,
    crop?: string,
    tone?: string
  ): Promise<string> {
    const cropMode = crop || "cover";
    const orient = cropMode.startsWith("top-center")
      ? "portrait"
      : orientation === "portrait" || orientation === "square"
        ? orientation
        : "landscape";
    const key = query + "|" + orient + "|" + cropMode + "|" + (tone || "color");
    if (photoByQuery[key]) return photoByQuery[key];
    const got = await (options?.photoResolver || safePhoto)(query, orient, treatment, palette, usedPexelsIds, cropMode, tone);
    if (got.pexelsId) usedPexelsIds.add(String(got.pexelsId));
    const rel = publishPhoto(got.path);
    photoByQuery[key] = rel;
    return rel;
  }

  /** Image Tension: break out of the kit box by ~15% so the photo overlaps the field. */
  function applyImageTension(box: { x: number; y: number; width: number; height: number }, el: any) {
    const tension =
      el.tension != null ? Number(el.tension) : el.offset === true || el.offset === "breakout" ? 0.15 : 0;
    if (!(tension > 0)) return box;
    const dx = Math.round(box.width * tension);
    const dy = Math.round(box.height * tension);
    return {
      x: box.x - Math.round(dx * 0.35),
      y: box.y - Math.round(dy * 0.25),
      width: box.width + dx,
      height: box.height + dy,
    };
  }

  function expandSparkBars(el: any, fill: string, zIndex: number, groupId?: string): any[] {
    const bars: number[] = Array.isArray(el.bars) && el.bars.length ? el.bars : [0.4, 0.6, 0.5, 0.8];
    const gap = 10;
    const n = bars.length;
    const axisH = 3;
    const chartH = Math.max(24, el.height - 28);
    const barW = Math.max(10, Math.floor((el.width - gap * (n - 1)) / n));
    const muted = palette.line || palette.muted || fill;
    const out: any[] = [];
    // Baseline — clean axis, no diagonal segments
    out.push({
      id: el.id + "-axis",
      type: "shape",
      x: el.x,
      y: el.y + chartH,
      width: el.width,
      height: axisH,
      zIndex,
      pptxGroup: groupId,
      shapeContent: { kind: "rect", fill: muted, cornerRadius: 0 },
    });
    bars.forEach((t: number, i: number) => {
      const h = Math.max(6, Math.round(chartH * Math.min(1, Math.max(0.08, Number(t) || 0))));
      out.push({
        id: el.id + "-bar-" + i,
        type: "shape",
        x: el.x + i * (barW + gap),
        y: el.y + chartH - h,
        width: barW,
        height: h,
        zIndex: zIndex + 0.1,
        pptxGroup: groupId,
        opacity: 0.92,
        shapeContent: { kind: "rect", fill, cornerRadius: 2 },
      });
    });
    return out;
  }

  /** Disabled: rotated hairline segments rendered as glitchy diagonals over bars. */
  function expandSparkLine(_el: any, _stroke: string, _zIndex: number, _groupId?: string): any[] {
    return [];
  }

  /** team/b: column width from member count; 1:1 cells; centered row. */
  function teamGridLayout(count: number) {
    const n = Math.max(1, Math.min(4, count | 0));
    const marginX = 80;
    const usable = 1600 - marginX * 2;
    const gap = n >= 4 ? 40 : n === 3 ? 56 : 72;
    const cardW = Math.floor((usable - (n - 1) * gap) / n);
    const cardH = cardW;
    const rowW = n * cardW + (n - 1) * gap;
    const startX = Math.round((1600 - rowW) / 2);
    const blockH = cardH + 100;
    const photoY = Math.max(200, Math.round((900 - blockH) / 2));
    const nameY = photoY + cardH + 20;
    const roleY = nameY + 40;
    return { n, cardW, cardH, gap, startX, photoY, nameY, roleY };
  }

  /** feature/b: 2–6 items → cols by count (3→33%, 4→2×2, 6→2×3); centered. */
  function featureGridLayout(count: number) {
    const n = Math.max(1, Math.min(6, count | 0));
    const cols = n <= 3 ? n : n === 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const marginX = 80;
    const marginTop = 176;
    const marginBottom = 48;
    const usableW = 1600 - marginX * 2;
    const usableH = 900 - marginTop - marginBottom;
    const gapX = cols >= 3 ? 28 : 40;
    const gapY = 24;
    const cellW = Math.floor((usableW - (cols - 1) * gapX) / cols);
    const cellH = Math.floor((usableH - (rows - 1) * gapY) / rows);
    const photoW = Math.floor(cellW * 0.42);
    const photoH = Math.min(cellH - 8, Math.max(100, Math.floor(photoW * 0.82)));
    const labelW = Math.max(80, cellW - photoW - 16);
    const gridW = cols * cellW + (cols - 1) * gapX;
    const gridH = rows * cellH + (rows - 1) * gapY;
    const startX = Math.round((1600 - gridW) / 2);
    const startY = marginTop + Math.max(0, Math.floor((usableH - gridH) / 2));
    return { n, cols, rows, cellW, cellH, gapX, gapY, photoW, photoH, labelW, startX, startY };
  }

  function featureCell(g: ReturnType<typeof featureGridLayout>, idx: number) {
    const col = idx % g.cols;
    const row = Math.floor(idx / g.cols);
    const cx = g.startX + col * (g.cellW + g.gapX);
    const cy = g.startY + row * (g.cellH + g.gapY);
    const photoY = cy + Math.floor((g.cellH - g.photoH) / 2);
    return {
      photo: { x: cx, y: photoY, w: g.photoW, h: g.photoH },
      label: { x: cx + g.photoW + 12, y: photoY, w: g.labelW, h: g.photoH },
    };
  }

  /** stats/a: 1–3 columns from stats length; centered, no empty gap. */
  function statsGridLayout(count: number) {
    const n = Math.max(1, Math.min(3, count | 0));
    const marginX = 80;
    const usable = 1600 - marginX * 2;
    const gap = n === 1 ? 0 : 48;
    const colW = Math.floor((usable - (n - 1) * gap) / n);
    const rowW = n * colW + (n - 1) * gap;
    const startX = Math.round((1600 - rowW) / 2);
    return { n, colW, gap, startX, valueY: 300, labelY: 500, valueH: 160, labelH: 80 };
  }

  for (let i = 0; i < preparedSlides.length; i++) {
    // Density-aware normalize already applied; overflow already split
    const slide = preparedSlides[i];
    const sel = resolvedSelections[i] || { role: slide.role, variant: slide.variantHint || "a" };
    const variant = loadVariant(sel.role, sel.variant);
    const layoutId = "slide-" + String(i + 1).padStart(2, "0");
    layoutSequence.push(layoutId);
    const elements: any[] = [];
    const photoSlotIds: string[] = variant.photoSlots || [];
    const memberCount = Array.isArray(slide.members) ? slide.members.length : 0;
    const statsCount = Array.isArray(slide.stats) ? slide.stats.length : 0;
    const featureCount = Math.max(
      Array.isArray(slide.body) ? slide.body.length : 0,
      Array.isArray(slide.photoQueries) ? slide.photoQueries.length : 0
    );
    const querySlotCount =
      variant.id === "feature/b" && featureCount > 0
        ? Math.min(photoSlotIds.length, featureCount)
        : variant.id === "team/b" && memberCount > 0
          ? Math.min(photoSlotIds.length, memberCount)
          : photoSlotIds.length;
    const queries = queriesForSlots(slide, querySlotCount);
    let photoSlotCursor = 0;
    const defaultGroup = variant.pptxGroup || null;
    const photoOrients: string[] = Array.isArray((slide as any).photoOrientations)
      ? (slide as any).photoOrientations
      : [];
    const ghost = ghostStepNumber(i, slide.role, palette, typePair);
    if (ghost && !variant.preserveLayout) elements.push(ghost);

    // Global primitives: header / callout / list — strips thick bars & ellipse brushes
    const layoutEls = variant.preserveLayout ? variant.layout.elements : applyGlobalPrimitives(
      variant.layout.elements || [],
      slide,
      palette,
      typePair,
      { kitId: variant.id }
    );
    const contrastRegions = collectContrastRegions(layoutEls, palette);

    // Kit typography floor enforcement (schema-level hard limits)
    Object.keys(variant.fit || {}).forEach((slot) => {
      const rule = variant.fit[slot] || {};
      const isTitleSlot = slot === "title" || slot === "takeaway" || /^h[A-Z]/.test(slot);
      const floorPt = isTitleSlot ? typoLimits.titleMinPt : typoLimits.bodyMinPt;
      if (rule.minFont != null && Number(rule.minFont) < ptToEngine(floorPt) * 0.55) {
        // Legacy kits still store canvas-ish sizes; only throw when clearly below true floor intent
        const engineFloor = ptToEngine(floorPt);
        if (Number(rule.minFont) < engineFloor && Number(rule.minFont) < floorPt) {
          throw new SchemaValidationError(
            "Typography floor violated in " + variant.id,
            [
              slot +
                " minFont " +
                rule.minFont +
                " is below hard floor " +
                floorPt +
                "pt (engine " +
                engineFloor +
                ")",
            ]
          );
        }
      }
    });

    for (const el of layoutEls) {
      // Already-expanded primitive nodes (text/shape with textContent/shapeContent)
      if (el && el.textContent && el.textStyle && !el.slot) {
        elements.push(el);
        continue;
      }
      if (el && el.shapeContent && el.type === "shape" && (el.card || el.morphId === "accent" || el.morphId === "accent-square" || String(el.id || "").includes("-hairline") || String(el.id || "").includes("-square") || String(el.id || "").includes("-icon-") || String(el.id || "").includes("-plate"))) {
        elements.push(el);
        continue;
      }
      if (el && el.textContent && el.textStyle && String(el.id || "").match(/-kicker|-title$|-label$|-body$|-text-/)) {
        elements.push(el);
        continue;
      }

      const slotMetaEarly = (el.slot && variant.slots[el.slot]) || {};
      // Skip optional team / feature / stats slots past data count
      if (slide.role === "team" && memberCount > 0 && el.slot) {
        const m = String(el.slot).match(/^(?:p|n|r)(\d)$/);
        if (m && Number(m[1]) > memberCount) continue;
      }
      if (variant.id === "feature/b" && featureCount > 0 && el.slot) {
        const m = String(el.slot).match(/^(?:p|b)(\d)$/);
        if (m && Number(m[1]) > featureCount) continue;
      }
      if (variant.id === "stats/a" && statsCount > 0 && el.slot) {
        const m = String(el.slot).match(/^(?:v|l)(\d)$/);
        if (m && Number(m[1]) > statsCount) continue;
      }
      if (el.type === "text" && slotMetaEarly.optional && el.literal == null && el.slot !== "sectionLabel") {
        const from = slotMetaEarly.from || el.slot;
        if (!String(slotText(slide, from) || "").trim()) continue;
      }

      const groupId = el.pptxGroup || defaultGroup || undefined;
      let x = el.x;
      let y = el.y;
      let width = el.width;
      let height = el.height;

      // Spark charts → geometric shapes (PPTX-safe, no raster charts)
      if (el.type === "sparkBars") {
        const fill = palette[el.tokenFill || "accent"] || palette.accent;
        elements.push(
          ...expandSparkBars({ ...el, x, y, width, height }, fill, el.z != null ? el.z : 1, groupId)
        );
        continue;
      }
      if (el.type === "sparkLine") {
        const stroke = palette[el.tokenFill || "ink"] || palette.ink;
        elements.push(
          ...expandSparkLine({ ...el, x, y, width, height }, stroke, el.z != null ? el.z : 1, groupId)
        );
        continue;
      }
      // team/b: dynamic column % width from member count; centered 1:1 grid
      if (variant.id === "team/b" && memberCount > 0 && el.slot) {
        const m = String(el.slot).match(/^(?:p|n|r)(\d)$/);
        if (m) {
          const idx = Number(m[1]) - 1;
          const g = teamGridLayout(memberCount);
          x = g.startX + idx * (g.cardW + g.gap);
          width = g.cardW;
          if (String(el.slot).startsWith("p")) {
            y = g.photoY;
            height = g.cardH;
          } else if (String(el.slot).startsWith("n")) {
            y = g.nameY;
            height = 40;
          } else {
            y = g.roleY;
            height = 40;
          }
        }
      }
      // feature/b: dynamic 2×2 / 2×3 / N-col grid
      if (variant.id === "feature/b" && featureCount > 0 && el.slot) {
        const m = String(el.slot).match(/^(?:p|b)(\d)$/);
        if (m) {
          const idx = Number(m[1]) - 1;
          const g = featureGridLayout(featureCount);
          const cell = featureCell(g, idx);
          if (String(el.slot).startsWith("p")) {
            x = cell.photo.x;
            y = cell.photo.y;
            width = cell.photo.w;
            height = cell.photo.h;
          } else {
            x = cell.label.x;
            y = cell.label.y;
            width = cell.label.w;
            height = cell.label.h;
          }
        }
      }
      // stats/a: dynamic columns from stats length
      if (variant.id === "stats/a" && statsCount > 0 && el.slot) {
        const m = String(el.slot).match(/^(?:v|l)(\d)$/);
        if (m) {
          const idx = Number(m[1]) - 1;
          const g = statsGridLayout(statsCount);
          x = g.startX + idx * (g.colW + g.gap);
          width = g.colW;
          if (String(el.slot).startsWith("v")) {
            y = g.valueY;
            height = g.valueH;
          } else {
            y = g.labelY;
            height = g.labelH;
          }
        }
      }
      if (el.widthFrom) {
        const raw = String(slotText(slide, el.widthFrom)).trim();
        if (!/^\d+(?:\.\d+)?%$/.test(raw) || Number(raw.slice(0, -1)) > 100) {
          throw new Error(variant.id + ": " + el.widthFrom + " must be a percentage from 0% to 100%");
        }
        width *= Number(raw.slice(0, -1)) / 100;
      }
      const next: any = {
        id: el.id,
        type: el.type,
        x,
        y,
        width,
        height,
        zIndex: el.z != null ? el.z : 1,
      };
      if (el.opacity != null) next.opacity = el.opacity;
      if (groupId) next.pptxGroup = groupId;
      if (el.morphId) next.morphId = el.morphId;
      if (el.shapeTreatment) next.shapeTreatment = el.shapeTreatment;
      if (el.ambientTarget) next.ambientTarget = el.ambientTarget;
      if (el.overlapPlate) next.overlapPlate = true;
      if (el.motif) next.motif = true;

      if (el.type === "shape") {
        const fillKey = el.tokenFill || "surface";
        const fill = palette[fillKey] || palette.surface;
        let shapeKind = el.shape || "rect";
        // Global refined motif: never brush blobs / thick bars / ellipse accents
        const forbidOrganic =
          motifId === "refined" ||
          motifId === "bar-accent" ||
          (theme.motif && theme.motif.forbidBrush);
        if (forbidOrganic && (el.motif || shapeKind === "brush" || shapeKind === "squiggle")) {
          // Strip legacy motifs — header primitive already drew hairline+square
          continue;
        }
        if (forbidOrganic && el.motif && (shapeKind === "ellipse" || shapeKind === "circle")) {
          continue;
        }
        // Overlap plates / cards
        if (el.overlapPlate && next.opacity == null) next.opacity = 0.72;
        const fillResolved =
          el.tokenFill === "card_bg"
            ? palette.card_bg || palette.surface
            : el.tokenFill === "surface_color"
              ? palette.surface_color || palette.bg
              : fill;
        const isCard = !!(el.card || el.overlapPlate);
        const keepAccentFill =
          el.tokenFill === "accent" || el.keepFill === true || el.highlight === true;
        next.shapeContent = {
          kind: shapeKind === "ellipse" || shapeKind === "circle" ? "circle" : "rect",
          fill: fillResolved,
          cornerRadius: isCard ? cardRadius : el.radius || 0,
        };
        if (isCard) {
          if (!keepAccentFill) {
            next.shapeContent.fill = palette.card_bg || fillResolved;
          }
          const shadow = palette.card_shadow || theme.card_shadow;
          if (palette.useCards !== false && shadow && shadow.opacity !== 0) {
            next.shapeContent.shadow = shadow;
          }
          if (palette.card_border && palette.card_border.width && !keepAccentFill) {
            next.shapeContent.stroke = palette.card_border.color || palette.accent;
            next.shapeContent.strokeWidth = Number(palette.card_border.width) || 0;
          }
        }
      } else if (el.type === "chart") {
        const chart = (slide as any).chart || {};
        next.type = "chart";
        next.chartContent = {
          type: chart.type || chart.chartType || "line",
          chartType: chart.type || chart.chartType || "line",
          labels: Array.isArray(chart.labels) ? chart.labels : ["A", "B", "C", "D"],
          series: Array.isArray(chart.series)
            ? chart.series
            : [{ name: "Series", values: [2, 4, 3, 5] }],
          colors: chart.colors || [
            palette.accent,
            palette.accent2 || palette.muted,
            palette.muted,
            palette.line,
          ],
          showLegend: chart.showLegend !== false,
          holeSize: chart.holeSize,
          showPercent: chart.showPercent,
          color: palette.accent,
          ink: palette.ink,
          muted: palette.muted,
        };
        elements.push(next);
        continue;
      } else if (el.type === "text") {
        const slotMeta = variant.slots[el.slot] || {};
        const from = slotMeta.from || el.slot;
        let text = el.literal != null ? String(el.literal) : slotText(slide, from);
        // Consulting breakdown: supporting copy is dense prose minus the hero metric
        if (
          variant.id === "report/consulting-breakdown" &&
          (el.slot === "support" || from === "body0")
        ) {
          const source =
            (Array.isArray(slide.body) && slide.body[0]) || slide.caption || text || "";
          text = extractHeroStat(String(source)).support || text;
        }
        if (
          variant.id === "report/consulting-breakdown" &&
          (el.slot === "hero" || from === "heroStat")
        ) {
          const source =
            (slide as any).heroStat ||
            (Array.isArray(slide.body) && slide.body[0]) ||
            "";
          text = extractHeroStat(String(source)).hero;
        }
        // Vertical rail labels fall back to role when caption is empty
        if (!String(text || "").trim() && (el.slot === "sectionLabel" || from === "caption")) {
          text = String(slide.role || "SECTION").replace(/-/g, " ").toUpperCase();
        }
        // Two-column / comparison anchors when headers omitted
        if (!String(text || "").trim() && el.slot === "hLeft") {
          text =
            variant.id === "comparison/split" || slide.before || slide.after
              ? "Before"
              : "Current State";
        }
        if (!String(text || "").trim() && el.slot === "hRight") {
          text =
            variant.id === "comparison/split" || slide.before || slide.after
              ? "After"
              : "Regional Differences";
        }
        if (!String(text || "").trim() && variant.id === "comparison/quadrant") {
          const qd: Record<string, string> = {
            q0h: "Quick wins",
            q1h: "Big bets",
            q2h: "Fill-ins",
            q3h: "Avoid",
          };
          if (qd[el.slot]) text = qd[el.slot];
        }
        if (!String(text || "").trim() && el.slot === "badge" && variant.id === "pricing/three-tier") {
          text = "Most Popular";
        }
        if (
          !String(text || "").trim() &&
          (el.slot === "takeawayLabel" || from === "caption") &&
          variant.id === "report/executive-summary"
        ) {
          text = "KEY TAKEAWAY";
        }
        const hardBody = ptToEngine(MIN_READABLE_PT);
        const hardTitle = ptToEngine(24);
        const plainForFit = stripHighlightMarkers(text);
        const rules: any = {
          minFont: density === "report" ? floors.bodyPref : hardBody,
          maxFont: el.fontSize || 32,
          lineClamp: 4,
          ...((variant.fit && variant.fit[el.slot]) || {}),
          // Only single-paragraph prose triggers overflow-split; bullet blocks keep newlines
          splitOnOverflow: !/\n|•/.test(String(plainForFit || "")),
          lineHeight: Number(el.lineHeight) || (density === "report" ? 1.5 : 1.2),
        };
        const isTitle =
          el.slot === "title" ||
          el.slot === "hero" ||
          el.fontRole === "display" ||
          el.slot === "hLeft" ||
          el.slot === "hRight" ||
          from === "takeaway" ||
          from === "heroStat";
        const isBody =
          from === "body" ||
          /^body\d/.test(String(from)) ||
          el.slot === "support" ||
          el.fontRole === "body";
        const isAxisLabel = el.fontRole === "label" && !isTitle;
        // Hard typographic scale — never below 14pt body / 24pt title (true PPT points → engine units)
        const roleFloor = isTitle
          ? Math.max(hardTitle, floors.titleMin)
          : isAxisLabel
            ? ptToEngine(AXIS_LABEL_MIN_PT)
            : Math.max(hardBody, floors.bodyMin);
        rules.minFont = Math.max(roleFloor, rules.minFont || roleFloor);
        if (isTitle) {
          rules.lineClamp = Math.max(rules.lineClamp || 2, 2);
          rules.maxFont = Math.max(rules.maxFont || 40, rules.minFont);
        }
        if (isBody) {
          rules.lineClamp = Math.max(rules.lineClamp || 4, density === "report" ? 12 : 4);
        }
        const fitted = fitText(plainForFit, { width, height }, rules);
        let size = Math.max(roleFloor, fitted.fontSize || el.fontSize || roleFloor);
        const familyIdEarly = variant.family || (spec.style as any).family || null;
        const styleRoleEarly = inferTextStyleRole(el, { isTitle, isBody, size });
        const styleDefEarly = resolveTextStyle(familyIdEarly, styleRoleEarly, el);
        // Heavy display faces (Archivo Black etc.) only on punch roles — mid headlines stay on body face for fit.
        const useDisplayFace =
          styleRoleEarly === "display" ||
          styleRoleEarly === "stat" ||
          styleRoleEarly === "quote" ||
          ((el.fontRole === "display" || isTitle) && Number(size) >= 96);
        const fontName = useDisplayFace ? typePair.display : typePair.body;
        const colorKey = el.tokenColor || "ink";
        let color =
          el.color != null && String(el.color).trim()
            ? String(el.color).trim()
            : palette[colorKey] || palette.ink;
        const accent = palette.accent || color;
        // Hard schema enforcement: never render below floors — split instead of shrink
        if (size < roleFloor) {
          if (typoLimits.enforcement === "error-or-split" && rules.splitOnOverflow) {
            throw new SchemaValidationError("Typography floor violated at render", [
              (el.slot || el.id || "text") +
                " resolved " +
                size +
                " < floor " +
                roleFloor +
                " (title≥" +
                typoLimits.titleMinPt +
                "pt body≥" +
                typoLimits.bodyMinPt +
                "pt) — split content or enlarge box",
            ]);
          }
          size = roleFloor;
        }
        const familyId = familyIdEarly;
        const styleRole = styleRoleEarly;
        const textStyleDef = styleDefEarly;
        const weight =
          Number(el.fontWeight) ||
          Number(textStyleDef.fontWeight) ||
          (el.fontRole === "display" || el.fontRole === "label" || isTitle ? 700 : 400);
        // WCAG contrast: invert to white/black when text fails against local background
        const localBg = bgBehindText(
          contrastRegions,
          x,
          y,
          width,
          height,
          palette.bg || "#FFFFFF"
        );
        const largeText = isTitle || weight >= 700 || size >= ptToEngine(24);
        color = ensureContrast(String(color), localBg, largeText);
        const deckTreatment = typeTreatment;
        let resolvedTreatment = normalizeTreatment(
          el.typeTreatment ||
            textStyleDef.typeTreatment ||
            (deckTreatment !== "solid" &&
            (el.fontRole === "display" || el.slot === "title" || Number(size) >= 56)
              ? deckTreatment
              : "solid")
        );
        // Depth (offset-3d / long-shadow) only on short single-line punch titles.
        if (isDepthTreatment(resolvedTreatment)) {
          const approxCharW = Math.max(size * 0.55, 1);
          const hardBreaks = String(fitted.text || text || "").split(/\n/).length;
          const wrapEstimate = Math.max(
            hardBreaks,
            Math.ceil(Array.from(String(fitted.text || text || "").replace(/\s+/g, " ").trim()).length / Math.max(1, Math.floor(width / approxCharW)))
          );
          resolvedTreatment = guardDepthTreatment(resolvedTreatment, fitted.text || text || "", {
            lineCount: wrapEstimate,
            fallback: "solid",
          });
        }
        const useOutline = resolvedTreatment === "outline";
        const lineHeight =
          Number(el.lineHeight) ||
          Number(textStyleDef.lineHeight) ||
          (isBody || density === "report" ? 1.5 : 1.2);
        const pairTracking = isTitle
          ? Number(typePair.titleLetterSpacing != null ? typePair.titleLetterSpacing : typePair.letterSpacing) || 0
          : Number(typePair.letterSpacing) || 0;
        const letterSpacing =
          el.letterSpacing != null
            ? Number(el.letterSpacing)
            : textStyleDef.letterSpacing != null
              ? Number(textStyleDef.letterSpacing)
              : pairTracking;
        next.textStyle = {
          fontFamily: fontName,
          fontSize: size,
          fontWeight: weight,
          color,
          textAlign: el.align || "left",
          verticalAlign: el.verticalAlign || "top",
          lineHeight,
          letterSpacing,
          typeTreatment: resolvedTreatment,
          textStyleRole: styleRole,
          strokeWidth: useOutline ? 2 : 0,
          offsetSteps: textStyleDef.offsetSteps || 4,
          offsetX: textStyleDef.offsetX || 4,
          offsetY: textStyleDef.offsetY || 4,
          shadowLength: textStyleDef.shadowLength || 48,
          shadowStep: textStyleDef.shadowStep || 3,
        };
        // **highlight** → bold accent spans when content fully fits
        const sameWords = (value: string) => String(value || "").replace(/\s+/g, " ").trim();
        const highlightParts =
          !fitted.reason && sameWords(fitted.text) === sameWords(plainForFit)
            ? parseHighlightSpans(text)
            : [{ text: fitted.text || " " }];
        const accentSafe = ensureContrast(String(accent), localBg, true);
        const maybeUpper = (value: string) =>
          textStyleDef.uppercase ? String(value || "").toUpperCase() : value || " ";
        next.textContent = {
          spans: highlightParts.map((part: any) => ({
            text: maybeUpper(part.text || " "),
            fontFamily: fontName,
            fontSize: size,
            fontWeight: part.highlight || part.bold ? 700 : weight,
            color: part.highlight ? accentSafe : color,
            highlight: !!part.highlight,
            typeTreatment: resolvedTreatment,
            letterSpacing,
          })),
        };
        if (el.rotate) {
          elements.push({
            type: "rotated",
            degrees: Number(el.rotate) || 0,
            zIndex: next.zIndex,
            element: next,
          });
          continue;
        }
      } else if (el.type === "table") {
        const rows = slideTable(slide);
        const fontName = typePair.body;
        const ink = palette.ink || "#111111";
        const tableRules = (viz && viz.table) || {};
        const headerFill =
          palette[tableRules.headerTintToken || "surface_color"] ||
          palette.surface_color ||
          palette.surface ||
          "#F8FAFC";
        const altFill =
          palette[tableRules.altRowToken || "surface_color"] ||
          palette.surface_color ||
          "#F8FAFC";
        const line = palette.line || "#CCCCCC";
        const accent = palette.accent || ink;
        next.tableContent = {
          rows: rows.length
            ? rows
            : [
                ["Metric", "Q1", "Q2", "Q3", "Q4"],
                ["—", "—", "—", "—", "—"],
                ["—", "—", "—", "—", "—"],
                ["—", "—", "—", "—", "—"],
              ],
          fontFamily: fontName,
          fontSize: Math.max(floors.bodyMin, ptToEngine(tableRules.fontMinPt || 14)),
          color: ink,
          headerFill,
          headerColor: accent,
          altRowFill: tableRules.alternatingRows !== false ? altFill : null,
          borderColor: line,
          verticalBorders: tableRules.verticalBorders === true,
          horizontalBorders: tableRules.horizontalBorders !== false,
          align: "left",
          cellPadding: tableRules.cellPadding != null ? tableRules.cellPadding : 6,
        };
        elements.push(next);
        continue;
      } else if (el.type === "image") {
        const tensed = applyImageTension({ x, y, width, height }, el);
        next.x = tensed.x;
        next.y = tensed.y;
        next.width = tensed.width;
        next.height = tensed.height;
        const slotIndex = photoSlotIds.indexOf(el.slot || el.id);
        const qIndex = slotIndex >= 0 ? slotIndex : photoSlotCursor++;
        const query = queries[qIndex] || queries[0] || slide.photoQuery || "abstract texture";
        // Team: cover + top-center only (no face-focus extract). Square vs 4:5 from box.
        let crop: string | undefined;
        if (el.crop === "top-center" || slide.role === "team") {
          const ratio = next.width / Math.max(1, next.height);
          crop = Math.abs(ratio - 0.8) < 0.08 ? "top-center-45" : "top-center-square";
        }
        const slotOrient =
          photoOrients[qIndex] ||
          (slide.role === "team" ? "portrait" : slide.photoOrientation || "landscape");
        const tone =
          el.tone || defaultImageTone || resolveImageTone(String(treatment || ""));
        const url = await photoRel(query, slotOrient, crop, tone);
        const alignX =
          el.alignX != null
            ? Math.max(0, Math.min(1, Number(el.alignX)))
            : el.focalX != null
              ? Math.max(0, Math.min(1, Number(el.focalX)))
              : 0.5;
        const alignY =
          el.alignY != null
            ? Math.max(0, Math.min(1, Number(el.alignY)))
            : el.focalY != null
              ? Math.max(0, Math.min(1, Number(el.focalY)))
              : crop && crop.startsWith("top-center")
                ? 0
                : 0.5;
        const zoomRaw = el.zoom != null ? Number(el.zoom) : 1;
        const zoom =
          Number.isFinite(zoomRaw) && zoomRaw > 1 ? Math.min(2.5, zoomRaw) : undefined;
        next.imageContent = {
          url,
          // Uniform cover — never stretch/squash mixed source ratios
          fit: "cover",
          alignX,
          alignY,
          crop: crop || "cover",
          tone: tone || null,
          ...(zoom ? { zoom } : {}),
        };
        const clip = resolveMask(el);
        if (clip) next.imageContent.clip = clip;
        elements.push(next);
        // Tint wash — skip on harsh B&W / baked duotones; neon gets cyan wash
        if (
          (treatment === "tint" || treatment === "neon-tint") &&
          tone !== "bw-harsh" &&
          tone !== "sepia" &&
          tone !== "navy-duotone"
        ) {
          const tintOpacity =
            treatment === "neon-tint" ? 0.28 : palette && palette.dark ? 0.58 : 0.36;
          elements.push({
            id: el.id + "-tint",
            type: "shape",
            x: next.x,
            y: next.y,
            width: next.width,
            height: next.height,
            zIndex: (el.z != null ? el.z : 1) + 0.5,
            opacity: tintOpacity,
            pptxGroup: groupId,
            shapeContent: {
              kind: clip && clip.kind === "ellipse" ? "circle" : "rect",
              fill:
                treatment === "neon-tint"
                  ? palette.accent || "#22D3EE"
                  : paletteDarkHex(palette),
              cornerRadius: (clip && clip.cornerRadius) || el.radius || 0,
            },
          });
        }
        continue;
      } else if (el.type === "smartAsset") {
        const sa = el.smartAsset || {};
        const kind = String(sa.type || el.assetType || "photo");
        const saQueries = (slide as any).smartAssetQueries || {};
        let query = String(
          sa.query || el.query || slide.photoQuery || slide.title || "abstract"
        ).trim();
        if (kind === "illustration" && saQueries.illustration) {
          query = String(saQueries.illustration);
        } else if (kind === "photo" && saQueries.photo) {
          query = String(saQueries.photo);
        } else if (kind === "icon" && Array.isArray(saQueries.icons)) {
          const iconEls = (variant.layout.elements || []).filter(
            (e: any) => e && e.type === "smartAsset" && String((e.smartAsset || {}).type) === "icon"
          );
          const idx = iconEls.findIndex((e: any) => e && e.id === el.id);
          if (idx >= 0 && saQueries.icons[idx]) query = String(saQueries.icons[idx]);
        }
        const style = sa.style || el.style || undefined;
        // Nested geometry (inches) only when element box is missing/zero
        const inchToCanvas = (inches: number) => (Number(inches) || 0) * (1600 / 13.333);
        if ((!width || !height) && (sa.width || sa.height)) {
          next.x = sa.x != null ? inchToCanvas(sa.x) : x;
          next.y = sa.y != null ? inchToCanvas(sa.y) : y;
          next.width = sa.width != null ? inchToCanvas(sa.width) : width;
          next.height = sa.height != null ? inchToCanvas(sa.height) : height;
        }
        const assets = getAssetService();
        const accent = palette.accent || palette.on_accent || "#2563EB";
        const result = await assets.resolve(kind as any, query, {
          color: kind === "icon" ? String(accent) : undefined,
          style: style ? String(style) : undefined,
        });
        const rel = publishAsset(result.path);
        next.type = "image";
        next.imageContent = {
          url: rel,
          fit: kind === "icon" ? "contain" : "cover",
          alignX: 0.5,
          alignY: 0.5,
          smartAsset: {
            kind,
            query,
            style: style || null,
            dataUri: result.dataUri || null,
            iconId: result.iconId || null,
            mocked: !!result.mocked,
            source: result.source,
          },
        };
        elements.push(next);
        continue;
      }
      elements.push(next);
    }

    // Collage grouping hint for multi-photo kits (feature/b, team/b)
    if ((photoSlotIds || []).length >= 3) {
      elements.forEach((e) => {
        if (e.type === "image" || (e.id && String(e.id).endsWith("-tint"))) {
          e.pptxGroup = e.pptxGroup || variant.id + "-collage";
        }
      });
    }

    // Locked kits: geometry + motion rules are frozen (content may still change)
    const lockedElements = enforceLockedGeometry(variant, elements);

    layouts[layoutId] = {
      id: layoutId,
      name: slide.role,
      role: slide.role,
      variant: variant.variant || sel.variant || variant.id,
      family: variant.family || null,
      kitId: variant.id,
      kitStatus: variant.status || "draft",
      motion: variant.motion ? JSON.parse(JSON.stringify(variant.motion)) : undefined,
      elements: lockedElements,
    };
  }

  return {
    schemaVersion: 2,
    id: deckId,
    name: deckId,
    layoutSequence,
    layouts,
    tokens: {
      color: {
        bg: palette.bg,
        surface: palette.surface,
        ink: palette.ink,
        muted: palette.muted,
        accent: palette.accent,
        line: palette.line,
      },
      font: {
        display: typePair.display,
        body: typePair.body,
      },
    },
    engine: {
      v: "1.5-pro",
      style: { ...spec.style, imageTreatment: treatment, typeTreatment },
      selections: resolvedSelections,
      contentDensity: density,
      typographyFloors: floors,
      typographyLimits: typoLimits,
      theme: { version: theme.version, motif: theme.motif && theme.motif.id },
      primitives: ["header", "callout", "listItem"],
      usedPexelsIds: Array.from(usedPexelsIds),
      assetPipeline: getAssetService().lastStatus,
      brand: branded.brand
        ? {
            name: branded.brand.name || null,
            fonts: branded.brand.fonts || null,
            colors: branded.brand.colors || null,
            logoUrl: branded.brand.logoUrl || null,
          }
        : null,
      pptxRules: {
        noGlassmorphism: true,
        solidOverlayOpacity: "60-80%",
        masks: ["circle", "roundedRect", "rect", "arch", "pill"],
        nativeCropToShape: true,
        editableTextOnly: true,
        nativeCharts: ["donut", "line", "stackedBar"],
        solidBackgrounds: true,
        groupedOverlaps: true,
        imageTension: true,
        typeOutline: typeTreatment === "outline",
        typeTreatment,
      },
    },
  };
}

module.exports = { renderDeckFromSpec, loadVariant, tokens: tokensDoc, slotText, resolveMask };
