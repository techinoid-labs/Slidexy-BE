/**
 * Glyph decks — presentation-first; geometry is atmosphere, not the slide.
 *
 *   facet-lattice  — diamonds accent a crystal / craft talk track
 *   hive-circuit   — hexagons accent a colony / team talk track
 *   bracket-gate   — L-lintels frame architectural narrative
 *
 *   node -r ts-node/register/transpile-only scripts/generate-glyph-decks.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  circle,
  diamond,
  hexagon,
  photo,
  writeKit,
  runTemplates,
  El,
  asBeat,
  asChrome,
  asLabel,
  asDot,
  asTitle,
  asStage,
} from "./lib/designKit";

const display = { fontRole: "display", fontWeight: 700 };
const kicker = { fontRole: "label", letterSpacing: 2.2, fontWeight: 600 };

const icon = (id: string, query: string, x: number, y: number, size: number, z = 6): El => ({
  id,
  type: "smartAsset",
  x,
  y,
  width: size,
  height: size,
  z,
  smartAsset: { type: "icon", query, style: "glyph-line" },
});

const bar = (id: string, x: number, y: number, w: number, h: number, fill: string, z = 1, opacity?: number): El =>
  asChrome(rect(id, x, y, w, h, fill, { z, ...(opacity != null ? { opacity } : {}) }));

function bracket(
  id: string,
  x: number,
  y: number,
  arm: number,
  thick: number,
  fill: string,
  corner: "tl" | "tr" | "bl" | "br" = "tl",
  z = 1,
  offset = 0,
  opacity?: number
): El[] {
  const o = offset;
  const op = opacity != null ? { opacity } : {};
  if (corner === "tl") {
    return [
      asChrome(rect(id + "_h", x + o, y, arm, thick, fill, { z, ...op })),
      asChrome(rect(id + "_v", x, y + o, thick, arm, fill, { z, ...op })),
    ];
  }
  if (corner === "tr") {
    return [
      asChrome(rect(id + "_h", x - arm - o, y, arm, thick, fill, { z, ...op })),
      asChrome(rect(id + "_v", x - thick, y + o, thick, arm, fill, { z, ...op })),
    ];
  }
  if (corner === "bl") {
    return [
      asChrome(rect(id + "_h", x + o, y - thick, arm, thick, fill, { z, ...op })),
      asChrome(rect(id + "_v", x, y - arm - o, thick, arm, fill, { z, ...op })),
    ];
  }
  return [
    asChrome(rect(id + "_h", x - arm - o, y - thick, arm, thick, fill, { z, ...op })),
    asChrome(rect(id + "_v", x - thick, y - arm - o, thick, arm, fill, { z, ...op })),
  ];
}

/** Numbered talk-track row: accent diamond + title + body on a surface plate. */
function talkRow(
  i: number,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  ink: string,
  muted: string
): El[] {
  const id = "note" + i;
  const bodySlot = "copy" + (i * 2 + 1);
  const titleSlot = "copy" + i * 2;
  return [
    asChrome(diamond("acc" + i, x - 20, y - 10, 120, 120, fill, { z: 2, opacity: 0.85 })),
    asBeat(rect(id, x + 80, y, w - 80, h, "surface", { z: 3 }), { morphId: "note-" + i }),
    asLabel(text(titleSlot, x + 110, y + 24, w - 160, 44, 24, titleSlot, ink, { fontWeight: 700, z: 4 }), id),
    asLabel(text(bodySlot, x + 110, y + 72, w - 160, h - 96, 18, bodySlot, muted, { lineHeight: 1.3, z: 4 }), id),
  ];
}

