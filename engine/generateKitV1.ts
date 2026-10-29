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

async function askOpenRouter(prompt: string): Promise<string> {
  loadEnv();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://slidexy.local",
      "X-Title": "Slidexy Engine v1",
    },
    body: JSON.stringify({
      model: process.env.ENGINE_V1_MODEL || "openai/gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You write DeckSpec JSON only. No prose." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error("OpenRouter HTTP " + res.status + " " + (await res.text()).slice(0, 200));
  const data: any = await res.json();
  return data.choices[0].message.content;
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

/** Fallback deterministic DeckSpec when LLM unavailable — still validates. */
export function fallbackSpec(prompt: string, deckType: DeckType): DeckSpec {
  const dark = /bold|dark|night|garage|racing/i.test(prompt);
  const warm = /clinic|dental|warm|care|human/i.test(prompt);
  const palette = dark ? "ink-night" : warm ? "ivory-warm" : "paper-blue";
  const typePair = dark ? "condensed-impact" : warm ? "editorial-serif" : "technical-sans";
  const sequences: Record<string, string[]> = {
    Pitch: ["cover", "problem", "solution", "how-it-works", "feature", "stats", "testimonial", "closing"],
    Overview: ["cover", "agenda", "feature", "how-it-works", "team", "stats", "closing"],
    Report: ["cover", "agenda", "problem", "stats", "solution", "feature", "closing"],
    Proposal: ["cover", "problem", "solution", "feature", "stats", "team", "closing"],
  };
  const roles = sequences[deckType] || sequences.Pitch;
  const topic = String(prompt || "Brand").slice(0, 40);
  return {
    style: {
      palette,
      typePair,
      imageTreatment: dark ? "duotone" : "full-bleed",
      motif: "bar-accent",
    },
    slides: roles.map((role) => {
      const slide: any = {
        role,
        title: role === "cover" ? topic.split(/\s+/).slice(0, 4).join(" ") : role.replace(/-/g, " "),
        body: ["Clear value", "Trusted delivery", "Measurable outcomes"].slice(0, role === "feature" ? 3 : 2),
      };
      if (role === "stats") {
        slide.stat = "98%";
        slide.caption = "client retention";
        slide.body = ["4.9", "120+"];
      }
      if (role !== "problem" || true) {
        if (["cover", "problem", "solution", "feature", "how-it-works", "testimonial", "team", "closing", "agenda", "stats"].indexOf(role) >= 0) {
          slide.photoQuery = topic + " " + role;
          slide.photoOrientation = role === "team" || role === "testimonial" ? "portrait" : "landscape";
        }
      }
      if (role === "problem") {
        // keep photo for variant a preference
      }
      return slide;
    }),
  };
}

export async function inventDeckSpec(prompt: string, deckType: DeckType, repairNotes?: string[]): Promise<DeckSpec> {
  if (process.env.ENGINE_V1_SKIP_LLM === "1") {
    return fallbackSpec(prompt, deckType);
  }
  try {
    const text = await askOpenRouter(buildPrompt(prompt, deckType, repairNotes));
    const parsed = extractJson(text);
    const check = validateDeckSpec(parsed);
    if (!check.ok) throw new Error("invalid DeckSpec: " + check.errors.join("; "));
    return parsed;
  } catch (err) {
    console.warn("DeckSpec LLM fallback:", (err as Error).message);
    return fallbackSpec(prompt, deckType);
  }
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
    // if LLM failed validation, use fallback patched for gate notes
    const v = validateDeckSpec(spec);
    if (!v.ok) spec = fallbackSpec(prompt, deckType);
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

module.exports = { generateKitV1, inventDeckSpec, fallbackSpec };
