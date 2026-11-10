/**
 * Family-scoped text styles + title treatments.
 * Kits can set el.textStyleRole / el.typeTreatment; otherwise we infer from slot/role/size.
 */
const fs = require("fs");
const path = require("path");

export type TextTreatment = "solid" | "outline" | "offset-3d" | "long-shadow";

export type TextStyleRole =
  | "display"
  | "headline"
  | "kicker"
  | "body"
  | "stat"
  | "quote";

export type TextStyleDef = {
  role: TextStyleRole;
  fontRole?: "display" | "body" | "label";
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  typeTreatment?: TextTreatment;
  uppercase?: boolean;
  /** Offset stack depth for offset-3d (layers behind fill). */
  offsetSteps?: number;
  offsetX?: number;
  offsetY?: number;
  /** Long-shadow ray length in engine units. */
  shadowLength?: number;
  shadowStep?: number;
};

type FamilyDoc = {
  id: string;
  textStyles?: Record<string, Partial<TextStyleDef>>;
  defaultTitleTreatment?: TextTreatment;
};

const ROOT = path.join(__dirname, "..");
const FAMILIES_PATH = path.join(ROOT, "engine/design-system/families.json");

const BASE_STYLES: Record<TextStyleRole, TextStyleDef> = {
  display: {
    role: "display",
    fontRole: "display",
    fontWeight: 700,
    letterSpacing: -0.6,
    lineHeight: 1.05,
    typeTreatment: "solid",
    offsetSteps: 4,
    offsetX: 4,
    offsetY: 4,
    shadowLength: 48,
    shadowStep: 3,
  },
  headline: {
    role: "headline",
    fontRole: "display",
    fontWeight: 700,
    letterSpacing: -0.3,
    lineHeight: 1.12,
    typeTreatment: "solid",
  },
  kicker: {
    role: "kicker",
    fontRole: "label",
    fontWeight: 700,
    letterSpacing: 1.6,
    lineHeight: 1.2,
    typeTreatment: "solid",
    uppercase: true,
  },
  body: {
    role: "body",
    fontRole: "body",
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.35,
    typeTreatment: "solid",
  },
  stat: {
    role: "stat",
    fontRole: "display",
    fontWeight: 700,
    letterSpacing: -1.2,
    lineHeight: 0.95,
    typeTreatment: "solid",
    offsetSteps: 3,
    offsetX: 3,
    offsetY: 3,
  },
  quote: {
    role: "quote",
    fontRole: "display",
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.25,
    typeTreatment: "solid",
  },
};

let cachedFamilies: FamilyDoc[] | null = null;

function loadFamilies(): FamilyDoc[] {
  if (cachedFamilies) return cachedFamilies;
  try {
    const doc = JSON.parse(fs.readFileSync(FAMILIES_PATH, "utf8"));
    cachedFamilies = Array.isArray(doc.families) ? doc.families : [];
  } catch {
    cachedFamilies = [];
  }
  return cachedFamilies || [];
}

export function getFamily(familyId: string | null | undefined): FamilyDoc | null {
  if (!familyId) return null;
  return loadFamilies().find((f) => f.id === String(familyId)) || null;
}

export function inferTextStyleRole(el: any, opts?: { isTitle?: boolean; isBody?: boolean; size?: number }): TextStyleRole {
  const explicit = String(el && (el.textStyleRole || el.textStyleKey) || "").trim();
  if (explicit && (BASE_STYLES as any)[explicit]) return explicit as TextStyleRole;

  const id = String((el && (el.id || el.slot)) || "").toLowerCase();
  const from = String((el && el.from) || "").toLowerCase();
  const size = Number(opts && opts.size != null ? opts.size : el && el.fontSize) || 0;

  if (/^(stat|number|hero|folio|metric|herostat)$/.test(id) || from === "herostat" || size >= 120)
    return "stat";
  if (/quote|pull/.test(id)) return "quote";
  if (
    /^(kicker|label|stamp|brand|purpose|eyebrow|tag|foot|leftlabel)$/.test(id) ||
    el.fontRole === "label"
  )
    return "kicker";
  if (opts && opts.isTitle) return size >= 96 ? "display" : "headline";
  if (el.fontRole === "display" || el.slot === "title" || el.slot === "hero") {
    return size >= 96 ? "display" : "headline";
  }
  if (opts && opts.isBody) return "body";
  return "body";
}

export function resolveTextStyle(
  familyId: string | null | undefined,
  role: TextStyleRole,
  el?: any
): TextStyleDef {
  const base = { ...BASE_STYLES[role] };
  const family = getFamily(familyId);
  const override = family && family.textStyles && family.textStyles[role];
  const merged: TextStyleDef = {
    ...base,
    ...(override || {}),
    role,
  };

  // Element-level treatment wins; else family default only on oversized display titles.
  const elTreatment = el && el.typeTreatment ? String(el.typeTreatment) : "";
  if (elTreatment === "outline" || elTreatment === "offset-3d" || elTreatment === "long-shadow" || elTreatment === "solid") {
    merged.typeTreatment = elTreatment as TextTreatment;
  } else {
    const familyDefault = family && family.defaultTitleTreatment;
    const size = Number(el && el.fontSize) || 0;
    const heroTitle =
      role === "display" &&
      size >= 140 &&
      el &&
      (el.slot === "title" || el.id === "title" || el.id === "statement");
    if (familyDefault && familyDefault !== "solid" && heroTitle) {
      merged.typeTreatment = familyDefault;
    }
  }

  if (el && el.fontWeight != null) merged.fontWeight = Number(el.fontWeight) || merged.fontWeight;
  if (el && el.lineHeight != null) merged.lineHeight = Number(el.lineHeight) || merged.lineHeight;
  if (el && el.letterSpacing != null) merged.letterSpacing = Number(el.letterSpacing);

  return merged;
}

export function normalizeTreatment(raw: any): TextTreatment {
  const t = String(raw || "solid");
  if (t === "outline" || t === "offset-3d" || t === "long-shadow") return t;
  return "solid";
}

/** Punchy single-line titles only — longer copy falls back to flat type. */
export const DEPTH_MAX_CHARS = 14;

export function isDepthTreatment(treatment: any): boolean {
  const t = String(treatment || "");
  return t === "offset-3d" || t === "long-shadow";
}

/**
 * Depth treatments only for short, single-line titles.
 * Falls back to outline (preferred) or solid when text wraps / exceeds the char budget.
 */
export function guardDepthTreatment(
  treatment: TextTreatment | string,
  text: string,
  opts?: { lineCount?: number; fallback?: TextTreatment }
): TextTreatment {
  const t = normalizeTreatment(treatment);
  if (!isDepthTreatment(t)) return t;
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  const hasBreak = /[\n\r]/.test(String(text || ""));
  const chars = Array.from(raw).length;
  const lines = Number(opts && opts.lineCount) || 1;
  if (hasBreak || lines > 1 || chars > DEPTH_MAX_CHARS) {
    return opts && opts.fallback ? opts.fallback : "solid";
  }
  return t;
}

module.exports = {
  getFamily,
  inferTextStyleRole,
  resolveTextStyle,
  normalizeTreatment,
  isDepthTreatment,
  guardDepthTreatment,
  DEPTH_MAX_CHARS,
  BASE_STYLES,
};
