const fs = require("fs");
const path = require("path");
import { DeckSpec, DeckType } from "./types";
const { validateDeckSpec } = require("./validate");
const { selectAll } = require("./selectVariant");
const { runGates } = require("./gates");
const { renderDeckFromSpec, tokens } = require("./render");

const ROOT = path.join(__dirname, "..");

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line: string) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function extractJson(text: string): any {
  const trimmed = String(text || "").trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON object in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

async function askOpenRouter(key: string, prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://slidexy.local",
      "X-Title": "Slidexy Engine v1",
    },
    body: JSON.stringify({
      model: process.env.ENGINE_V1_MODEL || "google/gemini-2.5-flash-lite",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You write DeckSpec JSON only. No prose." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error("OpenRouter HTTP " + res.status + " " + (await res.text()).slice(0, 200));
  const data: any = await res.json();
  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!text) throw new Error("OpenRouter returned empty content");
  return text;
}

async function askGoogle(key: string, prompt: string): Promise<string> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + key;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "You write DeckSpec JSON only. No prose.\n\n" + prompt }] }],
    }),
  });
  const body: any = await res.json();
  if (!res.ok) throw new Error((body.error && body.error.message) || "Gemini HTTP " + res.status);
  const text =
    body.candidates &&
    body.candidates[0] &&
    body.candidates[0].content &&
    body.candidates[0].content.parts &&
    body.candidates[0].content.parts[0] &&
    body.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

/** Resolve text from OpenRouter or Gemini. Throws if no LLM endpoint works. */
async function askModel(prompt: string): Promise<string> {
  loadEnv();
  const openRouter = process.env.OPENROUTER_API_KEY;
  const google = process.env.API_KEY1 || process.env.GEMINI_API_KEY;
  if (!openRouter && !google) {
    throw new Error("No LLM available — set OPENROUTER_API_KEY or API_KEY1 / GEMINI_API_KEY");
  }
  const errors: string[] = [];
  if (openRouter) {
    try {
      return await askOpenRouter(openRouter, prompt);
    } catch (err) {
      errors.push("openrouter: " + (err as Error).message);
      if (!google) throw err;
      console.warn("OpenRouter failed; trying Gemini:", (err as Error).message.slice(0, 120));
    }
  }
  if (google) {
    try {
      return await askGoogle(google, prompt);
    } catch (err) {
      errors.push("gemini: " + (err as Error).message);
      throw new Error("No LLM available — " + errors.join(" | "));
    }
  }
  throw new Error("No LLM available — " + errors.join(" | "));
}

function buildPrompt(userPrompt: string, deckType: DeckType, repairNotes?: string[]): string {
  const guide = fs.readFileSync(path.join(__dirname, "prompts", "deckspec.md"), "utf8");
  const goldens = fs
    .readdirSync(path.join(__dirname, "golden", "specs"))
    .filter((n: string) => n.endsWith(".json"))
    .slice(0, 5)
    .map((n: string) => fs.readFileSync(path.join(__dirname, "golden", "specs", n), "utf8"))
    .join("\n\n");
  let msg =
    guide +
    "\n\n## Golden examples\n" +
    goldens +
    "\n\n## Request\ndeckType: " +
    deckType +
    "\nprompt: " +
    userPrompt +
    "\n";
  if (repairNotes && repairNotes.length) {
    msg +=
      "\n## Repair (fix ONLY these gate failures; keep style unless invalid)\n" +
      repairNotes.map((r) => "- " + r).join("\n") +
      "\n";
  }
  return msg;
}

/** LLM must produce a valid DeckSpec. No deterministic fallback. One validation re-ask max. */
export async function inventDeckSpec(prompt: string, deckType: DeckType, repairNotes?: string[]): Promise<DeckSpec> {
  let text = await askModel(buildPrompt(prompt, deckType, repairNotes));
  let parsed = extractJson(text);
  let check = validateDeckSpec(parsed);
  if (!check.ok && !(repairNotes && repairNotes.length)) {
    // One schema/token repair (still LLM) — distinct from gate repair in generateKitV1
    text = await askModel(
      buildPrompt(prompt, deckType, check.errors.map((e: string) => "validation: " + e))
    );
    parsed = extractJson(text);
    check = validateDeckSpec(parsed);
  }
  if (!check.ok) throw new Error("invalid DeckSpec: " + check.errors.join("; "));
  return parsed;
}

export async function generateKitV1(
  prompt: string,
  deckType: DeckType = "Pitch",
  options?: { outDir?: string; id?: string }
): Promise<{
  deck: any;
  spec: DeckSpec;
  selections: Array<{ role: string; variant: string }>;
  gates: any;
  repaired: boolean;
  failedAfterRepair?: any;
  outDir?: string;
}> {
  loadEnv();
  let spec = await inventDeckSpec(prompt, deckType);
  let selections = selectAll(spec, prompt);
  let gates = runGates(spec, selections, tokens);
  let repaired = false;
  let failedAfterRepair: any = null;

  if (!gates.pass) {
    const notes = gates.slides.flatMap((s: any) => s.reasons.map((r: string) => "slide " + s.slideIndex + " " + r));
    repaired = true;
    spec = await inventDeckSpec(prompt, deckType, notes);
    selections = selectAll(spec, prompt + ":repair");
    gates = runGates(spec, selections, tokens);
    if (!gates.pass) failedAfterRepair = { spec, gates };
  }

  const id =
    (options && options.id) ||
    ("kit-v1-" +
      String(prompt)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40) +
      "-" +
      Date.now().toString(36));
  const deck = await renderDeckFromSpec(spec, selections, { id });

  const outDir = options && options.outDir;
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(spec, null, 2));
    fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
    fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));
    const { renderSlidePng } = require("../scripts/slideSvg");
    const { exportDeckPptx } = require("../services/templatePipeline/catalog");
    deck.layoutSequence.forEach((layoutId: string, index: number) => {
      const file = path.join(outDir, "slide-" + String(index + 1).padStart(2, "0") + ".png");
      renderSlidePng(deck, layoutId, file);
    });
    await exportDeckPptx(deck, path.join(outDir, "deck.pptx"));
  }

  return { deck, spec, selections, gates, repaired, failedAfterRepair, outDir };
}

module.exports = { generateKitV1, inventDeckSpec };
