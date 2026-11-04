/**
 * Global component primitives — header, callout, list-item.
 * Kits inherit these automatically; new layouts get the premium aesthetic by default.
 */
const fs = require("fs");
const path = require("path");
const { ptToEngine } = require("./content");
const { parseHighlightSpans } = require("./highlight");

const themeDoc = JSON.parse(fs.readFileSync(path.join(__dirname, "theme.json"), "utf8"));

function highlightSpans(
  raw: string,
  base: { fontFamily: string; fontSize: number; fontWeight: number; color: string },
  accent: string
) {
  return parseHighlightSpans(raw).map((part: any) => ({
    text: part.text || " ",
    fontFamily: base.fontFamily,
    fontSize: base.fontSize,
    fontWeight: part.highlight || part.bold ? 700 : base.fontWeight,
    color: part.highlight ? accent : base.color,
    highlight: !!part.highlight,
  }));
}

export type PrimitiveContext = {
  palette: Record<string, any>;
  typePair: Record<string, any>;
  slide: any;
  groupId?: string;
  density?: string;
};

function shadowFromTheme(palette?: any): any {
  if (palette && palette.useCards === false) return null;
  const s = (palette && palette.card_shadow) || themeDoc.card_shadow || {};
  if (s.opacity === 0 || s.blur === 0) return null;
  return {
    color: s.color || "#0F172A",
    blur: Number(s.blur) || 24,
    offset: Number(s.offset) || 8,
    opacity: s.opacity != null ? Number(s.opacity) : 0.12,
  };
}

function resolveCardBg(palette: any): string {
  if (palette && palette.useCards === false) {
    return palette.bg || palette.surface || "#FFFFFF";
  }
  return palette.card_bg || palette.surface || "#FFFFFF";
}

/** Active catalog world from theme.json (token-only visual worlds). */
export function resolveCatalogWorld(paletteKey: string): any {
  const catalog = themeDoc.catalog || {};
  return catalog[String(paletteKey || "")] || null;
}

export function catalogCardRadius(palette: any, world?: any): number {
  if (palette && palette.card_radius != null) return Number(palette.card_radius) || 0;
  if (world && world.shapes && world.shapes.cardRadius != null) {
    return Number(world.shapes.cardRadius) || 0;
  }
  if (themeDoc.shapes && themeDoc.shapes.cardRadius != null) {
    return Number(themeDoc.shapes.cardRadius) || 0;
  }
  return 4;
}

function resolveSurfaceColor(palette: any): string {
  return palette.surface_color || palette.bg || "#F8FAFC";
}

function kickerText(slide: any, el: any): string {
  if (el.kicker) return String(el.kicker).toUpperCase();
  if (slide.kicker) return String(slide.kicker).toUpperCase();
  if (slide.caption && el.useCaptionAsKicker) return String(slide.caption).toUpperCase();
  const role = String(slide.role || "SECTION").replace(/-/g, " ");
  return role.toUpperCase();
}

/**
 * Header primitive: kicker (10pt caps) + bold title + refined motif (1px hairline + 4×4 square).
 * Replaces thick blue bars and overlapping ellipse brush motifs.
 */
