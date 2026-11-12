/**
 * Motion target awareness — morphId tagging + enter/persist/none intent.
 * Used by engine/motion.ts (stamp) and motionOoxml.js (entrance pick).
 */

const MAX_ENTRANCES = 6;

function isFullBleedHero(el) {
  if (!el || el.type !== "image") return false;
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 0;
  const h = Number(el.height) || 0;
  if (w >= 1500 && h >= 850 && x <= 40 && y <= 40) return true;
  if (w >= 1580 && h >= 880) return true;
  return false;
}

/**
 * Pattern → morphId for creative kits (idea-wall notes, stickers, votes, chrome).
 * Returns null when the element should stay untagged (e.g. extra vote dots).
 */
function inferMorphId(el) {
  if (!el) return null;
  if (el.morphId) return String(el.morphId);
  if (el.motion === "none") return null;

  const id = String(el.id || "");
  const slot = String(el.slot || el.id || "");

  // Classic slots
  if (el.type === "text" && (id === "title" || slot === "title")) return "title";
  if (el.type === "text" && (id === "caption" || slot === "caption")) return "caption";
  if (el.type === "text" && (id === "body" || slot === "body")) return "body";
  if (el.type === "text" && /^b\d$/.test(slot)) return "body-" + slot.slice(1);
  if (el.type === "text" && /^v\d$/.test(slot)) return "stat-" + (Number(slot.slice(1)) - 1);

  if (el.type === "image") {
    if (/^p\d$/.test(slot)) return "photo-" + slot.slice(1);
    if (id === "photo" && isFullBleedHero(el)) return "hero";
    if (isFullBleedHero(el)) return "hero";
    if (id === "photo") return "photo";
  }

  // Stage / chrome — persist across fades
  if (id === "bg") return "stage";
  if (id === "shadow") return "chrome-shadow";
  if (id === "pin") return "chrome-pin";
  if (id === "stickerShade") return "shade-sticker";
  if (/^shade\d+$/.test(id)) return "shade-" + id.replace(/\D/g, "");
  if (/^rule\d*$/.test(id)) return "rule-" + (id.replace(/\D/g, "") || "0");

  // Beat units — notes / stickers / cluster heads
  if (id === "note") return "note-0";
  if (/^note\d+$/.test(id)) return "note-" + id.replace(/\D/g, "");
  if (/^n(\d)(\d)$/.test(id)) {
    const m = id.match(/^n(\d)(\d)$/);
    return "note-" + m[1] + "-" + m[2];
  }
  if (id === "sticker") return "note-sticker";
  if (/^head\d+$/.test(id)) return "head-" + id.replace(/\D/g, "");

  // Vote dots: every cell gets an id so all can pop in
  if (/^v(\d+)_(\d+)$/.test(id)) {
    const m = id.match(/^v(\d+)_(\d+)$/);
    return "vote-" + m[1] + "-" + m[2];
  }

  // Note / card labels
  if (el.type === "text" && /^copy\d+$/.test(id)) {
    return "label-" + id.replace(/\D/g, "");
  }

  // Accent / plate shapes
  if (
    el.type === "shape" &&
    (id === "neon" ||
      id === "accent" ||
      id === "pulse-bg" ||
      id === "titlePlate" ||
      id.startsWith("accent") ||
      el.motif ||
      el.overlapPlate ||
      el.shapeTreatment === "depth")
  ) {
    if (id === "pulse-bg") return "pulse-bg";
    if (id === "titlePlate") return "titlePlate";
    if (id.startsWith("accent") || id === "accent" || el.motif) return "accent";
    return id || "plate";
  }

  return null;
}

