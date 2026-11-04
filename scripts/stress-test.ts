/**
 * Engine stress decks (no LLM): text overflow, dynamic grids, mixed image ratios.
 *
 *   node -r ts-node/register/transpile-only scripts/stress-test.ts
 *
 * Writes out/stress/<id>/ + review grid out/stress/stress-grid.png
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "stress");

const LONG_TITLE =
  "Competitive gaming nights with reserved booths coaches and a crew that actually shows up";
// 10–12 words ✓ (gaming domain only — no clinic bleed)

function longBody(seed: string): string {
  return (
    seed +
    " High refresh rigs private booths and staffed tournaments keep ranked teams practicing together instead of scattering across noisy cafes so every session ends with clearer callouts better chemistry and a reason to book the same booth again next week for another ladder night."
  );
  // 50+ words ✓ gaming lounge domain
}

type StressDeck = {
  id: string;
  name: string;
  deckType: "Pitch" | "Overview";
  spec: any;
};

const decks: StressDeck[] = [
  {
    id: "stress-text-volume-nexus",
    name: "Stress 1 — Text Volume (Nexus)",
    deckType: "Pitch",
    spec: {
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "tint",
        motif: "bar-accent",
      },
      slides: [
        {
          role: "cover",
          title: LONG_TITLE,
          caption: longBody("Welcome to Nexus Lounge."),
          photoQuery: "neon gaming lounge interior night wide",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Scattered late night sessions without a reliable community home base nearby",
          body: [
            longBody("Home setups fragment crews."),
            longBody("Matchmaking feels lonely."),
          ],
          photoQuery: "lonely gamer at home desk night stress",
          photoOrientation: "landscape",
        },
        {
          role: "solution",
          title: "A shared premium lounge that hosts compete and belong rituals every week",
          body: [
            longBody("Reserved booths keep teams together."),
            longBody("Staff run ladders and coaching."),
          ],
          photoQuery: "friends gaming together lounge stress",
          photoOrientation: "landscape",
        },
        {
          role: "how-it-works",
          title: "Arrive check in pick a booth compete and reconnect after every match",
          body: [
            longBody("Step one is greeting."),
            longBody("Step two is seating."),
            longBody("Step three is play."),
          ],
          photoQuery: "esports arena with RGB PCs stress",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "Arena systems built for competitive comfort training and private focus nights",
          body: [
            longBody("Top tier rigs."),
            longBody("High refresh displays."),
            longBody("Ergo seating systems."),
            longBody("Private booth zones."),
          ],
          photoQueries: [
            "gaming pc tower rgb fans stress1",
            "ultrawide gaming monitor desk stress2",
            "gaming chair close up stress3",
            "private booth pc gaming lounge stress4",
          ],
          photoQuery: "gaming pc tower rgb fans stress1",
          photoOrientation: "landscape",
          // no variantHint — v1.5 must auto-switch to feature/c (text-heavy)
        },
        {
          role: "stats",
          title: "Impact metrics proving lounge density retention and competitive event cadence",
          stats: [
            { value: "120+", label: "Active PCs online nightly" },
            { value: "24", label: "Weekly events hosted on site" },
            { value: "4.9", label: "Member rating from regulars" },
          ],
          variantHint: "a",
        },
        {
          role: "testimonial",
          title: "Players describe belonging clarity and better practice after joining the lounge",
          body: [longBody("This is where our crew actually meets and improves together.")],
          caption: "Maya R., captain of the night shift squad and community mentor",
          photoQuery: "smiling gamer with headset portrait stress",
          photoOrientation: "portrait",
        },
        {
          role: "team",
          title: "Floor crew leaders who keep hardware community and coaching running smoothly",
          members: [
            { name: "Alex Kim", role: "Manager of operations and member experience" },
            { name: "Samira Khan", role: "Community host and tournament director" },
            { name: "Ben Carter", role: "Tech lead for rigs networking and booths" },
          ],
          photoQueries: [
            "gaming lounge manager professional headshot portrait looking at camera smiling stress a",
            "community host headset professional headshot portrait looking at camera smiling stress b",
            "tech staff professional headshot portrait looking at camera smiling stress c",
          ],
          photoQuery:
            "gaming lounge staff professional headshot portrait looking at camera smiling stress",
          photoOrientation: "portrait",
        },
        {
          role: "closing",
          title: "Level up your evenings here with open late hours and easy memberships",
          body: [longBody("Open late nightly."), longBody("nexus.example booking desk.")],
          photoQuery: "gaming lounge neon entrance night stress close",
          photoOrientation: "landscape",
        },
      ],
    },
  },
  {
    id: "stress-data-volume-littlesmiles",
    name: "Stress 2 — Data Volume (Little Smiles)",
    deckType: "Overview",
    spec: {
      style: {
        palette: "ivory-warm",
        typePair: "editorial-cambria",
        imageTreatment: "full-bleed",
        motif: "dot-cluster",
      },
      slides: [
        {
          role: "cover",
          title: "Little Smiles",
          caption: "Pediatric dental care",
          photoQuery: "bright pediatric dental clinic children data",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Clinic anxiety",
          body: ["Harsh lights", "Rushed visits"],
          photoQuery: "anxious child waiting room soft light data",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "Gentle care",
          body: [
            "Play check-in",
            "Quiet rooms",
            "Parent notes",
            "Soft tools",
            "Sensory breaks",
            "Follow-up plans",
          ],
          photoQueries: [
            "pediatric dental play area data1",
            "quiet dental exam room warm data2",
            "parent reading with child clinic data3",
            "friendly dentist tools soft colors data4",
            "child sensory calm corner clinic data5",
            "dentist explaining care plan parent data6",
          ],
          photoQuery: "pediatric dental play area data1",
          photoOrientation: "landscape",
          variantHint: "b",
        },
        {
          role: "how-it-works",
          title: "Visit flow",
          body: ["Welcome", "Exam", "Plan"],
          photoQuery: "dentist talking kindly to child data",
          photoOrientation: "landscape",
        },
        {
          role: "team",
          title: "Clinicians",
          members: [
            { name: "Dr. Lee", role: "Lead" },
            { name: "Sam Ortiz", role: "Hygienist" },
            { name: "Mia Chen", role: "Care lead" },
          ],
          photoQueries: [
            "friendly dentist headshot portrait soft light data a",
            "dental hygienist professional headshot portrait data b",
            "clinic care lead headshot portrait soft light data c",
          ],
          photoQuery: "friendly dentist headshot portrait soft light data",
          photoOrientation: "portrait",
          variantHint: "b",
        },
        {
          role: "stats",
          title: "Trust",
          stats: [
            { value: "4.9", label: "family rating" },
            { value: "98%", label: "return rate" },
          ],
          variantHint: "a",
        },
        {
          role: "testimonial",
          title: "Parents",
          body: ["My kids ask to come back"],
          caption: "J. Morgan",
          photoQuery: "parent and child smiling clinic data",
          photoOrientation: "landscape",
        },
        {
          role: "closing",
          title: "Visit us",
          body: ["Mon–Sat", "hello@littlesmiles.example"],
          photoQuery: "clinic reception warm light data",
          photoOrientation: "landscape",
        },
      ],
    },
  },
  {
    id: "stress-image-ratios-nexus",
    name: "Stress 3 — Mixed Image Ratios (Nexus)",
    deckType: "Pitch",
    spec: {
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "tint",
        motif: "bar-accent",
      },
      slides: [
        {
          role: "cover",
          title: "Nexus Lounge",
          caption: "Play. Compete. Belong.",
          photoQuery: "neon gaming lounge interior night ratios",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Scattered sessions",
          body: ["No home base", "Weak community"],
          photoQuery: "lonely gamer at home desk night ratios",
          photoOrientation: "landscape",
        },
        {
          role: "solution",
          title: "One lounge",
          body: ["Reserved booths", "Staffed events"],
          photoQuery: "friends gaming together lounge ratios",
          photoOrientation: "landscape",
        },
        {
          role: "how-it-works",
          title: "Arrive → Play",
          body: ["Check in", "Booth", "Compete"],
          photoQuery: "esports arena with RGB PCs ratios",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "Mixed ratio grid",
          body: ["Portrait feed", "Landscape feed", "Square feed", "Portrait again", "Landscape again", "Square again"],
          photoQueries: [
            "esports player portrait headset vertical ratios1",
            "wide gaming lounge panorama landscape ratios2",
            "square rgb pc build detail ratios3",
            "gamer portrait side profile ratios4",
            "ultrawide monitor desk landscape ratios5",
            "square gaming chair product shot ratios6",
          ],
          photoOrientations: ["portrait", "landscape", "square", "portrait", "landscape", "square"],
          photoQuery: "esports player portrait headset vertical ratios1",
          variantHint: "b",
        },
        {
          role: "stats",
          title: "Impact",
          stats: [
            { value: "120+", label: "active PCs" },
            { value: "24", label: "weekly events" },
          ],
          variantHint: "a",
        },
        {
          role: "testimonial",
          title: "Players say",
          body: ["This is where our crew actually meets"],
          caption: "Maya R., captain",
          photoQuery: "smiling gamer with headset portrait ratios",
          photoOrientation: "portrait",
        },
        {
          role: "team",
          title: "Floor crew",
          members: [
            { name: "Alex Kim", role: "Manager" },
            { name: "Samira Khan", role: "Community" },
            { name: "Ben Carter", role: "Tech" },
          ],
          photoQueries: [
            "gaming lounge manager headshot portrait person ratios a",
            "community host headset headshot portrait person ratios b",
            "tech staff professional headshot portrait person ratios c",
          ],
          photoQuery: "gaming lounge staff headshot portrait person ratios",
          photoOrientation: "portrait",
        },
        {
          role: "closing",
          title: "Level up here",
          body: ["Open late", "nexus.example"],
          photoQuery: "gaming lounge neon entrance night ratios close",
          photoOrientation: "landscape",
        },
      ],
    },
  },
];

async function buildOne(theme: StressDeck) {
  const outDir = path.join(OUT, theme.id);
  fs.mkdirSync(outDir, { recursive: true });
  const seed = theme.name + "|" + theme.spec.style.palette + "|stress";
  const selections = selectAll(theme.spec, seed);
  theme.spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const gates = runGates(theme.spec, selections, tokens, theme.deckType);
  const deck = await renderDeckFromSpec(theme.spec, selections, { id: theme.id });
  deck.name = theme.name;
  deck.description = theme.name;
  if (deck.engine) deck.engine.stress = theme.id;

  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(theme.spec, null, 2));
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));
  deck.layoutSequence.forEach((layoutId: string, index: number) => {
    renderSlidePng(
      deck,
      layoutId,
      path.join(outDir, "slide-" + String(index + 1).padStart(2, "0") + ".png")
    );
  });
  await exportDeckPptx(deck, path.join(outDir, "deck.pptx"));

  // overflow audit: any text font below min without ellipsis is ok; flag huge untruncated bodies
  const overflowNotes: string[] = [];
  deck.layoutSequence.forEach((layoutId: string) => {
    const layout = deck.layouts[layoutId];
    (layout.elements || []).forEach((el: any) => {
      if (el.type !== "text" || !el.textContent) return;
      const t = (el.textContent.spans || []).map((s: any) => s.text || "").join("");
      if (t.length > 400 && t.indexOf("…") < 0) {
        overflowNotes.push(layoutId + "/" + el.id + " len=" + t.length + " (no ellipsis; may still fit)");
      }
    });
  });

  return {
    id: theme.id,
    name: theme.name,
    gates: gates.pass,
    gateFails: gates.slides.filter((s: any) => !s.pass).map((s: any) => s.reasons).flat(),
    selections: selections.map((s: any) => s.role + "/" + s.variant),
    slides: deck.layoutSequence.length,
    overflowNotes,
  };
}

async function writeReviewGrid(results: any[]) {
  const thumbW = 400;
  const thumbH = 225;
  const gap = 12;
  const labelH = 22;
  const sectionGap = 36;
  let totalRows = 0;
  const sections: Array<{ id: string; name: string; slides: string[] }> = [];
  results.forEach((r) => {
    const dir = path.join(OUT, r.id);
    const slides = fs
      .readdirSync(dir)
      .filter((n: string) => /^slide-\d{2}\.png$/.test(n))
      .sort();
    sections.push({ id: r.id, name: r.name, slides });
    totalRows += 1 + slides.length; // header + rows
  });
  const cols = 1;
  const canvas = createCanvas(
    thumbW + gap * 2 + 40,
    totalRows * (thumbH + labelH) + sections.length * sectionGap + gap * 2 + 60
  );
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0c0c0e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f2f2";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Engine stress review", gap, 32);

  let y = 50;
  for (const sec of sections) {
    ctx.fillStyle = "#E4572E";
    ctx.font = "bold 16px Arial";
    ctx.fillText(sec.name, gap, y + 16);
    y += sectionGap;
    const dir = path.join(OUT, sec.id);
    for (const name of sec.slides) {
      const imgPath = path.join(dir, name);
      if (fs.existsSync(imgPath)) {
        const img = await loadImage(imgPath);
        ctx.drawImage(img, gap, y, thumbW, thumbH);
      } else {
        ctx.fillStyle = "#333";
        ctx.fillRect(gap, y, thumbW, thumbH);
      }
      ctx.fillStyle = "#aaa";
      ctx.font = "12px Arial";
      ctx.fillText(sec.id + " / " + name, gap, y + thumbH + 14);
      y += thumbH + labelH;
    }
  }

  // Also a compact 3-column key-slide strip (feature + team + stats from each)
  const keyCanvas = createCanvas(3 * thumbW + gap * 4, 3 * (thumbH + labelH) + gap * 2 + 48);
  const kctx = keyCanvas.getContext("2d");
  kctx.fillStyle = "#0c0c0e";
  kctx.fillRect(0, 0, keyCanvas.width, keyCanvas.height);
  kctx.fillStyle = "#f2f2f2";
  kctx.font = "bold 18px Arial";
  kctx.fillText("Stress key slides (feature · team · stats)", gap, 28);
  const keyMap = [
    { id: "stress-text-volume-nexus", slides: ["slide-05.png", "slide-08.png", "slide-06.png"], label: "Text" },
    {
      id: "stress-data-volume-littlesmiles",
      slides: ["slide-03.png", "slide-05.png", "slide-06.png"],
      label: "Data",
    },
    { id: "stress-image-ratios-nexus", slides: ["slide-05.png", "slide-08.png", "slide-06.png"], label: "Ratios" },
  ];
  for (let row = 0; row < keyMap.length; row++) {
    const rowInfo = keyMap[row];
    for (let col = 0; col < 3; col++) {
      const x = gap + col * (thumbW + gap);
      const yy = 40 + gap + row * (thumbH + labelH);
      const p = path.join(OUT, rowInfo.id, rowInfo.slides[col]);
      if (fs.existsSync(p)) {
        const img = await loadImage(p);
        kctx.drawImage(img, x, yy, thumbW, thumbH);
      }
      kctx.fillStyle = "#aaa";
      kctx.font = "11px Arial";
      kctx.fillText(rowInfo.label + " · " + rowInfo.slides[col], x, yy + thumbH + 14);
    }
  }

  const fullPath = path.join(OUT, "stress-grid-full.png");
  const keyPath = path.join(OUT, "stress-grid.png");
  fs.writeFileSync(fullPath, canvas.toBuffer("image/png"));
  fs.writeFileSync(keyPath, keyCanvas.toBuffer("image/png"));
  return { fullPath, keyPath };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const selected = only.length
    ? decks.filter((t) => only.some((id) => t.id === id || t.id.includes(id)))
    : decks;
  if (!selected.length) {
    console.error("No stress decks matched", only.join(", "));
    process.exit(1);
  }
  const summary = [];
  for (const theme of selected) {
    console.log("===", theme.id);
    try {
      const row = await buildOne(theme);
      summary.push(row);
      console.log(
        "ok",
        row.id,
        "gates",
        row.gates,
        row.selections.join(","),
        row.gateFails.length ? "FAILS " + row.gateFails.join("|") : ""
      );
    } catch (err) {
      console.error("FAIL", theme.id, (err as Error).message);
      summary.push({ id: theme.id, error: (err as Error).message });
    }
  }
  const grid = await writeReviewGrid(summary.filter((s: any) => !s.error));
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ summary, grid }, null, 2));
  console.log("grid", grid.keyPath);
  console.log("full", grid.fullPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