export function expandHeaderPrimitive(
  el: any,
  titleText: string,
  ctx: PrimitiveContext
): any[] {
  const motif = themeDoc.motif || {};
  const typo = themeDoc.typography || {};
  const kickerPt = Number(typo.kickerPt) || 10;
  const titleMin = ptToEngine(Number(typo.titleMinPt) || 24);
  const titleSize = Math.max(titleMin, Number(el.fontSize) || titleMin);
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 1400;
  const z = el.z != null ? el.z : el.zIndex != null ? el.zIndex : 3;
  const ink = ctx.palette.ink || "#111111";
  const accent = ctx.palette.accent || ink;
  const muted = ctx.palette.muted || ink;
  const display = ctx.typePair.display || "Calibri";
  const hairlineH = Number(motif.hairlineHeight) || 1;
  const hairlineW = Number(motif.hairlineWidth) || 72;
  const square = Number(motif.squareSize) || 4;
  const gap = Number(motif.gap) || 8;
  const kicker = kickerText(ctx.slide, el);
  const out: any[] = [];

  out.push({
    id: (el.id || "header") + "-kicker",
    type: "text",
    x,
    y,
    width: w,
    height: ptToEngine(kickerPt) + 8,
    zIndex: z,
    pptxGroup: ctx.groupId,
    morphId: "kicker",
    textStyle: {
      fontFamily: display,
      fontSize: ptToEngine(kickerPt),
      fontWeight: 600,
      color: muted,
      textAlign: "left",
      verticalAlign: "top",
      lineHeight: 1.2,
      letterSpacing: 2,
    },
    textContent: {
      spans: [
        {
          text: kicker,
          fontFamily: display,
          fontSize: ptToEngine(kickerPt),
          fontWeight: 600,
          color: muted,
          letterSpacing: 2,
        },
      ],
    },
  });

  const titleY = y + ptToEngine(kickerPt) + 14;
  out.push({
    id: (el.id || "header") + "-title",
    type: "text",
    x,
    y: titleY,
    width: w,
    height: Number(el.titleHeight) || Math.max(56, titleSize * 1.4),
    zIndex: z + 0.1,
    pptxGroup: ctx.groupId,
    morphId: el.morphId || "title",
    textStyle: {
      fontFamily: display,
      fontSize: titleSize,
      fontWeight: 700,
      color: ink,
      textAlign: el.align || "left",
      verticalAlign: "top",
      lineHeight: Number(typo.titleLineHeight) || 1.2,
    },
    textContent: {
      spans: [
        {
          text: titleText || " ",
          fontFamily: display,
          fontSize: titleSize,
          fontWeight: 700,
          color: ink,
        },
      ],
    },
  });

  const motifY = titleY + (Number(el.titleHeight) || Math.max(56, titleSize * 1.4)) + 10;
  // 1px hairline
  out.push({
    id: (el.id || "header") + "-hairline",
    type: "shape",
    x,
    y: motifY,
    width: hairlineW,
    height: hairlineH,
    zIndex: z,
    pptxGroup: ctx.groupId,
    morphId: "accent",
    shapeContent: { kind: "rect", fill: accent, cornerRadius: 0 },
  });
  // 4×4 solid square
  out.push({
    id: (el.id || "header") + "-square",
    type: "shape",
    x: x + hairlineW + gap,
    y: motifY - Math.floor((square - hairlineH) / 2),
    width: square,
    height: square,
    zIndex: z,
    pptxGroup: ctx.groupId,
    morphId: "accent-square",
    shapeContent: { kind: "rect", fill: accent, cornerRadius: 0 },
  });

  return out;
}

/**
 * Callout primitive: card_bg + card_shadow + 20pt pull-quote text.
 */
