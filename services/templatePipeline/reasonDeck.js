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

const { illustration, maskedImage, rotated, collage } = require("./deckSchema");

const JOBS = ["sequence", "comparison", "evidence", "emphasis", "narrative", "transition"];

const STRATEGIES = {
  sequence: ["sequence.rail", "sequence.spine", "sequence.index", "sequence.steps"],
  comparison: ["comparison.halves", "comparison.ledger", "comparison.offset", "comparison.table"],
  evidence: ["evidence.figure", "evidence.proof", "evidence.bars", "evidence.stats"],
  emphasis: ["emphasis.word", "emphasis.corner", "emphasis.band", "emphasis.quote"],
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
  "comparison.table": "layoutTeam",
  "evidence.figure": "layoutStatHighlight",
  "evidence.proof": "layoutImageLeft",
  "evidence.bars": "layoutThreeUp",
  "evidence.stats": "layoutStatHighlight",
  "emphasis.word": "layoutTextOnly",
  "emphasis.corner": "layoutFullBleedHero",
  "emphasis.band": "layoutQuoteBanner",
  "emphasis.quote": "layoutQuoteBanner",
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
  "comparison.table": ["The table", ["Open — The first row", "Hold — The second row", "Turn — The third row", "Cost — What it asks", "Return — What comes back", "Rest — Where it settles"]],
  "evidence.figure": ["The figure", ["One count, kept honest", "Counted in the room"]],
  "evidence.proof": ["The proof", ["Seen, not asserted", "The picture does the arguing"]],
  "evidence.bars": ["The weight", ["Light — A small share", "Middle — The usual share", "Heavy — Where it actually sits"]],
  "evidence.stats": ["Three counts", ["Kept — Still on the books", "Moved — Changed hands", "Left — No longer here"]],
  "emphasis.word": ["Hold still", []],
  "emphasis.corner": ["In the corner", []],
  "emphasis.band": ["Across", []],
  "emphasis.quote": ["The line", ["Night watch — Kept in the log"]],
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
  return Math.imul(hashString(key) ^ salt, 99) >>> 0;
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

module.exports = {
  JOBS,
  STRATEGIES,
  PREFERRED_LAYOUT,
  LAYOUT_POOL,
  planReasoning,
  previewFor,
  schemaPrimitives: { illustration, maskedImage, rotated, collage },
};
