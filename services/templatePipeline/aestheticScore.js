/**
 * Calls the LAION aesthetic sidecar. Failures are non-fatal: the caller logs
 * and keeps the deck.
 */

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "score_aesthetics.py");

function scoreDeckFile(deckPath) {
  const result = spawnSync("python", [SCRIPT, deckPath], {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "aesthetic score failed").trim();
    process.stderr.write(message + "\n");
    return null;
  }
  const line = String(result.stdout || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("{"))
    .pop();
  if (!line) {
    process.stderr.write("aesthetic score returned no JSON\n");
    return null;
  }
  try {
    const parsed = JSON.parse(line);
    return {
      aesthetic_mean: parsed.deck_mean,
      aesthetic_min: parsed.deck_min,
      slide_scores: parsed.slide_scores,
    };
  } catch (error) {
    process.stderr.write("aesthetic score JSON was not readable\n");
    return null;
  }
}

module.exports = { scoreDeckFile };