export function expandCalloutPrimitive(
  el: any,
  bodyText: string,
  labelText: string,
  ctx: PrimitiveContext
): any[] {
  const typo = themeDoc.typography || {};
  const prim = (themeDoc.primitives && themeDoc.primitives.callout) || {};
  const worldPrim =
    (ctx.palette &&
      resolveCatalogWorld(String(ctx.palette._worldKey || "")) &&
      resolveCatalogWorld(String(ctx.palette._worldKey || "")).primitives &&
      resolveCatalogWorld(String(ctx.palette._worldKey || "")).primitives.callout) ||
    {};
  const calloutPt = Number(prim.textPt || typo.calloutPt) || 20;
  const labelPt = Number(prim.labelPt || typo.kickerPt) || 10;
  const padX = Number(prim.paddingX) || 32;
  const padY = Number(prim.paddingY) || 20;
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 1400;
  const textEngine = ptToEngine(calloutPt);
  const labelEngine = ptToEngine(labelPt);
  const contentH = labelEngine + 8 + textEngine * 1.35 * 2;
  const h = Math.max(Number(el.height) || 0, contentH + padY * 2);
  const z = el.z != null ? el.z : 2;
  const ink = ctx.palette.ink || "#111111";
  const accent = ctx.palette.accent || ink;
  const cardBg = resolveCardBg(ctx.palette);
  const bodyFont = ctx.typePair.body || "Calibri";
  const display = ctx.typePair.display || bodyFont;
  const radius =
    worldPrim.radius != null
      ? Number(worldPrim.radius)
      : catalogCardRadius(ctx.palette, resolveCatalogWorld(String(ctx.palette._worldKey || "")));
  const wantShadow = worldPrim.shadow !== false && ctx.palette.useCards !== false;
  const out: any[] = [];

  out.push({
    id: (el.id || "callout") + "-plate",
    type: "shape",
    x,
    y,
    width: w,
    height: h,
    zIndex: z,
    pptxGroup: ctx.groupId,
    morphId: "takeawayPlate",
    card: true,
    shapeContent: {
      kind: "rect",
      fill: cardBg,
      cornerRadius: radius,
      shadow: wantShadow ? shadowFromTheme(ctx.palette) : null,
      stroke: ctx.palette.card_border ? ctx.palette.card_border.color || accent : null,
      strokeWidth: ctx.palette.card_border ? Number(ctx.palette.card_border.width) || 0 : 0,
    },
  });

  out.push({
    id: (el.id || "callout") + "-label",
    type: "text",
    x: x + padX,
    y: y + padY,
    width: w - padX * 2,
    height: labelEngine + 6,
    zIndex: z + 1,
    pptxGroup: ctx.groupId,
    morphId: "sectionLabel",
    textStyle: {
      fontFamily: display,
      fontSize: labelEngine,
      fontWeight: 700,
      color: accent,
      textAlign: "left",
      lineHeight: 1.2,
      letterSpacing: 2,
    },
    textContent: {
      spans: [
        {
          text: String(labelText || "KEY TAKEAWAY").toUpperCase(),
          fontFamily: display,
          fontSize: labelEngine,
          fontWeight: 700,
          color: accent,
        },
      ],
    },
  });

  out.push({
    id: (el.id || "callout") + "-body",
    type: "text",
    x: x + padX,
    y: y + padY + labelEngine + 10,
    width: w - padX * 2,
    height: h - padY * 2 - labelEngine - 12,
    zIndex: z + 1,
    pptxGroup: ctx.groupId,
    morphId: "body",
    textStyle: {
      fontFamily: display,
      fontSize: textEngine,
      fontWeight: 700,
      color: ink,
      textAlign: "left",
      verticalAlign: "top",
      lineHeight: 1.35,
    },
    textContent: {
      spans: highlightSpans(
        bodyText || " ",
        { fontFamily: display, fontSize: textEngine, fontWeight: 700, color: ink },
        accent
      ),
    },
  });

  return out;
}

/**
 * Word-wrap line count for list stacking (never space-between / stretch).
 */
function estimateListLines(text: string, boxWidth: number, fontSize: number): number {
  const plain = String(text || "").replace(/\*\*([^*]+)\*\*/g, "$1").trim();
  if (!plain) return 1;
  // Calibri-ish average glyph ~0.5em; keep estimate tight so gaps stay fixed at itemGap
  const cpl = Math.max(24, Math.floor(boxWidth / Math.max(6, fontSize * 0.5)));
  let lines = 0;
  plain.split(/\n/).forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines += 1;
      return;
    }
    let len = 0;
    let paraLines = 1;
    words.forEach((w) => {
      const next = len === 0 ? w.length : len + 1 + w.length;
      if (next > cpl && len > 0) {
        paraLines += 1;
        len = w.length;
      } else {
        len = next;
      }
    });
    lines += paraLines;
  });
  return Math.max(1, Math.min(5, lines || 1));
}

/**
 * List-item primitive: minimalist square icon left of each bullet.
 * Fixed tight vertical margin (theme itemGap, default 12px) — stack from top.
 * Never distribute with space-between / equal leftover gaps.
 */
