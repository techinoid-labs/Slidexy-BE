/**
 * Generate three proof decks with real LLM (ENGINE_V1_SKIP_LLM unset).
 * node -r ts-node/register/transpile-only scripts/proof-llm.ts
 */
const fs = require("fs");
const path = require("path");

require("ts-node/register/transpile-only");
const { generateKitV1 } = require("../engine/generateKitV1");

delete process.env.ENGINE_V1_SKIP_LLM;

const ROOT = path.join(__dirname, "..");

async function main() {
  const proofs = [
    { id: "supercars-garage", prompt: "A supercars garage brand pitch", deckType: "Pitch" },
    { id: "pediatric-dental", prompt: "Pediatric dental clinic overview", deckType: "Overview" },
    { id: "b2b-payroll", prompt: "B2B payroll SaaS for EU compliance pitch", deckType: "Pitch" },
  ];
  const summary: any = { proofs: [], failedAfterRepair: [] };

  for (const p of proofs) {
    // Write under proof-llm/ so locked PowerPoint files in out/proof/ do not EBUSY
    const outDir = path.join(ROOT, "out", "proof-llm", p.id);
    fs.mkdirSync(outDir, { recursive: true });
    console.log("generating", p.id, "...");
    const result = await generateKitV1(p.prompt, p.deckType, { outDir, id: p.id });
    const entry = {
      id: p.id,
      repaired: result.repaired,
      gatesPass: result.gates.pass,
      selections: result.selections,
      style: result.spec.style,
      deckspecPath: path.join(outDir, "deckspec.json"),
    };
    summary.proofs.push(entry);
    if (result.failedAfterRepair) {
      summary.failedAfterRepair.push({ id: p.id, spec: result.failedAfterRepair.spec, gates: result.failedAfterRepair.gates });
    }
    console.log(p.id, "gates", result.gates.pass, "repaired", result.repaired);
  }

  fs.writeFileSync(path.join(ROOT, "out", "proof-llm", "llm-summary.json"), JSON.stringify(summary, null, 2));
  console.log("wrote out/proof-llm/llm-summary.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
