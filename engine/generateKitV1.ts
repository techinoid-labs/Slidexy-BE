const fs = require("fs");
const path = require("path");
import { DeckSpec, DeckType, StyleLock } from "./types";
const { validateDeckSpec } = require("./validate");
const { selectAll } = require("./selectVariant");
const { runGates } = require("./gates");
const { renderDeckFromSpec, tokens } = require("./render");

const DEFAULT_BRAND_LOCK: StyleLock = {
  palette: "charcoal-ember",
  typePair: "slab-rockwell",
  imageTreatment: "tint",
  motif: "bar-accent",
};

function applyStyleLock(spec: DeckSpec, lock?: StyleLock | true): DeckSpec {
  if (!lock) return spec;
  const L = lock === true ? DEFAULT_BRAND_LOCK : { ...DEFAULT_BRAND_LOCK, ...lock };
  spec.style = {
    palette: L.palette || spec.style.palette,
    typePair: L.typePair || spec.style.typePair,
    imageTreatment: L.imageTreatment || spec.style.imageTreatment,
    motif: L.motif || spec.style.motif,
  };
  if (spec.style.imageTreatment === "duotone") spec.style.imageTreatment = "tint";
  return spec;
}

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
  const mins: Record<string, number> = { Pitch: 9, Overview: 8, Report: 8, Proposal: 8 };
  const minSlides = mins[deckType] || 8;
  let msg =
    guide +
    "\n\n## Golden examples\n" +
    goldens +
    "\n\n## Request\ndeckType: " +
    deckType +
    "\nminimumSlides: " +
    minSlides +
    " (hard — slideCountOK fails below this)\nprompt: " +
    userPrompt +
    "\n\nEmit style.typePair as a token id only (corp-calibri | editorial-cambria | tech-verdana | classic-georgia | serif-constantia | soft-candara | modern-segoe | display-trebuchet | poster-franklin | book-garamond | story-bookman | slab-rockwell), never a font family name.\n";
  if (deckType === "Report") {
    msg +=
      "\n## Report content density (required)\n" +
      "Set style.contentDensity to \"report\". Do NOT write short punchy keynote copy.\n" +
      "Write consulting-grade detailed copy with 3 bullet points per content slide, each with a supporting sentence.\n" +
      "Include several role:\"report\" slides with variantHint one of: two-column-text | bulleted-list | executive-summary | data-table | consulting-breakdown | agenda | chart-panel.\n" +
      "For executive-summary include a takeaway string. For data-table include a table string[][] (4x4 or 5x5).\n" +
      "For chart-panel include chart:{type:donut|line|stackedBar,labels,series}. Use **double asterisks** for accent highlights with spaces around markers (e.g. 'cut **30%** in four quarters', never 'cut**30%**in').\n" +
      "For consulting-breakdown body, include a clear metric number the engine can extract; never leave bare ** as a hero.\n" +
      "Typography floors: body ≥14pt, titles ≥24pt — the engine will split >80-word blocks across slides.\n";
  }
  if (repairNotes && repairNotes.length) {
    msg +=
      "\n## Repair (fix ONLY these failures; quote/allowed lists below — replace bad values)\n" +
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
    // One schema/token repair (still LLM) — errors already quote bad value + allowed list
    text = await askModel(
      buildPrompt(
        prompt,
        deckType,
        check.errors.map((e: string) => "validation (fix value; use allowed list): " + e)
      )
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
  options?: { outDir?: string; id?: string; styleLock?: StyleLock | true }
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
  const brandNote =
    options && options.styleLock
      ? [
          "styleLock: set style.palette=charcoal-ember, style.typePair=slab-rockwell, style.imageTreatment=tint, style.motif=bar-accent",
          "roleSequenceOK: include each required role exactly once; always end with closing (CTA, not a location hero)",
        ]
      : undefined;
  let spec = applyStyleLock(await inventDeckSpec(prompt, deckType, brandNote), options?.styleLock);
  let selections = selectAll(spec, prompt);
  let gates = runGates(spec, selections, tokens, deckType);
  let repaired = false;
  let failedAfterRepair: any = null;

  if (!gates.pass) {
    const notes = gates.slides.flatMap((s: any) => s.reasons.map((r: string) => "slide " + s.slideIndex + " " + r));
    if (options && options.styleLock) {
      notes.push(
        "styleLock: palette charcoal-ember, typePair slab-rockwell, imageTreatment tint, motif bar-accent"
      );
    }
    repaired = true;
    spec = applyStyleLock(await inventDeckSpec(prompt, deckType, notes), options?.styleLock);
    selections = selectAll(spec, prompt + ":repair");
    gates = runGates(spec, selections, tokens, deckType);
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

  // Always keep deckspec beside published id folder when id looks published
  if (options && options.id) {
    const pubDir = path.join(ROOT, "app-library", "published", options.id);
    if (fs.existsSync(path.dirname(pubDir))) {
      try {
        fs.mkdirSync(pubDir, { recursive: true });
        fs.writeFileSync(path.join(pubDir, "deckspec.json"), JSON.stringify(spec, null, 2));
      } catch (_) {
        /* ignore */
      }
    }
  }

  return { deck, spec, selections, gates, repaired, failedAfterRepair, outDir };
}

module.exports = { generateKitV1, inventDeckSpec, applyStyleLock, DEFAULT_BRAND_LOCK };