export function expandListItemPrimitive(
  el: any,
  lines: string[],
  ctx: PrimitiveContext
): any[] {
  const prim = (themeDoc.primitives && themeDoc.primitives.listItem) || {};
  const typo = themeDoc.typography || {};
  const textPt = Number(prim.textPt || typo.listItemPt) || 16;
  const textEngine = ptToEngine(textPt);
  const iconSize = Number(prim.iconSize) || 6;
  const iconGap = Number(prim.iconGap) || 14;
  // Fixed gap between items (engine px ≈ CSS px at 1600 canvas) — not space-between
  const itemGap = prim.itemGap != null ? Number(prim.itemGap) : 12;
  const lineHeight = Number(prim.lineHeight || typo.bodyLineHeight) || 1.35;
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 900;
  const z = el.z != null ? el.z : 2;
  const ink = ctx.palette.ink || "#111111";
  const accent = ctx.palette.accent || ink;
  const bodyFont = ctx.typePair.body || "Calibri";
  const items = (lines || [])
    .map((l) => String(l || "").replace(/^[•\-–—]\s*/, "").trim())
    .filter(Boolean);
  const out: any[] = [];
  let cursorY = y;
  const textWidth = Math.max(40, w - iconSize - iconGap);

  items.forEach((item, i) => {
    const lineCount = estimateListLines(item, textWidth, textEngine);
    // Natural content height only — do not reserve 2 blank lines per item
    const blockH = Math.ceil(textEngine * lineHeight * lineCount + 4);
    out.push({
      id: (el.id || "list") + "-icon-" + i,
      type: "shape",
      x,
      y: cursorY + Math.round(textEngine * 0.35),
      width: iconSize,
      height: iconSize,
      zIndex: z,
      pptxGroup: ctx.groupId,
      morphId: "list-icon-" + (i + 1),
      shapeContent: { kind: "rect", fill: accent, cornerRadius: 0 },
    });
    out.push({
      id: (el.id || "list") + "-text-" + i,
      type: "text",
      x: x + iconSize + iconGap,
      y: cursorY,
      width: textWidth,
      height: blockH,
      zIndex: z,
      pptxGroup: ctx.groupId,
      morphId: "body-" + i,
      textStyle: {
        fontFamily: bodyFont,
        fontSize: textEngine,
        fontWeight: 400,
        color: ink,
        textAlign: "left",
        verticalAlign: "top",
        lineHeight,
      },
      textContent: {
        spans: highlightSpans(
          item,
          { fontFamily: bodyFont, fontSize: textEngine, fontWeight: 400, color: ink },
          accent
        ),
      },
    });
    cursorY += blockH + itemGap;
  });

  return out;
}

/**
 * Rewrite a kit layout to use global primitives:
 * - title (+ old motif accent) → header
 * - takeaway plate → callout
 * - body bullet block → list-item
 * Drops thick bars / brush / ellipse motifs.
 */
