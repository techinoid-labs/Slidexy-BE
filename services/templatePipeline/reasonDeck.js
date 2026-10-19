/**
 * Decides what each body slide is for, then picks a composition for that job.
 * The seed still supplies the palette, type, and cover. This step supplies
 * the structure, so a sequence is not always the same roadmap and a
 * comparison is not always two matched columns.
 *
 * Strategies are spread across the catalog: the least-used composition for
 * a job is chosen. A deck takes four of the six jobs, so some decks have
 * no roadmap and some have no comparison.
 */

const JOBS = ["sequence", "comparison", "evidence", "emphasis", "narrative", "transition"];

const STRATEGIES = {
  sequence: ["sequence.rail", "sequence.spine", "sequence.index", "sequence.steps"],
  comparison: ["comparison.halves", "comparison.ledger", "comparison.offset"],
  evidence: ["evidence.figure", "evidence.proof", "evidence.bars"],
  emphasis: ["emphasis.word", "emphasis.corner", "emphasis.band"],
  narrative: ["narrative.bleed", "narrative.margin", "narrative.frames"],
  transition: ["transition.pause", "transition.chapter", "transition.edge"],
};

// These ids are slide roles the phone app already knows. Two strategies may
// share a role. The composition's identity is the strategy name, not this id.
// A new id such as layoutFullBleedHero_emphasis_corner would be parsed by the
// app as a generic two-column slide, and the composition stored under it
// would not be drawn.
const PREFERRED_LAYOUT = {
  "sequence.rail": "layoutTimeline",
  "sequence.spine": "layoutAgendaList",
  "sequence.index": "layoutThreeRow_3",
  "sequence.steps": "layoutTeam",
  "comparison.halves": "layoutComparison",
  "comparison.ledger": "layoutTwoColumn_2x1",
  "comparison.offset": "layoutImageTop",
  "evidence.figure": "layoutStatHighlight",
  "evidence.proof": "layoutImageLeft",
  "evidence.bars": "layoutThreeUp",
  "emphasis.word": "layoutTextOnly",
  "emphasis.corner": "layoutFullBleedHero",
  "emphasis.band": "layoutQuoteBanner",
  "narrative.bleed": "layoutFullBleedHero",
  "narrative.margin": "layoutImageTop",
  "narrative.frames": "layoutThreeUp",
  "transition.pause": "layoutTextOnly",
  "transition.chapter": "layoutStatHighlight",
  "transition.edge": "layoutQuoteBanner",
};

const LAYOUT_POOL = [
  "layoutAgendaList", "layoutTimeline", "layoutStatHighlight", "layoutThreeUp",
  "layoutComparison", "layoutTeam", "layoutImageLeft", "layoutTextOnly",
  "layoutQuoteBanner", "layoutImageTop", "layoutTwoColumn_2x1", "layoutThreeRow_3",
  "layoutFullBleedHero",
];

const PREVIEW = {
  "sequence.rail": ["Along the bottom", ["Open — The first room", "Hold — Stay with the work", "Turn — Change direction", "Leave — Hand it over"]],
  "sequence.spine": ["Down the side", ["Gather — Bring the pieces in", "Shape — Decide the form", "Fire — Commit to it", "Cool — Let it settle"]],
  "sequence.index": ["Three moves", ["Open — Name what this is", "Hold — Keep the useful part", "Close — Stop while it is clear"]],
  "sequence.steps": ["A staircase", ["Ground — Where you stand", "Rise — The next height", "Turn — A change of aim", "Land — Where it rests"]],
  "comparison.halves": ["Two sides", ["Before — The habit we had", "After — The habit we want"]],
  "comparison.ledger": ["A ledger", ["Cost — What it asks of us", "Return — What we get back"]],
  "comparison.offset": ["Crossed", ["Near — Close and specific", "Far — Wide and slow"]],
  "evidence.figure": ["The figure", ["One count, kept honest", "Counted in the room"]],
  "evidence.proof": ["The proof", ["Seen, not asserted", "The picture does the arguing"]],
  "evidence.bars": ["The weight", ["Light — A small share", "Middle — The usual share", "Heavy — Where it actually sits"]],
  "emphasis.word": ["Hold still", []],
  "emphasis.corner": ["In the corner", []],
  "emphasis.band": ["Across", []],
  "narrative.bleed": ["In the picture", ["A place with a name", "Nothing else on the frame"]],
  "narrative.margin": ["In the margin", ["The note sits beside the claim", "The claim stays short"]],
  "narrative.frames": ["Three frames", ["Arrive — The way in", "Stay — The middle", "Go — The way out"]],
  "transition.pause": ["Pause", []],
  "transition.chapter": ["Chapter", []],
  "transition.edge": ["To the edge", []],
};

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function tieRank(key, salt) {
  return Math.imul(hashString(key) ^ salt, 71) >>> 0;
}