// ─────────────────────────────────────────────────────────────
// FACET LATTICE — craft / decision presentation
// ─────────────────────────────────────────────────────────────
const facet: Template = {
  id: "facet-lattice",
  name: "Facet Lattice • Crystal kit",
  description: "Presentation deck — craft decisions cut like facets; diamonds are atmosphere.",
  family: "facet-lattice",
  brand: {
    colors: {
      bg: "#0B1020",
      surface: "#F4F1EA",
      surface_color: "#2A3350",
      ink: "#E8ECF8",
      muted: "#8B93B0",
      accent: "#7EF0D8",
      line: "#3D4666",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "The cut decides the light",
      items: ["FACET LATTICE · CRAFT BRIEF", "How we finish a product so it catches attention"],
      photoQuery: "glyph-facet-cover",
    },
    {
      role: "feature",
      title: "Tonight’s cut",
      items: [
        "01 Plane",
        "Name the decision before you polish the story.",
        "02 Edge",
        "Remove anything that does not carry weight.",
        "03 Blaze",
        "Leave one surface that catches the room.",
      ],
    },
    {
      role: "feature",
      title: "Three planes we protect",
      items: [
        "Table",
        "The promise the customer can say in one breath.",
        "Crown",
        "The proof they can see without a demo.",
        "Pavilion",
        "The quiet work that keeps the cut from chipping.",
      ],
    },
    {
      role: "feature",
      title: "Where the light lands",
      items: ["HOLD", "Ship only when one plane still burns under hard light."],
      photoQuery: "glyph-facet-cut",
    },
    {
      role: "feature",
      title: "Cut sequence",
      items: [
        "Rough",
        "Block the silhouette. No detail yet.",
        "Facet",
        "Carve the three planes. Kill the fourth.",
        "Polish",
        "Tighten copy. Raise contrast. Stop early.",
      ],
    },
    {
      role: "feature",
      title: "Glass check",
      items: ["PROOF", "Hold the work against a bright window. If it goes flat, recut."],
      photoQuery: "glyph-facet-glass",
    },
    {
      role: "quote",
      title: "NOTE",
      items: ["A facet is a decision you can see.", "— Studio lapidary"],
    },
    {
      role: "closing",
      title: "Cut clean. Ship bright.",
      items: ["Facet Lattice · craft brief"],
    },
  ],
  kits: () => {
    const f = "facet-lattice";
    const kits: ReturnType<typeof writeKit>[] = [];

    // 1 Cover — full-bleed photo, scrim, title on plate, diamonds as accent only
    kits.push(
      writeKit("cover", "facet-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.55 })),
        asChrome(diamond("d0", -100, -80, 520, 640, "accent", { z: 3, opacity: 0.28 })),
        asChrome(diamond("d1", 200, 400, 360, 480, "surface_color", { z: 3, opacity: 0.4 })),
        asChrome(diamond("d2", 1280, -60, 420, 420, "accent", { z: 3, opacity: 0.25 })),
        asBeat(rect("note", 80, 220, 820, 420, "surface", { z: 5 }), { morphId: "note-0" }),
        asLabel(text("copy0", 120, 260, 740, 40, 16, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 120, 320, 740, 180, 52, "title", "bg", { ...display, lineHeight: 1.1, z: 6 })),
        asLabel(text("copy1", 120, 520, 740, 70, 20, "copy1", "muted", { lineHeight: 1.3, z: 6 }), "note"),
      ])
    );

    // 2 Agenda — talk track rows, tiny diamonds as numbers
    const agenda: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 900, 70, 42, "title", "ink", display)),
      asChrome(diamond("wm", 1100, -40, 620, 700, "surface_color", { z: 1, opacity: 0.35 })),
      asChrome(diamond("wm2", 1280, 280, 400, 500, "accent", { z: 1, opacity: 0.22 })),
    ];
    [0, 1, 2].forEach((i) => {
      agenda.push(...talkRow(i, 80, 140 + i * 230, 980, 200, i === 2 ? "accent" : "surface_color", "bg", "muted"));
    });
    kits.push(writeKit("feature", "facet-agenda", f, agenda));

    // 3 Three planes — photo strip + three prose cards
    const planes: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 36, 900, 70, 42, "title", "ink", display)),
      asChrome(diamond("pbg", 1040, 80, 640, 760, "surface_color", { z: 1, opacity: 0.35 })),
    ];
    [0, 1, 2].forEach((i) => {
      const y = 130 + i * 240;
      const id = "note" + i;
      planes.push(asChrome(diamond("pm" + i, 70, y + 20, 100, 100, i === 0 ? "accent" : "muted", { z: 2, opacity: 0.7 })));
      planes.push(asBeat(rect(id, 160, y, 860, 210, "surface", { z: 3 }), { morphId: "note-" + i }));
      planes.push(
        asLabel(text("copy" + i * 2, 200, y + 30, 780, 44, 26, "copy" + i * 2, "bg", { fontWeight: 700, z: 4 }), id)
      );
      planes.push(
        asLabel(text("copy" + (i * 2 + 1), 200, y + 90, 780, 90, 20, "copy" + (i * 2 + 1), "muted", { lineHeight: 1.3, z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "facet-planes", f, planes));

    // 4 Photo hero — proof
    kits.push(
      writeKit("feature", "facet-blaze", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 900, 900, "bg", { z: 2, opacity: 0.72 })),
        asChrome(diamond("h0", -80, 200, 360, 480, "accent", { z: 3, opacity: 0.3 })),
        asChrome(diamond("h1", 200, 520, 280, 360, "surface_color", { z: 3, opacity: 0.4 })),
        asTitle(text("title", 80, 120, 720, 80, 42, "title", "ink", display)),
        asBeat(rect("note", 80, 280, 700, 360, "surface", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 120, 320, 620, 48, 20, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asLabel(text("copy1", 120, 400, 620, 200, 24, "copy1", "bg", { fontWeight: 700, lineHeight: 1.35, z: 5 }), "note"),
      ])
    );

    // 5 Process sequence
    const seq: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 36, 900, 70, 42, "title", "ink", display)),
      bar("rail", 80, 480, 1440, 8, "surface_color", 1),
    ];
    [0, 1, 2].forEach((i) => {
      const x = 80 + i * 500;
      const id = "note" + i;
      seq.push(asChrome(diamond("sd" + i, x + 160, 400, 120, 120, i === 2 ? "accent" : "muted", { z: 2 })));
      seq.push(asDot(circle("dot" + i, x + 200, 440, 28, i === 2 ? "accent" : "surface"), 0, i));
      seq.push(asBeat(rect(id, x, 160, 460, 280, "surface", { z: 3 }), { morphId: "note-" + i }));
      seq.push(asLabel(text("copy" + i * 2, x + 30, 190, 400, 48, 24, "copy" + i * 2, "bg", { fontWeight: 700, z: 4 }), id));
      seq.push(
        asLabel(text("copy" + (i * 2 + 1), x + 30, 260, 400, 140, 18, "copy" + (i * 2 + 1), "muted", { lineHeight: 1.3, z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "facet-sequence", f, seq));

    // 6 Glass check — photo + copy
    kits.push(
      writeKit("feature", "facet-window", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 720, 0, 880, 900, { z: 1 }),
        asChrome(diamond("ov", 560, 120, 420, 560, "accent", { z: 2, opacity: 0.28 })),
        asTitle(text("title", 70, 80, 620, 80, 42, "title", "ink", display)),
        asBeat(rect("note", 70, 220, 620, 480, "surface", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 110, 280, 540, 48, 20, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asLabel(text("copy1", 110, 360, 540, 240, 26, "copy1", "bg", { fontWeight: 700, lineHeight: 1.35, z: 5 }), "note"),
      ])
    );

    // 7 Quote
    kits.push(
      writeKit("quote", "facet-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(diamond("q0", 100, -60, 1400, 1020, "surface_color", { z: 1, opacity: 0.35 })),
        asChrome(diamond("q1", 980, 80, 560, 640, "accent", { z: 1, opacity: 0.22 })),
        asBeat(rect("note", 220, 240, 1160, 420, "surface", { z: 3 }), { morphId: "note-quote" }),
        asTitle(text("title", 300, 290, 1000, 48, 18, "title", "accent", { ...kicker, align: "center", z: 4 })),
        asLabel(text("copy0", 300, 360, 1000, 160, 32, "copy0", "bg", { align: "center", fontWeight: 700, lineHeight: 1.3, z: 4 }), "note"),
        asLabel(text("copy1", 400, 560, 800, 48, 18, "copy1", "muted", { align: "center", z: 4 }), "note"),
      ])
    );

    // 8 Close
    kits.push(
      writeKit("closing", "facet-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(diamond("e0", 900, -40, 820, 980, "surface_color", { z: 1, opacity: 0.4 })),
        asChrome(diamond("e1", 1080, 160, 560, 640, "accent", { z: 2, opacity: 0.3 })),
        asBeat(diamond("note", 1180, 300, 320, 360, "surface", { z: 3 }), { morphId: "note-0" }),
        asTitle(text("title", 80, 280, 900, 200, 56, "title", "ink", { ...display, lineHeight: 1.15, z: 4 })),
        asChrome(text("copy0", 80, 520, 800, 48, 18, "copy0", "muted", { z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

// ─────────────────────────────────────────────────────────────
// HIVE CIRCUIT — team / ops presentation
// ─────────────────────────────────────────────────────────────
const hive: Template = {
  id: "hive-circuit",
  name: "Hive Circuit • Cell kit",
  description: "Presentation deck — how a colony ships work; hexagons are atmosphere.",
  family: "hive-circuit",
  brand: {
    colors: {
      bg: "#FFF8E8",
      surface: "#FFFFFF",
      surface_color: "#F0D9A0",
      ink: "#1A1408",
      muted: "#8A7348",
      accent: "#E4572E",
      line: "#C4A86A",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "A colony that still feels human",
      items: ["HIVE CIRCUIT · OPS BRIEF", "Roles, routes, and the cells that carry the week"],
      photoQuery: "glyph-hive-cover",
    },
    {
      role: "feature",
      title: "How the hive moves",
      items: [
        "01 Pack",
        "Same cell shape so handoffs never reinvent the box.",
        "02 Route",
        "Work travels the warmest path, not the longest memo.",
        "03 Brood",
        "New work starts next to veterans, not in a side channel.",
      ],
    },
    {
      role: "feature",
      title: "Cells on the floor",
      items: [
        "Nurse",
        "Owns intake. Turns noise into a ticket the floor can run.",
        "Guard",
        "Protects focus. Blocks scope that would crack the comb.",
        "Forager",
        "Brings proof back. Closes the loop in the same cell.",
      ],
    },
    {
      role: "feature",
      title: "Queen cell",
      items: [
        "Queen",
        "Sets the week’s direction — one sentence, no slide deck.",
        "Workers",
        "Forty people, one cadence. Standups stay under eight minutes.",
        "Drones",
        "Specialists that plug in, then leave the comb intact.",
        "Stores",
        "Shared docs and templates. No private honey pots.",
      ],
    },
    {
      role: "feature",
      title: "The shell holds",
      items: ["SHELL", "Six clear walls beat four soft ones when pressure hits."],
      photoQuery: "glyph-hive-cell",
    },
    {
      role: "feature",
      title: "Follow the warmth",
      items: ["FIELD", "If a cell goes cold, move the work before you add process."],
      photoQuery: "glyph-hive-field",
    },
    {
      role: "quote",
      title: "WAX",
      items: ["A hive is a city that still fits in a hand.", "— Ops notebook"],
    },
    {
      role: "closing",
      title: "Pack tight. Leave room to breathe.",
      items: ["Hive Circuit · ops brief"],
    },
  ],
  kits: () => {
    const f = "hive-circuit";
    const kits: ReturnType<typeof writeKit>[] = [];

    // hex talk row helper
    const hexTalk = (i: number, x: number, y: number, w: number, h: number, accentFill: boolean): El[] => {
      const id = "note" + i;
      return [
        asChrome(hexagon("hx" + i, x - 30, y + 10, 110, 100, accentFill ? "accent" : "surface_color", { z: 2, opacity: 0.85 })),
        asBeat(rect(id, x + 70, y, w - 70, h, "surface", { z: 3 }), { morphId: "note-" + i }),
        asLabel(text("copy" + i * 2, x + 100, y + 24, w - 140, 44, 24, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id),
        asLabel(
          text("copy" + (i * 2 + 1), x + 100, y + 72, w - 140, h - 96, 18, "copy" + (i * 2 + 1), "muted", {
            lineHeight: 1.3,
            z: 4,
          }),
          id
        ),
      ];
    };

    // 1 Cover
    kits.push(
      writeKit("cover", "hive-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.45 })),
        asChrome(hexagon("h0", -60, -40, 360, 340, "accent", { z: 3, opacity: 0.35 })),
        asChrome(hexagon("h1", 200, 480, 320, 300, "surface_color", { z: 3, opacity: 0.4 })),
        asChrome(hexagon("h2", 1300, 40, 360, 340, "accent", { z: 3, opacity: 0.28 })),
        asBeat(rect("note", 80, 220, 860, 420, "surface", { z: 5 }), { morphId: "note-0" }),
        asLabel(text("copy0", 120, 260, 780, 40, 16, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 120, 320, 780, 180, 48, "title", "ink", { ...display, lineHeight: 1.12, z: 6 })),
        asLabel(text("copy1", 120, 520, 780, 70, 20, "copy1", "muted", { lineHeight: 1.3, z: 6 }), "note"),
      ])
    );

    // 2 How hive moves
    const move: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 36, 1000, 70, 42, "title", "ink", display)),
      asChrome(hexagon("wm", 1120, 40, 560, 520, "surface_color", { z: 1, opacity: 0.45 })),
      asChrome(hexagon("wm2", 1240, 400, 400, 400, "accent", { z: 1, opacity: 0.25 })),
    ];
    [0, 1, 2].forEach((i) => move.push(...hexTalk(i, 80, 130 + i * 240, 1000, 210, i === 0)));
    kits.push(writeKit("feature", "hive-move", f, move));

    // 3 Cells — three prose cards
    const cells: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 36, 1000, 70, 42, "title", "ink", display)),
    ];
    [0, 1, 2].forEach((i) => {
      const x = 70 + i * 510;
      const id = "note" + i;
      cells.push(asChrome(hexagon("cb" + i, x + 140, 120, 200, 180, i === 1 ? "accent" : "surface_color", { z: 1, opacity: 0.55 })));
      cells.push(asBeat(rect(id, x, 280, 480, 480, "surface", { z: 3 }), { morphId: "note-" + i }));
      if (i === 0) cells.push(icon("ic0", "person", x + 200, 320, 48, 5));
      if (i === 1) cells.push(icon("ic1", "shield", x + 200, 320, 48, 5));
      if (i === 2) cells.push(icon("ic2", "walking", x + 200, 320, 48, 5));
      cells.push(asLabel(text("copy" + i * 2, x + 30, 400, 420, 48, 26, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      cells.push(
        asLabel(text("copy" + (i * 2 + 1), x + 30, 470, 420, 220, 18, "copy" + (i * 2 + 1), "muted", { lineHeight: 1.35, z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "hive-cells", f, cells));

    // 4 Colony — primary left prose + three stacked roles (balanced)
    const col: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 60, 42, "title", "ink", display)),
      asChrome(hexagon("cbg", 40, 100, 720, 700, "accent", { z: 1, opacity: 0.2 })),
      asBeat(rect("note0", 80, 140, 680, 640, "surface", { z: 3 }), { morphId: "note-0" }),
      icon("iq", "crown", 360, 200, 56, 5),
      asLabel(text("copy0", 120, 290, 600, 48, 28, "copy0", "ink", { fontWeight: 700, z: 4 }), "note0"),
      asLabel(text("copy1", 120, 370, 600, 320, 20, "copy1", "muted", { lineHeight: 1.35, z: 4 }), "note0"),
    ];
    [1, 2, 3].forEach((i) => {
      const y = 140 + (i - 1) * 220;
      const id = "note" + i;
      col.push(asChrome(hexagon("cs" + i, 820, y + 20, 90, 80, "surface_color", { z: 2, opacity: 0.8 })));
      col.push(asBeat(rect(id, 900, y, 600, 200, "surface", { z: 3 }), { morphId: "note-" + i }));
      col.push(asLabel(text("copy" + i * 2, 940, y + 28, 520, 44, 22, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      col.push(
        asLabel(text("copy" + (i * 2 + 1), 940, y + 80, 520, 90, 17, "copy" + (i * 2 + 1), "muted", { lineHeight: 1.3, z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "hive-colony", f, col));

    // 5 Shell photo
    kits.push(
      writeKit("feature", "hive-dome", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 860, 900, "ink", { z: 2, opacity: 0.55 })),
        asChrome(hexagon("dh", -40, 160, 360, 360, "accent", { z: 3, opacity: 0.3 })),
        asTitle(text("title", 80, 120, 700, 80, 42, "title", "surface", display)),
        asBeat(rect("note", 80, 280, 680, 380, "surface", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 120, 320, 600, 48, 20, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asLabel(text("copy1", 120, 400, 600, 200, 26, "copy1", "ink", { fontWeight: 700, lineHeight: 1.35, z: 5 }), "note"),
      ])
    );

    // 6 Field photo
    kits.push(
      writeKit("feature", "hive-field", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 700, 0, 900, 900, { z: 1 }),
        asChrome(hexagon("fb", 520, 160, 360, 360, "accent", { z: 2, opacity: 0.25 })),
        asTitle(text("title", 70, 80, 600, 80, 42, "title", "ink", display)),
        asBeat(rect("note", 70, 220, 600, 480, "surface", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 110, 280, 520, 48, 20, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asLabel(text("copy1", 110, 360, 520, 240, 26, "copy1", "ink", { fontWeight: 700, lineHeight: 1.35, z: 5 }), "note"),
      ])
    );

    // 7 Quote
    kits.push(
      writeKit("quote", "hive-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(hexagon("q0", 180, -20, 1240, 940, "surface_color", { z: 1, opacity: 0.45 })),
        asBeat(rect("note", 280, 240, 1040, 420, "surface", { z: 3 }), { morphId: "note-quote" }),
        asTitle(text("title", 360, 290, 880, 48, 18, "title", "accent", { ...kicker, align: "center", z: 4 })),
        asLabel(text("copy0", 360, 360, 880, 160, 30, "copy0", "ink", { align: "center", fontWeight: 700, lineHeight: 1.3, z: 4 }), "note"),
        asLabel(text("copy1", 480, 560, 640, 48, 16, "copy1", "muted", { align: "center", z: 4 }), "note"),
      ])
    );

    // 8 Close
    kits.push(
      writeKit("closing", "hive-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(hexagon("e0", 920, -20, 720, 680, "surface_color", { z: 1, opacity: 0.5 })),
        asChrome(hexagon("e1", 1100, 320, 480, 480, "accent", { z: 2, opacity: 0.35 })),
        asBeat(hexagon("note", 1180, 400, 300, 300, "surface", { z: 3 }), { morphId: "note-0" }),
        asTitle(text("title", 80, 280, 900, 200, 48, "title", "ink", { ...display, lineHeight: 1.15, z: 4 })),
        asChrome(text("copy0", 80, 520, 800, 48, 18, "copy0", "muted", { z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

// ─────────────────────────────────────────────────────────────
// BRACKET GATE — keep architectural presentation (already photo-led)
// ─────────────────────────────────────────────────────────────
const gate: Template = {
  id: "bracket-gate",
  name: "Bracket Gate • Lintel kit",
  description: "Corner-bracket presentation — thresholds, courts, and openings.",
  family: "bracket-gate",
  brand: {
    colors: {
      bg: "#F3EEE4",
      surface: "#FFFDF8",
      surface_color: "#D9CFC0",
      ink: "#1C1914",
      muted: "#6E6558",
      accent: "#B84A2E",
      line: "#A89780",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "Every room needs a threshold",
      items: ["BRACKET GATE · SPACE BRIEF", "How openings teach people where to pause"],
      photoQuery: "glyph-bracket-cover",
    },
    {
      role: "feature",
      title: "Three corners we mark",
      items: [
        "Load",
        "The corner that carries the span — never decorate it away.",
        "Span",
        "The clear distance people feel before they cross.",
        "Post",
        "The quiet vertical that keeps the story upright.",
      ],
      photoQuery: "glyph-bracket-cover",
    },
    {
      role: "feature",
      title: "Measure the opening",
      items: [
        "Outer",
        "4.2m — ceremonial approach, slow the pace.",
        "Inner",
        "2.8m — conversation distance, still public.",
        "Clear",
        "2.1m — one person, one decision, no crowd.",
      ],
    },
    {
      role: "feature",
      title: "Courts in sequence",
      items: [
        "Entry",
        "Arrive. Put the phone away.",
        "Pause",
        "Read the wall. Breathe once.",
        "Exit",
        "Leave with one sentence, not ten photos.",
        "Light",
        "Daylight is the only spotlight we trust.",
      ],
      photoQuery: "glyph-bracket-court",
    },
    {
      role: "feature",
      title: "At the lintel",
      items: ["HOLD", "Stop under the beam before you speak. The room is listening."],
      photoQuery: "glyph-bracket-gate",
    },
    {
      role: "feature",
      title: "Along the colonnade",
      items: ["WALK", "Columns keep the sky honest — and your pitch short."],
      photoQuery: "glyph-bracket-court",
    },
    {
      role: "quote",
      title: "STONE",
      items: ["A gate is a sentence with two capitals.", "— Court mason"],
    },
    {
      role: "closing",
      title: "Pass through. Leave it open.",
      items: ["Bracket Gate · space brief"],
    },
  ],
  kits: () => {
    const f = "bracket-gate";
    const kits: ReturnType<typeof writeKit>[] = [];

    kits.push(
      writeKit("cover", "bracket-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.35 })),
        ...bracket("Ftl", 48, 40, 420, 36, "surface", "tl", 3, 18),
        ...bracket("Ftr", 1552, 28, 420, 36, "surface", "tr", 3, -12),
        ...bracket("Fbl", 36, 860, 420, 36, "accent", "bl", 3, 22),
        ...bracket("Fbr", 1564, 848, 420, 36, "accent", "br", 3, -16),
        ...bracket("Stl", 120, 100, 280, 22, "accent", "tl", 4, 28, 0.55),
        asBeat(rect("note", 80, 240, 780, 420, "surface", { z: 5 }), { morphId: "note-0" }),
        ...bracket("nTL", 80, 240, 90, 16, "ink", "tl", 6, 8),
        ...bracket("nBR", 860, 660, 90, 16, "accent", "br", 6, -10),
        asLabel(text("copy0", 120, 280, 700, 40, 16, "copy0", "accent", { ...kicker, z: 7 }), "note"),
        asTitle(text("title", 120, 340, 700, 180, 48, "title", "ink", { ...display, lineHeight: 1.12, z: 7 })),
        asLabel(text("copy1", 120, 550, 700, 70, 18, "copy1", "muted", { z: 7 }), "note"),
      ])
    );

    const corners: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 60, 42, "title", "ink", display)),
      photo("photo", 60, 140, 520, 680, { z: 1 }),
      ...bracket("pTL", 40, 120, 140, 22, "ink", "tl", 3, 14),
      ...bracket("pBR", 600, 840, 140, 22, "accent", "br", 3, -18),
    ];
    [0, 1, 2].forEach((i) => {
      const y = 140 + i * 240;
      const id = "note" + i;
      const x = 640;
      corners.push(...bracket("c" + i + "a", x, y, 100, 18, i === 0 ? "accent" : "ink", "tl", 2, 10 + i * 6));
      corners.push(...bracket("c" + i + "b", x + 860, y + 210, 100, 18, i === 0 ? "accent" : "ink", "br", 2, -8 - i * 4));
      corners.push(asBeat(rect(id, x + 36, y + 24, 800, 170, "surface", { z: 3 }), { morphId: "note-" + i }));
      corners.push(asLabel(text("copy" + i * 2, x + 70, y + 45, 740, 40, 24, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      corners.push(
        asLabel(text("copy" + (i * 2 + 1), x + 70, y + 100, 740, 70, 18, "copy" + (i * 2 + 1), "muted", { z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "bracket-corners", f, corners));

    const spans: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 60, 42, "title", "ink", display)),
      ...bracket("sL", 60, 100, 240, 24, "ink", "tl", 1, 16),
      ...bracket("sR", 1540, 88, 240, 24, "ink", "tr", 1, -20),
      bar("lintel", 60, 100, 1480, 24, "ink", 1, 0.85),
    ];
    [0, 1, 2].forEach((i) => {
      const y = 200 + i * 220;
      const id = "note" + i;
      const shift = (i - 1) * 36;
      spans.push(bar("sp" + i, 180 + shift, y, 1200, 18, i === 1 ? "accent" : "surface_color", 1));
      spans.push(...bracket("sl" + i, 180 + shift, y, 80, 16, i === 1 ? "accent" : "ink", "tl", 2, 8 + i * 5));
      spans.push(...bracket("sr" + i, 1380 + shift, y, 80, 16, i === 1 ? "accent" : "ink", "tr", 2, -10 - i * 4));
      spans.push(asBeat(rect(id, 240 + shift, y + 36, 1080, 150, "surface", { z: 3 }), { morphId: "note-" + i }));
      spans.push(asLabel(text("copy" + i * 2, 300 + shift, y + 55, 400, 44, 24, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      spans.push(
        asLabel(text("copy" + (i * 2 + 1), 720 + shift, y + 55, 540, 90, 18, "copy" + (i * 2 + 1), "muted", { z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "bracket-spans", f, spans));

    const courts: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 60, 42, "title", "ink", display)),
      photo("photo", 80, 120, 700, 700, { z: 1 }),
      ...bracket("ctTL", 60, 100, 160, 24, "ink", "tl", 3, 12),
      ...bracket("ctBR", 800, 840, 160, 24, "accent", "br", 3, -14),
      asBeat(rect("note0", 140, 560, 520, 200, "surface", { z: 4 }), { morphId: "note-0" }),
      asLabel(text("copy0", 180, 590, 440, 40, 22, "copy0", "ink", { fontWeight: 700, z: 5 }), "note0"),
      asLabel(text("copy1", 180, 650, 440, 80, 17, "copy1", "muted", { z: 5 }), "note0"),
    ];
    [1, 2, 3].forEach((i) => {
      const y = 120 + (i - 1) * 240;
      const id = "note" + i;
      const x = 860;
      courts.push(...bracket("k" + i + "a", x, y, 90, 16, i === 1 ? "accent" : "ink", "tl", 2, 6 + i * 8));
      courts.push(...bracket("k" + i + "b", x + 640, y + 220, 90, 16, i === 1 ? "accent" : "ink", "br", 2, -10 - i * 5));
      courts.push(asBeat(rect(id, x + 28, y + 24, 580, 180, "surface", { z: 3 }), { morphId: "note-" + i }));
      courts.push(asLabel(text("copy" + i * 2, x + 60, y + 50, 520, 40, 22, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      courts.push(
        asLabel(text("copy" + (i * 2 + 1), x + 60, y + 100, 520, 70, 17, "copy" + (i * 2 + 1), "muted", { z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "bracket-courts", f, courts));

    kits.push(
      writeKit("feature", "bracket-threshold", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.42 })),
        ...bracket("thTL", 40, 36, 360, 32, "surface", "tl", 3, 20),
        ...bracket("thTR", 1560, 24, 360, 32, "surface", "tr", 3, -16),
        ...bracket("thBL", 28, 864, 360, 32, "accent", "bl", 3, 24),
        ...bracket("thBR", 1572, 852, 360, 32, "accent", "br", 3, -20),
        asBeat(rect("note", 180, 280, 860, 360, "surface", { z: 5 }), { morphId: "note-0" }),
        ...bracket("nA", 180, 280, 100, 16, "ink", "tl", 6, 10),
        ...bracket("nB", 1040, 640, 100, 16, "accent", "br", 6, -12),
        asTitle(text("title", 1100, 100, 420, 80, 42, "title", "surface", display)),
        asLabel(text("copy0", 240, 340, 740, 48, 20, "copy0", "accent", { ...kicker, z: 7 }), "note"),
        asLabel(text("copy1", 240, 420, 740, 160, 26, "copy1", "ink", { fontWeight: 700, lineHeight: 1.3, z: 7 }), "note"),
      ])
    );

    kits.push(
      writeKit("feature", "bracket-colonnade", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 760, 40, 780, 820, { z: 1 }),
        ...bracket("colTL", 740, 20, 140, 22, "accent", "tl", 3, 14),
        ...bracket("colBR", 1560, 880, 140, 22, "accent", "br", 3, -18),
        asTitle(text("title", 60, 50, 640, 80, 42, "title", "ink", display)),
        asBeat(rect("note", 60, 180, 640, 520, "surface", { z: 3 }), { morphId: "note-0" }),
        ...bracket("nTL", 60, 180, 110, 18, "ink", "tl", 4, 12),
        ...bracket("nBR", 700, 700, 110, 18, "accent", "br", 4, -14),
        asLabel(text("copy0", 120, 260, 520, 48, 20, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asLabel(text("copy1", 120, 340, 520, 240, 26, "copy1", "ink", { fontWeight: 700, lineHeight: 1.3, z: 5 }), "note"),
      ])
    );

    kits.push(
      writeKit("quote", "bracket-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...bracket("qTL", 160, 120, 200, 26, "ink", "tl", 1, 22),
        ...bracket("qTR", 1440, 100, 200, 26, "ink", "tr", 1, -18),
        ...bracket("qBL", 140, 780, 200, 26, "accent", "bl", 1, 28),
        ...bracket("qBR", 1460, 760, 200, 26, "accent", "br", 1, -24),
        asBeat(rect("note", 260, 200, 1080, 500, "surface", { z: 2 }), { morphId: "note-quote" }),
        asTitle(text("title", 360, 280, 880, 56, 20, "title", "accent", { ...kicker, align: "center", z: 3 })),
        asLabel(text("copy0", 360, 360, 880, 180, 28, "copy0", "ink", { align: "center", fontWeight: 700, lineHeight: 1.3, z: 3 }), "note"),
        asLabel(text("copy1", 480, 580, 640, 48, 16, "copy1", "muted", { align: "center", z: 3 }), "note"),
      ])
    );

    kits.push(
      writeKit("closing", "bracket-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...bracket("eTL", 700, 60, 260, 32, "ink", "tl", 1, 18),
        ...bracket("eTR", 1500, 48, 260, 32, "ink", "tr", 1, -22),
        ...bracket("eBL", 680, 840, 260, 32, "accent", "bl", 1, 26),
        ...bracket("eBR", 1520, 828, 260, 32, "accent", "br", 1, -18),
        bar("postL", 700, 60, 32, 780, "ink", 1),
        bar("postR", 1468, 48, 32, 780, "ink", 1),
        asBeat(rect("note", 860, 280, 420, 340, "surface", { z: 3 }), { morphId: "note-0" }),
        asTitle(text("title", 60, 300, 600, 180, 48, "title", "ink", { ...display, lineHeight: 1.15, z: 4 })),
        asChrome(text("copy0", 80, 520, 580, 48, 18, "copy0", "muted", { z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

runTemplates([facet, hive, gate]).catch((e) => {
  console.error(e);
  process.exit(1);
});
