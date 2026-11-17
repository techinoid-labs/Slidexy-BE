/**
 * Slidexy Atelier — new premium exclusives (v1).
 * Noir Ledger · Lumen Stage · Porcelain Brief · Signal Atlas
 *
 *   node -r ts-node/register/transpile-only scripts/generate-atelier-pack.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  photo,
  writeKit,
  runTemplates,
  floatingElement,
  depthPlate,
  contactShadow,
  asBeat,
  asChrome,
  asLabel,
  asTitle,
  asStage,
  El,
} from "./lib/designKit";

const display = { fontRole: "display", fontWeight: 700 };
const kicker = { fontRole: "label", letterSpacing: 1.8, fontWeight: 600, lockFont: true };
const BODY = 34;
const LABEL = 26;
const CAP = 22;
const body = { fontRole: "body", lockFont: true, lineHeight: 1.36, fontSize: BODY };

function orb(id: string, x: number, y: number, w: number, h: number, fill: string, opacity: number, blur: number, z = 1): El {
  return asChrome(rect(id, x, y, w, h, fill, { z, opacity, blur, shape: "ellipse", ignoreContrast: true }));
}

function cap(id: string, x: number, y: number, w: number, literal: string): El {
  return asChrome(text(id, x, y, w, 36, CAP, "", "muted", { ...kicker, letterSpacing: 1.2, literal, z: 8 }));
}

function stamp(id: string, cx: number, cy: number, z = 8): El[] {
  const arm = 10;
  const t = 1.5;
  return [
    asChrome(rect(`${id}-h`, cx - arm, cy - t / 2, arm * 2, t, "accent", { z, opacity: 0.85 })),
    asChrome(rect(`${id}-v`, cx - t / 2, cy - arm, t, arm * 2, "accent", { z, opacity: 0.85 })),
  ];
}

function plate(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    z?: number;
    opacity?: number;
    radius?: number;
    morphId?: string;
    fill?: string;
    blur?: number;
    stack?: 0 | 1 | 2;
    shadow?: "soft" | "lift" | "float" | "cast";
    preset?: string;
  } = {}
): El[] {
  return depthPlate(id, x, y, w, h, {
    z: opts.z,
    opacity: opts.opacity != null ? opts.opacity : 1,
    radius: opts.radius != null ? opts.radius : 8,
    morphId: opts.morphId,
    fill: opts.fill || "surface_color",
    // No under-stack by default — keeps the face bright and the edge clean.
    stack: opts.stack != null ? opts.stack : 0,
    shadow: opts.shadow || "lift",
    // No contact ellipses — they read as muddy floor blobs on dark slides.
    contact: false,
    sheen: true,
    strokeColor: "#FFFFFF",
    strokeWidth: 1.25,
    strokeOpacity: 0.16,
    underBlur: opts.blur != null ? opts.blur : 5,
    preset: opts.preset,
  });
}

/** Soft keynote beam — atmosphere only, never a literal stage set. */
function beam(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity = 0.16,
  pulse = false
): El {
  const el = orb(id, x, y, w, h, "accent", opacity, 100, 1);
  if (pulse) el.morphId = "pulse-bg";
  return el;
}

