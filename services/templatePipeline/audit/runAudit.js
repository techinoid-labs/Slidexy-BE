/**
 * Design gap audit: measures the reference set and our decks with the same
 * rules and writes audit/results.json.
 *
 *   node services/templatePipeline/audit/runAudit.js
 *
 * Needs the reference .pptx files in .audit-cache/reference (fetchReference.js)
 * and our sample decks in audit/samples/ours (sampleOurs.js).
 */

const fs = require("fs");
const path = require("path");
const { readPptx } = require("./fromPptx");
const { readDeck } = require("./fromDeck");
const { analyzeDeck } = require("./metrics");
const { CACHE, manifest } = require("./fetchReference");

const ROOT = path.join(__dirname, "..", "..", "..");
const SAMPLES = path.join(__dirname, "samples", "ours");
const STORED = path.join(ROOT, "generated-templates");
const LIBRARY = path.join(ROOT, "..", "slidesX-Flutter-POC", "assets", "templates", "decks");
const OUT = path.join(__dirname, "results.json");

function readJsonDir(dir, filter) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".json") && !name.startsWith("_") && name !== "taste.json" && name !== "rejects.json")
    .filter(filter || (() => true))
    .map((name) => ({ name, deck: JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) }));
}

const METRICS = {
  background: ["flatShare", "systemsUsed", "meanLayers"],
  decoration: ["perContentSlide", "groupsPerContentSlide", "perCover", "perTitleSlide", "familyCount", "edgeAnchoredShare"],
  components: ["types", "perContentSlide", "topShare", "maxSlideShare"],
  images: ["photos", "imageSlides", "treatedSlideShare", "backgroundPhotos", "nonPlainShare", "treatmentKinds", "textOverShare", "stickers"],
  typography: ["slidesWithPlay", "featuresPerSlide", "featureKinds", "meanRatio", "maxTitle", "fonts"],
  composition: ["signatureRatio", "overlapShare", "bleedShare", "tiltShare", "breakSlides", "meanCoverage", "meanDepth", "leftEdgeSpread"],
  cohesion: ["paletteSize", "topThreeShare", "fontCount", "dominantRadiusShare", "radiusKinds", "strokeWidths", "shadowStyles", "shapeFamilies", "recurringMotifs", "recurringChrome"],
  imperfection: ["slidesWithAny", "slidesWithTwo", "perSlide"],
};

function value(deck, group, name) {
  const v = deck[group][name];
  if (Array.isArray(v)) return v.length;
  return typeof v === "number" ? v : null;
}

function stats(list) {
  const xs = list.filter((n) => typeof n === "number" && Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mean = xs.reduce((s, n) => s + n, 0) / xs.length;
  const mid = Math.floor(xs.length / 2);
  const median = xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
  const sd = Math.sqrt(xs.reduce((s, n) => s + (n - mean) ** 2, 0) / xs.length);
  const r = (n) => Math.round(n * 1000) / 1000;
  return { n: xs.length, mean: r(mean), median: r(median), sd: r(sd), min: r(xs[0]), max: r(xs[xs.length - 1]) };
}

function pooled(decks) {
  const slides = decks.flatMap((d) => d.slides);
  const content = slides.filter((s) => s.role === "content");
  const photos = slides.flatMap((s) => s.photos);
  const count = (list) => list.reduce((acc, k) => ((acc[k] = (acc[k] || 0) + 1), acc), {});
  const pct = (counts, total) => Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, Math.round((n / Math.max(1, total)) * 1000) / 10]));
  const molecules = content.flatMap((s) => s.molecules);
  return {
    slides: slides.length,
    contentSlides: content.length,
    photos: photos.length,
    backgroundPrimaryPct: pct(count(slides.map((s) => s.background.primary)), slides.length),
    backgroundSystemPct: pct(count(slides.flatMap((s) => s.background.systems)), slides.length),
    decorFamilyPct: pct(count(slides.flatMap((s) => s.decoration.families)), slides.length),
    moleculePct: pct(count(molecules), molecules.length),
    moleculesPerContentSlide: content.length ? Math.round((molecules.length / content.length) * 100) / 100 : 0,
    treatmentPct: pct(count(photos.flatMap((p) => p.treatments)), photos.length),
    nonPlainPhotoPct: photos.length ? Math.round((photos.filter((p) => p.nonPlain).length / photos.length) * 1000) / 10 : null,
    typographyPct: pct(count(slides.flatMap((s) => s.typography.features)), slides.length),
    archetypePct: pct(count(slides.map((s) => s.composition.archetype)), slides.length),
    imperfectionPct: pct(count(slides.flatMap((s) => s.imperfection)), slides.length),
    decorPerContentSlide: stats(content.map((s) => s.decoration.count)),
    decorPerCover: stats(slides.filter((s) => s.role === "cover").map((s) => s.decoration.count)),
  };
}

