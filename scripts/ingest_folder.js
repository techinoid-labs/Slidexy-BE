/**
 * Convert every .pptx in a folder into the app library.
 *
 *   node scripts/ingest_folder.js <folder_path>
 *
 * Each presentation is passed to pptxToDeck. The deck JSON is written to
 * app-library/<deck-id>.json. Extracted pictures are written to
 * generated-templates/photos/<deck-id>/, which is where the renderer
 * loads them.
 */

const fs = require("fs");
const path = require("path");
const { convertPptx } = require("../services/templatePipeline/convert/pptxToDeck");

function deckIdFromName(file) {
  const base = path.basename(file, path.extname(file));
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "deck";
}

function ingestFolder(folder) {
  const dir = path.resolve(folder);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error("Not a folder: " + dir);
  }
  const files = fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".pptx") && !name.startsWith("~$"))
    .sort();
  if (!files.length) throw new Error("No .pptx files in " + dir);
  const seen = new Map();
  const results = [];
  files.forEach((name) => {
    const deckId = deckIdFromName(name);
    if (seen.has(deckId)) console.warn("duplicate deck id " + deckId + " from " + name + "; the previous file will be overwritten");
    seen.set(deckId, name);
    const input = path.join(dir, name);
    console.log("ingest " + name + " -> " + deckId);
    try {
      const summary = convertPptx(input, deckId);
      results.push({
        file: name,
        ok: true,
        deckId: summary.deckId,
        slides: summary.slides,
        images: summary.images,
        jsonPath: summary.jsonPath,
        photoDir: summary.photoDir,
        warnings: summary.warnings,
      });
      console.log("  slides " + summary.slides + ", images " + summary.images);
    } catch (error) {
      results.push({ file: name, ok: false, deckId, error: error.message });
      console.error("  failed: " + error.message);
    }
  });
  return results;
}

if (require.main === module) {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node scripts/ingest_folder.js <folder_path>");
    process.exit(1);
  }
  try {
    const results = ingestFolder(folder);
    const ok = results.filter((item) => item.ok).length;
    console.log("ingested " + ok + " of " + results.length);
    if (ok !== results.length) process.exit(1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { ingestFolder, deckIdFromName };
