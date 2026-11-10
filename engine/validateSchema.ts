/**
 * Strict schema validation for kits, brand.json, and theme tokens.
 * Fail-fast before PPTX generation.
 */
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

const ROOT = path.join(__dirname, "..");
const KIT_ROOT = path.join(ROOT, "kit");
const SCHEMA_DIR = path.join(__dirname, "schemas");

const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: true });

function loadSchema(name: string) {
  return JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, name), "utf8"));
}

const validateKit = ajv.compile(loadSchema("kit.schema.json"));
const validateBrand = ajv.compile(loadSchema("brand.schema.json"));
const validateTokens = ajv.compile(loadSchema("tokens.schema.json"));

export class SchemaValidationError extends Error {
  errors: string[];
  constructor(message: string, errors: string[]) {
    super(message + (errors.length ? "\n - " + errors.join("\n - ") : ""));
    this.name = "SchemaValidationError";
    this.errors = errors;
  }
}

function formatAjvErrors(errs: any[] | null | undefined): string[] {
  if (!errs || !errs.length) return [];
  return errs.map((e) => {
    const loc = e.instancePath || e.schemaPath || "";
    return loc + " " + (e.message || "invalid");
  });
}

function deriveMorphId(el: any): string | null {
  if (!el) return null;
  if (el.morphId) return el.morphId;
  const slot = String(el.slot || el.id || "");
  if (el.type === "text") {
    if (slot === "title" || el.id === "title") return "title";
    if (slot === "caption" || el.id === "caption" || slot === "sectionLabel" || el.id === "sectionLabel")
      return slot === "sectionLabel" || el.id === "sectionLabel" ? "sectionLabel" : "caption";
    if (slot === "body" || el.id === "body") return "body";
    if (/^b\d$/.test(slot)) return "body-" + slot.slice(1);
    if (/^v\d$/.test(slot)) return "stat-" + (Number(slot.slice(1)) - 1);
    if (/^n\d$/.test(slot) || /^r\d$/.test(slot)) return slot; // team name/role
  }
  if (el.type === "image") {
    if (/^p\d$/.test(slot)) return "photo-" + slot.slice(1);
    if (slot === "portrait") return "photo-1";
    // Only explicit hero/cutout or true full-bleed covers get Morph "hero".
    // Framed insets / contact cells must stay untagged or ambient/Morph steals them.
    if (slot === "cutout" || el.id === "cutout" || slot === "hero" || el.id === "hero") return "hero";
    const x = Number(el.x) || 0;
    const y = Number(el.y) || 0;
    const w = Number(el.width) || 0;
    const h = Number(el.height) || 0;
    if ((w >= 1500 && h >= 850 && x <= 40 && y <= 40) || (w >= 1580 && h >= 880)) return "hero";
    return null;
  }
  if (el.type === "shape") {
    if (el.id === "pulse-bg") return "pulse-bg";
    if (el.id === "accent" || String(el.id || "").startsWith("accent")) return "accent";
    if (el.id === "neon") return "neon";
    if (el.id === "titlePlate") return "titlePlate";
  }
  if (el.type === "table") return "table";
  return null;
}

/** Normalize kit in-place: status default, z alias, morphId for motion, typography floors. */
export function normalizeKit(kit: any): any {
  if (!kit || typeof kit !== "object") return kit;
  if (!kit.status) kit.status = "draft";
  enforceTypographyFloorsOnKit(kit);
  const els = kit.layout && kit.layout.elements;
  if (Array.isArray(els)) {
    els.forEach((el: any, i: number) => {
      if (el.z == null && el.zIndex != null) el.z = el.zIndex;
      if (el.z == null) el.z = i + 1;
      if (!el.morphId) {
        const derived = deriveMorphId(el);
        if (derived) el.morphId = derived;
      }
    });
  }
  return kit;
}

/** Raise kit fit floors to global theme mins (engine canvas units). */
function enforceTypographyFloorsOnKit(kit: any): void {
  const fit = kit && kit.fit;
  if (!fit || typeof fit !== "object") return;
  // 14pt → ~24 engine, 24pt → ~40 engine (catalog ×0.6)
  const BODY_ENGINE = Math.ceil(14 / 0.6);
  const TITLE_ENGINE = Math.ceil(24 / 0.6);
  Object.keys(fit).forEach((slot) => {
    const rule = fit[slot] || {};
    const isTitle =
      slot === "title" ||
      slot === "takeaway" ||
      slot === "hLeft" ||
      slot === "hRight" ||
      /title|display|header/i.test(slot);
    const floor = isTitle ? TITLE_ENGINE : BODY_ENGINE;
    if (rule.minFont == null || Number(rule.minFont) < floor) {
      rule.minFont = floor;
    }
    if (rule.maxFont != null && Number(rule.maxFont) < Number(rule.minFont)) {
      rule.maxFont = rule.minFont;
    }
    fit[slot] = rule;
  });
}