// ─── 1. NOIR LEDGER ───────────────────────────────────────────────────────────
const noir: Template = {
  id: "noir-ledger",
  name: "Noir Ledger • Board kit",
  description: "Atelier premium — carbon paper, ledger rules, stamped numerals for finance and board decks.",
  family: "noir-ledger",
  premium: false,
  brand: {
    depthBackground: true,
    colors: {
      bg: "#1C1A17",
      surface: "#F3EFE6",
      surface_color: "#2A2620",
      ink: "#141210",
      muted: "#6E6558",
      accent: "#C4A35A",
      line: "#4A4338",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    {
      role: "cover",
      title: "Noir Ledger.",
      items: ["ATELIER · FINANCE", "Carbon rules and stamped figures for rooms that decide with ink, not slides.", "Volume 01 · Board series"],
    },
    {
      role: "feature",
      title: "Open the book.",
      items: [
        "THE BRIEF",
        "A board deck should feel like a ledger already in use — ruled, stamped, and weighted. No empty cards pretending to be seriousness.",
        "01 Rule the page",
        "Ledgers hold the argument in columns the eye can audit.",
        "02 Stamp the figure",
        "One number carries the room — quiet proof around it.",
        "03 Close the book",
        "One line of judgment. Then file.",
      ],
    },
    {
      role: "feature",
      title: "Four entries",
      items: [
        "01",
        "Open",
        "State the position before the chart arrives.",
        "02",
        "Line",
        "Rule the page so every claim can be audited.",
        "03",
        "Stamp",
        "One figure. One source. No decoration.",
        "04",
        "File",
        "Close with a decision, not a summary slide.",
      ],
    },
    {
      role: "feature",
      title: "Three inks",
      items: [
        "Carbon",
        "Under-sheet memory",
        "A faint second plate so the page never feels alone.",
        "Gold",
        "Board accent",
        "Reserved for the figure that must hold the room.",
        "Rule",
        "Ledger line",
        "Thin horizontal law across every working page.",
      ],
    },
    {
      role: "quote",
      title: "One figure. One room.",
      items: ["BOARD NOTE", "If every number shouts, none of them decide.", "— Noir Ledger"],
    },
    {
      role: "feature",
      title: "At a glance",
      items: ["12", "Lines", "Ruled working pages", "3", "Inks", "Carbon, gold, rule", "1", "Stamp", "The figure that carries"],
    },
    {
      role: "feature",
      title: "Night audit.",
      items: ["FIELD RECORD 07", "After hours on the floor — the only light left is the desk lamp and the last open ledger.", "East wing · trading floor", "Plate 07 of 12"],
      photoQuery: "noir-ledger-field",
    },
    {
      role: "closing",
      title: "File the ledger.",
      items: ["READY FOR BOARD", "Stamp the figure. Close the book. Keep the carbon with the packet.", "Book the review · Send the brief"],
    },
  ],
  kits: () => {
    const f = "noir-ledger";
    const kits: ReturnType<typeof writeKit>[] = [];
    const rules = (y0: number, n: number, gap = 28): El[] => {
      const out: El[] = [];
      for (let i = 0; i < n; i++) {
        out.push(asChrome(rect(`rule${y0}_${i}`, 80, y0 + i * gap, 1440, 1, "line", { z: 0.5, opacity: 0.35, ignoreContrast: true })));
      }
      return out;
    };

    kits.push(
      writeKit("cover", "noir-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        orb("lamp", 200, -200, 1200, 800, "accent", 0.12, 100, 1),
        ...plate("back", 120, 80, 1360, 740, { z: 1.5, opacity: 0.2, fill: "surface_color", blur: 4 }),
        ...plate("note", 80, 100, 1100, 700, { z: 3, opacity: 0.96, morphId: "note-0" }),
        ...plate("counter", 1120, 420, 400, 360, { z: 2.8, opacity: 0.9 }),
        ...rules(180, 18, 32),
        ...stamp("s1", 120, 140),
        asLabel(text("copy0", 140, 160, 700, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 120, 220, 900, 160, 78, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(rect("gold", 140, 420, 160, 3, "accent", { z: 6 })),
        asLabel(text("copy1", 140, 460, 900, 140, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 140, 660, 700, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        asChrome(text("vol", 1160, 480, 320, 140, 96, "", "ink", { ...display, literal: "01", align: "center", z: 6 })),
        asChrome(text("volL", 1160, 640, 320, 40, CAP, "", "muted", { ...kicker, literal: "BOARD SERIES", align: "center", z: 6 })),
        cap("cap", 100, 840, 400, "ATELIER · NOIR LEDGER"),
      ])
    );

    kits.push(
      writeKit("feature", "noir-brief", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("note", 60, 80, 1480, 740, { z: 3, opacity: 0.96, morphId: "note-0" }),
        ...rules(200, 16, 36),
        asLabel(text("copy0", 120, 120, 600, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 100, 170, 1000, 90, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 120, 280, 1200, 120, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 120, 430, 420, 44, LABEL, "copy2", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy3", 120, 480, 420, 160, BODY, "copy3", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy4", 570, 430, 420, 44, LABEL, "copy4", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy5", 570, 480, 420, 160, BODY, "copy5", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy6", 1020, 430, 420, 44, LABEL, "copy6", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy7", 1020, 480, 420, 160, BODY, "copy7", "muted", { ...body, z: 6 }), "note"),
        cap("cap", 100, 850, 280, "BRIEF · 02"),
      ])
    );

    const entryY = [160, 320, 480, 640];
    const entryEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 28, 600, 34, LABEL, "", "accent", { ...kicker, literal: "METHOD", z: 4 })),
      asTitle(text("title", 60, 70, 1000, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "METHOD · 03"),
    ];
    for (let i = 0; i < 4; i++) {
      const y = entryY[i];
      const host = "note" + i;
      entryEls.push(
        ...plate(host, 80, y, 1440, 140, { z: 3, morphId: "note-" + i }),
        asLabel(text(`n${i}`, 120, y + 40, 100, 48, LABEL, "copy" + i * 3, "accent", { ...kicker, z: 6 }), host),
        asLabel(text(`h${i}`, 240, y + 28, 400, 40, LABEL, "copy" + (i * 3 + 1), "ink", { fontRole: "body", fontWeight: 700, lockFont: true, z: 6 }), host),
        asLabel(text(`b${i}`, 240, y + 72, 1180, 50, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "noir-entries", f, entryEls));

    const inkEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "CRAFT", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 52, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "CRAFT · 04"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      const host = "note" + i;
      inkEls.push(
        ...plate(host, x, 200, 460, 560, { z: 3, morphId: "note-" + i }),
        ...stamp(`t${i}`, x + 40, 240),
        asLabel(text(`th${i}`, x + 40, 280, 380, 48, LABEL, "copy" + i * 3, "ink", { fontRole: "body", fontWeight: 700, lockFont: true, z: 6 }), host),
        asLabel(text(`tl${i}`, x + 40, 340, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, z: 6 }), host),
        asLabel(text(`tb${i}`, x + 40, 400, 380, 200, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "noir-inks", f, inkEls));

    kits.push(
      writeKit("quote", "noir-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("under", 100, 140, 900, 600, { z: 2, opacity: 0.5, fill: "surface_color" }),
        asBeat(rect("note", 140, 400, 20, 20, "accent", { z: 3, opacity: 0 }), { morphId: "note-0" }),
        asLabel(text("copy0", 160, 200, 500, 40, LABEL, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asTitle(text("title", 140, 260, 900, 160, 56, "title", "ink", { ...display, lockFont: true, z: 5 })),
        ...plate("over", 700, 380, 800, 360, { z: 4 }),
        asLabel(text("copy1", 760, 440, 680, 160, BODY, "copy1", "ink", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 760, 640, 500, 40, LABEL, "copy2", "muted", { ...kicker, z: 6 }), "note"),
        cap("cap", 100, 850, 280, "PRINCIPLE · 05"),
      ])
    );

    const pulseEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "OVERVIEW", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "OVERVIEW · 06"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      const host = "note" + i;
      pulseEls.push(
        ...plate(host, x, 200, 460, 560, { z: 3, morphId: "note-" + i }),
        asLabel(text(`pn${i}`, x + 40, 280, 380, 140, 96, "copy" + i * 3, "ink", { ...display, align: "center", z: 6 }), host),
        asLabel(text(`pl${i}`, x + 40, 440, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, align: "center", z: 6 }), host),
        asLabel(text(`pd${i}`, x + 40, 500, 380, 120, BODY, "copy" + (i * 3 + 2), "muted", { ...body, align: "center", z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "noir-pulse", f, pulseEls));

    kits.push(
      writeKit(
        "feature",
        "noir-photo",
        f,
        [
          asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
          photo("photo", 560, 80, 960, 720, { z: 2, mask: "rect" }),
          ...plate("note", 60, 120, 720, 640, { z: 4, morphId: "note-0" }),
          asLabel(text("copy0", 100, 180, 600, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
          asTitle(text("title", 80, 240, 640, 100, 52, "title", "ink", { ...display, lockFont: true, z: 6 })),
          asLabel(text("copy1", 100, 380, 600, 180, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
          asLabel(text("copy2", 100, 580, 600, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
          asLabel(text("copy3", 100, 640, 600, 80, BODY, "copy3", "muted", { ...body, z: 6 }), "note"),
          cap("cap", 80, 850, 280, "FIELD · 07"),
        ],
        {
          foregroundLayer: [
            floatingElement("tape0", 700, 60, 60, {
              kind: "pill",
              width: 140,
              height: 26,
              fill: "accent",
              opacity: 0.9,
              shadow: { offsetY: 6, blur: 10, opacity: 0.25, color: "#000" },
              z: 1100,
            }),
          ],
        }
      )
    );

    kits.push(
      writeKit("closing", "noir-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("note", 120, 100, 1360, 680, { z: 3, morphId: "note-0" }),
        ...rules(320, 8, 40),
        asTitle(text("title", 200, 180, 1000, 100, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy0", 220, 320, 900, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy1", 220, 390, 1100, 100, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 220, 520, 1100, 60, BODY, "copy2", "ink", { ...body, z: 6 }), "note"),
        asChrome(rect("rule", 220, 620, 1040, 1, "ink", { z: 5, opacity: 0.3 })),
        asChrome(text("metaL", 220, 660, 480, 36, LABEL, "", "muted", { ...kicker, literal: "NOIR LEDGER", z: 6 })),
        asChrome(text("metaR", 900, 660, 420, 36, LABEL, "", "muted", { ...kicker, literal: "SHEET 08 / 08", align: "right", z: 6 })),
        cap("cap", 160, 850, 280, "CLOSE · 08"),
      ])
    );

    return kits;
  },
};

// ─── 2. LUMEN STAGE ───────────────────────────────────────────────────────────
const lumen: Template = {
  id: "lumen-stage",
  name: "Lumen Stage • Keynote kit",
  description: "Atelier premium — light beams, hard shadow type, and stage floor for launches and keynotes.",
  family: "lumen-stage",
  premium: true,
  // Fade-led — polish goes into stage depth, not post-fade entrances.
  motion: {
    morph: false,
    ambient: true,
    continuityFade: true,
    entrancesMode: "none",
    blendEntrances: true,
    cameraPan: false,
    scatter: false,
    defaultTransition: "fade",
    durationMs: 600,
  },
  brand: {
    // Spotlight only — skip depth-glow gold wash (diverges badly in PPTX softEdge).
    lighting: "spotlight",
    colors: {
      bg: "#08080C",
      surface: "#FFFFFF",
      // Mid-light slate — strong step from void; body uses near-white muted.
      surface_color: "#5C5C70",
      ink: "#FFFEF8",
      muted: "#E8E4EE",
      accent: "#FFC857",
      line: "#7A7A8C",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    {
      role: "cover",
      title: "Lumen Stage.",
      items: ["ATELIER · KEYNOTE", "Hard light. Hard shadow. Type that holds under a beam.", "Volume 01 · Launch series"],
    },
    {
      role: "feature",
      title: "Hold the beam.",
      items: [
        "THE BRIEF",
        "A keynote is not a dashboard. One beam, one line, one proof — then advance before the room cools.",
        "01 Cue the light",
        "Atmosphere before argument. The beam finds the title.",
        "02 Drop the line",
        "One sentence the room can repeat in the lobby.",
        "03 Cut to black",
        "Leave them with the afterimage, not a wall of bullets.",
      ],
    },
    {
      role: "feature",
      title: "Four cues",
      items: [
        "01",
        "House",
        "Dim the room. Warm the floor. Let silence work.",
        "02",
        "Beam",
        "A single cone of light — never a wash of chrome.",
        "03",
        "Line",
        "Type hard enough to cast a shadow on the stage.",
        "04",
        "Exit",
        "Black. Applause. No appendix slides.",
      ],
    },
    {
      role: "feature",
      title: "Stage craft",
      items: [
        "Beam",
        "Cone of attention",
        "One spotlight. Everything else falls away.",
        "Floor",
        "Ground plane",
        "A dark stage that makes type feel standing, not floating.",
        "Cue",
        "Gold tick",
        "The only accent that fires when the line lands.",
      ],
    },
    {
      role: "quote",
      title: "Leave the afterimage.",
      items: ["STAGE NOTE", "If they remember the slide, the line was too long.", "— Lumen Stage"],
    },
    {
      role: "feature",
      title: "Call sheet",
      items: ["8", "Cues", "Cover to blackout", "3", "Beams", "House, key, cue", "1", "Line", "The sentence that travels"],
    },
    {
      role: "feature",
      title: "Warm-up.",
      items: ["FIELD RECORD 07", "Empty hall an hour before doors — the beam already finds center stage.", "Main hall · FOH", "Cue 07 of 12"],
      photoQuery: "lumen-stage-field",
    },
    {
      role: "closing",
      title: "Go to black.",
      items: ["READY TO OPEN", "Cue the beam. Drop the line. Leave the afterimage.", "Open the house · Run the cue"],
    },
  ],
  kits: () => {
    const f = "lumen-stage";
    const kits: ReturnType<typeof writeKit>[] = [];

    // Clean keynote: void + one beam + lifted plates. No fake floors / light pools.

    kits.push(
      writeKit("cover", "lumen-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        beam("b1", 520, -380, 1100, 980, 0.2, true),
        beam("b2", 980, -40, 480, 560, 0.08),
        asChrome(text("copy0", 120, 180, 800, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asTitle(text("title", 100, 250, 1200, 180, 88, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy1", 120, 470, 1000, 120, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 120, 640, 700, 40, LABEL, "copy2", "accent", { ...kicker, z: 6 })),
        cap("cap", 100, 840, 400, "ATELIER · LUMEN STAGE"),
      ])
    );

    const briefEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      beam("b", 700, -320, 900, 900, 0.12, true),
      ...plate("board", 90, 90, 1180, 700, { z: 3, stack: 1, shadow: "float" }),
      asChrome(text("copy0", 140, 140, 600, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
      asTitle(text("title", 120, 200, 1000, 90, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
      asChrome(text("copy1", 140, 320, 1000, 120, BODY, "copy1", "muted", { ...body, z: 6 })),
      cap("cap", 100, 850, 280, "BRIEF · 02"),
    ];
    [
      { x: 140, h: "copy2", b: "copy3" },
      { x: 520, h: "copy4", b: "copy5" },
      { x: 900, h: "copy6", b: "copy7" },
    ].forEach((col, i) => {
      briefEls.push(
        asChrome(rect(`tick${i}`, col.x, 500, 4, 70, "accent", { z: 5 })),
        asChrome(text(`h${i}`, col.x + 20, 492, 320, 40, LABEL, col.h, "accent", { ...kicker, z: 6 })),
        asChrome(text(`b${i}`, col.x + 20, 540, 320, 140, BODY, col.b, "muted", { ...body, z: 6 }))
      );
    });
    kits.push(writeKit("feature", "lumen-brief", f, briefEls));

    const cueY = [160, 320, 480, 640];
    const cueEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      beam("wash", 0, -240, 760, 780, 0.1),
      asChrome(text("brand", 80, 28, 600, 34, LABEL, "", "accent", { ...kicker, literal: "CUES", z: 4 })),
      asTitle(text("title", 60, 70, 1000, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "METHOD · 03"),
    ];
    for (let i = 0; i < 4; i++) {
      const y = cueY[i];
      cueEls.push(
        ...plate("note" + i, 80, y, 1400, 132, { z: 3, stack: 0, shadow: "lift" }),
        asChrome(rect(`tick${i}`, 104, y + 28, 4, 76, "accent", { z: 5 })),
        asChrome(text(`n${i}`, 128, y + 36, 100, 48, LABEL, "copy" + i * 3, "accent", { ...kicker, z: 6 })),
        asChrome(
          text(`h${i}`, 250, y + 28, 400, 40, LABEL, "copy" + (i * 3 + 1), "ink", {
            fontRole: "body",
            fontWeight: 700,
            lockFont: true,
            z: 6,
          })
        ),
        asChrome(text(`b${i}`, 250, y + 72, 1100, 48, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }))
      );
    }
    kits.push(writeKit("feature", "lumen-cues", f, cueEls));

    const craftEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      beam("craftBeam", 400, -280, 1000, 800, 0.1),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "CRAFT", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 52, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "CRAFT · 04"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      craftEls.push(
        ...plate("note" + i, x, 200, 460, 560, { z: 3, stack: 1, shadow: "lift" }),
        asChrome(
          text(`th${i}`, x + 40, 280, 380, 48, LABEL, "copy" + i * 3, "ink", {
            fontRole: "body",
            fontWeight: 700,
            lockFont: true,
            z: 6,
          })
        ),
        asChrome(text(`tl${i}`, x + 40, 340, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, z: 6 })),
        asChrome(text(`tb${i}`, x + 40, 400, 380, 220, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }))
      );
    }
    kits.push(writeKit("feature", "lumen-craft", f, craftEls));

    kits.push(
      writeKit("quote", "lumen-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        beam("qb", 420, -280, 1000, 980, 0.16, true),
        asChrome(text("copy0", 160, 220, 500, 40, LABEL, "copy0", "accent", { ...kicker, z: 5 })),
        asTitle(text("title", 140, 290, 1100, 160, 56, "title", "ink", { ...display, lockFont: true, z: 5 })),
        asChrome(text("copy1", 160, 510, 1000, 120, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 160, 680, 500, 40, LABEL, "copy2", "accent", { ...kicker, z: 6 })),
        cap("cap", 100, 850, 280, "PRINCIPLE · 05"),
      ])
    );

    const callEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      beam("callBeam", 400, -260, 1000, 800, 0.1),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "CALL SHEET", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "OVERVIEW · 06"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      callEls.push(
        ...plate("note" + i, x, 200, 460, 560, { z: 3, stack: 1, shadow: "lift" }),
        asChrome(
          text(`pn${i}`, x + 40, 280, 380, 140, 96, "copy" + i * 3, "ink", { ...display, align: "center", z: 6 })
        ),
        asChrome(
          text(`pl${i}`, x + 40, 450, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", {
            ...kicker,
            align: "center",
            z: 6,
          })
        ),
        asChrome(
          text(`pd${i}`, x + 40, 510, 380, 120, BODY, "copy" + (i * 3 + 2), "muted", {
            ...body,
            align: "center",
            z: 6,
          })
        )
      );
    }
    kits.push(writeKit("feature", "lumen-call", f, callEls));

    kits.push(
      writeKit("feature", "lumen-photo", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(photo("photo", 0, 0, 1600, 900, { z: 1, mask: "rect" })),
        asChrome(rect("scrim", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.55, ignoreContrast: true })),
        beam("pb", 700, -200, 800, 700, 0.14),
        ...plate("note", 80, 180, 700, 520, { z: 4, stack: 1, shadow: "float" }),
        asChrome(text("copy0", 120, 230, 600, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asTitle(text("title", 100, 290, 620, 100, 52, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy1", 120, 420, 600, 160, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 120, 610, 600, 40, LABEL, "copy2", "accent", { ...kicker, z: 6 })),
        cap("cap", 100, 850, 280, "FIELD · 07"),
      ])
    );

    kits.push(
      writeKit("closing", "lumen-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        beam("cb", 480, -360, 1100, 1100, 0.15, true),
        asTitle(text("title", 180, 240, 1100, 120, 64, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asChrome(text("copy0", 200, 400, 900, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 })),
        asChrome(text("copy1", 200, 470, 1100, 100, BODY, "copy1", "muted", { ...body, z: 6 })),
        asChrome(text("copy2", 200, 600, 1100, 60, BODY, "copy2", "ink", { ...body, z: 6 })),
        asChrome(text("metaL", 200, 800, 480, 36, LABEL, "", "muted", { ...kicker, literal: "LUMEN STAGE", z: 6 })),
        asChrome(
          text("metaR", 900, 800, 420, 36, LABEL, "", "muted", {
            ...kicker,
            literal: "SHEET 08 / 08",
            align: "right",
            z: 6,
          })
        ),
        cap("cap", 160, 860, 280, "CLOSE · 08"),
      ])
    );

    return kits;
  },
};

// ─── 3. PORCELAIN BRIEF ───────────────────────────────────────────────────────
const porcelain: Template = {
  id: "porcelain-brief",
  name: "Porcelain Brief • Luxury kit",
  description: "Draft — ceramic whites; not Atelier until silhouette is unique vs Vellum.",
  family: "porcelain-brief",
  premium: false,
  brand: {
    depthBackground: true,
    colors: {
      bg: "#E8E2D8",
      surface: "#FFFEFB",
      surface_color: "#F0EBE3",
      ink: "#2A2420",
      muted: "#8A8078",
      accent: "#9C6B4A",
      line: "#D4CCC0",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    {
      role: "cover",
      title: "Porcelain Brief.",
      items: ["ATELIER · LUXURY", "Quiet type on ceramic white — the room hears the pause before the claim.", "Volume 01 · Soft series"],
    },
    {
      role: "feature",
      title: "Speak softly.",
      items: [
        "THE BRIEF",
        "Luxury decks fail when they shout. Porcelain keeps the plate empty enough that one sentence can ring.",
        "01 Leave air",
        "Whitespace is the product. Do not fill it with chrome.",
        "02 Emboss the edge",
        "A soft rim holds the plate without a hard card border.",
        "03 One material",
        "Ceramic white, warm ink, a single clay accent.",
      ],
    },
    {
      role: "feature",
      title: "Four finishes",
      items: [
        "01",
        "Bisque",
        "Matte ground that absorbs light instead of fighting it.",
        "02",
        "Glaze",
        "A thin sheen on the plate — never a glass widget.",
        "03",
        "Rim",
        "Emboss that frames without boxing the copy.",
        "04",
        "Mark",
        "One clay accent. Then stop.",
      ],
    },
    {
      role: "feature",
      title: "The kiln",
      items: [
        "Clay",
        "Warm accent",
        "Used once per page — never as a theme wash.",
        "White",
        "Ceramic field",
        "The plate is the stage. Protect its quiet.",
        "Ink",
        "Soft charcoal",
        "Type that sits in the glaze, not on a sticker.",
      ],
    },
    {
      role: "quote",
      title: "Quiet is the luxury.",
      items: ["STUDIO NOTE", "If the plate looks busy, the brand already lost.", "— Porcelain Brief"],
    },
    {
      role: "feature",
      title: "At a glance",
      items: ["8", "Plates", "Cover to close", "3", "Finishes", "Bisque, glaze, rim", "1", "Mark", "Clay, used once"],
    },
    {
      role: "feature",
      title: "Studio light.",
      items: ["FIELD RECORD 07", "Morning on the bench — unfired plates catching the only soft window in the room.", "North bench · atelier", "Plate 07 of 12"],
      photoQuery: "porcelain-brief-field",
    },
    {
      role: "closing",
      title: "Set the plate.",
      items: ["READY TO PRESENT", "One sentence. One rim. Leave the rest of the clay unworked.", "Book a fitting · Request the set"],
    },
  ],
  kits: () => {
    const f = "porcelain-brief";
    const kits: ReturnType<typeof writeKit>[] = [];
    const rim = (id: string, x: number, y: number, w: number, h: number, z = 3.2): El =>
      asChrome(
        rect(id, x, y, w, h, "surface", {
          z,
          opacity: 0,
          radius: 18,
          strokeColor: "#9C6B4A",
          strokeWidth: 1.5,
          strokeOpacity: 0.35,
          ignoreContrast: true,
        })
      );

    kits.push(
      writeKit("cover", "porc-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        orb("soft", 400, -100, 900, 700, "surface", 0.5, 80, 1),
        ...plate("back", 180, 60, 1240, 780, { z: 1.5, opacity: 0.45, fill: "surface_color", blur: 3, radius: 20 }),
        ...plate("note", 140, 100, 1100, 700, { z: 3, radius: 20, morphId: "note-0" }),
        rim("rim0", 155, 115, 1070, 670),
        asLabel(text("copy0", 200, 180, 700, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 180, 240, 950, 180, 78, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 200, 460, 900, 140, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 200, 640, 700, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        ...plate("counter", 1180, 480, 340, 280, { z: 2.8, radius: 18 }),
        asChrome(text("vol", 1200, 520, 300, 120, 72, "", "ink", { ...display, literal: "01", align: "center", z: 6 })),
        asChrome(text("volL", 1200, 660, 300, 40, CAP, "", "muted", { ...kicker, literal: "SOFT SERIES", align: "center", z: 6 })),
        cap("cap", 160, 840, 400, "ATELIER · PORCELAIN"),
      ])
    );

    kits.push(
      writeKit("feature", "porc-brief", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("note", 100, 80, 1400, 740, { z: 3, radius: 20, morphId: "note-0" }),
        rim("rim1", 120, 100, 1360, 700),
        asLabel(text("copy0", 180, 140, 600, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 160, 200, 1000, 90, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 180, 320, 1100, 120, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 180, 480, 380, 40, LABEL, "copy2", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy3", 180, 530, 380, 140, BODY, "copy3", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy4", 600, 480, 380, 40, LABEL, "copy4", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy5", 600, 530, 380, 140, BODY, "copy5", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy6", 1020, 480, 380, 40, LABEL, "copy6", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy7", 1020, 530, 380, 140, BODY, "copy7", "muted", { ...body, z: 6 }), "note"),
        cap("cap", 160, 850, 280, "BRIEF · 02"),
      ])
    );

    const finY = [160, 320, 480, 640];
    const finEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 28, 600, 34, LABEL, "", "accent", { ...kicker, literal: "FINISHES", z: 4 })),
      asTitle(text("title", 60, 70, 1000, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "METHOD · 03"),
    ];
    for (let i = 0; i < 4; i++) {
      const y = finY[i];
      const host = "note" + i;
      finEls.push(
        ...plate(host, 100, y, 1400, 140, { z: 3, radius: 16, morphId: "note-" + i }),
        asLabel(text(`n${i}`, 140, y + 40, 100, 48, LABEL, "copy" + i * 3, "accent", { ...kicker, z: 6 }), host),
        asLabel(text(`h${i}`, 260, y + 28, 400, 40, LABEL, "copy" + (i * 3 + 1), "ink", { fontRole: "body", fontWeight: 700, lockFont: true, z: 6 }), host),
        asLabel(text(`b${i}`, 260, y + 72, 1100, 50, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "porc-finishes", f, finEls));

    const kilnEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "KILN", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 52, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "CRAFT · 04"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      const host = "note" + i;
      kilnEls.push(
        ...plate(host, x, 200, 460, 560, { z: 3, radius: 18, morphId: "note-" + i }),
        rim(`kr${i}`, x + 16, 216, 428, 528),
        asLabel(text(`th${i}`, x + 40, 280, 380, 48, LABEL, "copy" + i * 3, "ink", { fontRole: "body", fontWeight: 700, lockFont: true, z: 6 }), host),
        asLabel(text(`tl${i}`, x + 40, 340, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, z: 6 }), host),
        asLabel(text(`tb${i}`, x + 40, 400, 380, 200, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "porc-kiln", f, kilnEls));

    kits.push(
      writeKit("quote", "porc-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("note", 200, 160, 1200, 560, { z: 3, radius: 24, morphId: "note-0" }),
        rim("qr", 220, 180, 1160, 520),
        asLabel(text("copy0", 280, 240, 500, 40, LABEL, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asTitle(text("title", 260, 300, 1000, 140, 56, "title", "ink", { ...display, lockFont: true, z: 5 })),
        asLabel(text("copy1", 280, 480, 1000, 100, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 280, 620, 500, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        cap("cap", 200, 850, 280, "PRINCIPLE · 05"),
      ])
    );

    const glanceEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "OVERVIEW", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "OVERVIEW · 06"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      const host = "note" + i;
      glanceEls.push(
        ...plate(host, x, 200, 460, 560, { z: 3, radius: 18, morphId: "note-" + i }),
        asLabel(text(`pn${i}`, x + 40, 280, 380, 140, 96, "copy" + i * 3, "ink", { ...display, align: "center", z: 6 }), host),
        asLabel(text(`pl${i}`, x + 40, 440, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, align: "center", z: 6 }), host),
        asLabel(text(`pd${i}`, x + 40, 500, 380, 120, BODY, "copy" + (i * 3 + 2), "muted", { ...body, align: "center", z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "porc-glance", f, glanceEls));

    kits.push(
      writeKit("feature", "porc-photo", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 700, 80, 820, 740, { z: 2, mask: "rect", radius: 16 }),
        ...plate("note", 60, 120, 720, 640, { z: 4, radius: 20, morphId: "note-0" }),
        rim("pr", 80, 140, 680, 600),
        asLabel(text("copy0", 120, 200, 580, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 100, 260, 620, 100, 52, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 120, 400, 580, 180, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 120, 600, 580, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy3", 120, 660, 580, 60, BODY, "copy3", "muted", { ...body, z: 6 }), "note"),
        cap("cap", 80, 850, 280, "FIELD · 07"),
      ])
    );

    kits.push(
      writeKit("closing", "porc-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("note", 160, 120, 1280, 640, { z: 3, radius: 24, morphId: "note-0" }),
        rim("cr", 180, 140, 1240, 600),
        asTitle(text("title", 240, 220, 1000, 100, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy0", 260, 360, 900, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy1", 260, 430, 1000, 100, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 260, 560, 1000, 60, BODY, "copy2", "ink", { ...body, z: 6 }), "note"),
        asChrome(text("metaL", 260, 680, 480, 36, LABEL, "", "muted", { ...kicker, literal: "PORCELAIN BRIEF", z: 6 })),
        asChrome(text("metaR", 900, 680, 400, 36, LABEL, "", "muted", { ...kicker, literal: "SHEET 08 / 08", align: "right", z: 6 })),
        cap("cap", 180, 850, 280, "CLOSE · 08"),
      ])
    );

    return kits;
  },
};

// ─── 4. SIGNAL ATLAS ──────────────────────────────────────────────────────────
const atlas: Template = {
  id: "signal-atlas",
  name: "Signal Atlas • Strategy kit",
  description: "Draft — map plates; not Atelier until silhouette is unique vs shared plate recipes.",
  family: "signal-atlas",
  premium: false,
  brand: {
    depthBackground: true,
    colors: {
      bg: "#D5DCE3",
      surface: "#FAFBFC",
      surface_color: "#C5CED8",
      ink: "#1A2330",
      muted: "#5A6A7A",
      accent: "#C45C26",
      line: "#8A9AAA",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  } as any,
  slides: [
    {
      role: "cover",
      title: "Signal Atlas.",
      items: ["ATELIER · STRATEGY", "Routes, plates, and a legend that tells the room where to look next.", "Volume 01 · Ops series"],
    },
    {
      role: "feature",
      title: "Plot the route.",
      items: [
        "THE BRIEF",
        "Strategy decks fail as dashboards. An atlas gives the room a plate, a path, and a legend — then asks for a decision.",
        "01 Lay the plate",
        "One map field. No widget chrome.",
        "02 Mark the route",
        "Ticks and bearings that the eye can follow once.",
        "03 Read the legend",
        "Three keys max. Then the ask.",
      ],
    },
    {
      role: "feature",
      title: "Four bearings",
      items: [
        "01",
        "Plate",
        "The ground the argument stands on.",
        "02",
        "Route",
        "A path with ticks — not a spaghetti chart.",
        "03",
        "Legend",
        "Three keys. Anything more is noise.",
        "04",
        "Ask",
        "One decision the plate was drawn to earn.",
      ],
    },
    {
      role: "feature",
      title: "Legend set",
      items: [
        "Route",
        "Primary path",
        "The line the room must follow first.",
        "Node",
        "Decision point",
        "Where the path branches or stops.",
        "Field",
        "Context wash",
        "Soft map ground — never a UI grid.",
      ],
    },
    {
      role: "quote",
      title: "One plate. One ask.",
      items: ["FIELD NOTE", "If the legend needs a second page, the strategy is not ready.", "— Signal Atlas"],
    },
    {
      role: "feature",
      title: "Survey",
      items: ["8", "Plates", "Cover to close", "3", "Keys", "Route, node, field", "1", "Ask", "The decision on the map"],
    },
    {
      role: "feature",
      title: "Ridge line.",
      items: ["FIELD RECORD 07", "Survey plate from the western ridge — route ticks still readable after the weather came in.", "West ridge · ops survey", "Plate 07 of 12"],
      photoQuery: "signal-atlas-field",
    },
    {
      role: "closing",
      title: "Fold the map.",
      items: ["READY TO BRIEF", "Mark the route. Read the legend. Ask once.", "Schedule the brief · Send the plate"],
    },
  ],
  kits: () => {
    const f = "signal-atlas";
    const kits: ReturnType<typeof writeKit>[] = [];
    const ticks = (x0: number, y0: number, n: number): El[] => {
      const out: El[] = [];
      for (let i = 0; i < n; i++) {
        out.push(asChrome(rect(`tick${x0}_${i}`, x0 + i * 48, y0, 18, 3, "accent", { z: 2, opacity: 0.7 })));
      }
      return out;
    };
    const legend = (x: number, y: number): El[] => [
      asChrome(rect("lg0", x, y, 18, 18, "accent", { z: 5 })),
      asChrome(text("lgt0", x + 28, y - 2, 160, 24, 14, "", "muted", { ...kicker, literal: "ROUTE", z: 5 })),
      asChrome(rect("lg1", x, y + 36, 18, 18, "ink", { z: 5, opacity: 0.7 })),
      asChrome(text("lgt1", x + 28, y + 34, 160, 24, 14, "", "muted", { ...kicker, literal: "NODE", z: 5 })),
      asChrome(rect("lg2", x, y + 72, 18, 18, "line", { z: 5 })),
      asChrome(text("lgt2", x + 28, y + 70, 160, 24, 14, "", "muted", { ...kicker, literal: "FIELD", z: 5 })),
    ];

    kits.push(
      writeKit("cover", "atlas-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("field", 40, 40, 1520, 820, { z: 1, fill: "surface_color", opacity: 0.55, radius: 2 }),
        ...ticks(200, 120, 20),
        ...ticks(200, 780, 20),
        ...plate("note", 100, 160, 1000, 560, { z: 3, radius: 2, morphId: "note-0" }),
        asLabel(text("copy0", 140, 200, 700, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 120, 260, 900, 160, 78, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 140, 460, 860, 120, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 140, 620, 700, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        ...plate("leg", 1180, 280, 320, 320, { z: 2.8, radius: 2 }),
        ...legend(1220, 340),
        asChrome(text("vol", 1200, 500, 280, 60, LABEL, "", "ink", { ...kicker, literal: "OPS SERIES", align: "center", z: 6 })),
        cap("cap", 120, 840, 400, "ATELIER · SIGNAL ATLAS"),
      ])
    );

    kits.push(
      writeKit("feature", "atlas-brief", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("note", 60, 80, 1480, 740, { z: 3, radius: 2, morphId: "note-0" }),
        ...ticks(120, 240, 24),
        asLabel(text("copy0", 120, 120, 600, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 100, 170, 1000, 90, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 120, 280, 1200, 120, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 120, 440, 400, 40, LABEL, "copy2", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy3", 120, 490, 400, 140, BODY, "copy3", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy4", 560, 440, 400, 40, LABEL, "copy4", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy5", 560, 490, 400, 140, BODY, "copy5", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy6", 1000, 440, 440, 40, LABEL, "copy6", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy7", 1000, 490, 440, 140, BODY, "copy7", "muted", { ...body, z: 6 }), "note"),
        cap("cap", 100, 850, 280, "BRIEF · 02"),
      ])
    );

    const bearY = [160, 320, 480, 640];
    const bearEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 28, 600, 34, LABEL, "", "accent", { ...kicker, literal: "BEARINGS", z: 4 })),
      asTitle(text("title", 60, 70, 1000, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "METHOD · 03"),
    ];
    for (let i = 0; i < 4; i++) {
      const y = bearY[i];
      const host = "note" + i;
      bearEls.push(
        ...plate(host, 80, y, 1440, 140, { z: 3, radius: 2, morphId: "note-" + i }),
        asChrome(rect(`node${i}`, 120, y + 50, 16, 16, "accent", { z: 5 })),
        asLabel(text(`n${i}`, 160, y + 40, 100, 48, LABEL, "copy" + i * 3, "accent", { ...kicker, z: 6 }), host),
        asLabel(text(`h${i}`, 280, y + 28, 400, 40, LABEL, "copy" + (i * 3 + 1), "ink", { fontRole: "body", fontWeight: 700, lockFont: true, z: 6 }), host),
        asLabel(text(`b${i}`, 280, y + 72, 1100, 50, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "atlas-bearings", f, bearEls));

    const legEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "LEGEND", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 52, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "CRAFT · 04"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      const host = "note" + i;
      legEls.push(
        ...plate(host, x, 200, 460, 560, { z: 3, radius: 2, morphId: "note-" + i }),
        asChrome(rect(`lk${i}`, x + 40, 250, 24, 24, i === 0 ? "accent" : i === 1 ? "ink" : "line", { z: 5 })),
        asLabel(text(`th${i}`, x + 40, 300, 380, 48, LABEL, "copy" + i * 3, "ink", { fontRole: "body", fontWeight: 700, lockFont: true, z: 6 }), host),
        asLabel(text(`tl${i}`, x + 40, 360, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, z: 6 }), host),
        asLabel(text(`tb${i}`, x + 40, 420, 380, 200, BODY, "copy" + (i * 3 + 2), "muted", { ...body, z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "atlas-legend", f, legEls));

    kits.push(
      writeKit("quote", "atlas-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("field", 80, 100, 1440, 700, { z: 1.5, fill: "surface_color", opacity: 0.5, radius: 2 }),
        ...ticks(200, 200, 18),
        asBeat(rect("note", 160, 400, 20, 20, "accent", { z: 3, opacity: 0 }), { morphId: "note-0" }),
        asLabel(text("copy0", 180, 240, 500, 40, LABEL, "copy0", "accent", { ...kicker, z: 5 }), "note"),
        asTitle(text("title", 160, 300, 1000, 140, 56, "title", "ink", { ...display, lockFont: true, z: 5 })),
        asLabel(text("copy1", 180, 500, 1100, 100, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 180, 640, 500, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        cap("cap", 100, 850, 280, "PRINCIPLE · 05"),
      ])
    );

    const survEls: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(text("brand", 80, 36, 600, 34, LABEL, "", "accent", { ...kicker, literal: "SURVEY", z: 4 })),
      asTitle(text("title", 70, 78, 900, 70, 48, "title", "ink", { ...display, lockFont: true, z: 5 })),
      cap("cap", 80, 860, 280, "OVERVIEW · 06"),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      const host = "note" + i;
      survEls.push(
        ...plate(host, x, 200, 460, 560, { z: 3, radius: 2, morphId: "note-" + i }),
        asLabel(text(`pn${i}`, x + 40, 280, 380, 140, 96, "copy" + i * 3, "ink", { ...display, align: "center", z: 6 }), host),
        asLabel(text(`pl${i}`, x + 40, 440, 380, 40, LABEL, "copy" + (i * 3 + 1), "accent", { ...kicker, align: "center", z: 6 }), host),
        asLabel(text(`pd${i}`, x + 40, 500, 380, 120, BODY, "copy" + (i * 3 + 2), "muted", { ...body, align: "center", z: 6 }), host)
      );
    }
    kits.push(writeKit("feature", "atlas-survey", f, survEls));

    kits.push(
      writeKit("feature", "atlas-photo", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 620, 60, 920, 780, { z: 2, mask: "rect" }),
        ...plate("note", 40, 100, 680, 680, { z: 4, radius: 2, morphId: "note-0" }),
        ...legend(80, 160),
        asLabel(text("copy0", 80, 300, 560, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 60, 360, 600, 100, 52, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy1", 80, 490, 560, 160, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 80, 680, 560, 40, LABEL, "copy2", "ink", { ...kicker, z: 6 }), "note"),
        cap("cap", 60, 850, 280, "FIELD · 07"),
      ])
    );

    kits.push(
      writeKit("closing", "atlas-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...plate("field", 80, 80, 1440, 740, { z: 1.5, fill: "surface_color", opacity: 0.4, radius: 2 }),
        ...plate("note", 160, 140, 1280, 600, { z: 3, radius: 2, morphId: "note-0" }),
        ...ticks(220, 200, 20),
        asTitle(text("title", 220, 240, 1000, 100, 56, "title", "ink", { ...display, lockFont: true, z: 6 })),
        asLabel(text("copy0", 240, 380, 900, 40, LABEL, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asLabel(text("copy1", 240, 450, 1000, 100, BODY, "copy1", "muted", { ...body, z: 6 }), "note"),
        asLabel(text("copy2", 240, 580, 1000, 60, BODY, "copy2", "ink", { ...body, z: 6 }), "note"),
        asChrome(text("metaL", 240, 660, 480, 36, LABEL, "", "muted", { ...kicker, literal: "SIGNAL ATLAS", z: 6 })),
        asChrome(text("metaR", 900, 660, 400, 36, LABEL, "", "muted", { ...kicker, literal: "SHEET 08 / 08", align: "right", z: 6 })),
        cap("cap", 160, 850, 280, "CLOSE · 08"),
      ])
    );

    return kits;
  },
};

runTemplates([noir, lumen, porcelain, atlas]).catch((e) => {
  console.error(e);
  process.exit(1);
});