export function applyGlobalPrimitives(
  layoutElements: any[],
  slide: any,
  palette: any,
  typePair: any
): any[] {
  const els = Array.isArray(layoutElements) ? layoutElements.slice() : [];
  const ctx: PrimitiveContext = { palette, typePair, slide };
  const out: any[] = [];
  const skip = new Set<string>();

  const titleEl = els.find(
    (e) => e && (e.primitive === "header" || e.slot === "title" || e.id === "title") && e.type !== "shape"
  );
  const accentEls = els.filter(
    (e) =>
      e &&
      (e.motif ||
        e.id === "accent" ||
        String(e.id || "").startsWith("accent") ||
        e.shape === "brush" ||
        e.shape === "squiggle")
  );
  const calloutPlate = els.find(
    (e) =>
      e &&
      (e.primitive === "callout" ||
        e.id === "takeawayPlate" ||
        e.slot === "takeawayPlate" ||
        (e.overlapPlate && (e.id || "").toLowerCase().includes("takeaway")))
  );
  const takeawayText = els.find((e) => e && (e.slot === "takeaway" || e.id === "takeaway"));
  const takeawayLabel = els.find(
    (e) => e && (e.slot === "takeawayLabel" || e.id === "takeawayLabel")
  );
  const listEl = els.find(
    (e) =>
      e &&
      (e.primitive === "list" || e.primitive === "listItem") &&
      (e.slot === "body" || e.id === "body")
  );
  const bodyEl =
    listEl ||
    els.find(
      (e) =>
        e &&
        e.type === "text" &&
        (e.slot === "body" || e.id === "body") &&
        // report bulleted-list style single body block
        String((slide && slide.role) || "") === "report"
    );

  // Header upgrade for non-cover content slides
  const useHeader =
    titleEl &&
    slide &&
    slide.role !== "cover" &&
    slide.role !== "closing" &&
    (titleEl.primitive === "header" || slide.role === "report" || titleEl.usePrimitive !== false);

  if (useHeader && titleEl) {
    skip.add(titleEl.id);
    accentEls.forEach((a) => skip.add(a.id));
    const titleText =
      titleEl.literal != null
        ? String(titleEl.literal)
        : String((slide && slide.title) || "");
    out.push(
      ...expandHeaderPrimitive(
        { ...titleEl, titleHeight: titleEl.height },
        titleText,
        { ...ctx, groupId: titleEl.pptxGroup }
      )
    );
  }

  if (calloutPlate || takeawayText || (slide && slide.takeaway)) {
    if (calloutPlate) skip.add(calloutPlate.id);
    if (takeawayText) skip.add(takeawayText.id);
    if (takeawayLabel) skip.add(takeawayLabel.id);
    // Always drop raw takeaway text nodes when callout primitive owns the content
    els.forEach((e) => {
      if (!e) return;
      if (e.slot === "takeaway" || e.id === "takeaway" || e.slot === "takeawayLabel" || e.id === "takeawayLabel") {
        skip.add(e.id);
      }
    });
    const plate = calloutPlate || {
      id: "callout",
      x: (takeawayText && takeawayText.x - 32) || 72,
      y: (takeawayText && takeawayText.y - 40) || 168,
      width: (takeawayText && takeawayText.width + 64) || 1456,
      height: 120,
      z: 2,
    };
    const body =
      (slide && slide.takeaway) ||
      (takeawayText && takeawayText.literal) ||
      "";
    const label =
      (takeawayLabel && takeawayLabel.literal) ||
      "KEY TAKEAWAY";
    out.push(...expandCalloutPrimitive(plate, String(body), String(label), ctx));
  }

  // List primitive for report body bullets
  const bodyLines: string[] = Array.isArray(slide && slide.body) ? slide.body : [];
  const looksLikeList =
    bodyEl &&
    bodyLines.length >= 2 &&
    bodyLines.every((b) => /^[•\-–—]|\w/.test(String(b || "").trim()));
  if (bodyEl && (bodyEl.primitive === "list" || bodyEl.primitive === "listItem" || looksLikeList)) {
    // Only auto-list when it's the main body slot (bulleted-list kit), not two-column body0/1
    if (bodyEl.slot === "body" || bodyEl.primitive === "list" || bodyEl.primitive === "listItem") {
      skip.add(bodyEl.id);
      out.push(
        ...expandListItemPrimitive(bodyEl, bodyLines, { ...ctx, groupId: bodyEl.pptxGroup })
      );
    }
  }

  // Remap leftover motif accents → refined hairline + square (covers, etc.)
  els.forEach((el) => {
    if (!el || skip.has(el.id)) return;
    if (
      el.motif ||
      el.shape === "brush" ||
      el.shape === "squiggle" ||
      (themeDoc.motif &&
        themeDoc.motif.forbidEllipses &&
        (el.shape === "ellipse" || el.shape === "circle") &&
        (el.id === "accent" || String(el.id || "").startsWith("accent")))
    ) {
      if (useHeader && (el.id === "accent" || String(el.id || "").startsWith("accent"))) {
        return; // already replaced by header motif
      }
      // Convert thick/organic accents into refined motif at the same origin
      if (el.motif || el.shape === "brush" || el.shape === "squiggle") {
        const motif = themeDoc.motif || {};
        const accent = palette.accent || palette.ink || "#111111";
        const hairlineH = Number(motif.hairlineHeight) || 1;
        const hairlineW = Math.min(Number(motif.hairlineWidth) || 72, Number(el.width) || 72);
        const square = Number(motif.squareSize) || 4;
        const gap = Number(motif.gap) || 8;
        out.push({
          id: (el.id || "accent") + "-hairline",
          type: "shape",
          x: el.x,
          y: el.y,
          width: hairlineW,
          height: hairlineH,
          zIndex: el.z != null ? el.z : 2,
          pptxGroup: el.pptxGroup,
          morphId: "accent",
          shapeContent: { kind: "rect", fill: accent, cornerRadius: 0 },
        });
        out.push({
          id: (el.id || "accent") + "-square",
          type: "shape",
          x: el.x + hairlineW + gap,
          y: el.y - Math.floor((square - hairlineH) / 2),
          width: square,
          height: square,
          zIndex: el.z != null ? el.z : 2,
          pptxGroup: el.pptxGroup,
          morphId: "accent-square",
          shapeContent: { kind: "rect", fill: accent, cornerRadius: 0 },
        });
        return;
      }
      return; // strip ellipse accent blobs
    }
    out.push(el);
  });

  return out.length ? out : els;
}