function lockedKitExtraChecks(kit: any, file: string): string[] {
  const errors: string[] = [];
  if (!kit || kit.status !== "locked") return errors;
  const els = (kit.layout && kit.layout.elements) || [];
  els.forEach((el: any, idx: number) => {
    if (el.type === "text" || el.type === "image") {
      if (!el.morphId) {
        errors.push(`${file}: locked element[${idx}] (${el.id}) missing morphId`);
      }
    }
    if (el.z == null && el.zIndex == null) {
      errors.push(`${file}: locked element[${idx}] (${el.id}) missing z / zIndex`);
    }
  });
  if (!kit.motion) {
    // locked kits must declare motion rules (even if transition: none)
    errors.push(`${file}: locked kit missing motion block (geometry/motion rules are frozen)`);
  }
  return errors;
}

export function validateKitObject(kit: any, fileLabel?: string): void {
  const label = fileLabel || (kit && kit.id) || "kit";
  normalizeKit(kit);
  const ok = validateKit(kit);
  const errors = formatAjvErrors(validateKit.errors);
  errors.push(...lockedKitExtraChecks(kit, label));
  if (!ok || errors.length) {
    throw new SchemaValidationError(`Kit schema failed: ${label}`, errors);
  }
}

export function validateBrandObject(brand: any, fileLabel?: string): void {
  const label = fileLabel || "brand.json";
  const ok = validateBrand(brand);
  if (!ok) {
    throw new SchemaValidationError(`Brand schema failed: ${label}`, formatAjvErrors(validateBrand.errors));
  }
}

export function validateTokensObject(tokens: any, fileLabel?: string): void {
  const label = fileLabel || "tokens.json";
  const ok = validateTokens(tokens);
  if (!ok) {
    throw new SchemaValidationError(`Tokens schema failed: ${label}`, formatAjvErrors(validateTokens.errors));
  }
}

export function listKitFiles(): string[] {
  const out: string[] = [];
  if (!fs.existsSync(KIT_ROOT)) return out;
  fs.readdirSync(KIT_ROOT).forEach((role: string) => {
    const dir = path.join(KIT_ROOT, role);
    if (!fs.statSync(dir).isDirectory()) return;
    if (role === "ambient") return; // ambient kits use a different shape
    fs.readdirSync(dir)
      .filter((f: string) => f.endsWith(".json"))
      .forEach((f: string) => out.push(path.join(dir, f)));
  });
  return out;
}

export function validateAllKits(): { checked: number; locked: string[] } {
  const files = listKitFiles();
  const locked: string[] = [];
  files.forEach((file) => {
    const kit = JSON.parse(fs.readFileSync(file, "utf8"));
    normalizeKit(kit);
    validateKitObject(kit, path.relative(ROOT, file).replace(/\\/g, "/"));
    if (kit.status === "locked") locked.push(kit.id);
  });
  return { checked: files.length, locked };
}

export function validateBrandFile(filePath?: string): void {
  const file = filePath || path.join(ROOT, "brand.json");
  if (!fs.existsSync(file)) return;
  validateBrandObject(JSON.parse(fs.readFileSync(file, "utf8")), path.relative(ROOT, file));
}

export function validateTokensFile(filePath?: string): void {
  const file = filePath || path.join(ROOT, "engine", "tokens.json");
  validateTokensObject(JSON.parse(fs.readFileSync(file, "utf8")), path.relative(ROOT, file));
}

/** Run full schema gate — throws SchemaValidationError on failure. */
export function assertEngineSchemas(): { checked: number; locked: string[] } {
  validateTokensFile();
  validateBrandFile();
  return validateAllKits();
}

/**
 * Locked kits: freeze geometry + motion rules.
 * Content (text/image urls) may change; x/y/w/h/z/morphId/motion may not.
 */
export function enforceLockedGeometry(kit: any, elements: any[]): any[] {
  if (!kit || kit.status !== "locked") return elements;
  const byId: Record<string, any> = {};
  ((kit.layout && kit.layout.elements) || []).forEach((el: any) => {
    byId[el.id] = el;
  });
  return (elements || []).map((el) => {
    const src = byId[el.id];
    if (!src) return el;
    return {
      ...el,
      x: src.x,
      y: src.y,
      width: src.width,
      height: src.height,
      z: src.z != null ? src.z : el.z,
      zIndex: src.z != null ? src.z : el.zIndex,
      morphId: src.morphId || el.morphId,
      shapeTreatment: src.shapeTreatment || el.shapeTreatment,
      mask: src.mask || el.mask,
      radius: src.radius != null ? src.radius : el.radius,
    };
  });
}

export function isKitLocked(kit: any): boolean {
  return !!(kit && kit.status === "locked");
}

module.exports = {
  SchemaValidationError,
  normalizeKit,
  validateKitObject,
  validateBrandObject,
  validateTokensObject,
  validateAllKits,
  validateBrandFile,
  validateTokensFile,
  assertEngineSchemas,
  enforceLockedGeometry,
  isKitLocked,
  listKitFiles,
  deriveMorphId,
};
