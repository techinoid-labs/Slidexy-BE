/**
 * Eval 15 golden prompts through generateKitV1 (LLM required).
 * Reports first-try gate pass rate. Does not repair for the rate (repair is separate).
 *
 * node -r ts-node/register/transpile-only scripts/eval.ts
 */
const fs = require("fs");
const path = require("path");

require("ts-node/register/transpile-only");
const { inventDeckSpec, generateKitV1 } = require("../engine/generateKitV1");
const { validateDeckSpec } = require("../engine/validate");
const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { tokens } = require("../engine/render");

const ROOT = path.join(__dirname, "..");
delete process.env.ENGINE_V1_SKIP_LLM;

async function main() {
  const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, "engine", "golden", "prompts.json"), "utf8"));
  const outDir = path.join(ROOT, "out", "eval");
  fs.mkdirSync(outDir, { recursive: true });

  let firstTry = 0;
  const rows: any[] = [];

  for (const item of prompts) {
    const row: any = { id: item.id, prompt: item.prompt, deckType: item.deckType };
    try {
      const spec = await inventDeckSpec(item.prompt, item.deckType);
      const v = validateDeckSpec(spec);
      row.valid = v.ok;
      if (!v.ok) {
        row.errors = v.errors;
        rows.push(row);
        console.log(item.id, "INVALID", v.errors.join("; "));
        continue;
      }
      const selections = selectAll(spec, item.prompt);
      const gates = runGates(spec, selections, tokens, item.deckType);
      row.firstTryPass = gates.pass;
      row.gateFails = gates.slides.filter((s: any) => !s.pass).map((s: any) => ({
        slideIndex: s.slideIndex,
        role: s.role,
        reasons: s.reasons,
      }));
      if (gates.pass) firstTry += 1;
      fs.writeFileSync(path.join(outDir, item.id + "-deckspec.json"), JSON.stringify(spec, null, 2));
      console.log(item.id, gates.pass ? "PASS" : "FAIL", item.prompt.slice(0, 40));
    } catch (err) {
      row.error = (err as Error).message;
      console.log(item.id, "ERROR", row.error);
    }
    rows.push(row);
  }

  const summary = {
    total: prompts.length,
    firstTryPass: firstTry,
    rate: firstTry / prompts.length,
    rows,
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log("FIRST_TRY", firstTry + "/" + prompts.length, summary.rate);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