export function getTheme() {
  return themeDoc;
}

export function enrichPalette(palette: any, worldKey?: string): any {
  if (!palette || typeof palette !== "object") return palette;
  const world = resolveCatalogWorld(worldKey || palette._worldKey || "");
  const worldTokens = (world && world.tokens) || {};
  const merged = { ...palette, ...worldTokens, _worldKey: worldKey || palette._worldKey || null };
  const dark = !!merged.dark;
  const defaults = (themeDoc.surfaces && themeDoc.surfaces[dark ? "dark" : "light"]) || {};
  const shadow =
    (world && world.card_shadow) || merged.card_shadow || themeDoc.card_shadow;
  const useCards =
    merged.useCards != null
      ? merged.useCards
      : world && world.shapes
        ? world.shapes.useCards !== false
        : true;
  const card_bg = useCards
    ? merged.card_bg || defaults.card_bg || merged.surface
    : merged.bg || merged.surface;
  const accentHex = String(merged.accent || "#2563EB");
  function accentLum(hex: string): number {
    const h = String(hex || "").replace("#", "");
    if (h.length < 6) return 0.5;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const on_accent =
    merged.on_accent || (accentLum(accentHex) < 0.55 ? "#FFFFFF" : "#0F172A");
  return {
    ...merged,
    useCards,
    surface_color: merged.surface_color || defaults.surface_color || merged.bg,
    card_bg,
    card_shadow: shadow,
    on_accent,
    card_radius:
      merged.card_radius != null
        ? Number(merged.card_radius)
        : catalogCardRadius(merged, world),
  };
}

export function typographyLimits() {
  const t = themeDoc.typography || {};
  return {
    bodyMinPt: Number(t.bodyMinPt) || 14,
    titleMinPt: Number(t.titleMinPt) || 24,
    calloutPt: Number(t.calloutPt) || 20,
    kickerPt: Number(t.kickerPt) || 10,
    enforcement: t.enforcement || "error-or-split",
  };
}

export function dataVizRules() {
  return themeDoc.dataViz || {};
}

module.exports = {
  expandHeaderPrimitive,
  expandCalloutPrimitive,
  expandListItemPrimitive,
  applyGlobalPrimitives,
  getTheme,
  enrichPalette,
  resolveCatalogWorld,
  catalogCardRadius,
  typographyLimits,
  dataVizRules,
  shadowFromTheme,
  themeDoc,
};
