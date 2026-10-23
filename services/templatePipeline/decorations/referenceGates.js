/**
 * Score the balanced reference slides with the same four questions as gates.js.
 * The slides are the 75 PNGs in evaluations/preferences/rendered. The measures
 * come from the PowerPoint those PNGs were rendered from, because a PNG has
 * no element list.
 *
 *   node services/templatePipeline/decorations/referenceGates.js
 */

const path = require("path");
const { readPptx } = require("../audit/fromPptx");
const { analyzeSlide } = require("../audit/metrics");

const MANIFEST = path.join(__dirname, "..", "..", "..", "evaluations", "preferences", "rendered", "manifest.json");

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

function summarize(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
  return {
    n: values.length,
    min: sorted[0],
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    mean: Math.round(mean * 100) / 100,
  };
}

function score(slide) {
  const photos = slide.photos || [];
  const plain = photos.filter((photo) => !photo.nonPlain).length;
  return {
    decoration: slide.decoration.count,
    overlap: Boolean(slide.composition.overlap),
    edge: slide.decoration.edgeAnchored >= 1,
    bleedOff: Boolean(slide.composition.bleed),
    images: photos.length,
    plainImages: plain,
    role: slide.role,
  };
}

function main() {
  const manifest = require(MANIFEST);
  const balanced = manifest.balanced || [];
  const byFile = new Map();
  balanced.forEach((item) => {
    if (!byFile.has(item.file)) byFile.set(item.file, []);
    byFile.get(item.file).push(item);
  });
  const rows = [];
  byFile.forEach((items, file) => {
    const source = items[0] && manifest.decks.find((deck) => deck.file === file);
    const model = readPptx(source.path);
    const body = 20;
    items.forEach((item) => {
      const raw = model.slides[item.slide - 1];
      if (!raw) {
        rows.push({ file, slide: item.slide, png: item.png, missing: true });
        return;
      }
      const analyzed = analyzeSlide(raw, model.scheme || {}, body);
      rows.push({ file, slide: item.slide, png: item.png, bucket: item.bucket, ...score(analyzed) });
    });
  });
  const present = rows.filter((row) => !row.missing);
  const gates = {
    decoration: present.filter((row) => row.decoration >= 3).length,
    overlap: present.filter((row) => row.overlap).length,
    edge: present.filter((row) => row.edge).length,
    plain: present.filter((row) => row.images === 0 || row.plainImages / row.images <= 0.4).length,
  };
  const withImages = present.filter((row) => row.images > 0);
  const imageLevel = {
    slides: withImages.length,
    slidesMostlyTreated: withImages.filter((row) => row.plainImages / row.images <= 0.4).length,
    photos: present.reduce((sum, row) => sum + row.images, 0),
    plainPhotos: present.reduce((sum, row) => sum + row.plainImages, 0),
  };
  console.log(JSON.stringify({
    slides: present.length,
    missing: rows.length - present.length,
    pass: gates,
    failShare: {
      decoration: 1 - gates.decoration / present.length,
      overlap: 1 - gates.overlap / present.length,
      edge: 1 - gates.edge / present.length,
      plain: 1 - gates.plain / present.length,
    },
    decoration: summarize(present.map((row) => row.decoration)),
    imageLevel,
    byBucket: Object.fromEntries([...new Set(present.map((row) => row.bucket))].map((bucket) => {
      const group = present.filter((row) => row.bucket === bucket);
      return [bucket, {
        n: group.length,
        decoration: group.filter((row) => row.decoration >= 3).length,
        overlap: group.filter((row) => row.overlap).length,
        edge: group.filter((row) => row.edge).length,
        plainPass: group.filter((row) => row.images === 0 || row.plainImages / row.images <= 0.4).length,
        decorMean: summarize(group.map((row) => row.decoration)).mean,
      }];
    })),
  }, null, 2));
}

main();
