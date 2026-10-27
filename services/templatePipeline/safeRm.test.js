/**
 * safeRm allowlist / refuse cases.
 *
 *   node services/templatePipeline/safeRm.test.js
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { safeRm, ROOT, TMP_ROOT } = require("./safeRm");

function expectRefuse(target, pattern) {
  let threw = false;
  try {
    safeRm(target, { force: true });
  } catch (error) {
    threw = true;
    assert.ok(/safeRm refused/.test(error.message), error.message);
    if (pattern) assert.ok(pattern.test(error.message), error.message + " vs " + pattern);
  }
  assert.ok(threw, "expected refuse for " + target);
}

function main() {
  expectRefuse(undefined, /empty/);
  expectRefuse(null, /empty/);
  expectRefuse("", /empty/);
  expectRefuse(ROOT, /ROOT/);
  expectRefuse(path.join(ROOT, "generated-templates"), /generated-templates/);
  expectRefuse(path.join(ROOT, "generated-templates", "photos"), /photos/);
  expectRefuse(path.join(ROOT, "app-library"), /app-library/);
  expectRefuse(path.join(ROOT, "app-library", "native"), /native/);
  expectRefuse(path.join(ROOT, "docs"), /docs/);
  expectRefuse(path.join(ROOT, "docs", "template-pipeline"), /template-pipeline/);
  expectRefuse(path.join(ROOT, "generated-templates", "photos", "thematic"), /allowlist/);
  expectRefuse(path.join(ROOT, "app-library", "published"), /allowlist/);
  expectRefuse(path.join(ROOT, "docs", "template-pipeline", "..", "secret"), /allowlist|outside|ROOT|deny/);

  // Phase 4b deny list
  expectRefuse(path.join(ROOT, "docs", "template-pipeline", "native", "corporate-payroll"), /deny/);
  expectRefuse(path.join(ROOT, "docs", "template-pipeline", "native", "corporate-payroll", "deck.json"), /deny/);
  expectRefuse(path.join(ROOT, "docs", "template-pipeline", "merge"), /deny/);
  expectRefuse(path.join(ROOT, "docs", "template-pipeline", "merge", "phase-3-payroll"), /deny/);
  expectRefuse(path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "index.html"), /deny/);
  expectRefuse(path.join(ROOT, "app-library", "native", "composer"), /deny/);
  expectRefuse(path.join(ROOT, "app-library", "native", "composer", "cover-word-corp-calibri.json"), /deny/);

  const allowedDocs = path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "tmp", "safe-rm-test-" + Date.now());
  fs.mkdirSync(allowedDocs, { recursive: true });
  fs.writeFileSync(path.join(allowedDocs, "marker.txt"), "x");
  safeRm(allowedDocs, { recursive: true, force: true });
  assert.strictEqual(fs.existsSync(allowedDocs), false);

  const thematic = path.join(ROOT, "generated-templates", "photos", "thematic", "safe-rm-test-" + Date.now());
  fs.mkdirSync(thematic, { recursive: true });
  safeRm(thematic, { recursive: true, force: true });
  assert.strictEqual(fs.existsSync(thematic), false);

  const native = path.join(ROOT, "generated-templates", "photos", "native", "safe-rm-test-" + Date.now());
  fs.mkdirSync(native, { recursive: true });
  safeRm(native, { recursive: true, force: true });

  const composer = path.join(ROOT, "generated-templates", "photos", "composer", "safe-rm-test-" + Date.now());
  fs.mkdirSync(composer, { recursive: true });
  safeRm(composer, { recursive: true, force: true });

  const published = path.join(ROOT, "app-library", "published", "safe-rm-test-" + Date.now());
  fs.mkdirSync(published, { recursive: true });
  safeRm(published, { recursive: true, force: true });

  // tmpdir allow
  const tmpDir = fs.mkdtempSync(path.join(TMP_ROOT || os.tmpdir(), "safe-rm-tmp-"));
  fs.writeFileSync(path.join(tmpDir, "x.txt"), "x");
  safeRm(tmpDir, { recursive: true, force: true });
  assert.strictEqual(fs.existsSync(tmpDir), false);
  expectRefuse(TMP_ROOT || os.tmpdir(), /tmpdir root|deny|allowlist/);

  console.log("safeRm test passed");
}

main();