function inferMotionIntent(el) {
  if (!el) return "none";
  // Author override only via el.motion — never stick on a stale motionIntent:"none"
  // from a previous tag pass before morphId existed.
  const authored = el.motion;
  if (authored === "persist" || authored === "enter" || authored === "none") return authored;

  const mid = String(el.morphId || "");
  if (!mid) return "none";

  if (
    mid === "stage" ||
    mid === "hero" ||
    mid.indexOf("chrome-") === 0 ||
    mid.indexOf("shade-") === 0 ||
    mid.indexOf("rule-") === 0
  ) {
    return "persist";
  }

  if (
    mid === "title" ||
    mid === "caption" ||
    mid === "body" ||
    mid.indexOf("body-") === 0 ||
    mid.indexOf("note-") === 0 ||
    mid.indexOf("head-") === 0 ||
    mid.indexOf("vote-row-") === 0 ||
    mid.indexOf("vote-") === 0 ||
    mid.indexOf("label-") === 0 ||
    mid.indexOf("stat-") === 0 ||
    mid.indexOf("photo") === 0 ||
    mid === "accent" ||
    mid.indexOf("accent-") === 0 ||
    mid === "pulse-bg" ||
    mid === "titlePlate" ||
    mid === "plate"
  ) {
    return "enter";
  }

  return "enter";
}

function entrancePriority(morphId) {
  const id = String(morphId || "");
  if (id.indexOf("note-") === 0) return 10;
  if (id.indexOf("head-") === 0) return 20;
  if (id === "title" || id === "caption") return 30;
  if (id.indexOf("vote-row-") === 0 || id.indexOf("vote-") === 0) return 40;
  if (id.indexOf("stat-") === 0) return 45;
  if (id === "accent" || id.indexOf("accent-") === 0) return 50;
  if (id.indexOf("body") === 0) return 55;
  if (id.indexOf("label-") === 0) return 70;
  if (id === "hero" || id.indexOf("photo") === 0) return 80;
  return 60;
}

/** Pick a motion preset from morphId — notes slam, titles rise, labels soft-fade alone. */
function pickEntrancePreset(morphId, continuity) {
  const id = String(morphId || "");
  if (id.indexOf("note-") === 0) return "slam";
  if (id.indexOf("head-") === 0) return "fadeUp";
  if (id.indexOf("vote-row-") === 0 || id.indexOf("vote-") === 0) return "pop";
  if (id.indexOf("stat-") === 0) return "zoomSettle";
  if (id === "title" || id === "caption") return "fadeUp";
  if (id === "accent" || id.indexOf("accent-") === 0) return continuity ? "fadeUp" : "wipeRight";
  if (id.indexOf("label-") === 0) return "fadeIn"; // overridden when paired to a note
  if (id.indexOf("body") === 0) return "fadeUp";
  return continuity ? "fadeIn" : "fadeUp";
}

function isNoteHost(morphId) {
  return String(morphId || "").indexOf("note-") === 0;
}

function isLabelId(morphId) {
  return String(morphId || "").indexOf("label-") === 0;
}

function isVoteId(morphId) {
  const id = String(morphId || "");
  return id.indexOf("vote-") === 0;
}