/**
 * Layout reuse across a catalog: a slide counts as repeated when the same
 * 4x3 occupancy grid shows up in at least three other decks.
 */
function crossDeck(decks) {
  const owners = new Map();
  decks.forEach((d, i) => d.slides.forEach((s) => {
    const sig = s.composition.signature;
    if (!owners.has(sig)) owners.set(sig, new Set());
    owners.get(sig).add(i);
  }));
  const slides = decks.flatMap((d, i) => d.slides.map((s) => ({ s, i })));
  const repeated = slides.filter(({ s, i }) => [...owners.get(s.composition.signature)].filter((j) => j !== i).length >= 3);
  return {
    distinctSignatures: owners.size,
    slides: slides.length,
    distinctPerSlide: slides.length ? Math.round((owners.size / slides.length) * 1000) / 1000 : 0,
    repeatedShare: slides.length ? Math.round((repeated.length / slides.length) * 1000) / 1000 : 0,
  };
}

/** Share of decks that would pass each target from the spec, as written. */
function targetPassRates(decks) {
  const out = {};
  for (const name of Object.keys((decks[0] && decks[0].targets) || {})) {
    const values = decks.map((d) => d.targets[name]).filter((v) => v !== null && v !== undefined);
    out[name] = values.length ? { pass: values.filter(Boolean).length, of: values.length, rate: Math.round((values.filter(Boolean).length / values.length) * 100) / 100 } : null;
  }
  return out;
}

function summarize(decks) {
  const summary = {};
  for (const [group, names] of Object.entries(METRICS)) {
    summary[group] = {};
    for (const name of names) summary[group][name] = stats(decks.map((d) => value(d, group, name)));
  }
  return { decks: decks.length, perDeck: summary, targets: targetPassRates(decks), pooled: { ...pooled(decks), crossDeck: crossDeck(decks) } };
}

function catalogDiversity(decks) {
  const tally = (list) => {
    const counts = {};
    for (const k of list) counts[k] = (counts[k] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { distinct: sorted.length, topShare: sorted.length ? Math.round((sorted[0][1] / list.length) * 1000) / 10 : 0, top: sorted.slice(0, 5) };
  };
  return {
    fontPairing: tally(decks.map((d) => d.tokens && d.tokens.font ? `${d.tokens.font.display} / ${d.tokens.font.text}` : "?")),
    displayFont: tally(decks.map((d) => d.tokens && d.tokens.font ? d.tokens.font.display : "?")),
    background: tally(decks.map((d) => d.tokens && d.tokens.color ? d.tokens.color.bg : "?")),
    subjectWord: tally(decks.map((d) => String(d.name || "").split(/\s+/)[0].toLowerCase())),
    cover: tally(decks.map((d) => (d.taste && d.taste.cover) || String(d.geometry || "").split(".")[0])),
    groundMode: tally(decks.map((d) => {
      const first = d.layouts && Object.values(d.layouts)[1];
      const wash = first && first.elements.find((e) => e.shapeContent && e.shapeContent.kind === "decor" && e.width >= 1600);
      return wash ? wash.shapeContent.decorName : "none";
    })),
  };
}

function strip(deck, keepSlides) {
  const out = { ...deck };
  out.slides = keepSlides
    ? deck.slides.map((s) => ({
      index: s.index,
      role: s.role,
      background: s.background.primary,
      layers: s.background.layers,
      decoration: s.decoration.count,
      families: s.decoration.families,
      molecules: s.molecules,
      photos: s.photos.map((p) => p.treatments),
      typography: s.typography.features,
      archetype: s.composition.archetype,
      signature: s.composition.signature,
      depth: s.depth,
      imperfection: s.imperfection,
    }))
    : undefined;
  return out;
}

function runAudit() {
  const t0 = Date.now();
  const reference = manifest().entries.map((entry) => {
    const file = path.join(CACHE, entry.slug + ".pptx");
    if (!fs.existsSync(file)) throw new Error("Missing reference deck " + entry.slug + ". Run fetchReference.js first.");
    const model = readPptx(file);
    return analyzeDeck(model, { source: "reference", slug: entry.slug, bucket: entry.bucket, complete: model.complete });
  });
  const ours = readJsonDir(SAMPLES, (name) => name.startsWith("gen-")).map(({ deck }) => analyzeDeck(readDeck(deck), {
    source: "ours", slug: deck.id, name: deck.name, geometry: deck.geometry,
  }));
  const storedRaw = readJsonDir(STORED);
  const stored = storedRaw.map(({ deck }) => analyzeDeck(readDeck(deck), { source: "stored", slug: deck.id, name: deck.name, status: deck.status || "candidate" }));
  const libraryRaw = readJsonDir(LIBRARY);
  const library = libraryRaw.map(({ deck, name }) => analyzeDeck(readDeck(deck), { source: "library", slug: deck.id || name, name: deck.name }));
  const oursRaw = readJsonDir(SAMPLES, (name) => name.startsWith("gen-")).map(({ deck }) => deck);

  const results = {
    generatedAt: new Date().toISOString(),
    method: {
      canvas: "1600x900 px; PPTX EMU scaled to canvas",
      housekeeping: "Template credit, font list, resource and how-to slides are removed before measuring.",
      roles: "First kept slide is the cover, last is the closing; other slides with <=4 short texts, no photos and a >=44px headline are title slides; the rest are content slides.",
      ourBindings: "Deck JSON is measured on its preview slides with the studio sample copy; image slots count as photos.",
    },
    reference: { ...summarize(reference), decks: reference.map((d) => strip(d, true)) },
    ours: { ...summarize(ours), decks: ours.map((d) => strip(d, true)), catalog: catalogDiversity(oursRaw) },
    stored: {
      ...summarize(stored),
      byStatus: Object.fromEntries(["ship", "discard", "candidate"].map((status) => [status, summarize(stored.filter((d) => d.status === status))])),
      catalog: catalogDiversity(storedRaw.map((r) => r.deck)),
    },
    library: summarize(library),
    seconds: Math.round((Date.now() - t0) / 100) / 10,
  };
  results.reference.count = reference.length;
  results.ours.count = ours.length;
  results.stored.count = stored.length;
  results.library.count = library.length;
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2) + "\n", "utf8");
  return results;
}

