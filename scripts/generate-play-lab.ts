import * as fs from "fs";
import * as path from "path";
const { renderDeckFromSpec } = require("../engine/render");
const { validateKitObject } = require("../engine/validateSchema");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { createCanvas, loadImage } = require("canvas");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out/play-lab");
const brand = require("../engine/design-system/families.json").families.find((f: any) => f.id === "play-lab").brand;
const roleFor = (id: string, fontSize: number) => {
  if (/^(stat|number|folio)$/.test(id) || fontSize >= 120) return "stat";
  if (/^(label|stamp|brand|foot|leftlabel)$/.test(id) || fontSize <= 24) return "kicker";
  if (fontSize >= 96) return "display";
  if (fontSize >= 48) return "headline";
  return "body";
};
const t = (id: string, x: number, y: number, width: number, height: number, fontSize: number, value: string, tokenColor = "ink", extras: any = {}) => ({
  id,
  type: "text",
  x,
  y,
  width,
  height,
  fontSize,
  value,
  tokenColor,
  textStyleRole: extras.textStyleRole || roleFor(id, fontSize),
  typeTreatment: extras.typeTreatment,
  fontRole: fontSize >= 70 ? "display" : "body",
  lineHeight: 1.12,
  fontWeight: fontSize >= 70 ? 700 : 400,
  z: 4,
  ...extras,
});
const box = (id: string, x: number, y: number, width: number, height: number, tokenFill: string, shape = "rect") => ({ id, type: "shape", shape, x, y, width, height, tokenFill, z: 1 });
const icon = (id: string, query: string, x: number, y: number, size: number) => ({ id, type: "smartAsset", x, y, width: size, height: size, z: 3, smartAsset: { type: "icon", query, style: "play-lab-live" } });
const slides = [
  { role: "cover", variant: "play-lab-poster", elements: [
    box("rail", 0, 0, 24, 900, "accent"),
    t("brand", 75, 55, 900, 50, 28, "PLAY / LAB     —     IDEAS IN MOTION", "ink", { textStyleRole: "kicker" }),
    t("title", 65, 250, 1000, 210, 150, "WHAT IF?", "ink", { textStyleRole: "display", typeTreatment: "offset-3d", fontWeight: 900 }),
    box("disc", 990, 130, 530, 530, "ink", "ellipse"),
    icon("rocket", "rocket", 1070, 210, 370),
    box("label", 1020, 690, 470, 78, "accent"),
    t("stamp", 1040, 708, 430, 50, 29, "SMALL TESTS. BIG IDEAS.", "ink", { textStyleRole: "kicker" }),
    t("caption", 80, 560, 730, 120, 34, "A creative sprint for ideas that deserve a first attempt.", "ink", { textStyleRole: "body" })
  ] },
  { role: "feature", variant: "play-lab-identity", elements: [
    box("field", 0, 0, 650, 900, "ink"),
    icon("fingerprint", "fingerprint", 70, 165, 510),
    t("leftlabel", 70, 760, 520, 60, 27, "01 / FIND YOUR OWN PATTERN", "bg"),
    t("title", 720, 95, 810, 230, 96, "Follow your curiosity."),
    box("rule", 725, 400, 790, 5, "accent"),
    t("prompt", 725, 460, 750, 100, 42, "Notice the thing everyone else walks past."),
    t("body", 725, 620, 710, 130, 31, "Write one observation. Question one assumption. Turn the difference into a testable idea."),
    t("foot", 725, 810, 700, 40, 23, "EXERCISE / TEN MINUTES / ONE IDEA")
  ] },
  { role: "feature", variant: "play-lab-experiment", elements: [
    t("title", 70, 70, 1460, 150, 100, "Make room for failure."),
    box("step1", 70, 540, 470, 285, "ink"),
    box("step2", 550, 425, 470, 400, "ink"),
    box("step3", 1030, 310, 500, 515, "ink"),
    t("one", 95, 565, 400, 100, 72, "01 / ASK", "bg"),
    t("copy1", 100, 700, 390, 90, 29, "What would make this idea worth trying?", "bg"),
    t("two", 575, 450, 400, 100, 72, "02 / MAKE", "bg"),
    t("copy2", 580, 690, 390, 100, 29, "Build the smallest version that answers the question.", "bg"),
    icon("flask", "flask", 1190, 425, 175),
    t("three", 1055, 335, 450, 100, 72, "03 / TEST", "bg"),
    t("copy3", 1060, 690, 405, 100, 29, "Show it to someone. Keep what works. Change what does not.", "bg"),
    box("marker1", 70, 520, 470, 12, "accent"),
    box("marker2", 550, 405, 470, 12, "accent"),
    box("marker3", 1030, 290, 500, 12, "accent")
  ] }
];
const feature = (variant: string, elements: any[]) => ({ role: "feature", variant: "play-lab-" + variant, elements });
const agenda = feature("agenda", [
  box("orange", 0, 0, 570, 900, "accent"),
  t("title", 60, 150, 470, 310, 100, "Four acts."),
  t("time", 65, 705, 450, 80, 38, "60 minutes. One team."),
  ...["01 / NOTICE     10 MIN", "02 / EXPLORE   15 MIN", "03 / MAKE         20 MIN", "04 / SHARE       15 MIN"].flatMap((v, i) => [
    t("act" + i, 660, 145 + i * 165, 830, 85, 48, v),
    box("rule" + i, 660, 255 + i * 165, 830, 2, "ink")
  ])
]);
const challenge = feature("challenge", [
  box("background", 0, 0, 1600, 900, "ink"),
  t("label", 80, 65, 1300, 50, 28, "THE CHALLENGE / EXAMPLE WORKSHOP BRIEF", "accent"),
  t("title", 75, 210, 1370, 300, 110, "How might we make the first step easier?", "bg"),
  box("rule", 80, 590, 1440, 5, "accent"),
  t("body", 80, 650, 950, 140, 36, "Help a new teammate find the right person, tool and next action on their first day.", "bg"),
  t("scope", 1140, 655, 360, 145, 28, "FOCUS\nOne person.\nOne moment.\nOne small change.", "bg")
]);
const insight = feature("insight", [
  box("stripe", 0, 0, 1600, 120, "accent"),
  t("label", 75, 40, 1400, 50, 28, "KEY INSIGHT / A HYPOTHESIS TO TEST"),
  t("title", 100, 255, 1380, 280, 106, "More information is not always more clarity."),
  t("body", 110, 645, 1140, 120, 36, "A useful first step may matter more than a complete guide. Find out where people hesitate before adding more content."),
  box("end", 1410, 665, 90, 90, "ink", "ellipse")
]);
const ideas = feature("exploration", [
  t("title", 70, 65, 1450, 120, 88, "Break the pattern."),
  box("a", 70, 290, 660, 225, "accent"),
  t("aLabel", 105, 320, 590, 80, 58, "REMOVE ONE THING"),
  t("aBody", 110, 425, 560, 65, 29, "What can the first experience do without?"),
  box("b", 850, 410, 680, 240, "ink"),
  t("bLabel", 890, 445, 600, 80, 58, "REVERSE IT", "bg"),
  t("bBody", 895, 550, 550, 70, 29, "What if the useful action came first?", "bg"),
  t("cLabel", 105, 635, 650, 80, 58, "BORROW AN IDEA"),
  t("cBody", 110, 740, 630, 80, 29, "How would a host, a game or a trail guide solve it?")
]);
const comparison = feature("compare", [
  t("title", 70, 60, 1450, 130, 92, "Two ideas. Different bets."),
  box("left", 70, 260, 710, 550, "ink"),
  box("right", 800, 260, 730, 550, "accent"),
  t("a", 110, 295, 610, 100, 62, "A / THE FIRST TASK", "bg"),
  t("aCopy", 115, 435, 580, 250, 34, "A guided action that helps a teammate finish something useful.\n\nBet: doing creates confidence.", "bg"),
  t("aTest", 115, 725, 580, 55, 27, "TEST / Can they start without help?", "bg"),
  t("b", 840, 295, 650, 100, 62, "B / A HUMAN GUIDE"),
  t("bCopy", 845, 435, 610, 250, 34, "One named person who answers the first question.\n\nBet: connection reduces hesitation."),
  t("bTest", 845, 725, 610, 55, 27, "TEST / Do they know whom to ask?")
]);
const plan = feature("plan", [
  t("title", 70, 65, 1400, 120, 96, "Design the smallest test."),
  box("rail", 75, 280, 12, 510, "accent"),
  t("hyp", 130, 285, 780, 220, 48, "If the first action is clear, a new teammate can start without asking for help."),
  t("note", 130, 640, 730, 120, 30, "Build a paper sketch or clickable draft. Test the idea before polishing the interface."),
  box("right", 1000, 270, 520, 540, "ink"),
  t("details", 1040, 310, 440, 460, 31, "WHO\nThree people unfamiliar with the flow.\n\nTASK\nFind and complete the first action.\n\nWATCH\nWhere they pause or ask for help.", "bg")
]);
const results = feature("results", [
  t("title", 70, 65, 1400, 125, 94, "Keep the evidence visible."),
  t("label", 80, 210, 1400, 50, 26, "EXAMPLE FINDINGS / REPLACE AFTER YOUR TEST"),
  box("stat", 70, 330, 520, 480, "accent"),
  t("number", 100, 390, 470, 180, 124, "2 OF 3", "ink", { textStyleRole: "stat", typeTreatment: "offset-3d", fontWeight: 900 }),
  t("meaning", 115, 625, 420, 135, 34, "started without asking for help in this example test."),
  t("observed", 690, 350, 790, 160, 39, "OBSERVED\nTwo people found the first task. One searched for a contact."),
  box("line", 690, 550, 800, 3, "ink"),
  t("change", 690, 610, 790, 160, 39, "CHANGE NEXT\nKeep the action clear. Add a visible person to ask.")
]);
const next = feature("next", [
  t("title", 70, 65, 1400, 140, 100, "Give the idea an owner."),
  { id: "actions", type: "table", x: 70, y: 280, width: 1460, height: 440, z: 3 },
  box("line", 70, 790, 1460, 4, "accent")
]);
const closing = feature("closing", [
  box("orange", 0, 0, 1600, 900, "accent"),
  t("title", 75, 150, 1450, 300, 150, "START SMALL.", "ink", { textStyleRole: "display", typeTreatment: "offset-3d" }),
  box("band", 0, 580, 1600, 320, "ink"),
  t("body", 80, 630, 1140, 130, 46, "Choose one idea. Name one owner. Put the first test on the calendar.", "bg", { textStyleRole: "headline" }),
  t("brand", 80, 815, 1420, 45, 26, "PLAY / LAB     —     YOUR NEXT EXPERIMENT STARTS HERE", "bg", { textStyleRole: "kicker" })
]);
const originals = [...slides];
slides.splice(0, slides.length, originals[0], agenda, challenge, originals[1], insight, ideas, comparison, originals[2], plan, results, next, closing);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const specs: any[] = [], selections: any[] = [];
  for (const s of slides) {
    const kit: any = { id: `${s.role}/${s.variant}`, role: s.role, variant: s.variant, family: "play-lab", preserveLayout: true, status: "approved", requiresPhoto: false, photoSlots: [], slots: {}, fit: {}, pptxMapping: {}, layout: { elements: [] } };
    const sample: any = { role: s.role, variantHint: s.variant, title: "", items: [] };
    if (s.variant === "play-lab-next") sample.table = [
      ["ACTION", "OWNER", "WHEN"],
      ["Revise the first-task sketch", "Design lead", "Day 1"],
      ["Run a second small test", "Research lead", "Day 3"],
      ["Share a go / change decision", "Team lead", "Day 5"]
    ];
    for (const raw of s.elements) {
      const e: any = { ...raw, morphId: raw.id };
      if (e.type === "text") {
        const slot = e.id === "title" ? "title" : `copy${sample.items.length}`;
        const from = e.id === "title" ? "title" : `items${sample.items.length}`;
        if (e.id === "title") sample.title = e.value; else sample.items.push(e.value);
        delete e.value; e.slot = slot;
        kit.slots[slot] = { kind: "text", from, optional: false };
        kit.pptxMapping[slot] = { kind: "text" };
        kit.fit[slot] = { minFont: e.fontSize, maxFont: e.fontSize, lineClamp: Math.max(1, Math.floor(e.height / (e.fontSize * 1.12))), shrinkMin: 1 };
      }
      kit.layout.elements.push(e);
    }
    validateKitObject(kit);
    fs.writeFileSync(path.join(ROOT, "kit", s.role, s.variant + ".json"), JSON.stringify(kit, null, 2));
    specs.push(sample); selections.push({ role: s.role, variant: s.variant });
  }
  const spec = { style: { palette: "ink-night", typePair: "modern-segoe", motif: "bar-accent" }, slides: specs };
  fs.writeFileSync(path.join(OUT, "spec.json"), JSON.stringify({ spec, selections, brand }, null, 2));
  const deck = await renderDeckFromSpec(spec, selections, { id: "play-lab", brand });
  deck.name = "PLAY / LAB";
  deck.description = "A 12-slide creative workshop with oversized icons, bold orange accents, experiments, evidence and clear next steps.";
  const assets: any[] = [];
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    for (const e of deck.layouts[lid].elements) {
      if (e.textContent?.spans.some((s: any) => /…/.test(s.text))) throw new Error(`Truncated text: slide ${i + 1}/${e.id}`);
      if (e.imageContent?.smartAsset) {
        const a = e.imageContent.smartAsset;
        if (a.mocked || a.source === "mock") throw new Error(`Placeholder icon: ${a.query}`);
        assets.push({ slide: i + 1, ...a, dataUri: undefined });
      }
    }
    const warnings = renderSlidePng(deck, lid, path.join(OUT, `slide-${i + 1}.png`));
    if (warnings.length) throw new Error(warnings.join("; "));
  }
  if (assets.length !== 3) throw new Error("Expected three Iconify assets");
  fs.writeFileSync(path.join(OUT, "iconify-report.json"), JSON.stringify({ passed: true, assets }, null, 2));
  await exportDeckPptx(deck, path.join(OUT, "play-lab.pptx"));
  const c = createCanvas(1600, 2916), ctx = c.getContext("2d");
  ctx.fillStyle = "#292929"; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < slides.length; i++) {
    const x = (i % 2) * 800, y = Math.floor(i / 2) * 486;
    ctx.fillStyle = "#FFFFFF"; ctx.font = "18px Arial"; ctx.fillText(String(i + 1).padStart(2, "0"), x + 12, y + 24);
    ctx.drawImage(await loadImage(path.join(OUT, `slide-${i + 1}.png`)), x + 8, y + 34, 784, 441);
  }
  fs.writeFileSync(path.join(OUT, "preview.png"), c.toBuffer("image/png"));
  fs.writeFileSync(path.join(OUT, "deck.json"), JSON.stringify(deck, null, 2));
  console.log(`PASS: ${slides.length} valid kits; three real Iconify assets; no text truncation; PNG and PPTX exports.`);
  if (process.argv.includes("--publish-local")) {
    // Stage through the existing publisher, including its PPTX gate and asset copying.
    const jobId = `play-lab-release-${Date.now()}`;
    const stage = path.join(ROOT, "docs/template-pipeline/admin-dashboard/tmp", jobId);
    const photoDir = path.join(ROOT, "generated-templates/photos/composer", jobId);
    fs.mkdirSync(stage, { recursive: true });
    fs.mkdirSync(photoDir, { recursive: true });
    for (const lid of deck.layoutSequence) {
      for (const e of deck.layouts[lid].elements) {
        const content = e.imageContent;
        if (!content?.smartAsset) continue;
        const name = path.basename(content.url);
        const source = path.join(ROOT, "generated-templates", content.url);
        fs.copyFileSync(source, path.join(photoDir, name));
        content.url = `photos/composer/${jobId}/${name}`;
      }
    }
    fs.writeFileSync(path.join(stage, "deck.json"), JSON.stringify(deck, null, 2));
    for (let i = 1; i <= slides.length; i++) {
      fs.copyFileSync(path.join(OUT, `slide-${i}.png`), path.join(stage, `slide-${String(i).padStart(2, "0")}.png`));
    }
    fs.copyFileSync(path.join(OUT, "play-lab.pptx"), path.join(stage, "deck.pptx"));
    const { publishTemplate } = require("../services/templatePipeline/adminCatalog");
    const result = await publishTemplate(jobId);
    const { listCatalog, readCatalog, buildPptx } = require("../services/templatePipeline/catalog");
    if (!listCatalog().some((entry: any) => entry.id === "play-lab")) throw new Error("Published template missing from catalog");
    if (readCatalog("play-lab").slides.length !== slides.length) throw new Error("Published previews missing");
    const download = await buildPptx("play-lab");
    if (!download.buffer || download.buffer.length < 1000) throw new Error("Published PPTX download is empty");
    fs.writeFileSync(path.join(OUT, "release.json"), JSON.stringify({ ...result, verified: { catalog: true, previews: slides.length, downloadBytes: download.buffer.length } }, null, 2));
    console.log("Published and verified local catalog entry: play-lab");
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });









