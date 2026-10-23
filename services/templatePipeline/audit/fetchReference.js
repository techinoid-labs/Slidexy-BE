/**
 * Downloads the reference decks listed in referenceSet.json into .audit-cache/reference.
 * The files are third-party templates, so they stay out of git.
 *
 *   node services/templatePipeline/audit/fetchReference.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const CACHE = path.join(ROOT, ".audit-cache", "reference");

function manifest() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "referenceSet.json"), "utf8"));
}

async function download(entry) {
  const file = path.join(CACHE, entry.slug + ".pptx");
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return { slug: entry.slug, file, cached: true };
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(entry.pptx, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const type = response.headers.get("content-type") || "";
      if (!type.includes("presentationml")) throw new Error("Unexpected content type " + type);
      fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
      return { slug: entry.slug, file, cached: false };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw new Error(entry.slug + ": " + lastError.message);
}

async function fetchReference() {
  fs.mkdirSync(CACHE, { recursive: true });
  const results = [];
  for (const entry of manifest().entries) {
    results.push(await download(entry));
  }
  return results;
}

if (require.main === module) {
  fetchReference()
    .then((rows) => rows.forEach((row) => console.log((row.cached ? "cached  " : "fetched ") + row.slug)))
    .catch((error) => { console.error(error.message); process.exit(1); });
}

module.exports = { fetchReference, CACHE, manifest };
