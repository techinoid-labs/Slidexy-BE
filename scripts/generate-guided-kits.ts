/**
 * Generate the 16 guide-derived kits and five deterministic sample DeckSpecs.
 * node -r ts-node/register/transpile-only scripts/generate-guided-kits.ts
 */
import * as fs from "fs";
import * as path from "path";
const ROOT = path.join(__dirname, "..");
const dna = require("../docs/layout-dna/canva-reference-layouts.json");
const { listDesignGuides } = require("./build-design-guide");
const { validateKitObject } = require("../engine/validateSchema");
const scale = (n: number) => Math.round(n * 5 / 6 * 100) / 100;
const guides = listDesignGuides();
const folder = path.join(ROOT, "examples", "design-guides");
fs.mkdirSync(folder, { recursive: true });

function writeJson(file: string, value: any) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}
function bind(ref: string, el: any): { from?: string; literal?: string } {
  const id = el.id;
  if (id === "title") return { from: "title" };
  const number = id.match(/(?:number-|index-)(\d+)$/);
  if (number) return { literal: String(Number(number[1]) + (id.startsWith("index") ? 1 : 0)).padStart(2, "0") };
  if (ref === "ref-group-project") return { from: id === "brand" ? "caption" : id === "date" ? "body0" : "body1" };
  if (ref === "ref-two-column-contents") return { from: "items" + (Number(id.split("-").pop()) - 1) };
  if (ref === "ref-four-portrait-team") return { from: "members" + id.split("-").pop() + "." + (id.startsWith("name") ? "name" : "role") };
  if (ref === "ref-three-objectives") return { from: "body" + (Number(id.split("-").pop()) * 2 + (id.startsWith("heading") ? 0 : 1)) };
  if (ref === "ref-insight-donut") return { from: id === "takeaway" ? "body0" : "body1" };
  if (ref === "ref-line-chart-commentary") return { from: "body" + ((Number(id.split("-").pop()) - 1) * 2 + (id.startsWith("body") ? 1 : 0)) };
  if (ref.startsWith("ref-timeline")) {
    if (id.startsWith("stage-title")) return { from: "steps" + (Number(id.slice(-1)) - 1) + ".title" };
    if (id.startsWith("stage-body")) return { from: "steps" + (Number(id.slice(-1)) - 1) + ".body" };
    return { from: id === "subtitle" ? "caption" : "body0" };
  }
  if (ref === "ref-staggered-partners") return { from: id === "caption" ? "caption" : "items" + id.split("-").pop() };
  if (ref === "ref-three-price-outlines") return { from: "tiers" + id.split("-").pop() + "." + (id.startsWith("price") ? "price" : id.startsWith("plan") ? "name" : "features") };
  if (ref === "ref-contact-footer-columns") {
    if (id === "brand") return { from: "caption" };
    const names = ["phone", "email", "website"];
    const n = names.indexOf(id.split("-")[0]);
    if (id.endsWith("label")) return { literal: ["Phone", "Email", "Website"][n] };
    return { from: "body" + n };
  }
  if (ref === "ref-left-photo-introduction") return { from: id === "lead" ? "body0" : "body1" };
  if (ref.endsWith("showcase")) return { from: id === "index" ? "caption" : id === "item-title" ? "body0" : "body1" };
  if (ref === "ref-photo-progress") {
    if (id === "body") return { from: "body0" };
    const n = id.split("-").pop();
    return { from: "stats" + n + "." + (id.startsWith("percent") ? "value" : "label") };
  }
  return { from: "caption" };
}
function makeKit(ref: any, guide: any) {
  const kit: any = {
    id: ref.suggestedEngineRole + "/" + ref.id, role: ref.suggestedEngineRole,
    variant: ref.id, family: guide.id + "-" + ref.id, sourceRef: ref.id,
    designGuide: guide.id, steal: ref.spatialGeometry, preserveLayout: true,
    status: "draft", requiresPhoto: false, photoSlots: [], slots: {}, fit: {},
    pptxMapping: {}, layout: { elements: [] },
    motion: { transition: "fade", fallbackTransition: "fade", durationMs: 500 },
    implementationNotes: [
      "Geometry estimated from the supplied raster and scaled to 1600x900.",
      "Body text raised to readable export floors; copy must fit the original whitespace.",
      "Soft grain and photographic edge fades replaced by clean crops and flat palette surfaces.",
    ],
  };
  function text(el: any, binding: any, size?: number) {
    // Only the slide headline is a title slot. The schema normalizer raises any
    // slot containing "title" to the headline floor, including item-title.
    const slot = el.id === "title" ? "title" : "copy" + Object.keys(kit.fit).length;
    const b = el.bounds;
    const typ = el.typography || {};
    const title = el.id === "title";
    const fsiz = Math.max(title ? 40 : 24, size || scale(typ.fontSizePx || 28));
    const h = Math.max(scale(b.height), fsiz * (typ.lineHeightRatio || 1.25) + 12);
    kit.slots[slot] = { kind: "text", optional: !title, ...(binding.from ? { from: binding.from } : {}) };
    kit.fit[slot] = { maxFont: fsiz, minFont: title ? Math.min(fsiz, 48) : 24, lineClamp: Math.max(1, Math.floor(h / (fsiz * (typ.lineHeightRatio || 1.25)))), shrinkMin: 0.9 };
    kit.pptxMapping[slot] = { kind: "text" };
    kit.layout.elements.push({
      id: el.id, type: "text", slot, x: scale(b.x), y: scale(b.y),
      width: el.id.startsWith("percent-") ? 80 : scale(b.width), height: h, z: 4, morphId: el.id,
      fontRole: title ? "display" : "body", fontSize: fsiz,
      fontWeight: typ.fontWeight || (title ? 300 : 400),
      tokenColor: title || el.role === "item-heading" || el.role === "price" ? "ink" : "muted",
      align: typ.align || "left", lineHeight: typ.lineHeightRatio || 1.25,
      usePrimitive: false, ...(binding.literal != null ? { literal: binding.literal } : {}),
    });
  }
  for (const el of ref.elements) {
    if (["brand-symbol", "arrow"].includes(el.id)) continue;
    if (el.type === "text") {
      if (ref.id === "ref-insight-donut" && el.id.startsWith("label")) continue;
      text(el, bind(ref.id, el));
    } else if (el.type === "image") {
      if (el.assetRole === "outline-icon") {
        const ordinal = el.id.startsWith("stage-icon-")
          ? Number(el.id.slice(-1)) + (ref.id.endsWith("continuation") ? 2 : 0)
          : Number(el.id.slice(-1)) + 1;
        text({ ...el, bounds: { ...el.bounds, width: 84, height: 78 }, role: "index" },
          { literal: String(ordinal).padStart(2, "0") }, 40);
        kit.implementationNotes.push(el.id + ": editable step number replaces the reference outline icon.");
      } else if (el.assetRole === "logo-lockup") {
        text({ ...el, bounds: { ...el.bounds, width: 240, height: 52 } },
          { from: "items" + el.id.split("-").pop() }, 24);
        kit.implementationNotes.push(el.id + ": dynamic partner wordmark; original logos are not bundled.");
      } else {
        const slot = el.id;
        kit.photoSlots.push(slot);
        kit.slots[slot] = { kind: "image", optional: false, from: "photo" + (kit.photoSlots.length - 1) };
        kit.pptxMapping[slot] = { kind: "picture" };
        kit.layout.elements.push({ id: slot, type: "image", slot, x: scale(el.bounds.x), y: scale(el.bounds.y), width: scale(el.bounds.width), height: scale(el.bounds.height), z: 1, morphId: slot, mask: "rect" });
      }
    } else if (el.type === "chart") {
      kit.slots.chart = { kind: "chart", optional: false, from: "chart" };
      kit.pptxMapping.chart = { kind: "chart" };
      kit.layout.elements.push({ id: "chart", type: "chart", slot: "chart",
        x: scale(el.bounds.x), y: scale(el.bounds.y), width: scale(el.bounds.width), height: scale(el.bounds.height), z: 2, morphId: "chart" });
      kit.implementationNotes.push("Native chart supplies its data labels; manual reference labels are omitted.");
    } else {
      const b = el.bounds;
      const e: any = { id: el.id, type: "shape", shape: "rect", x: scale(b.x), y: scale(b.y), width: scale(b.width), height: Math.max(1, scale(b.height)), z: el.id.startsWith("fill") ? 3 : 2, morphId: el.id,
        tokenFill: el.id.includes("rule") ? (el.id === "title-rule" ? "accent" : "line") : el.id.startsWith("track") || el.id.startsWith("rail") || el.id.includes("separator") ? "line" : "accent" };
      if (el.id.startsWith("fill")) {
        e.widthFrom = "stats" + el.id.split("-").pop() + ".value";
        e.width = scale(559);
      }
      if (el.id.startsWith("price-outline")) {
        e.tokenFill = "ink"; e.radius = scale(el.cornerRadiusPx || 23);
        kit.layout.elements.push(e);
        kit.layout.elements.push({ ...e, id: el.id + "-inside", morphId: el.id + "-inside", x: e.x + 1, y: e.y + 1, width: e.width - 2, height: e.height - 2, radius: Math.max(0, e.radius - 1), tokenFill: "bg", z: 3 });
      } else kit.layout.elements.push(e);
    }
  }
  kit.requiresPhoto = kit.photoSlots.length > 0;
  validateKitObject(JSON.parse(JSON.stringify(kit)), kit.id);
  return kit;
}
const samples: any = {
  "ref-group-project": { title: "Studio\nOverview", caption: "STUDIO", body: ["DESIGN COLLECTION", "studio.example"] },
  "ref-two-column-contents": { title: "Inside the studio", items: ["Introduction", "Team", "Objectives", "Projects", "Insights", "Timeline", "Services", "Contact"] },
  "ref-centered-interlude": { title: "Room to think" },
  "ref-contact-footer-columns": { title: "Start a conversation", caption: "STUDIO", body: ["+00 000 000 000", "hello@studio.example", "studio.example"] },
  "ref-left-photo-introduction": { title: "Built around people", body: ["We design spaces that make everyday work easier.", "Our process connects research, practical planning and careful delivery."] },
  "ref-right-bleed-showcase": { title: "Showcase 01", caption: "01", body: ["A place to focus", "Quiet areas and shared spaces support different ways of working."] },
  "ref-masonry-showcase": { title: "Showcase 02", caption: "02", body: ["Details in context", "A collection of spaces, surfaces and working environments."] },
  "ref-insight-donut": { title: "A clearer picture", body: ["Most demand comes from repeat customers.", "Example data illustrates how a short insight can sit beside editable evidence."], chart: { type: "donut", labels: ["New", "Referral", "Repeat"], series: [{ name: "Share", values: [12.5,25,62.5] }], holeSize: 50, showPercent: true, showLegend: true } },
  "ref-line-chart-commentary": { title: "Two paths to growth", body: ["Core customers", "An established base provides a steady contribution.", "New markets", "A second route adds opportunities over time."], chart: { type: "line", labels: ["Aug","Sep","Oct","Nov","Dec"], series: [{ name: "Core", values: [18,30,25,40,42] }, { name: "New", values: [12,4,20,15,50] }], showLegend: false } },
  "ref-photo-progress": { title: "From plan to delivery", body: ["Three editable indicators show the status of a sample project."], stats: [{ value: "100%", label: "PLANNING" }, { value: "80%", label: "DESIGN" }, { value: "67%", label: "DELIVERY" }] },
  "ref-timeline-opening": { title: "Set the direction", caption: "Project timeline", body: ["Define the decisions, owners and outputs before moving into detailed delivery."], steps: [{ title: "RESEARCH", body: "Understand the people, constraints and opportunity." }, { title: "PLANNING", body: "Agree the scope, schedule and responsibilities." }] },
  "ref-timeline-continuation": { title: "Make it happen", caption: "Project timeline", body: ["Review work in stages and keep the team aligned around a shared delivery plan."], steps: [{ title: "DEVELOPMENT", body: "Build, test and review the proposed solution." }, { title: "LAUNCH", body: "Prepare the handover and measure the result." }] },
  "ref-four-portrait-team": { title: "People behind the work", members: [{ name: "Alex Chen", role: "Design" }, { name: "Sam Rivera", role: "Strategy" }, { name: "Taylor Park", role: "Research" }, { name: "Jordan Lee", role: "Delivery" }] },
  "ref-staggered-partners": { title: "Better together", items: ["PARTNER ONE", "PARTNER TWO", "PARTNER THREE", "PARTNER FOUR", "PARTNER FIVE", "PARTNER SIX"], caption: "A flexible space for the partners who support your work." },
  "ref-three-objectives": { title: "Three clear priorities", body: ["Build demand", "Reach the customers who need the service.", "Improve the experience", "Make each interaction easier to navigate.", "Deliver consistently", "Create a process the team can repeat."] },
  "ref-three-price-outlines": { title: "Choose your scope", tiers: [{ name: "ESSENTIAL", price: "$299", features: ["For a focused small project."] }, { name: "BUSINESS", price: "$599", features: ["For a growing team."] }, { name: "ENTERPRISE", price: "$899", features: ["For more complex needs."] }] },
};
const entries: any[] = [];
for (const guide of guides) {
  for (const id of guide.referenceLayoutIds) {
    const ref = dna.slides.find((s: any) => s.id === id);
    const kit = makeKit(ref, guide);
    const file = path.join(ROOT, "kit", kit.role, kit.variant + ".json");
    if (fs.existsSync(file)) {
      const old = JSON.parse(fs.readFileSync(file, "utf8"));
      if (old.status === "locked" || old.sourceRef !== id) throw new Error("Refusing to overwrite " + kit.id);
    }
    writeJson(file, kit);
    entries.push({ guideId: guide.id, role: kit.role, variant: id, kitId: kit.id, photoSlots: kit.photoSlots });
  }
}
const sequences: any[] = [];
for (const guide of guides) {
  const ids = [...guide.referenceLayoutIds];
  if (!ids.includes("ref-group-project")) ids.unshift("ref-group-project");
  if (!ids.includes("ref-contact-footer-columns")) ids.push("ref-contact-footer-columns");
  const slides = ids.map((id: string) => {
    const entry = entries.find((e) => e.variant === id);
    const sample = JSON.parse(JSON.stringify(samples[id]));
    const queries = entry.photoSlots.map((slot: string, i: number) =>
      (entry.role === "team" ? "studio headshot portrait looking at camera " : "studio workplace interior ") + id + " " + slot + " " + i);
    return { role: entry.role, variantHint: id, ...sample,
      ...(queries.length ? { photoQueries: queries, photoOrientations: queries.map(() => entry.role === "team" ? "portrait" : "landscape") } : {}) };
  });
  const sequenceId = "guide-" + guide.id;
  const spec = { style: { palette: "ink-night", typePair: "modern-segoe", imageTreatment: "full-bleed", motif: "bar-accent", sequence: sequenceId }, slides };
  writeJson(path.join(folder, guide.id + ".json"), spec);
  sequences.push({ id: sequenceId, label: guide.name, beats: slides.map((s: any, i: number) => ({ role: s.role, variant: s.variantHint, beat: s.variantHint + "-" + i })) });
}
writeJson(path.join(ROOT, "engine", "design-guide-catalog.json"), { version: 1, entries, sequences });
console.log("Generated " + entries.length + " kits and " + sequences.length + " sample decks.");
