/**
 * Convert every .pptx in a folder into the app library.
 *
 *   node scripts/bulk_ingest.js <folder_path>
 *
 * Each file is handed to pptxToDeck.js in its own process. A corrupt
 * file, or a deck the converter cannot parse, is appended to
 * ingest_failures.log. The batch then moves on to the next file.
 * A saved deck is scored with score_seeds.js. A scoring failure is logged
 * and does not remove the deck.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CONVERTER = path.join(ROOT, "services", "templatePipeline", "convert", "pptxToDeck.js");
const SCORER = path.join(ROOT, "scripts", "score_seeds.js");
const FAILURES = path.join(ROOT, "ingest_failures.log");
const PER_FILE_MS = 10 * 60 * 1000;

function deckIdFromName(file) {
  const base = path.basename(file, path.extname(file));
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "deck";
}

function logFailure(file, message) {
  const detail = String(message || "converter failed").replace(/\s+/g, " ").trim().slice(0, 2000);
  fs.appendFileSync(FAILURES, new Date().toISOString() + "\t" + file + "\t" + detail + "\n");
}

function failureMessage(result) {
  if (result.error) return result.error.message;
  const text = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
  if (result.signal) return "converter stopped (" + result.signal + ")" + (text ? ": " + text : "");
  return text || "converter exited " + result.status;
}

function scoreDeck(deckId, sourceFile) {
  let result;
  try {
    result = spawnSync(process.execPath, [SCORER, deckId], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    logFailure(sourceFile, "score " + error.message);
    console.error("  score failed: " + error.message);
    return { ok: false, error: error.message };
  }
  if (result.error || result.status !== 0) {
    const message = failureMessage(result);
    logFailure(sourceFile, "score " + message);
    console.error("  score failed: " + message.split(/\r?\n/).filter(Boolean)[0]);
    return { ok: false, error: message };
  }
  const line = String(result.stdout || "").split(/\r?\n/).filter((item) => item.indexOf("score " + deckId) === 0).pop() || "";
  console.log("  " + (line || "scored"));
  return { ok: true, line };
}

function bulkIngest(folder) {
  const dir = path.resolve(folder);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error("Not a folder: " + dir);
  }
  const files = fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".pptx") && !name.startsWith("~$"))
    .sort();
  const results = [];
  files.forEach((name) => {
    const input = path.join(dir, name);
    const deckId = deckIdFromName(name);
    console.log("ingest " + name + " -> " + deckId);
    let result;
    try {
      result = spawnSync(process.execPath, [CONVERTER, input, deckId], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: PER_FILE_MS,
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (error) {
      logFailure(input, error.message);
      console.error("  failed: " + error.message);
      results.push({ file: name, ok: false, deckId, error: error.message });
      return;
    }
    if (result.error || result.status !== 0) {
      const message = failureMessage(result);
      logFailure(input, message);
      const lines = message.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      console.error("  failed: " + (lines.find((line) => line.startsWith("Error:")) || lines[0]));
      results.push({ file: name, ok: false, deckId, error: message });
      return;
    }
    const saved = path.join("app-library", deckId + ".json");
    console.log("  saved " + saved);
    const score = scoreDeck(deckId, input);
    results.push({ file: name, ok: true, deckId, jsonPath: saved, score });
  });
  return results;
}

if (require.main === module) {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node scripts/bulk_ingest.js <folder_path>");
    process.exit(1);
  }
  try {
    const results = bulkIngest(folder);
    const ok = results.filter((item) => item.ok).length;
    const failed = results.length - ok;
    console.log("ingested " + ok + " of " + results.length + (failed ? "; " + failed + " logged in ingest_failures.log" : ""));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { bulkIngest, deckIdFromName };
