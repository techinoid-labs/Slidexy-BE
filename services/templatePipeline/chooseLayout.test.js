/**
 * chooseLayout ranks DNA offline when classifyVibe is skipped and seedScores reads stubbed fs.
 *
 * Seam: seedScores closes over fs + LIBRARY. Patch fs.readdirSync / existsSync / readFileSync
 * for paths under app-library. Pass knownVibe so classifyVibe (and askModel) never run.
 *
 *   node services/templatePipeline/chooseLayout.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chooseLayout } = require("./thematic");

const LIBRARY = path.join(__dirname, "..", "..", "app-library");

const fixtures = {
  "seed-high.dna.json": {
    qualityScore: 91,
    recommendedUse: "Corporate",
    disabled: false,
    semanticType: "Abstract",
    industry: "",
  },
  "seed-mid.dna.json": {
    qualityScore: 85,
    recommendedUse: "Corporate",
    disabled: false,
    semanticType: "Abstract",
    industry: "",
  },
  "seed-low.dna.json": {
    qualityScore: 69,
    recommendedUse: "Corporate",
    disabled: false,
    semanticType: "Abstract",
    industry: "",
  },
  "seed-photo.dna.json": {
    qualityScore: 100,
    recommendedUse: "Photo-heavy",
    disabled: false,
    semanticType: "Photo-driven",
    industry: "",
  },
  "seed-ill.dna.json": {
    qualityScore: 99,
    recommendedUse: "Corporate",
    disabled: true,
    semanticType: "Illustration-heavy",
    industry: "health",
  },
};

const original = {
  readdirSync: fs.readdirSync,
  existsSync: fs.existsSync,
  readFileSync: fs.readFileSync,
  fetch: global.fetch,
};

function underLibrary(target) {
  const resolved = path.resolve(String(target || ""));
  return resolved === LIBRARY || resolved.startsWith(LIBRARY + path.sep);
}

function installFs(activeNames) {
  const names = activeNames.slice();
  fs.readdirSync = (dir) => {
    if (path.resolve(dir) === LIBRARY) return names.slice();
    return original.readdirSync(dir);
  };
  fs.existsSync = (file) => {
    if (!underLibrary(file)) return original.existsSync(file);
    const base = path.basename(file);
    if (base.endsWith(".dna.json")) return names.indexOf(base) >= 0;
    if (base.endsWith(".json")) {
      const dna = base.replace(/\.json$/, ".dna.json");
      return names.indexOf(dna) >= 0;
    }
    return false;
  };
  fs.readFileSync = (file, encoding) => {
    if (!underLibrary(file)) return original.readFileSync(file, encoding);
    const base = path.basename(file);
    if (!fixtures[base]) throw new Error("missing fixture " + base);
    return JSON.stringify(fixtures[base]);
  };
}

function restore() {
  fs.readdirSync = original.readdirSync;
  fs.existsSync = original.existsSync;
  fs.readFileSync = original.readFileSync;
  if (original.fetch === undefined) delete global.fetch;
  else global.fetch = original.fetch;
}

async function main() {
  global.fetch = async () => {
    throw new Error("classifyVibe must not call the network when knownVibe is set");
  };

  installFs([
    "seed-high.dna.json",
    "seed-mid.dna.json",
    "seed-low.dna.json",
    "seed-photo.dna.json",
    "seed-ill.dna.json",
  ]);

  const known = { vibe: "Corporate", model: "test" };
  const top = await chooseLayout("A corporate payroll company", [], known);
  assert.strictEqual(top.id, "seed-high");
  assert.strictEqual(top.vibe, "Corporate");
  assert.strictEqual(top.qualityScore, 91);
  assert.strictEqual(top.semanticType, "Abstract");

  const skipped = await chooseLayout("A corporate payroll company", ["seed-high"], known);
  assert.strictEqual(skipped.id, "seed-mid");
  assert.strictEqual(skipped.qualityScore, 85);

  installFs(["seed-low.dna.json"]);
  await assert.rejects(
    () => chooseLayout("A corporate payroll company", [], known),
    /No enabled Corporate layout scored 70 or above/
  );

  installFs(["seed-high.dna.json", "seed-low.dna.json"]);
  const again = await chooseLayout("A corporate payroll company", [], known);
  assert.strictEqual(again.id, "seed-high");
  assert.notStrictEqual(again.id, "seed-low");

  restore();
  console.log("chooseLayout test passed");
}

main().catch((error) => {
  restore();
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