/** Parse vote-row-col → { row, col } */
function parseVoteId(morphId) {
  const m = String(morphId || "").match(/^vote(?:-row)?-(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  return { row: Number(m[1]), col: m[2] != null ? Number(m[2]) : 0 };
}

function elBox(el) {
  return {
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    w: Number(el.width) || 0,
    h: Number(el.height) || 0,
  };
}

/** True if label center sits on/near the sticky (text is part of the note). */
function labelBelongsToNote(labelEl, noteEl, padPx) {
  const pad = padPx != null ? padPx : 36;
  const n = elBox(noteEl);
  const l = elBox(labelEl);
  const cx = l.x + l.w / 2;
  const cy = l.y + l.h / 2;
  return cx >= n.x - pad && cx <= n.x + n.w + pad && cy >= n.y - pad && cy <= n.y + n.h + pad;
}

function tagMorphIds(elements, role) {
  const seen = new Set();
  (elements || []).forEach((el) => {
    if (!el) return;
    // Refresh legacy vote-row-* → vote-r-c so every dot is addressable
    if (el.morphId && /^vote-row-\d+$/.test(String(el.morphId))) {
      delete el.morphId;
    }
    if (!el.morphId) {
      const inferred = inferMorphId(el);
      if (inferred) el.morphId = inferred;
    }
    if (el.morphId) {
      if (seen.has(el.morphId)) {
        if (el.morphId === "accent") el.morphId = "accent-" + (seen.size + 1);
        else if (el.morphId !== "hero" && el.morphId !== "title" && el.morphId !== "stage") {
          el.morphId = el.morphId + "-" + (seen.size + 1);
        } else {
          delete el.morphId;
        }
      }
      if (el.morphId) seen.add(el.morphId);
    }
    el.motionIntent = inferMotionIntent(el);
    void role;
  });
  return elements;
}

/** Map morphId → {x,y,w,h} from a layout (for geometry-aware continuity). */
function layoutMorphGeometry(layout) {
  const map = new Map();
  ((layout && layout.elements) || []).forEach((el) => {
    if (!el || !el.morphId) return;
    map.set(String(el.morphId), {
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      w: Number(el.width) || 0,
      h: Number(el.height) || 0,
    });
  });
  return map;
}

/**
 * Same morphId only counts as "persist" when geometry is still near the previous box.
 * Reused ids at a new place (cover note-0 → steps note-0) still get an entrance.
 *
 * Labels / vote dots never persist across slides — copyN morphIds collide
 * (label-4 on slide 2 ≈ label-4 on slide 3) and would leave text stuck while
 * the ticket slams.
 */
function isStablePersist(morphId, el, prevGeom, thresholdPx) {
  const mid = String(morphId || "");
  if (mid.indexOf("label-") === 0 || mid.indexOf("vote-") === 0) return false;
  if (!prevGeom || !prevGeom.size || !prevGeom.has(morphId)) return false;
  const prev = prevGeom.get(morphId);
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 0;
  const h = Number(el.height) || 0;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const pcx = prev.x + prev.w / 2;
  const pcy = prev.y + prev.h / 2;
  const dist = Math.hypot(cx - pcx, cy - pcy);
  const sizeJump =
    Math.abs(w - prev.w) / Math.max(prev.w, 1) + Math.abs(h - prev.h) / Math.max(prev.h, 1);
  const thr = thresholdPx != null ? thresholdPx : 120;
  return dist < thr && sizeJump < 0.45;
}

function passesNewOnly(el, mid, newOnly, prevIds, prevGeom) {
  if (!newOnly || !prevIds || !prevIds.size) return true;
  if (prevGeom) return !isStablePersist(mid, el, prevGeom);
  return !prevIds.has(mid);
}

/**
 * Pick entrance targets from layout elements (intent-aware).
 * Sticky notes slam as a unit: note shape + on-note labels share preset + delay.
 */
function pickEntranceTargets(layout, opts) {
  const continuity = opts && opts.continuity;
  const prevIds = (opts && opts.prevIds) || new Set();
  const prevGeom = (opts && opts.prevGeom) || null;
  const newOnly = opts && opts.newOnly;
  const max = (opts && opts.max) || MAX_ENTRANCES;
  const stagger = continuity ? Math.round(200 * 1.25) : 200;

  const enterEls = [];
  ((layout && layout.elements) || []).forEach((el) => {
    if (!el || !el.morphId) return;
    const intent = el.motionIntent || inferMotionIntent(el);
    if (intent !== "enter") return;
    const mid = String(el.morphId);
    if (!passesNewOnly(el, mid, newOnly, prevIds, prevGeom)) return;
    enterEls.push(el);
  });

  const notes = enterEls.filter((el) => isNoteHost(el.morphId));
  const labels = enterEls.filter((el) => isLabelId(el.morphId));
  const votes = enterEls.filter((el) => isVoteId(el.morphId));
  const others = enterEls.filter(
    (el) => !isNoteHost(el.morphId) && !isLabelId(el.morphId) && !isVoteId(el.morphId)
  );

  // Pair labels: prefer author motionHost, else smallest containing note by geometry
  const pairedLabelIds = new Set();
  const noteKids = new Map(); // morphId → label els
  const notesById = {};
  notes.forEach((note) => {
    noteKids.set(String(note.morphId), []);
    if (note.id) notesById[note.id] = note;
  });
  labels.forEach((lab) => {
    let host = null;
    if (lab.motionHost && notesById[lab.motionHost]) {
      host = notesById[lab.motionHost];
    } else if (lab.motionParent) {
      host = notes.find((n) => String(n.morphId) === String(lab.motionParent)) || null;
    } else {
      const hosts = notes
        .filter((n) => labelBelongsToNote(lab, n, 36))
        .sort(
          (a, b) =>
            (Number(a.width) || 0) * (Number(a.height) || 0) -
            (Number(b.width) || 0) * (Number(b.height) || 0)
        );
      host = hosts[0] || null;
    }
    if (!host) return;
    const mid = String(host.morphId);
    if (!noteKids.has(mid)) noteKids.set(mid, []);
    noteKids.get(mid).push(lab);
    pairedLabelIds.add(lab.morphId);
  });
  const noteGroups = notes
    .map((note) => ({ note, kids: noteKids.get(String(note.morphId)) || [] }))
    .sort(
      (a, b) =>
        (Number(a.note.y) || 0) - (Number(b.note.y) || 0) ||
        (Number(a.note.x) || 0) - (Number(b.note.x) || 0)
    );

  // Non-vote beats only — votes always cascade in full below (not capped)
  const otherBeats = others
    .filter((el) => entrancePriority(el.morphId) <= 45)
    .sort(
      (a, b) =>
        entrancePriority(a.morphId) - entrancePriority(b.morphId) ||
        (Number(a.y) || 0) - (Number(b.y) || 0)
    );

  const hostSlots = [];
  noteGroups.forEach((g) => hostSlots.push({ kind: "note", group: g }));
  otherBeats.forEach((el) => hostSlots.push({ kind: "other", el }));
  const limited = hostSlots.slice(0, max);

  const out = [];
  const seen = new Set();
  let hostIndex = 0;
  limited.forEach((slot) => {
    const delayMs = hostIndex * stagger;
    if (slot.kind === "note") {
      const { note, kids } = slot.group;
      const mid = String(note.morphId);
      // Note+text: slamDrop (no scale) so paper and copy share the same path
      // and don't tear apart from different scale centers.
      const authored = note.motionPreset;
      const preset = authored || (kids.length ? "slamDrop" : "slam");
      if (!seen.has(mid)) {
        seen.add(mid);
        out.push({ morphId: mid, preset, delayMs });
      }
      kids.forEach((lab) => {
        const lid = String(lab.morphId);
        if (seen.has(lid)) return;
        seen.add(lid);
        out.push({
          morphId: lid,
          preset: lab.motionPreset || "slamDrop",
          delayMs,
        });
      });
      hostIndex++;
    } else {
      const mid = String(slot.el.morphId);
      if (seen.has(mid)) return;
      seen.add(mid);
      out.push({
        morphId: mid,
        preset: pickEntrancePreset(mid, continuity),
        delayMs,
      });
      hostIndex++;
    }
  });

  // Vote dots: every dot pops fast L→R, rows cascade slightly
  const VOTE_COL_MS = 45;
  const VOTE_ROW_MS = 120;
  const voteBase = hostIndex * stagger;
  votes
    .slice()
    .sort((a, b) => {
      const pa = parseVoteId(a.morphId) || { row: 0, col: 0 };
      const pb = parseVoteId(b.morphId) || { row: 0, col: 0 };
      return pa.row - pb.row || pa.col - pb.col || (Number(a.x) || 0) - (Number(b.x) || 0);
    })
    .forEach((el) => {
      const mid = String(el.morphId);
      if (seen.has(mid)) return;
      seen.add(mid);
      const p = parseVoteId(mid) || { row: 0, col: 0 };
      out.push({
        morphId: mid,
        preset: "pop",
        delayMs: voteBase + p.row * VOTE_ROW_MS + p.col * VOTE_COL_MS,
      });
    });

  // Orphan labels (not on a selected note): soft fade only if room under a soft cap
  const orphanCap = max + 4;
  labels.forEach((lab) => {
    if (out.length >= orphanCap + votes.length) return;
    const lid = String(lab.morphId);
    if (seen.has(lid) || pairedLabelIds.has(lid)) return;
    // still try attach to any note on slide (even if note didn't enter — rare)
    const host = notes.find((n) => labelBelongsToNote(lab, n));
    if (host) return; // parent note wasn't selected; skip orphan text
    seen.add(lid);
    out.push({
      morphId: lid,
      preset: "fadeIn",
      delayMs: hostIndex * stagger,
    });
  });

  return out;
}

module.exports = {
  MAX_ENTRANCES,
  isFullBleedHero,
  inferMorphId,
  inferMotionIntent,
  tagMorphIds,
  pickEntranceTargets,
  pickEntrancePreset,
  layoutMorphGeometry,
  isStablePersist,
  entrancePriority,
  labelBelongsToNote,
  isNoteHost,
  isLabelId,
  isVoteId,
};
