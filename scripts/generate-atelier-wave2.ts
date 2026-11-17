/**
 * Atelier wave 2 — drafts (not in paid pack until ship bar clears).
 *
 * ferrotype  — communication-first rebuild (photo + type + content boxes)
 * sumi-field / kiln-slab — demoted; frozen until rebuilt the same way
 *
 *   node -r ts-node/register/transpile-only scripts/generate-atelier-wave2.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  circle,
  photo,
  writeKit,
  runTemplates,
  asChrome,
  asTitle,
  asStage,
  El,
} from "./lib/designKit";

const display = { fontRole: "display", fontWeight: 700 };
const kicker = { fontRole: "label", letterSpacing: 1.6, fontWeight: 600, lockFont: true };
const BODY = 28;
const LABEL = 20;
const CAP = 16;
const body = { fontRole: "body", lockFont: true, lineHeight: 1.4, fontSize: BODY };

function brand(literal: string, color = "ink"): El {
  return asChrome(text("brand", 80, 36, 520, 32, LABEL, "", color, { ...kicker, literal, z: 8 }));
}

function rule(id: string, x: number, y: number, w: number, color = "line"): El {
  return asChrome(rect(id, x, y, w, 1, color, { z: 4 }));
}

function orb(id: string, x: number, y: number, s: number, fill: string): El {
  return asChrome(circle(id, x, y, s, fill, { z: 5 }));
}

// ─── FERROTYPE — communication-first draft ────────────────────────────────────
// Recipe: photo atmosphere + extreme type + stroked content boxes. Motif = brass accent only.
const ferrotype: Template = {
  id: "ferrotype",
  name: "Ferrotype • Wet-plate pitch",
  description: "Heritage photography system — photo-led covers, heavy type, stroked content boards.",
  family: "ferrotype",
  premium: false,
  motion: {
    morph: false,
    ambient: true,
    continuityFade: true,
    entrancesMode: "none",
    defaultTransition: "fade",
    durationMs: 600,
  },
  brand: {
    lighting: "flat",
    colors: {
      bg: "#E6E1D6",
      surface: "#F4F0E7",
      surface_color: "#161412",
      ink: "#161412",
      muted: "#5E574C",
      accent: "#8B7355",
      line: "#C2B8A8",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    {
      role: "cover",
      title: "Ferrotype.",
      items: ["WET-PLATE SERIES", "Pitch for a quieter kind of portrait.", "Presented by Atelier"],
      photoQuery: "ferrotype-cover",
    },
    {
      role: "feature",
      title: "Today’s sitting",
      items: [
        "01 The brief",
        "02 Four baths",
        "03 Studio craft",
        "04 Field record",
        "05 Hold still",
        "AGENDA",
      ],
    },
    {
      role: "feature",
      title: "The brief",
      items: [
        "A portrait is not a collage. One plate, one light, one face that does not blink.",
        "We coat lacquer black so silver has somewhere to land — then we wait longer than feels polite.",
        "FERROTYPE",
      ],
      photoQuery: "ferrotype-studio",
    },
    {
      role: "feature",
      title: "What we fix",
      items: [
        "PROBLEM 01",
        "Too many images. None of them hold still long enough to mean anything.",
        "PROBLEM 02",
        "Light that flatters everyone and remembers no one.",
        "PROBLEM 03",
        "Sessions that rush the chemistry — and lose the face.",
      ],
    },
    {
      role: "feature",
      title: "Four baths",
      items: [
        "01",
        "Coat",
        "Pour the plate. Black becomes the stage.",
        "02",
        "Sensitize",
        "Silver waits in the dark for light.",
        "03",
        "Expose",
        "One sitting. No second take.",
        "04",
        "Fix",
        "Wash until the image stops running.",
      ],
    },
    {
      role: "quote",
      title: "Stillness is the point.",
      items: ["If they smile too soon, the plate forgets them.", "— Studio note"],
    },
    {
      role: "feature",
      title: "Field record",
      items: ["PLATE 07", "Silver settling into lacquer — tray still warm.", "North light · Tray 2", "07 / 12"],
      photoQuery: "ferrotype-field",
    },
    {
      role: "closing",
      title: "Hold still.",
      items: ["Coat. Expose. Fix.", "Open the shutter", "ATELIER · FERROTYPE"],
    },
  ],
  kits: () => {
    const f = "ferrotype";
    const kits: ReturnType<typeof writeKit>[] = [];

    // COVER — full-bleed photo + heavy type (pitch cover discipline)
    kits.push(
      writeKit("cover", "ferro-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(photo("photo", 0, 0, 1600, 900, { z: 1, mask: "rect" })),
        asChrome(rect("scrim", 0, 0, 1600, 900, "surface_color", { z: 2, opacity: 0.42, ignoreContrast: true })),
        brand("FERROTYPE", "surface"),
        asChrome(text("by", 980, 36, 520, 32, LABEL, "copy2", "surface", { ...kicker, align: "right", z: 8 })),
        rule("top", 80, 88, 1440, "line"),
        asTitle(
          text("title", 80, 520, 900, 140, 96, "title", "surface", {
            ...display,
            lockFont: true,
            z: 6,
          })
        ),
        asChrome(text("copy0", 80, 680, 500, 36, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asChrome(text("copy1", 80, 740, 900, 50, BODY, "copy1", "surface", { ...body, z: 6 })),
      ])
    );

    // AGENDA — split panel (title left / numbered list right)
    kits.push(
      writeKit("feature", "ferro-agenda", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        brand("FERROTYPE"),
        rule("top", 80, 88, 680, "line"),
        asChrome(text("copy5", 80, 140, 400, 32, LABEL, "copy5", "accent", { ...kicker, z: 6 })),
        asTitle(text("title", 80, 520, 640, 160, 64, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(rect("panel", 820, 0, 780, 900, "surface_color", { z: 2 })),
        asChrome(text("a0", 900, 160, 600, 48, BODY, "copy0", "surface", { ...body, fontWeight: 600, z: 6 })),
        asChrome(text("a1", 900, 260, 600, 48, BODY, "copy1", "surface", { ...body, fontWeight: 600, z: 6 })),
        asChrome(text("a2", 900, 360, 600, 48, BODY, "copy2", "surface", { ...body, fontWeight: 600, z: 6 })),
        asChrome(text("a3", 900, 460, 600, 48, BODY, "copy3", "surface", { ...body, fontWeight: 600, z: 6 })),
        asChrome(text("a4", 900, 560, 600, 48, BODY, "copy4", "surface", { ...body, fontWeight: 600, z: 6 })),
      ])
    );

    // BRIEF — photo environment + dark stroked content plate
    kits.push(
      writeKit("feature", "ferro-brief", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(photo("photo", 0, 0, 1600, 900, { z: 1, mask: "rect" })),
        asChrome(rect("plate", 120, 140, 1360, 620, "surface_color", { z: 3, radius: 18 })),
        asChrome(
          rect("stroke", 120, 140, 1360, 620, "line", {
            z: 4,
            radius: 18,
            opacity: 0.35,
            ignoreContrast: true,
            strokeColor: "#C2B8A8",
            strokeWidth: 1.5,
            strokeOpacity: 0.55,
          })
        ),
        brand("FERROTYPE", "surface"),
        asTitle(text("title", 180, 220, 900, 70, 48, "title", "surface", { ...display, lockFont: true, z: 6 })),
        orb("dot", 1400, 200, 36, "accent"),
        asChrome(text("copy0", 180, 340, 560, 280, BODY, "copy0", "surface", { ...body, z: 6 })),
        asChrome(text("copy1", 800, 340, 560, 280, BODY, "copy1", "muted", { ...body, z: 6 })),
      ])
    );

    // PROBLEMS — dark field + stroked 3-column board
    const problems: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "surface_color", { z: 0 })),
      brand("FERROTYPE", "surface"),
      asTitle(text("title", 80, 100, 1000, 70, 48, "title", "surface", { ...display, lockFont: true, z: 6 })),
      asChrome(
        rect("board", 80, 220, 1440, 560, "ink", {
          z: 2,
          radius: 16,
          strokeColor: "#5E574C",
          strokeWidth: 1.5,
          strokeOpacity: 0.8,
        })
      ),
      asChrome(rect("d1", 560, 260, 1, 460, "line", { z: 3, opacity: 0.35, ignoreContrast: true })),
      asChrome(rect("d2", 1040, 260, 1, 460, "line", { z: 3, opacity: 0.35, ignoreContrast: true })),
    ];
    [
      { x: 120, h: "copy0", b: "copy1" },
      { x: 600, h: "copy2", b: "copy3" },
      { x: 1080, h: "copy4", b: "copy5" },
    ].forEach((col, i) => {
      problems.push(
        orb(`o${i}`, col.x, 280, 28, "accent"),
        asChrome(text(`h${i}`, col.x + 48, 278, 360, 40, LABEL, col.h, "surface", { ...kicker, z: 6 })),
        asChrome(text(`b${i}`, col.x, 360, 400, 320, BODY, col.b, "muted", { ...body, z: 6 }))
      );
    });
    kits.push(writeKit("feature", "ferro-problems", f, problems));

    // BATHS — light field + stroked service cards (2×2)
    const baths: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      brand("FERROTYPE"),
      asTitle(text("title", 80, 100, 1000, 70, 48, "title", "ink", { ...display, lockFont: true, z: 6 })),
    ];
    const cards = [
      { x: 80, y: 220, n: "copy0", h: "copy1", b: "copy2" },
      { x: 820, y: 220, n: "copy3", h: "copy4", b: "copy5" },
      { x: 80, y: 540, n: "copy6", h: "copy7", b: "copy8" },
      { x: 820, y: 540, n: "copy9", h: "copy10", b: "copy11" },
    ];
    // Only 12 slots from 4 baths × 3 — but items only have 12 strings (01,Coat,desc ×4). Good.
    cards.forEach((c, i) => {
      baths.push(
        asChrome(
          rect(`card${i}`, c.x, c.y, 700, 260, "surface", {
            z: 2,
            radius: 16,
            strokeColor: "#161412",
            strokeWidth: 1.5,
            strokeOpacity: 0.55,
          })
        ),
        asChrome(
          circle(`badge${i}`, c.x + 36, c.y + 40, 56, "surface_color", {
            z: 4,
          })
        ),
        asChrome(
          text(`n${i}`, c.x + 36, c.y + 52, 56, 40, LABEL, c.n, "surface", {
            ...kicker,
            align: "center",
            z: 6,
          })
        ),
        asChrome(text(`h${i}`, c.x + 110, c.y + 52, 520, 40, LABEL, c.h, "ink", { ...kicker, z: 6 })),
        asChrome(text(`b${i}`, c.x + 36, c.y + 130, 620, 90, BODY, c.b, "muted", { ...body, z: 6 }))
      );
    });
    kits.push(writeKit("feature", "ferro-baths", f, baths));

    // QUOTE — type carries
    kits.push(
      writeKit("quote", "ferro-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        brand("FERROTYPE"),
        rule("top", 80, 88, 1440, "line"),
        asTitle(text("title", 80, 300, 1400, 120, 64, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy0", 80, 460, 1200, 80, BODY, "copy0", "muted", { ...body, z: 6 })),
        asChrome(text("copy1", 80, 580, 600, 40, LABEL, "copy1", "accent", { ...kicker, z: 6 })),
      ])
    );

    // FIELD — photo + bottom content band
    kits.push(
      writeKit("feature", "ferro-field", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(photo("photo", 0, 0, 1600, 900, { z: 1, mask: "rect" })),
        asChrome(rect("band", 0, 560, 1600, 340, "surface_color", { z: 3, opacity: 0.92 })),
        rule("lip", 0, 560, 1600, "accent"),
        brand("FERROTYPE", "surface"),
        asChrome(text("copy0", 80, 600, 400, 36, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asTitle(text("title", 80, 650, 900, 70, 48, "title", "surface", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy1", 80, 740, 1000, 50, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 1100, 740, 400, 40, LABEL, "copy2", "accent", { ...kicker, align: "right", z: 6 })),
      ])
    );

    // CLOSE — heavy type, quiet chrome
    kits.push(
      writeKit("closing", "ferro-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        brand("FERROTYPE"),
        rule("top", 80, 88, 1440, "line"),
        asTitle(text("title", 80, 320, 1200, 120, 84, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy0", 80, 480, 900, 50, BODY, "copy0", "muted", { ...body, z: 6 })),
        asChrome(text("copy1", 80, 560, 700, 40, LABEL, "copy1", "accent", { ...kicker, z: 6 })),
        asChrome(text("copy2", 80, 800, 600, 36, LABEL, "copy2", "muted", { ...kicker, z: 6 })),
      ])
    );

    return kits;
  },
};

// ─── SUMI / KILN — demoted drafts (premium false). Rebuild later. ─────────────
// Kept runnable so --only still works; not in ATELIER_PACK_IDS.

const sumi: Template = {
  id: "sumi-field",
  name: "Sumi Field • Draft",
  description: "Demoted draft — rebuild to communication-first bar before pack.",
  family: "sumi-field",
  premium: false,
  motion: { morph: false, ambient: true, continuityFade: true, entrancesMode: "none", defaultTransition: "fade", durationMs: 650 },
  brand: {
    colors: {
      bg: "#F3EFE6",
      surface: "#FAF7F0",
      surface_color: "#E5DFD2",
      ink: "#1A2744",
      muted: "#5C6678",
      accent: "#C43B2C",
      line: "#D0C8B8",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    { role: "cover", title: "Sumi Field.", items: ["DRAFT", "Not in paid pack.", "Rebuild pending"] },
    { role: "closing", title: "Draft only.", items: ["Do not ship.", "Communication-first rebuild next."] },
  ],
  kits: () => {
    const f = "sumi-field";
    return [
      writeKit("cover", "sumi-draft-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(text("copy0", 120, 200, 400, 36, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asTitle(text("title", 110, 280, 1200, 120, 72, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy1", 120, 440, 900, 60, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 120, 540, 500, 40, LABEL, "copy2", "muted", { ...kicker, z: 6 })),
      ]),
      writeKit("closing", "sumi-draft-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asTitle(text("title", 120, 320, 1200, 100, 64, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy0", 120, 460, 900, 50, BODY, "copy0", "muted", { ...body, z: 6 })),
        asChrome(text("copy1", 120, 540, 900, 50, BODY, "copy1", "muted", { ...body, z: 6 })),
      ]),
    ];
  },
};

const kiln: Template = {
  id: "kiln-slab",
  name: "Kiln Slab • Draft",
  description: "Demoted draft — rebuild to communication-first bar before pack.",
  family: "kiln-slab",
  premium: false,
  motion: { morph: false, ambient: true, continuityFade: true, entrancesMode: "none", defaultTransition: "fade", durationMs: 600 },
  brand: {
    colors: {
      bg: "#C9A882",
      surface: "#F3E6D4",
      surface_color: "#A8845E",
      ink: "#2A1A12",
      muted: "#5C4030",
      accent: "#8B3A22",
      line: "#8F6A48",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    { role: "cover", title: "Kiln Slab.", items: ["DRAFT", "Not in paid pack.", "Rebuild pending"] },
    { role: "closing", title: "Draft only.", items: ["Do not ship.", "Communication-first rebuild next."] },
  ],
  kits: () => {
    const f = "kiln-slab";
    return [
      writeKit("cover", "kiln-draft-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(text("copy0", 120, 200, 400, 36, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asTitle(text("title", 110, 280, 1200, 120, 72, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy1", 120, 440, 900, 60, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 120, 540, 500, 40, LABEL, "copy2", "muted", { ...kicker, z: 6 })),
      ]),
      writeKit("closing", "kiln-draft-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asTitle(text("title", 120, 320, 1200, 100, 64, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy0", 120, 460, 900, 50, BODY, "copy0", "muted", { ...body, z: 6 })),
        asChrome(text("copy1", 120, 540, 900, 50, BODY, "copy1", "muted", { ...body, z: 6 })),
      ]),
    ];
  },
};

runTemplates([ferrotype, sumi, kiln]).catch((e) => {
  console.error(e);
  process.exit(1);
});
