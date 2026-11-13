/**
 * Geography flagships — NEW glyph language (not orbs, grids, belts, or tiles).
 *
 *   peak-chain   — mountain triangles + arch photo windows
 *   delta-flow   — river channel + chevron current + triangular fan
 *
 *   node -r ts-node/register/transpile-only scripts/generate-geography.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  circle,
  triangle,
  chevron,
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

const bar = (id: string, x: number, y: number, w: number, h: number, fill: string, z = 1): El =>
  asChrome(rect(id, x, y, w, h, fill, { z }));

/** Layered mountain peak (nested triangles). */
function peak(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fills: string[],
  z = 1
): El[] {
  const out: El[] = [];
  fills.forEach((fill, i) => {
    const inset = i * (w * 0.12);
    const top = y + i * (h * 0.12);
    out.push(
      asChrome(
        triangle(id + "_" + i, x + inset / 2, top, w - inset, h - i * (h * 0.12), fill, {
          z: z + i,
          opacity: i === 0 ? 1 : 0.92,
        })
      )
    );
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// PEAK CHAIN — alpine triangle skyline
// ─────────────────────────────────────────────────────────────
const peaks: Template = {
  id: "peak-chain",
  name: "Peak Chain • Alpine kit",
  description:
    "Mountain glyph deck — triangle peaks, arch sightings, summit marks. Not orbs, belts, or tiles.",
  family: "peak-chain",
  brand: {
    colors: {
      bg: "#E8EEF2",
      surface: "#F7FAFC",
      surface_color: "#A8B8C4",
      ink: "#0E1A24",
      muted: "#5A6F7D",
      accent: "#2EC4B6",
      line: "#7A909E",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "PEAKS",
      items: ["ALPINE KIT · CHAIN 03", "Rise · sight · summit"],
      photoQuery: "geo-peak-cover",
    },
    {
      role: "feature",
      title: "Skyline",
      items: ["Aiguille", "3120m", "Col", "2480m", "Dome", "4010m"],
    },
    {
      role: "feature",
      title: "Approaches",
      items: ["North face", "Ice", "West ridge", "Rock", "South couloir", "Snow"],
    },
    {
      role: "feature",
      title: "Camps",
      items: ["C1", "2100m", "C2", "2800m", "C3", "3400m", "C4", "3800m"],
    },
    {
      role: "feature",
      title: "Sightings",
      items: ["Dawn", "Alpenglow", "Noon", "Hard light", "Dusk", "Blue hour"],
      photoQuery: "geo-peak-sight",
    },
    {
      role: "feature",
      title: "Summit",
      items: ["TOP", "Stand only as long as the wind allows."],
      photoQuery: "geo-peak-summit",
    },
    {
      role: "quote",
      title: "NOTE",
      items: ["A peak is a sentence the land finishes.", "— Alpine log"],
    },
    {
      role: "closing",
      title: "Summit.",
      items: ["Peak Chain · alpine kit"],
    },
  ],
  kits: () => {
    const f = "peak-chain";
    const kits: ReturnType<typeof writeKit>[] = [];

    // 1 Cover — skyline of peaks + arch photo window + title block
    kits.push(
      writeKit("cover", "peak-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "ink", { z: 0 })),
        photo("photo", 980, 80, 520, 740, { mask: "arch", alignX: 0.4, z: 2 }),
        ...peak("p0", -40, 220, 520, 680, ["muted", "surface_color", "accent"], 1),
        ...peak("p1", 280, 160, 460, 740, ["surface_color", "muted", "ink"], 1),
        ...peak("p2", 560, 260, 400, 640, ["ink", "muted"], 1),
        asBeat(triangle("note", 80, 80, 360, 220, "accent", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 110, 200, 300, 36, 14, "copy0", "ink", { ...kicker, align: "center", z: 5 }), "note"),
        asTitle(text("title", 80, 420, 700, 140, 88, "title", "surface", { ...display, z: 5 })),
        asLabel(text("copy1", 80, 580, 700, 40, 20, "copy1", "accent", { z: 5 }), "note"),
        asDot(circle("s0", 200, 120, 18, "surface"), 0, 0),
        asDot(circle("s1", 420, 90, 18, "accent"), 0, 1),
        asDot(circle("s2", 700, 180, 18, "surface"), 0, 2),
      ])
    );

    // 2 Skyline — three labeled summit peaks
    const sky: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 36, 900, 55, 42, "title", "ink", display)),
      bar("ground", 0, 820, 1600, 80, "ink", 1),
    ];
    [
      [40, 280, 480, 540, 0, ["ink", "muted", "accent"]],
      [520, 200, 520, 620, 1, ["muted", "surface_color", "ink"]],
      [1060, 300, 500, 520, 2, ["ink", "accent"]],
    ].forEach(([x, y, w, h, i, fills]) => {
      sky.push(...peak("sk" + i, Number(x), Number(y), Number(w), Number(h), fills as string[], 1));
      const id = "note" + i;
      // label plate as inverted triangle tip zone — small surface triangle near summit
      const lx = Number(x) + Number(w) * 0.28;
      const ly = Number(y) + 40;
      sky.push(asBeat(triangle(id, lx, ly, Number(w) * 0.44, 160, "surface", { z: 4 }), { morphId: "note-" + i }));
      sky.push(
        asLabel(
          text("copy" + i * 2, lx + 20, ly + 70, Number(w) * 0.44 - 40, 40, 20, "copy" + i * 2, "ink", {
            align: "center",
            z: 5,
            fontWeight: 700,
          }),
          id
        )
      );
      sky.push(
        asLabel(
          text("copy" + (i * 2 + 1), lx + 20, ly + 115, Number(w) * 0.44 - 40, 30, 16, "copy" + (i * 2 + 1), "muted", {
            align: "center",
            z: 5,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "peak-skyline", f, sky));

    // 3 Approaches — three face triangles with route chevrons
    const app: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "ink", display)),
      ...peak("base", 400, 120, 800, 780, ["surface_color", "muted", "ink"], 1),
    ];
    [
      [80, 200, 0],
      [80, 520, 1],
      [1180, 360, 2],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      app.push(asBeat(triangle(id, x, y, 320, 280, i === 0 ? "accent" : "ink", { z: 3 }), { morphId: "note-" + i }));
      app.push(asChrome(chevron("ch" + i, x + 70, y + 150, 180, 50, "surface", { z: 4 })));
      const ink = i === 0 ? "ink" : "surface";
      app.push(
        asLabel(text("copy" + i * 2, x + 40, y + 80, 240, 50, 22, "copy" + i * 2, ink, { align: "center", z: 5, fontWeight: 700 }), id)
      );
      app.push(
        asLabel(text("copy" + (i * 2 + 1), x + 40, y + 210, 240, 40, 16, "copy" + (i * 2 + 1), ink, { align: "center", z: 5 }), id)
      );
    });
    kits.push(writeKit("feature", "peak-approaches", f, app));

    // 4 Camps — ascending triangle ladder
    const camps: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "ink", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "surface", display)),
    ];
    [
      [80, 620, 280, 200, 0],
      [420, 480, 320, 340, 1],
      [800, 320, 360, 500, 2],
      [1200, 160, 340, 660, 3],
    ].forEach(([x, y, w, h, i]) => {
      const id = "note" + i;
      camps.push(
        asBeat(triangle(id, x, y, w, h, i === 3 ? "accent" : i % 2 === 0 ? "muted" : "surface_color", { z: 2 }), {
          morphId: "note-" + i,
        })
      );
      const ink = i === 3 || i % 2 === 0 ? "surface" : "ink";
      camps.push(
        asLabel(
          text("copy" + i * 2, x + w * 0.2, y + h * 0.45, w * 0.6, 40, 22, "copy" + i * 2, ink, {
            align: "center",
            z: 3,
            fontWeight: 700,
          }),
          id
        )
      );
      camps.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + w * 0.2, y + h * 0.62, w * 0.6, 36, 16, "copy" + (i * 2 + 1), ink, {
            align: "center",
            z: 3,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "peak-camps", f, camps));

    // 5 Sightings — arch photo trio with triangle captions
    const sight: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "ink", display)),
      photo("photo", 80, 120, 420, 560, { mask: "arch", alignY: 0.35, z: 1 }),
      asChrome(rect("ph2", 560, 120, 420, 560, "ink", { z: 1 })), // placeholder second arch via dark + triangle
      asChrome(rect("ph3", 1040, 120, 420, 560, "muted", { z: 1 })),
      // faux arch tops
      asChrome(triangle("a2", 560, 40, 420, 120, "bg", { z: 2 })),
      asChrome(triangle("a3", 1040, 40, 420, 120, "bg", { z: 2 })),
      asChrome(triangle("a1", 80, 40, 420, 120, "bg", { z: 2 })),
    ];
    [0, 1, 2].forEach((i) => {
      const x = 120 + i * 480;
      const id = "note" + i;
      sight.push(asBeat(triangle(id, x, 700, 340, 140, i === 1 ? "accent" : "ink", { z: 3 }), { morphId: "note-" + i }));
      const ink = i === 1 ? "ink" : "surface";
      sight.push(
        asLabel(text("copy" + i * 2, x + 30, yLab(i), 280, 36, 18, "copy" + i * 2, ink, { align: "center", z: 4, fontWeight: 700 }), id)
      );
      sight.push(
        asLabel(text("copy" + (i * 2 + 1), x + 30, 780, 280, 30, 14, "copy" + (i * 2 + 1), ink, { align: "center", z: 4 }), id)
      );
    });
    function yLab(_i: number) {
      return 735;
    }
    kits.push(writeKit("feature", "peak-sightings", f, sight));

    // 6 Summit — hero peak + arch photo
    kits.push(
      writeKit("feature", "peak-summit", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.45 })),
        ...peak("su", 60, 80, 700, 820, ["ink", "muted", "accent"], 3),
        asTitle(text("title", 820, 80, 700, 70, 48, "title", "surface", display)),
        asBeat(triangle("note", 900, 280, 520, 400, "surface", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 980, 400, 360, 40, 20, "copy0", "accent", { ...kicker, align: "center", z: 5 }), "note"),
        asLabel(
          text("copy1", 960, 460, 400, 140, 26, "copy1", "ink", {
            align: "center",
            z: 5,
            fontWeight: 700,
            lineHeight: 1.25,
          }),
          "note"
        ),
      ])
    );

    // 7 Quote — single peak
    kits.push(
      writeKit("quote", "peak-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...peak("q", 350, 40, 900, 860, ["surface_color", "muted", "ink"], 1),
        asBeat(triangle("note", 560, 220, 480, 360, "surface", { z: 3 }), { morphId: "note-quote" }),
        asTitle(text("title", 600, 290, 400, 56, 20, "title", "accent", { ...kicker, align: "center", z: 4 })),
        asLabel(
          text("copy0", 600, 360, 400, 140, 26, "copy0", "ink", {
            align: "center",
            z: 4,
            fontWeight: 700,
            lineHeight: 1.25,
          }),
          "note"
        ),
        asLabel(text("copy1", 640, 520, 320, 36, 16, "copy1", "muted", { align: "center", z: 4 }), "note"),
      ])
    );

    // 8 Close
    kits.push(
      writeKit("closing", "peak-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "ink", { z: 0 })),
        ...peak("cl", 500, 40, 600, 560, ["muted", "accent"], 1),
        asBeat(triangle("note", 620, 120, 360, 280, "accent", { z: 3 }), { morphId: "note-0" }),
        asTitle(text("title", 80, 680, 1440, 100, 64, "title", "surface", { ...display, align: "center", z: 4 })),
        asChrome(text("copy0", 80, 800, 1440, 40, 18, "copy0", "accent", { align: "center", z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

// ─────────────────────────────────────────────────────────────
// DELTA FLOW — river + chevron current + triangular mouth
// ─────────────────────────────────────────────────────────────
const delta: Template = {
  id: "delta-flow",
  name: "Delta Flow • River kit",
  description:
    "River-delta deck — meander channel, chevron current, triangular mouth fan. Not orbs, belts, or tiles.",
  family: "delta-flow",
  brand: {
    colors: {
      bg: "#071820",
      surface: "#E8F4F2",
      surface_color: "#134E4A",
      ink: "#E8F4F2",
      muted: "#5F8A86",
      accent: "#F4A261",
      line: "#1F3A3A",
    },
    fonts: { display: "Georgia", body: "Consolas" },
  },
  slides: [
    {
      role: "cover",
      title: "DELTA",
      items: ["RIVER KIT · MOUTH 09", "Flow · fork · fan"],
      photoQuery: "geo-delta-cover",
    },
    {
      role: "feature",
      title: "Current",
      items: ["Head", "2 kn", "Bend", "4 kn", "Reach", "6 kn"],
    },
    {
      role: "feature",
      title: "Banks",
      items: ["Left", "Silt", "Right", "Reed", "Island", "Spoil"],
    },
    {
      role: "feature",
      title: "Forks",
      items: ["Main", "Keep", "East arm", "Shallow", "West arm", "Deep", "Cut", "New"],
    },
    {
      role: "feature",
      title: "Mouth",
      items: ["Fan", "12km", "Lobes", "5", "Tide", "1.8m"],
    },
    {
      role: "feature",
      title: "Passage",
      items: ["HOLD", "Follow the deepest fork to the sea."],
      photoQuery: "geo-delta-pass",
    },
    {
      role: "quote",
      title: "LOG",
      items: ["A river writes its ending in many hands.", "— Delta pilot"],
    },
    {
      role: "closing",
      title: "Fan out.",
      items: ["Delta Flow · river kit"],
    },
  ],
  kits: () => {
    const f = "delta-flow";
    const kits: ReturnType<typeof writeKit>[] = [];

    /** Orthogonal meander segments (river body). */
    const meander = (prefix: string): El[] => [
      bar(prefix + "a", 0, 380, 420, 90, "accent", 1),
      bar(prefix + "b", 360, 380, 90, 260, "accent", 1),
      bar(prefix + "c", 360, 560, 520, 90, "accent", 1),
      bar(prefix + "d", 800, 200, 90, 450, "accent", 1),
      bar(prefix + "e", 800, 200, 500, 90, "accent", 1),
      bar(prefix + "f", 1210, 200, 90, 320, "accent", 1),
      bar(prefix + "g", 1210, 440, 390, 90, "accent", 1),
    ];

    // 1 Cover
    kits.push(
      writeKit("cover", "delta-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.7 })),
        ...meander("m"),
        // mouth fan
        asChrome(triangle("fan0", 1280, 520, 360, 280, "surface_color", { z: 3 })),
        asChrome(triangle("fan1", 1180, 560, 280, 240, "accent", { z: 3, opacity: 0.85 })),
        asChrome(triangle("fan2", 1400, 580, 240, 220, "muted", { z: 3 })),
        asChrome(chevron("c0", 100, 400, 200, 50, "surface", { z: 4 })),
        asChrome(chevron("c1", 420, 580, 200, 50, "surface", { z: 4 })),
        asChrome(chevron("c2", 860, 220, 200, 50, "surface", { z: 4 })),
        asBeat(rect("note", 60, 80, 720, 220, "bg", { z: 5 }), { morphId: "note-0" }),
        asLabel(text("copy0", 90, 110, 600, 36, 16, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(text("title", 90, 150, 640, 120, 88, "title", "accent", { ...display, z: 6 })),
        asLabel(text("copy1", 90, 280, 600, 40, 20, "copy1", "ink", { z: 6 }), "note"),
      ])
    );

    // 2 Current — chevron cascade with speed labels
    const cur: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "ink", display)),
      bar("river", 80, 400, 1440, 100, "surface_color", 1),
    ];
    [0, 1, 2].forEach((i) => {
      const x = 120 + i * 480;
      cur.push(asChrome(chevron("cf" + i, x, 410, 280, 80, "accent", { z: 2 })));
      const id = "note" + i;
      cur.push(asBeat(triangle(id, x + 40, 560, 240, 200, i === 2 ? "accent" : "surface", { z: 3 }), { morphId: "note-" + i }));
      const ink = i === 2 ? "bg" : "bg";
      cur.push(
        asLabel(text("copy" + i * 2, x + 60, 640, 200, 40, 22, "copy" + i * 2, ink, { align: "center", z: 4, fontWeight: 700 }), id)
      );
      cur.push(
        asLabel(text("copy" + (i * 2 + 1), x + 60, 690, 200, 36, 18, "copy" + (i * 2 + 1), ink, { align: "center", z: 4 }), id)
      );
    });
    // more current chevrons as chrome
    for (let i = 0; i < 6; i++) {
      cur.push(asChrome(chevron("cx" + i, 100 + i * 240, 420, 160, 60, "ink", { z: 2, opacity: 0.25 })));
    }
    kits.push(writeKit("feature", "delta-current", f, cur));

    // 3 Banks — river spine with left/right/island triangles
    const banks: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "ink", display)),
      bar("spine", 200, 420, 1200, 70, "accent", 1),
      ...Array.from({ length: 5 }, (_, i) => asChrome(chevron("bs" + i, 260 + i * 220, 430, 160, 50, "surface", { z: 2 }))),
    ];
    [
      [200, 80, 0],
      [200, 560, 1],
      [1000, 200, 2],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      banks.push(asBeat(triangle(id, x, y, 400, 280, i === 0 ? "accent" : "surface_color", { z: 3 }), { morphId: "note-" + i }));
      banks.push(
        asLabel(
          text("copy" + i * 2, x + 70, y + 90, 260, 50, 26, "copy" + i * 2, i === 0 ? "bg" : "ink", {
            align: "center",
            z: 4,
            fontWeight: 700,
          }),
          id
        )
      );
      banks.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 70, y + 160, 260, 40, 16, "copy" + (i * 2 + 1), i === 0 ? "bg" : "muted", {
            align: "center",
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "delta-banks", f, banks));

    // 4 Forks — channel splits into arms
    const forks: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "ink", display)),
      bar("main", 80, 400, 600, 80, "accent", 1),
      bar("up", 620, 200, 80, 280, "accent", 1),
      bar("dn", 620, 400, 80, 280, "accent", 1),
      bar("east", 620, 200, 500, 80, "surface_color", 1),
      bar("west", 620, 600, 500, 80, "muted", 1),
    ];
    [
      [200, 200, 0],
      [1180, 120, 1],
      [1180, 520, 2],
      [200, 560, 3],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      forks.push(
        asBeat(triangle(id, x, y, 280, 220, i === 0 ? "accent" : "surface", { z: 3 }), { morphId: "note-" + i })
      );
      const ink = i === 0 ? "bg" : "bg";
      forks.push(
        asLabel(text("copy" + i * 2, x + 40, y + 70, 200, 45, 22, "copy" + i * 2, ink, { align: "center", z: 4, fontWeight: 700 }), id)
      );
      forks.push(
        asLabel(text("copy" + (i * 2 + 1), x + 40, y + 130, 200, 40, 16, "copy" + (i * 2 + 1), ink, { align: "center", z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "delta-forks", f, forks));

    // 5 Mouth — triangular fan lobes
    const mouth: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 30, 900, 55, 42, "title", "ink", display)),
      bar("in", 0, 400, 400, 90, "accent", 1),
      asChrome(chevron("mi", 120, 415, 200, 60, "surface", { z: 2 })),
    ];
    [
      [420, 80, 520, 420, 0, "accent"],
      [700, 200, 560, 500, 1, "surface_color"],
      [1050, 120, 500, 460, 2, "muted"],
    ].forEach(([x, y, w, h, i, fill]) => {
      const id = "note" + i;
      mouth.push(asBeat(triangle(id, Number(x), Number(y), Number(w), Number(h), String(fill), { z: 2 }), { morphId: "note-" + i }));
      mouth.push(
        asLabel(
          text("copy" + i * 2, Number(x) + Number(w) * 0.25, Number(y) + Number(h) * 0.4, Number(w) * 0.5, 45, 22, "copy" + i * 2, "ink", {
            align: "center",
            z: 3,
            fontWeight: 700,
          }),
          id
        )
      );
      mouth.push(
        asLabel(
          text(
            "copy" + (i * 2 + 1),
            Number(x) + Number(w) * 0.25,
            Number(y) + Number(h) * 0.55,
            Number(w) * 0.5,
            40,
            18,
            "copy" + (i * 2 + 1),
            "ink",
            { align: "center", z: 3 }
          ),
          id
        )
      );
    });
    kits.push(writeKit("feature", "delta-mouth", f, mouth));

    // 6 Passage
    kits.push(
      writeKit("feature", "delta-passage", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.6 })),
        bar("ch", 0, 420, 900, 80, "accent", 3),
        asChrome(chevron("pc0", 80, 435, 180, 50, "surface", { z: 4 })),
        asChrome(chevron("pc1", 320, 435, 180, 50, "surface", { z: 4 })),
        asChrome(chevron("pc2", 560, 435, 180, 50, "surface", { z: 4 })),
        asChrome(triangle("pf", 900, 280, 620, 420, "surface_color", { z: 3 })),
        asTitle(text("title", 80, 60, 700, 70, 48, "title", "accent", display)),
        asBeat(triangle("note", 1020, 340, 400, 300, "surface", { z: 4 }), { morphId: "note-0" }),
        asLabel(text("copy0", 1100, 430, 240, 36, 18, "copy0", "accent", { ...kicker, align: "center", z: 5 }), "note"),
        asLabel(
          text("copy1", 1080, 480, 280, 100, 22, "copy1", "bg", {
            align: "center",
            z: 5,
            fontWeight: 700,
            lineHeight: 1.25,
          }),
          "note"
        ),
      ])
    );

    // 7 Quote
    kits.push(
      writeKit("quote", "delta-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        bar("qch", 0, 430, 500, 60, "accent", 1),
        asChrome(triangle("qf", 480, 160, 900, 620, "surface_color", { z: 1 })),
        asBeat(triangle("note", 700, 280, 520, 380, "surface", { z: 2 }), { morphId: "note-quote" }),
        asTitle(text("title", 760, 350, 400, 56, 20, "title", "accent", { ...kicker, align: "center", z: 3 })),
        asLabel(
          text("copy0", 760, 420, 400, 140, 26, "copy0", "bg", {
            align: "center",
            z: 3,
            fontWeight: 700,
            lineHeight: 1.25,
          }),
          "note"
        ),
        asLabel(text("copy1", 800, 580, 320, 36, 16, "copy1", "muted", { align: "center", z: 3 }), "note"),
      ])
    );

    // 8 Close
    kits.push(
      writeKit("closing", "delta-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        bar("end", 0, 400, 700, 80, "accent", 1),
        asChrome(chevron("ec0", 80, 415, 200, 50, "surface", { z: 2 })),
        asChrome(chevron("ec1", 340, 415, 200, 50, "surface", { z: 2 })),
        asChrome(triangle("ef0", 700, 200, 500, 500, "surface_color", { z: 1 })),
        asChrome(triangle("ef1", 1000, 260, 420, 440, "accent", { z: 2 })),
        asBeat(triangle("note", 1100, 320, 280, 280, "surface", { z: 3 }), { morphId: "note-0" }),
        asTitle(text("title", 80, 560, 900, 120, 64, "title", "accent", { ...display, z: 4 })),
        asChrome(text("copy0", 80, 700, 900, 40, 18, "copy0", "muted", { z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

runTemplates([peaks, delta]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
