/**
 * Motion Grammar — how future template generations declare what should move.
 *
 * Authors mark elements at kit-write time:
 *   motionKind: "beat" | "chrome" | "label" | "dot" | "title" | "stage" | "none"
 *   motionHost: id of parent beat (labels)
 *   motionPreset: optional override ("slam" | "slamDrop" | "pop" | "fadeUp" | …)
 *   motionRow / motionCol: vote dots
 *
 * Pipeline:
 *   1. Author marks (preferred)
 *   2. Pattern fallback (motionTargets.inferMorphId) for unmarked ids
 *   3. Continuity + OOXML apply at export
 *   4. lintMotion(deck) fails generate if beats lack morphIds
 */

const motionTargets = require("./motionTargets");

const KINDS = {
  beat: { intent: "enter", preset: "slam", morphPrefix: "note" },
  chrome: { intent: "persist", preset: null, morphPrefix: "chrome" },
  label: { intent: "enter", preset: "slamDrop", morphPrefix: "label" },
  dot: { intent: "enter", preset: "pop", morphPrefix: "vote" },
  title: { intent: "enter", preset: "fadeUp", morphPrefix: "title" },
  stage: { intent: "persist", preset: null, morphPrefix: "stage" },
  none: { intent: "none", preset: null, morphPrefix: null },
};

function mark(el, kind, opts) {
  if (!el) return el;
  const k = String(kind || "none");
  const meta = KINDS[k] || KINDS.none;
  el.motionKind = k;
  el.motion = meta.intent === "none" ? "none" : meta.intent;
  if (opts && opts.host) el.motionHost = String(opts.host);
  if (opts && opts.preset) el.motionPreset = String(opts.preset);
  else if (meta.preset && k !== "label") el.motionPreset = meta.preset;
  if (opts && opts.row != null) el.motionRow = Number(opts.row);
  if (opts && opts.col != null) el.motionCol = Number(opts.col);
  // Stable morphId from author marks — don't wait for pattern inference
  if (!el.morphId && k === "beat") {
    el.morphId = opts && opts.morphId ? String(opts.morphId) : "note-" + String(el.id || "beat").replace(/[^a-zA-Z0-9]+/g, "-");
  }
  if (!el.morphId && k === "stage") el.morphId = "stage";
  if (!el.morphId && k === "title") el.morphId = "title";
  if (!el.morphId && k === "chrome") {
    el.morphId = "chrome-" + String(el.id || "x").replace(/[^a-zA-Z0-9]+/g, "-");
  }
  if (!el.morphId && k === "label") {
    el.morphId = "label-" + String(el.id || "x").replace(/\D/g, "");
  }
  if (!el.morphId && k === "dot") {
    const r = opts && opts.row != null ? opts.row : 0;
    const c = opts && opts.col != null ? opts.col : 0;
    el.morphId = "vote-" + r + "-" + c;
  }
  if (k === "none") {
    el.motionIntent = "none";
    delete el.morphId;
  }
  return el;
}

const asBeat = (el, opts) => mark(el, "beat", opts);
const asChrome = (el, opts) => mark(el, "chrome", opts);
const asLabel = (el, hostId, opts) => mark(el, "label", Object.assign({}, opts, { host: hostId }));
const asDot = (el, row, col, opts) => mark(el, "dot", Object.assign({}, opts, { row, col }));
const asTitle = (el, opts) => mark(el, "title", opts);
const asStage = (el, opts) => mark(el, "stage", opts);
const asNone = (el) => mark(el, "none");

/**
 * Apply author marks + pattern fallback. Call after render / before export.
 */
function annotateDeck(deck) {
  if (!deck || !deck.layouts) return deck;
  (deck.layoutSequence || Object.keys(deck.layouts)).forEach((lid) => {
    const layout = deck.layouts[lid];
    if (!layout) return;
    // Resolve label→host morphId links before pattern tag
    const byId = {};
    (layout.elements || []).forEach((el) => {
      if (el && el.id) byId[el.id] = el;
    });
    (layout.elements || []).forEach((el) => {
      if (!el || el.motionKind !== "label" || !el.motionHost) return;
      const host = byId[el.motionHost];
      if (host && host.morphId) el.motionParent = host.morphId;
    });
    motionTargets.tagMorphIds(layout.elements || [], layout.role);
    // Re-apply author intent after pattern tag (pattern may have set morphIds)
    (layout.elements || []).forEach((el) => {
      if (!el || !el.motionKind) return;
      const meta = KINDS[el.motionKind] || KINDS.none;
      if (el.motionKind === "none") {
        el.motionIntent = "none";
        return;
      }
      el.motionIntent = meta.intent;
      if (el.motion === "persist" || el.motion === "enter" || el.motion === "none") {
        el.motionIntent = el.motion;
      }
    });
  });
  return deck;
}

/**
 * Lint a deck for motion readiness. Returns { ok, errors, warnings }.
 */
function lintMotion(deck) {
  const errors = [];
  const warnings = [];
  if (!deck || !deck.layouts) {
    return { ok: false, errors: ["missing layouts"], warnings };
  }
  (deck.layoutSequence || Object.keys(deck.layouts)).forEach((lid, index) => {
    const layout = deck.layouts[lid];
    if (!layout) return;
    const els = layout.elements || [];
    const beats = els.filter((e) => e && (e.motionKind === "beat" || String(e.morphId || "").indexOf("note-") === 0));
    const labels = els.filter((e) => e && (e.motionKind === "label" || String(e.morphId || "").indexOf("label-") === 0));
    const dots = els.filter((e) => e && (e.motionKind === "dot" || /^vote-\d+-\d+$/.test(String(e.morphId || ""))));

    beats.forEach((b) => {
      if (!b.morphId) errors.push(`${lid}: beat ${b.id} missing morphId`);
    });
    labels.forEach((lab) => {
      if (!lab.morphId) {
        warnings.push(`${lid}: label ${lab.id} missing morphId`);
        return;
      }
      if (lab.motionHost) {
        const host = els.find((e) => e && e.id === lab.motionHost);
        if (!host) warnings.push(`${lid}: label ${lab.id} host ${lab.motionHost} not found`);
      }
    });
    // Orphan enter-labels with no nearby note (geometry) — soft warning
    const noteEls = els.filter((e) => e && String(e.morphId || "").indexOf("note-") === 0);
    labels.forEach((lab) => {
      if (lab.motionHost) return;
      if (lab.motionKind === "chrome" || lab.motionIntent === "persist") return;
      const pad = 36;
      const attached = noteEls.some((n) => {
        const nx = Number(n.x) || 0,
          ny = Number(n.y) || 0,
          nw = Number(n.width) || 0,
          nh = Number(n.height) || 0;
        const cx = (Number(lab.x) || 0) + (Number(lab.width) || 0) / 2;
        const cy = (Number(lab.y) || 0) + (Number(lab.height) || 0) / 2;
        return cx >= nx - pad && cx <= nx + nw + pad && cy >= ny - pad && cy <= ny + nh + pad;
      });
      if (!attached && noteEls.length) {
        warnings.push(`${lid}: label ${lab.id} not attached to any note (may animate alone)`);
      }
    });

    if (dots.length && dots.length < 3) {
      warnings.push(`${lid}: only ${dots.length} vote dots tagged — expected a full cascade`);
    }

    void index;
  });
  return { ok: errors.length === 0, errors, warnings };
}

module.exports = {
  KINDS,
  mark,
  asBeat,
  asChrome,
  asLabel,
  asDot,
  asTitle,
  asStage,
  asNone,
  annotateDeck,
  lintMotion,
};
