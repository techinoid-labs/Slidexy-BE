/**
 * Two premium pitch decks — distinct cover constructions.
 *
 *   fuse-rack   — pulled cartridge interrupts a wall of fuse slots
 *   plate-river — stacked ceramics over a circulation baseline
 *
 *   node -r ts-node/register/transpile-only scripts/generate-fuse-and-plate.ts
 */
import * as path from "path";
import { El, ROOT, circle, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";

type Frame = [number, number, number, number, number, string?, El?];
type Copy = [string, Frame];
type Page = { title: string; items: string[]; elements: El[]; art?: string; chart?: El };

const display = { textStyleRole: "display" };
const plate = (id: string, x: number, y: number, w: number, h: number, tone: string, z = 1, extra: El = {}) =>
  rect(id, x, y, w, h, tone, { z, keepFill: true, ...extra });
const back = (tone: string) => plate("ground", 0, 0, 1600, 900, tone, 0);
const picture = (x: number, y: number, w: number, h: number, z = 2) => photo("object", x, y, w, h, { z });
const plot = (x: number, y: number, w: number, h: number) => ({ id: "plot", type: "chart", x, y, width: w, height: h, z: 2 });

function page(head: Copy, lines: Copy[], layers: El[] = [], art?: string, chart?: El): Page {
  const elements = [head, ...lines].map(([, frame], i) => {
    const [x, y, w, h, size, color, style] = frame;
    const slot = i ? "copy" + (i - 1) : "title";
    return text(slot, x, y, w, h, size, slot, color || "ink", { z: 8, ...(i ? {} : display), ...style });
  });
  return { title: head[0], items: lines.map(([s]) => s), elements: [...layers, ...elements], art, chart };
}

/** Vertical fuse slots — the wall rack silhouette (not a chart). */
function fuseSlots(x: number, y: number, count: number, tone: string, tip: string) {
  const els: El[] = [];
  for (let i = 0; i < count; i++) {
    const yy = y + i * 58;
    els.push(plate("slot-" + i, x, yy, 220, 44, tone, 2));
    els.push(plate("tip-" + i, x + 188, yy + 8, 24, 28, tip, 3));
  }
  return els;
}

const util = {
  fonts: { display: "Bahnschrift", body: "Consolas" },
  colors: {
    bg: "#F4F1EA",
    ink: "#1A1E24",
    slate: "#2B303A",
    yellow: "#F0C40D",
    porcelain: "#F7F4EE",
    tip: "#C43B2C",
    muted: "#6B7280",
    accent: "#C43B2C",
    white: "#FFFFFF",
  },
};

const clay = {
  fonts: { display: "Georgia", body: "Calibri" },
  colors: {
    bg: "#F7EFE4",
    ink: "#2A1F1A",
    terra: "#C4785A",
    glaze: "#FFF8F0",
    river: "#1F6F6A",
    sand: "#E8D5C4",
    muted: "#6A5648",
    accent: "#1F6F6A",
    deep: "#3A241C",
  },
};

// ─── FUSE RACK ────────────────────────────────────────────────────────────────
// Cover: slate wall → yellow safety rail → vertical slot column → pulled cartridge
// photo → FUSE on the cartridge plane → RACK on the wall plate.
// Read: cartridge first, FUSE on it, then RACK in the remaining slots.
const fuse: Page[] = [
  page(
    ["FUSE", [72, 290, 520, 160, 118, "slate", { ...display, z: 7 }]],
    [
      ["RACK", [72, 460, 520, 140, 110, "yellow", { ...display, z: 7 }]],
      ["Shared fuse inventory for regional utilities", [72, 640, 480, 100, 28, "porcelain"]],
      ["Illustrative seed pitch", [72, 760, 360, 40, 20, "muted"]],
    ],
    [
      back("slate"),
      plate("rail", 0, 0, 1600, 28, "yellow", 1),
      plate("rail-b", 0, 872, 1600, 28, "yellow", 1),
      plate("wall", 980, 80, 520, 740, "ink", 1),
      ...fuseSlots(1040, 140, 10, "porcelain", "tip"),
      picture(420, 120, 720, 680, 5),
    ],
    "fuse-cover"
  ),
  page(
    ["A blown fuse should not strand a feeder.", [70, 80, 1460, 160, 64]],
    [
      ["Crews already carry common cartridge sizes. What they lack is a shared count of what the neighboring yard still holds.", [78, 300, 900, 200, 32]],
      ["Fuse Rack pools spare stock across districts so a night truck can pull a verified cartridge before the feeder sits cold.", [78, 540, 900, 200, 32, "accent"]],
    ],
    [back("bg"), plate("mark", 1100, 280, 380, 380, "yellow", 1), plate("inner", 1140, 320, 300, 300, "slate", 2)]
  ),
  page(
    ["The bay keeps the count", [70, 70, 700, 200, 68]],
    [
      ["Each bay scans a cartridge into a shared bin. The next crew sees live counts before leaving the yard.", [78, 320, 620, 220, 30]],
      ["A sealed bag travels with a lot number. The receiving bay confirms the amp rating before the truck rolls.", [78, 580, 620, 200, 30, "accent"]],
    ],
    [picture(760, 0, 840, 900)],
    "fuse-bay"
  ),
  page(
    ["Pull, confirm, replace", [70, 70, 1450, 120, 72]],
    [
      ["01 Pull", [90, 260, 400, 70, 42, "slate", display]],
      ["The night lead selects a cartridge from the shared rack against the feeder ticket.", [90, 350, 400, 200, 28]],
      ["02 Confirm", [580, 260, 400, 70, 42, "slate", display]],
      ["A second tech verifies amp rating and lot number before the seal is broken.", [580, 350, 400, 200, 28]],
      ["03 Replace", [1070, 260, 420, 70, 42, "slate", display]],
      ["The empty slot is marked pending restock. The shared count drops in the same minute.", [1070, 350, 420, 220, 28]],
    ],
    [
      back("yellow"),
      plate("c0", 70, 230, 460, 420, "porcelain"),
      plate("c1", 560, 230, 460, 420, "porcelain"),
      plate("c2", 1050, 230, 480, 420, "porcelain"),
    ]
  ),
  page(
    ["Outage minutes the shared rack avoids", [70, 60, 1450, 120, 56]],
    [
      ["Illustrative feeder model • minutes of cold time avoided after a blown cartridge", [78, 200, 1400, 50, 26, "muted"]],
      ["At twelve shared spares, modeled cold time falls from 94 to 28 minutes. The gain comes from skipping a cross-town parts run.", [1000, 360, 520, 320, 30]],
    ],
    [back("bg"), plot(70, 280, 880, 500)],
    undefined,
    {
      type: "bar",
      labels: ["0 spares", "4", "8", "12", "16"],
      series: [{ name: "Cold minutes", values: [94, 71, 48, 28, 22] }],
      colors: ["#C43B2C"],
      showLegend: false,
    }
  ),
  page(
    ["Unit economics of a shared bay", [70, 70, 1450, 120, 64]],
    [
      ["$18k / year", [80, 260, 700, 120, 72, "slate", display]],
      ["Subscription per participating bay for inventory software, sealed bags and quarterly audits.", [80, 420, 700, 200, 30]],
      ["$11.2k direct", [900, 280, 600, 80, 44, "accent", display]],
      ["Bag software $4.1k, bagging and seals $2.4k, audit labor $4.7k. Contribution $6.8k before head-office overhead.", [900, 400, 600, 280, 28]],
    ],
    [back("porcelain"), plate("rule", 820, 250, 4, 480, "yellow")]
  ),
  page(
    ["Start with one corridor", [70, 70, 1450, 120, 68]],
    [
      ["36 bays", [80, 260, 700, 120, 86, "slate", display]],
      ["Assume each bay avoids two cross-town runs a month. At $420 per avoided run, corridor savings are $362,880 before subscription fees.", [80, 420, 720, 260, 30]],
      ["Pilot rule", [920, 280, 560, 70, 40, "accent", display]],
      ["Open a corridor only when three adjacent yards can each commit twelve common cartridge SKUs.", [920, 380, 560, 280, 30]],
    ],
    [back("yellow")]
  ),
  page(
    ["Why share the rack?", [70, 70, 1450, 120, 68]],
    [
      ["Local stock", [90, 260, 420, 70, 40, "accent", display]],
      ["Fast for familiar faults. Thin for rare amp ratings that sit idle for months.", [90, 360, 420, 240, 28]],
      ["Central warehouse", [560, 260, 420, 70, 40, "accent", display]],
      ["Deep assortment, but every night run pays the drive before the feeder is restored.", [560, 360, 420, 260, 28]],
      ["Shared bay", [1030, 260, 440, 70, 40, "slate", display]],
      ["A verified cartridge in a neighboring yard. The truck leaves with a counted spare.", [1030, 360, 440, 260, 28]],
    ],
    [back("bg"), plate("base", 80, 760, 1440, 10, "yellow")]
  ),
  page(
    ["Two leads own the count", [70, 70, 1450, 120, 68]],
    [
      ["Rafi Cole / inventory", [80, 260, 680, 80, 40, "slate", display]],
      ["Rafi owns SKU standards, sealed-bag lots and the quarterly audit. A disputed count freezes the SKU until both bays sign.", [80, 380, 680, 280, 30]],
      ["Nia Park / night ops", [860, 300, 640, 80, 40, "accent", display]],
      ["Nia owns feeder tickets and truck dispatch. Her team will not leave without a confirmed amp rating on the bag tag.", [860, 420, 640, 280, 30]],
    ],
    [back("porcelain")]
  ),
  page(
    ["Ninety days on one corridor", [70, 70, 1450, 120, 64]],
    [
      ["Days 1–30", [90, 260, 400, 60, 36, "accent"]],
      ["Instrument three bays. Photograph every shared SKU and seal the first lots.", [90, 350, 400, 220, 28]],
      ["Days 31–60", [580, 260, 400, 60, 36, "accent"]],
      ["Run night pulls against live counts. Target fewer than two count disputes per week.", [580, 350, 400, 240, 28]],
      ["Days 61–90", [1070, 260, 420, 60, 36, "accent"]],
      ["Prove a 40% cut in cross-town parts runs before opening a second corridor.", [1070, 350, 420, 240, 28]],
    ],
    [back("bg")]
  ),
  page(
    ["Stock the first corridor.", [70, 80, 1450, 140, 72, "porcelain"]],
    [
      ["$4.8M seed", [70, 280, 900, 140, 96, "yellow", display]],
      ["$2.1M for bay hardware and seals, $1.5M for inventory software, $1.2M for ops hiring and audits. Illustrative company and figures.", [70, 480, 900, 220, 30, "porcelain"]],
      ["Target: 36 instrumented bays and a 40% cut in cross-town runs within 12 months.", [1000, 520, 520, 200, 26, "muted"]],
    ],
    [back("slate"), plate("bar", 70, 450, 1460, 6, "yellow")]
  ),
];

// ─── PLATE RIVER ──────────────────────────────────────────────────────────────
// Cover: clay ground → glaze well → stacked plate object → PLATE left of stack →
// RIVER as a teal circulation baseline under the stack.
// Read: stack silhouette → PLATE → river path of return.
const river: Page[] = [
  page(
    ["PLATE", [70, 200, 620, 160, 110, "ink", { ...display, z: 7 }]],
    [
      ["RIVER", [70, 720, 900, 100, 72, "glaze", { ...display, z: 8 }]],
      ["Reusable ceramic float for food halls", [70, 390, 560, 100, 30, "ink"]],
      ["Illustrative seed pitch", [70, 520, 400, 40, 22, "muted"]],
    ],
    [
      back("terra"),
      plate("well", 100, 80, 1400, 620, "sand", 1),
      plate("well-inner", 140, 120, 1320, 540, "glaze", 2),
      picture(720, 80, 780, 700, 5),
      plate("tide", 0, 700, 1600, 200, "river", 6),
      plate("tide-lip", 0, 700, 1600, 12, "deep", 7),
    ],
    "plate-cover"
  ),
  page(
    ["A plate should come back.", [70, 80, 1450, 160, 72]],
    [
      ["Food halls burn through single-use ware at lunch and again at dinner. Guests leave trays; nobody owns the return path.", [80, 300, 900, 200, 32]],
      ["Plate River floats a shared ceramic set through wash, rack and service so the next guest inherits a clean plate, not a new one.", [80, 540, 900, 200, 32, "accent"]],
    ],
    [back("bg"), plate("disc", 1100, 280, 360, 360, "terra", 1), circle("rim", 1160, 340, 240, "glaze", { z: 2, keepFill: true })]
  ),
  page(
    ["Wash is the choke point", [70, 70, 700, 200, 68]],
    [
      ["Plates enter a sealed rack at the tray return. The wash line releases a counted stack to the next service window.", [80, 320, 620, 220, 30]],
      ["A cracked rim is tagged out of the float. The hall sees available covers before the rush, not after.", [80, 580, 620, 200, 30, "accent"]],
    ],
    [picture(780, 0, 820, 900)],
    "plate-wash"
  ),
  page(
    ["Service → return → wash → rack", [70, 70, 1450, 120, 56]],
    [
      ["Service", [100, 260, 300, 60, 36, "river", display]],
      ["Hosts pull a counted stack. The float number rides on the rack card.", [100, 350, 320, 200, 28]],
      ["Return", [480, 260, 300, 60, 36, "river", display]],
      ["Guests leave trays at a single mouth. Mixed ware is sorted before the belt.", [480, 350, 320, 220, 28]],
      ["Wash", [860, 260, 300, 60, 36, "river", display]],
      ["A sealed cycle. Cracked rims exit to the cull bin with a photo tag.", [860, 350, 320, 220, 28]],
      ["Rack", [1240, 260, 280, 60, 36, "terra", display]],
      ["Clean stacks return to the window with a live cover count.", [1240, 350, 300, 220, 28]],
    ],
    [
      back("sand"),
      plate("p0", 80, 230, 360, 420, "glaze"),
      plate("p1", 460, 230, 360, 420, "glaze"),
      plate("p2", 840, 230, 360, 420, "glaze"),
      plate("p3", 1220, 230, 320, 420, "glaze"),
    ]
  ),
  page(
    ["Cost per 100 servings", [70, 60, 1450, 110, 64]],
    [
      ["Illustrative hall model • dollars for plate ware across 100 guest servings", [78, 190, 1400, 50, 26, "muted"]],
      ["Single-use ware stays flat. The float drops after wash labor is absorbed. At 8 washes per plate-life, modeled cost is $4.20 per 100 servings.", [980, 340, 540, 360, 30]],
    ],
    [back("bg"), plot(70, 260, 860, 520)],
    undefined,
    {
      type: "line",
      labels: ["1 wash", "2", "4", "8", "12"],
      series: [
        { name: "Single-use ($)", values: [18, 18, 18, 18, 18] },
        { name: "Plate float ($)", values: [22, 12, 7, 4.2, 3.1] },
      ],
      colors: ["#C4785A", "#1F6F6A"],
      showLegend: true,
    }
  ),
  page(
    ["What a hall pays to float", [70, 70, 1450, 120, 64]],
    [
      ["$2,400 / month", [80, 260, 720, 120, 64, "river", display]],
      ["Covers 2,000 active plates, wash SLAs, cull replacement and a weekly cover report.", [80, 420, 720, 220, 30]],
      ["$1,480 direct", [900, 280, 600, 80, 42, "terra", display]],
      ["Wash labor share $820, cull replacements $360, logistics $300. Contribution $920 before overhead.", [900, 400, 600, 280, 28]],
    ],
    [back("glaze"), plate("rule", 840, 250, 4, 480, "river")]
  ),
  page(
    ["Begin with one food hall", [70, 70, 1450, 120, 68]],
    [
      ["12 halls", [80, 260, 700, 120, 86, "terra", display]],
      ["At $2,400 per month, twelve halls produce $345,600 in annual float revenue before cull overages.", [80, 420, 720, 260, 30]],
      ["Entry test", [920, 280, 560, 70, 40, "accent", display]],
      ["Enroll a hall only if tray return is single-mouth and the wash line can release a counted stack in under twelve minutes.", [920, 380, 560, 300, 30]],
    ],
    [back("sand")]
  ),
  page(
    ["What halls buy today", [70, 70, 1450, 120, 68]],
    [
      ["Single-use", [90, 260, 420, 70, 40, "terra", display]],
      ["Simple purchasing. Guests leave a pile that never returns to service.", [90, 360, 420, 240, 28]],
      ["Owned ceramics", [560, 260, 420, 70, 40, "terra", display]],
      ["Beautiful when staffed. Breakage and wash labor sit on the hall with no shared float.", [560, 360, 420, 260, 28]],
      ["Plate River", [1030, 260, 440, 70, 40, "river", display]],
      ["A counted float with a wash SLA and a live cover number before the rush.", [1030, 360, 440, 260, 28]],
    ],
    [back("bg"), plate("base", 80, 760, 1440, 10, "terra")]
  ),
  page(
    ["Two crafts, one float", [70, 70, 1450, 120, 68]],
    [
      ["June Park / ceramics ops", [80, 260, 680, 80, 40, "river", display]],
      ["June owns cull standards, glaze lots and replacement lead times. A cracked rim never re-enters a guest stack.", [80, 380, 680, 280, 30]],
      ["Omar Ruiz / hall logistics", [860, 300, 640, 80, 40, "terra", display]],
      ["Omar owns tray-mouth design and wash-window SLAs. His team publishes the cover count thirty minutes before service.", [860, 420, 640, 280, 30]],
    ],
    [back("glaze")]
  ),
  page(
    ["A pilot with three gates", [70, 70, 1450, 120, 64]],
    [
      ["Return", [90, 260, 400, 60, 36, "accent"]],
      ["90% of trays hit the single mouth for ten consecutive lunch services.", [90, 350, 400, 220, 28]],
      ["Wash", [580, 260, 400, 60, 36, "accent"]],
      ["Counted stacks release in under twelve minutes with fewer than 2% cull tags.", [580, 350, 400, 240, 28]],
      ["Renew", [1070, 260, 420, 60, 36, "accent"]],
      ["The hall renews at full price after six weeks of live cover reports.", [1070, 350, 420, 240, 28]],
    ],
    [back("bg")]
  ),
  page(
    ["Keep the plates in motion.", [70, 80, 1450, 140, 68, "glaze"]],
    [
      ["$3.6M seed", [70, 280, 900, 140, 96, "sand", display]],
      ["$1.6M for ceramic inventory, $1.1M for wash tooling and logistics, $900k for hall onboarding. Illustrative company and figures.", [70, 480, 900, 220, 30, "glaze"]],
      ["Target: 12 halls and three renewals inside 15 months.", [1000, 520, 520, 180, 28, "sand"]],
    ],
    [back("river"), plate("bar", 70, 450, 1460, 6, "sand")]
  ),
];

async function build(id: string, name: string, brand: El, pages: Page[], description: string) {
  const slides = pages.map(({ art, elements, ...data }, i) => ({
    ...data,
    photoQuery: art,
    role: i === 0 ? "cover" : i === pages.length - 1 ? "closing" : "feature",
  }));
  await renderTemplate(
    {
      id,
      name,
      family: id,
      brand,
      description,
      premium: true,
      motion: false,
      slides,
      kits: () => pages.map((p, i) => writeKit(slides[i].role, id + "-" + (i + 1), id, p.elements)),
    },
    false,
    async (key) => {
      const dir = path.join(ROOT, "assets", "fuse-and-plate");
      const png = path.join(dir, key + ".png");
      const jpg = path.join(dir, key + ".jpg");
      const file = require("fs").existsSync(png) ? png : jpg;
      return { path: file, pexelsId: "local:" + key };
    }
  );
}

(async () => {
  await build(
    "fuse-rack",
    "Fuse Rack",
    util,
    fuse,
    "Illustrative shared-fuse inventory seed pitch for regional utilities."
  );
  await build(
    "plate-river",
    "Plate River",
    clay,
    river,
    "Illustrative reusable-plate float seed pitch for food halls."
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