function tally(decks, field) {
  const counts = {};
  for (const deck of decks || []) {
    for (const step of deck.reasoning || []) {
      const key = step[field];
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

function leastUsed(keys, counts, salt) {
  const least = Math.min(...keys.map((key) => counts[key] || 0));
  const tied = keys.filter((key) => (counts[key] || 0) === least);
  tied.sort((a, b) => tieRank(a, salt) - tieRank(b, salt) || (a < b ? -1 : 1));
  return tied[0];
}

function assignLayout(strategy, used) {
  const preferred = PREFERRED_LAYOUT[strategy];
  if (preferred && !used.has(preferred)) return preferred;
  return LAYOUT_POOL.find((id) => !used.has(id)) || preferred;
}

/**
 * Four body slides. Jobs and strategies are the ones this catalog has used least.
 */
function planReasoning(decks, rng) {
  const random = rng || Math.random;
  const salt = Math.floor(random() * 0x100000000);
  const jobCounts = tally(decks, "job");
  const strategyCounts = tally(decks, "strategy");
  const byUse = (a, b, counts) => (counts[a] || 0) - (counts[b] || 0) || tieRank(a, salt) - tieRank(b, salt) || (a < b ? -1 : 1);
  const jobs = JOBS.slice().sort((a, b) => byUse(a, b, jobCounts)).slice(0, 4);
  const ordered = jobs.slice().sort((a, b) => tieRank(a, salt) - tieRank(b, salt) || (a < b ? -1 : 1));
  const used = new Set(["layoutTitleFocus", "layoutClosingCta"]);
  return ordered.map((job) => {
    const strategy = leastUsed(STRATEGIES[job], strategyCounts, salt);
    strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
    const layoutId = assignLayout(strategy, used);
    used.add(layoutId);
    return { job, strategy, layoutId, confidence: 1 };
  });
}

function previewFor(strategy) {
  const copy = PREVIEW[strategy] || ["Slide", ["A line"]];
  return { title: copy[0], bullets: copy[1].slice() };
}

function buildStrategy(strategy, kit) {
  const { ground, shape, text, photo, item, m, W, H, D, F, ink, muted, accent, on } = kit;
  const inner = W - m * 2;
  const title = (x, y, w, h, size, color, align) => text(
    "title", x, y, w, h,
    { font: D, size, weight: 700, color: color || ink, align: align || "left" },
    { binding: "title" },
  );
  const pair = (prefix, index, x, y, nw, lw, dw, labelSize) => {
    const num = item("itemNumber", index);
    const label = item("labeledLabel", index);
    const detail = item("labeledDetail", index);
    return [
      text(prefix + "n" + index, x, y, nw, 56, { font: D, size: labelSize || 32, weight: 700, color: accent }, num.content, num.extra),
      text(prefix + "l" + index, x + nw + 16, y, lw, 56, { font: D, size: labelSize || 32, weight: 650, color: ink }, label.content, label.extra),
      text(prefix + "d" + index, x + nw + 16, y + 52, dw, 72, { font: F, size: 22, color: muted }, detail.content, detail.extra),
    ];
  };

  if (strategy === "sequence.rail") {
    const elements = [...ground(), title(m, m, 980, 160, 140), shape("rail", m, 620, inner, 4, accent, 3)];
    const col = inner / 4;
    for (let i = 0; i < 4; i += 1) {
      const x = m + i * col;
      const num = item("itemNumber", i);
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        shape("dot" + i, x, 604, 36, 36, accent, 4, 18),
        text("m" + i, x, 530, col - 24, 60, { font: D, size: 32, weight: 700, color: accent }, num.content, num.extra),
        text("l" + i, x, 660, col - 24, 48, { font: D, size: 26, weight: 650, color: ink }, label.content, label.extra),
        text("d" + i, x, 712, col - 24, 80, { font: F, size: 20, color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  if (strategy === "sequence.spine") {
    const elements = [
      ...ground(),
      title(m, 72, 900, 120, 120),
      shape("spine", W - m - 28, 220, 6, 600, accent, 3),
    ];
    for (let i = 0; i < 4; i += 1) {
      const y = 230 + i * 145;
      elements.push(
        shape("tick" + i, W - m - 48, y + 16, 48, 6, accent, 4),
        ...pair("s", i, m, y, 72, 520, 700, 28),
      );
    }
    return elements;
  }

  if (strategy === "sequence.index") {
    const elements = [...ground(), title(m, 48, 700, 72, 28, muted)];
    for (let i = 0; i < 3; i += 1) {
      const y = 150 + i * 240;
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      const num = item("itemNumber", i);
      elements.push(
        text("n" + i, m, y, 280, 180, { font: D, size: 120, weight: 750, color: accent }, num.content, num.extra),
        text("l" + i, m + 320, y + 30, 900, 80, { font: D, size: 48, weight: 650, color: ink }, label.content, label.extra),
        text("d" + i, m + 320, y + 120, 800, 60, { font: F, size: 24, color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  if (strategy === "sequence.steps") {
    const elements = [...ground(), title(m, 36, 800, 80, 40)];
    const gap = (inner - 420) / 3;
    for (let i = 0; i < 4; i += 1) {
      const x = m + i * gap;
      const y = 150 + i * 165;
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        shape("step" + i, x, y, 180, 10, accent, 4),
        text("l" + i, x, y + 24, 400, 56, { font: D, size: 32, weight: 700, color: ink }, label.content, label.extra),
        text("d" + i, x, y + 84, 380, 60, { font: F, size: 20, color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  if (strategy === "comparison.halves") {
    const left = item("labeledLabel", 0);
    const leftDetail = item("labeledDetail", 0);
    const right = item("labeledLabel", 1);
    const rightDetail = item("labeledDetail", 1);
    return [
      shape("left", 0, 0, W / 2, H, kit.card || ink, 1),
      shape("right", W / 2, 0, W / 2, H, accent, 1),
      text("ll", 72, 260, 640, 140, { font: D, size: 130, weight: 750, color: ink }, left.content, left.extra),
      text("ld", 72, 430, 640, 160, { font: F, size: 26, color: muted }, leftDetail.content, leftDetail.extra),
      text("rl", W / 2 + 72, 260, 640, 140, { font: D, size: 130, weight: 750, color: on }, right.content, right.extra),
      text("rd", W / 2 + 72, 430, 640, 160, { font: F, size: 26, color: on }, rightDetail.content, rightDetail.extra),
    ];
  }

  if (strategy === "comparison.ledger") {
    const elements = [
      ...ground(),
      title(m, 80, inner, 120, 64),
      shape("rule", W / 2 - 2, 260, 4, 520, accent, 3),
    ];
    elements.push(...pair("a", 0, m, 340, 80, 480, 500, 36));
    elements.push(...pair("b", 1, W / 2 + 48, 520, 80, 480, 500, 36));
    return elements;
  }

  if (strategy === "comparison.offset") {
    const a = item("labeledLabel", 0);
    const ad = item("labeledDetail", 0);
    const b = item("labeledLabel", 1);
    const bd = item("labeledDetail", 1);
    return [
      ...ground(),
      shape("near", m, 120, 860, 420, kit.card || accent, 2, 8),
      shape("far", W - m - 860, 400, 860, 400, accent, 3, 8),
      text("al", m + 40, 180, 740, 100, { font: D, size: 48, weight: 700, color: ink }, a.content, a.extra),
      text("ad", m + 40, 300, 740, 140, { font: F, size: 24, color: muted }, ad.content, ad.extra),
      text("bl", W - m - 820, 470, 740, 100, { font: D, size: 48, weight: 700, color: on }, b.content, b.extra),
      text("bd", W - m - 820, 590, 740, 140, { font: F, size: 24, color: on }, bd.content, bd.extra),
    ];
  }

  if (strategy === "evidence.figure") {
    return [
      ...ground(),
      shape("mark", m, 180, 120, 12, accent, 3),
      Object.assign(text("figure", m, 220, 780, 280, { font: D, size: 160, weight: 750, color: accent }, { binding: "subtitle" }), { role: "number" }),
      title(m + 40, 520, 900, 140, 48),
      text("note", m, 700, 880, 100, { font: F, size: 24, color: muted }, { binding: "bullets" }),
    ];
  }

  if (strategy === "evidence.proof") {
    return [
      ...ground(),
      photo("photo", 860, 0, 740, H, kit.photoUrl, 2),
      title(m, 220, 700, 220, 64),
      text("note", m, 480, 680, 160, { font: F, size: 26, color: muted }, { binding: "bullets" }),
    ];
  }

  if (strategy === "evidence.bars") {
    const elements = [...ground(), title(m, 70, 1000, 100, 48)];
    const widths = [0.42, 0.68, 0.9];
    for (let i = 0; i < 3; i += 1) {
      const y = 240 + i * 180;
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        shape("bar" + i, m, y, Math.round(inner * widths[i]), 28, accent, 3),
        text("l" + i, m, y + 44, 360, 48, { font: D, size: 28, weight: 700, color: ink }, label.content, label.extra),
        text("d" + i, m + 380, y + 44, 700, 48, { font: F, size: 22, color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  if (strategy === "emphasis.word") {
    return [
      ...ground(),
      shape("rule", m, 250, 180, 8, accent, 3),
      title(m, 290, 1400, 220, 200),
    ];
  }

  if (strategy === "emphasis.corner") {
    return [
      ...ground(),
      shape("block", W - 480, 0, 480, 480, accent, 2),
      title(m, 620, 980, 160, 72),
    ];
  }

  if (strategy === "emphasis.band") {
    return [
      ...ground(),
      shape("band", 0, 330, W, 240, accent, 2),
      title(m, 380, inner, 140, 64, on, "center"),
    ];
  }

  if (strategy === "narrative.bleed") {
    const scrim = shape("scrim", 0, 560, W, 340, kit.bg || ink, 4);
    scrim.opacity = 0.88;
    return [
      photo("photo", 0, 0, W, H, kit.photoUrl, 1),
      scrim,
      title(m, 640, 1100, 140, 60),
      text("note", m, 790, 900, 60, { font: F, size: 24, color: muted }, { binding: "bullets" }),
    ];
  }

  if (strategy === "narrative.margin") {
    return [
      shape("margin", 0, 0, 460, H, accent, 1),
      title(48, 280, 360, 280, 56, on),
      text("note", 540, 260, 960, 280, { font: F, size: 32, color: ink }, { binding: "bullets" }),
    ];
  }

  if (strategy === "narrative.frames") {
    const elements = [...ground(), title(m, 48, 900, 90, 44)];
    const tops = [180, 250, 160];
    const col = (inner - 48) / 3;
    for (let i = 0; i < 3; i += 1) {
      const x = m + i * (col + 24);
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        photo("frame" + i, x, tops[i], col, 360, kit.photoUrl, 2),
        text("l" + i, x, tops[i] + 380, col, 48, { font: D, size: 26, weight: 700, color: ink }, label.content, label.extra),
        text("d" + i, x, tops[i] + 430, col, 56, { font: F, size: 20, color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  if (strategy === "transition.pause") {
    return [
      ...ground(),
      shape("rule", W / 2 - 40, 300, 80, 6, accent, 3),
      title(m, 340, inner, 180, 80, ink, "center"),
    ];
  }

  if (strategy === "transition.chapter") {
    return [
      ...ground(),
      text("num", m, 160, 500, 280, { font: D, size: 200, weight: 750, color: accent }, { spans: [{ text: "02" }] }),
      title(m, 640, 1000, 140, 140),
    ];
  }

  if (strategy === "transition.edge") {
    return [
      ...ground(),
      shape("edge", 0, 0, 16, H, accent, 3),
      title(m, 340, 720, 200, 72),
    ];
  }

  return [...ground(), title(m, 300, inner, 160, 64)];
}

module.exports = {
  JOBS,
  STRATEGIES,
  PREFERRED_LAYOUT,
  LAYOUT_POOL,
  planReasoning,
  previewFor,
  buildStrategy,
};
