#!/usr/bin/env node
/**
 * Which model is actually worth paying for?
 *
 * Runs the REAL deck-generation pipeline across a ladder of models and
 * reports cost, latency and the quality signals that matter, so the choice
 * is made from evidence instead of from somebody's opinion about model
 * names. Running the whole ladder once costs well under a dollar.
 *
 *   node scripts/compare-models.js
 *   node scripts/compare-models.js --slides 8 --brief ./my-brief.txt
 *   node scripts/compare-models.js --only google/gemini-2.5-flash,deepseek/deepseek-chat
 *
 * Needs OPENROUTER_API_KEY in the environment (the same one the app uses).
 *
 * The scoring is deliberately crude and mechanical. It does not tell you
 * which deck reads better -- only you can judge that, and the script prints
 * the actual titles and bullets so you can. What it does catch is the
 * failure mode that matters: a model that agrees with the prompt's rules
 * and then ignores them.
 */

require("dotenv").config();

const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// The ladder. Prices are USD per million tokens and are APPROXIMATE -- they
// change, and OpenRouter's own page is the source of truth. They are here to
// give order-of-magnitude cost per deck, not an invoice.
// ---------------------------------------------------------------------------
const LADDER = [
  { id: "google/gemini-2.5-flash-lite", label: "Flash Lite (current)", inUsd: 0.10, outUsd: 0.40 },
  { id: "google/gemini-2.5-flash",      label: "Flash",               inUsd: 0.30, outUsd: 2.50 },
  { id: "deepseek/deepseek-chat",       label: "DeepSeek V3",         inUsd: 0.27, outUsd: 1.10 },
  { id: "openai/gpt-4.1-mini",          label: "GPT-4.1 mini",        inUsd: 0.40, outUsd: 1.60 },
  { id: "anthropic/claude-sonnet-4.5",  label: "Claude Sonnet 4.5",   inUsd: 3.00, outUsd: 15.00 },
];

const DEFAULT_BRIEF = `
Northwind Logistics is a mid-size freight brokerage operating across the US Midwest.
In 2025 they moved 142,000 loads, up from 98,000 in 2024. Revenue reached $310M with a
gross margin of 14.2%, down from 16.1% the previous year as carrier rates rose.
Their biggest operational problem is manual load matching: dispatchers spend an average
of 23 minutes per load finding and booking a carrier, and 31% of loads are booked
outside the target rate band. They piloted an automated matching engine in Q3 across
two lanes, which cut booking time to 6 minutes and brought off-band bookings to 9%.
They now want board approval to roll the engine out across all 14 lanes in 2026,
at a build cost of $2.4M against projected annual savings of $7.1M.
Key risks: carrier adoption, integration with their 11-year-old TMS, and a competitor
(Redline Freight) launching a similar capability in Q2.
`.trim();

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const SLIDE_COUNT = parseInt(arg("slides", "8"), 10);
const BRIEF_PATH = arg("brief", null);
const ONLY = arg("only", null);
const BRIEF = BRIEF_PATH ? fs.readFileSync(path.resolve(BRIEF_PATH), "utf8") : DEFAULT_BRIEF;

// ---------------------------------------------------------------------------
// Quality signals, straight off the prompt's own rules.
// ---------------------------------------------------------------------------
const GENERIC_TITLES = [
  "key insights", "important analysis", "core capabilities", "overview",
  "introduction", "conclusion", "key takeaways", "our approach", "next steps",
  "summary", "background", "the opportunity", "key benefits", "why us",
];

function scoreDeck(slides) {
  const titles = [];
  const bullets = [];

  for (const s of slides || []) {
    const t = s?.slide_title?.text || s?.title || "";
    if (t) titles.push(String(t));
    const bs = s?.bullets || s?.content || [];
    for (const b of Array.isArray(bs) ? bs : []) {
      const text = typeof b === "string" ? b : b?.text || "";
      if (text) bullets.push(String(text));
    }
  }

  const genericTitles = titles.filter((t) =>
    GENERIC_TITLES.some((g) => t.toLowerCase().trim() === g || t.toLowerCase().startsWith(g + " "))
  ).length;

  const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
  const bulletWords = bullets.map(words);
  const avgBulletWords = bulletWords.length
    ? bulletWords.reduce((a, b) => a + b, 0) / bulletWords.length
    : 0;

  // Rule 3: bullets should be 15-25 words.
  const inRange = bulletWords.filter((w) => w >= 15 && w <= 25).length;

  // Rule 3: at least one concrete figure per slide. Count bullets carrying
  // a number, percentage, currency amount or year.
  const withFigures = bullets.filter((b) => /\d/.test(b)).length;

  // Did it actually use the source, or invent a generic deck? Look for
  // distinctive strings from the brief.
  const anchors = ["Northwind", "142,000", "310", "14.2", "23 minutes", "Redline", "2.4", "7.1", "TMS"];
  const sourceHits = anchors.filter((a) => JSON.stringify(slides || []).includes(a)).length;

  return {
    slides: (slides || []).length,
    titles,
    genericTitles,
    bulletCount: bullets.length,
    avgBulletWords: Math.round(avgBulletWords * 10) / 10,
    bulletsInRange: bulletWords.length ? Math.round((inRange / bulletWords.length) * 100) : 0,
    bulletsWithFigures: bulletWords.length ? Math.round((withFigures / bullets.length) * 100) : 0,
    sourceAnchors: `${sourceHits}/${anchors.length}`,
    sampleTitles: titles.slice(0, 4),
    sampleBullets: bullets.slice(0, 3),
  };
}

