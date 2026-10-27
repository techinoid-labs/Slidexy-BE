/**
 * Guarded recursive delete for pipeline cleanup paths.
 *
 *   const { safeRm } = require("./safeRm");
 *   safeRm(dir, { recursive: true, force: true });
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(path.join(__dirname, "..", ".."));
const TMP_ROOT = path.resolve(os.tmpdir());

const DENY_PREFIXES = [
  path.join("docs", "template-pipeline", "native", "corporate-payroll"),
  path.join("docs", "template-pipeline", "merge"),
  path.join("docs", "template-pipeline", "admin-dashboard", "index.html"),
  path.join("app-library", "native", "composer"),
].map((rel) => path.resolve(ROOT, rel));

function refuse(message) {
  throw new Error("safeRm refused: " + message);
}

function isSafeSegment(value) {
  const text = String(value || "");
  return Boolean(text) && text !== "." && text !== ".." && text.indexOf(path.sep) < 0 && text.indexOf("/") < 0 && text.indexOf("\\") < 0;
}

function underOrEqual(resolved, root) {
  return resolved === root || resolved.startsWith(root + path.sep);
}

function isDenied(resolved) {
  return DENY_PREFIXES.some((deny) => underOrEqual(resolved, deny));
}

function isAllowed(resolved) {
  if (isDenied(resolved)) return false;

  // os.tmpdir()/<name>/...
  if (underOrEqual(resolved, TMP_ROOT) && resolved !== TMP_ROOT) {
    const relTmp = path.relative(TMP_ROOT, resolved);
    const parts = relTmp.split(path.sep).filter(Boolean);
    if (parts.length >= 1 && isSafeSegment(parts[0])) return true;
  }

  const rel = path.relative(ROOT, resolved);
  if (!rel || rel === "." || rel.startsWith("..") || path.isAbsolute(rel)) return false;
  const parts = rel.split(path.sep).filter(Boolean);
  if (!parts.length) return false;

  // docs/template-pipeline/<name>/...
  if (parts[0] === "docs" && parts[1] === "template-pipeline" && parts.length >= 3 && isSafeSegment(parts[2])) {
    return true;
  }

  // generated-templates/photos/(thematic|native|composer)/<slug>/...
  if (
    parts[0] === "generated-templates"
    && parts[1] === "photos"
    && parts.length >= 4
    && (parts[2] === "thematic" || parts[2] === "native" || parts[2] === "composer")
    && isSafeSegment(parts[3])
  ) {
    return true;
  }

  // app-library/published/<id>/...
  if (parts[0] === "app-library" && parts[1] === "published" && parts.length >= 3 && isSafeSegment(parts[2])) {
    return true;
  }

  return false;
}

function safeRm(target, options) {
  if (target == null || target === "") refuse("empty or undefined target");
  const resolved = path.resolve(String(target));

  if (isDenied(resolved)) refuse("deny-listed path: " + path.relative(ROOT, resolved));
  if (resolved === ROOT) refuse("repo ROOT");
  if (resolved === TMP_ROOT) refuse("tmpdir root");

  const inRoot = underOrEqual(resolved, ROOT);
  const inTmp = underOrEqual(resolved, TMP_ROOT) && resolved !== TMP_ROOT;
  if (!inRoot && !inTmp) refuse("outside repo ROOT and tmpdir");

  if (inRoot) {
    const rel = path.relative(ROOT, resolved);
    const parts = rel.split(path.sep).filter(Boolean);
    const joined = parts.join("/");
    if (joined === "generated-templates") refuse("generated-templates");
    if (joined === "generated-templates/photos") refuse("generated-templates/photos");
    if (joined === "app-library") refuse("app-library");
    if (joined === "app-library/native") refuse("app-library/native");
    if (joined === "docs") refuse("docs");
    if (joined === "docs/template-pipeline") refuse("docs/template-pipeline without a name");
  }

  if (!isAllowed(resolved)) {
    const label = inRoot ? path.relative(ROOT, resolved) : resolved;
    refuse("path not in allowlist: " + label);
  }

  fs.rmSync(resolved, options || { recursive: true, force: true });
  return resolved;
}

module.exports = { safeRm, ROOT, TMP_ROOT, isAllowed, isDenied, DENY_PREFIXES };