if (require.main === module) {
  const results = runAudit();
  const line = (label, group, name, scale = 1) => {
    const cells = ["reference", "ours", "stored", "library"].map((src) => {
      const s = results[src].perDeck && results[src].perDeck[group][name];
      return s ? (s.mean * scale).toFixed(2).padStart(7) : "    n/a";
    });
    console.log(label.padEnd(36), cells.join("  "));
  };
  console.log("metric".padEnd(36), ["   ref", "  ours", "stored", "   lib"].map((s) => s.padStart(7)).join("  "));
  for (const [group, names] of Object.entries(METRICS)) {
    for (const name of names) line(group + "." + name, group, name);
  }
  for (const src of ["reference", "ours", "stored", "library"]) {
    const p = results[src].pooled;
    console.log(`\n${src}: slides=${p.slides} content=${p.contentSlides} photos=${p.photos} nonPlain=${p.nonPlainPhotoPct}% crossDeck=${JSON.stringify(p.crossDeck)}`);
    console.log("  bg primary", JSON.stringify(p.backgroundPrimaryPct));
    console.log("  decor fam ", JSON.stringify(p.decorFamilyPct));
    console.log("  molecules ", JSON.stringify(p.moleculePct));
    console.log("  treatments", JSON.stringify(p.treatmentPct));
    console.log("  typography", JSON.stringify(p.typographyPct));
    console.log("  imperfect.", JSON.stringify(p.imperfectionPct));
    console.log("  decor/content", JSON.stringify(p.decorPerContentSlide), "decor/cover", JSON.stringify(p.decorPerCover));
  }
  console.log("\ntarget pass rates (decks passing / decks):");
  for (const name of Object.keys(results.reference.targets)) {
    const cells = ["reference", "ours", "stored", "library"].map((src) => {
      const t = results[src].targets && results[src].targets[name];
      return t ? `${t.pass}/${t.of}`.padStart(7) : "    n/a";
    });
    console.log("  " + name.padEnd(30), cells.join("  "));
  }
  console.log("\nours catalog", JSON.stringify(results.ours.catalog));
  console.log("stored by status", JSON.stringify(Object.fromEntries(Object.entries(results.stored.byStatus).map(([k, v]) => [k, v.decks]))));
  console.log(`\nwrote ${OUT} in ${results.seconds}s`);
}

module.exports = { runAudit };