async function run() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set. Add it to Slidexy-BE/.env and retry.");
    process.exit(1);
  }

  const ladder = ONLY
    ? LADDER.filter((m) => ONLY.split(",").map((s) => s.trim()).includes(m.id))
    : LADDER;

  if (ladder.length === 0) {
    console.error("No models matched --only. Known ids:\n  " + LADDER.map((m) => m.id).join("\n  "));
    process.exit(1);
  }

  console.log(`\nComparing ${ladder.length} models on a ${SLIDE_COUNT}-slide deck.`);
  console.log(`Brief: ${BRIEF.slice(0, 70).replace(/\s+/g, " ")}...\n`);

  const results = [];

  for (const model of ladder) {
    // The service reads the model from the env at call time, so setting it
    // here runs the real shipping pipeline rather than a reimplementation.
    process.env.OPENROUTER_QUALITY_MODEL = model.id;

    // Fresh require each time: the model constant is read at module load.
    for (const k of Object.keys(require.cache)) {
      if (k.includes("geminiModels") || k.includes("generateSlideText")) delete require.cache[k];
    }
    const { generateSlideText } = require("../services/generateSlideText");

    process.stdout.write(`  ${model.label.padEnd(24)} `);
    const t0 = Date.now();
    let slides = null;
    let error = null;
    try {
      slides = await generateSlideText(BRIEF, {
        goal: "Win board approval for a $2.4M rollout",
        tone: "Direct, evidence-led",
        audience: "Board of directors",
      }, SLIDE_COUNT);
    } catch (err) {
      error = err.message;
    }
    const ms = Date.now() - t0;

    if (error) {
      console.log(`FAILED  ${error.slice(0, 60)}`);
      results.push({ model, error, ms });
      continue;
    }

    const score = scoreDeck(slides);
    // Cost estimate from the measured prompt plus the produced JSON.
    const inTok = 3000;
    const outTok = Math.round(JSON.stringify(slides).length / 4);
    const cost = (inTok / 1e6) * model.inUsd + (outTok / 1e6) * model.outUsd;

    console.log(
      `${String(ms / 1000).slice(0, 4)}s  $${cost.toFixed(4)}/deck  ` +
      `${score.avgBulletWords}w avg  ${score.bulletsInRange}% in range  ` +
      `${score.bulletsWithFigures}% with figures  ${score.genericTitles} generic titles`
    );
    results.push({ model, score, ms, cost, outTok });
  }

  // -------------------------------------------------------------------------
  console.log("\n" + "=".repeat(78));
  console.log("SAMPLE OUTPUT  (the numbers above cannot tell you which reads better)");
  console.log("=".repeat(78));
  for (const r of results) {
    if (r.error) continue;
    console.log(`\n--- ${r.model.label} ---`);
    r.score.sampleTitles.forEach((t) => console.log(`  TITLE:  ${t}`));
    r.score.sampleBullets.forEach((b) => console.log(`  BULLET: ${b.slice(0, 130)}`));
  }

  console.log("\n" + "=".repeat(78));
  console.log("COST AT VOLUME");
  console.log("=".repeat(78));
  console.log("model".padEnd(26) + "per deck".padEnd(12) + "100 decks".padEnd(12) + "1,000 decks");
  for (const r of results) {
    if (r.error) continue;
    console.log(
      r.model.label.padEnd(26) +
      `$${r.cost.toFixed(4)}`.padEnd(12) +
      `$${(r.cost * 100).toFixed(2)}`.padEnd(12) +
      `$${(r.cost * 1000).toFixed(2)}`
    );
  }

  console.log(
    "\nPick the cheapest row whose sample output you would put in front of a client.\n" +
    "Then set OPENROUTER_QUALITY_MODEL to that id in .env. No code change needed.\n"
  );

  const out = path.join(__dirname, "model-comparison.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`Full decks written to ${out}\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
