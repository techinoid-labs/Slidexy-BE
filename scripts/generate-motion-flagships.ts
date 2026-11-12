/**
 * Motion-grammar flagships — distinct metaphors from idea-wall / spike-rail.
 *
 *   darkroom-strip  — film contact sheet / safelight lab
 *   crate-press     — vinyl sleeves in a record crate
 *
 *   node -r ts-node/register/transpile-only scripts/generate-motion-flagships.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  circle,
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

const display = { textStyleRole: "display", fontRole: "display" };
const kicker = { textStyleRole: "kicker", fontRole: "label" };
const mono = { fontRole: "body", letterSpacing: 1.2 };

// ─────────────────────────────────────────────────────────────
// DARKROOM STRIP — safelight amber on charcoal, film frames
// ─────────────────────────────────────────────────────────────
const darkroom: Template = {
  id: "darkroom-strip",
  name: "Darkroom Strip • Edit kit",
  description:
    "Film lab deck — contact-sheet frames under safelight amber, sprocket dots, and a developing close.",
  family: "darkroom-strip",
  brand: {
    colors: {
      bg: "#0E0E10",
      surface: "#1C1C20",
      surface_color: "#2A2A30",
      ink: "#F2EDE4",
      muted: "#9A948A",
      accent: "#E8A04A",
      line: "#3A3A42",
    },
    fonts: { display: "Impact", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "DARKROOM",
      items: ["EDIT KIT · ROLL 24", "Expose · develop · print"],
      photoQuery: "af9632a845",
    },
    {
      role: "feature",
      title: "Contact sheet",
      items: ["01", "Street", "02", "Window", "03", "Hands", "04", "Rain", "05", "Door", "06", "Night"],
    },
    {
      role: "feature",
      title: "Develop bath",
      items: ["Stop", "0:30", "Fix", "2:00", "Wash", "5:00"],
    },
    {
      role: "feature",
      title: "Crop language",
      items: ["Tight", "Face fills", "Wide", "Context first", "Split", "Two subjects"],
    },
    {
      role: "feature",
      title: "Keepers",
      items: ["12", "Keepers on the sheet", "8 shortlisted", "3 to print"],
      photoQuery: "af9632a845",
    },
    {
      role: "feature",
      title: "Sprocket count",
      items: ["Roll A", "24", "Roll B", "18", "Roll C", "12"],
    },
    {
      role: "quote",
      title: "NOTE",
      items: ["Light is the subject. Everything else is furniture.", "— Lab wall"],
    },
    {
      role: "closing",
      title: "Hang to dry.",
      items: ["Darkroom Strip · edit kit"],
    },
  ],
  kits: () => {
    const f = "darkroom-strip";
    const kits: ReturnType<typeof writeKit>[] = [];

    // 1 Cover — photo + film frame plate
    kits.push(
      writeKit("cover", "darkroom-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("scrim", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.55 })),
        asBeat(rect("note", 180, 160, 1240, 580, "surface", { z: 3 }), { morphId: "note-0" }),
        asChrome(rect("edgeL", 180, 160, 48, 580, "accent", { z: 4 })),
        asLabel(text("copy0", 280, 220, 1000, 40, 22, "copy0", "accent", { ...kicker, z: 4, ...mono }), "note"),
        asTitle(text("title", 280, 300, 1040, 200, 120, "title", "ink", { ...display, z: 4 })),
        asLabel(text("copy1", 280, 560, 1000, 50, 26, "copy1", "muted", { z: 4, ...mono }), "note"),
      ])
    );

    // 2 Contact sheet — 2×3 film cells
    const sheet: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 70, 56, "title", "ink", display)),
    ];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const i = r * 3 + c;
        const x = 80 + c * 500;
        const y = 140 + r * 360;
        const id = "note" + i;
        sheet.push(asBeat(rect(id, x, y, 460, 320, "surface", { z: 2 }), { morphId: "note-" + i }));
        sheet.push(asChrome(rect("bar" + i, x, y, 460, 36, "accent", { z: 3 })));
        sheet.push(
          asLabel(text("copy" + i * 2, x + 24, y + 8, 120, 28, 18, "copy" + i * 2, "bg", { z: 4, ...mono }), id)
        );
        sheet.push(
          asLabel(
            text("copy" + (i * 2 + 1), x + 24, y + 120, 412, 120, 40, "copy" + (i * 2 + 1), "ink", {
              ...display,
              z: 3,
            }),
            id
          )
        );
      }
    }
    kits.push(writeKit("feature", "darkroom-contact", f, sheet));

    // 3 Develop bath — vertical process with amber ticks
    const bath: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(rect("tray", 200, 120, 1200, 700, "surface", { z: 1 })),
      asTitle(text("title", 260, 160, 1080, 70, 56, "title", "ink", display)),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 280 + i * 160;
      const id = "note" + i;
      bath.push(asBeat(rect(id, 280, y, 1040, 120, i === 1 ? "accent" : "surface_color", { z: 2 }), { morphId: "note-" + i }));
      const ink = i === 1 ? "bg" : "ink";
      bath.push(asLabel(text("copy" + i * 2, 320, y + 28, 400, 60, 40, "copy" + i * 2, ink, { ...display, z: 3 }), id));
      bath.push(
        asLabel(text("copy" + (i * 2 + 1), 780, y + 32, 480, 60, 36, "copy" + (i * 2 + 1), ink, { z: 3, ...mono }), id)
      );
    }
    kits.push(writeKit("feature", "darkroom-bath", f, bath));

    // 4 Crop language — three tall strips
    const crop: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 70, 56, "title", "ink", display)),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 100 + i * 500;
      const id = "note" + i;
      crop.push(asBeat(rect(id, x, 150, 460, 680, i === 0 ? "accent" : "surface", { z: 2 }), { morphId: "note-" + i }));
      const ink = i === 0 ? "bg" : "ink";
      const muted = i === 0 ? "bg" : "muted";
      crop.push(asLabel(text("copy" + i * 2, x + 36, 220, 388, 100, 56, "copy" + i * 2, ink, { ...display, z: 3 }), id));
      crop.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 36, 360, 388, 200, 28, "copy" + (i * 2 + 1), muted, {
            z: 3,
            ...mono,
            lineHeight: 1.4,
          }),
          id
        )
      );
    }
    kits.push(writeKit("feature", "darkroom-crop", f, crop));

    // 5 Keepers — photo + amber stamp
    kits.push(
      writeKit("feature", "darkroom-keepers", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 0, 0, 1000, 900),
        asChrome(rect("scrim", 700, 0, 900, 900, "bg", { z: 2, opacity: 0.85 })),
        asTitle(text("title", 780, 80, 740, 80, 56, "title", "ink", display)),
        asBeat(rect("sticker", 780, 220, 320, 280, "accent", { z: 3 }), { morphId: "note-sticker" }),
        asLabel(
          text("copy0", 800, 280, 280, 160, 72, "copy0", "bg", { ...display, align: "center", z: 4 }),
          "sticker"
        ),
        asChrome(text("copy1", 780, 560, 700, 50, 28, "copy1", "muted", { ...mono, z: 3 })),
        asChrome(text("copy2", 780, 640, 700, 50, 28, "copy2", "accent", { ...mono, z: 3 })),
        asChrome(text("copy3", 780, 720, 700, 50, 28, "copy3", "ink", { ...mono, z: 3 })),
      ])
    );

    // 6 Sprocket count — dots cascade
    const sprocket: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 50, 1440, 80, 56, "title", "ink", display)),
    ];
    [14, 10, 6].forEach((n, i) => {
      const y = 220 + i * 180;
      sprocket.push(asChrome(text("copy" + i * 2, 80, y, 320, 50, 28, "copy" + i * 2, "muted", mono)));
      for (let d = 0; d < n; d++) {
        sprocket.push(
          asDot(circle("v" + i + "_" + d, 440 + d * 60, y + 4, 36, i === 0 ? "accent" : "ink"), i, d)
        );
      }
      sprocket.push(
        asChrome(
          text("copy" + (i * 2 + 1), 1400, y - 4, 120, 60, 40, "copy" + (i * 2 + 1), "accent", {
            ...display,
            align: "right",
          })
        )
      );
      sprocket.push(asChrome(rect("rule" + i, 80, y + 90, 1440, 2, "line")));
    });
    kits.push(writeKit("feature", "darkroom-sprocket", f, sprocket));

    // 7 Quote
    kits.push(
      writeKit("quote", "darkroom-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asBeat(rect("note", 160, 200, 1280, 500, "surface", { z: 2 }), { morphId: "note-quote" }),
        asChrome(rect("edge", 160, 200, 40, 500, "accent", { z: 3 })),
        asTitle(text("title", 260, 240, 1080, 56, 18, "title", "accent", { ...kicker, ...mono, z: 3 })),
        asLabel(
          text("copy0", 260, 340, 1080, 200, 36, "copy0", "ink", {
            ...display,
            align: "left",
            lineHeight: 1.3,
            z: 3,
          }),
          "note"
        ),
        asLabel(text("copy1", 260, 580, 1080, 50, 22, "copy1", "muted", { z: 3, ...mono }), "note"),
      ])
    );

    // 8 Close
    kits.push(
      writeKit("closing", "darkroom-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "surface", { z: 0 })),
        asChrome(rect("bar", 0, 0, 1600, 24, "accent", { z: 1 })),
        asTitle(text("title", 80, 340, 1440, 140, 96, "title", "ink", { ...display, align: "center" })),
        asChrome(text("copy0", 80, 520, 1440, 50, 24, "copy0", "muted", { align: "center", ...mono })),
      ])
    );

    return kits;
  },
};

// ─────────────────────────────────────────────────────────────
// CRATE PRESS — vinyl sleeves / record shop
// ─────────────────────────────────────────────────────────────
const cratePress: Template = {
  id: "crate-press",
  name: "Crate Press • A-side kit",
  description:
    "Record-shop deck — kraft sleeves slammed into a wood crate, A/B sides, listening notes, and a sold stamp.",
  family: "crate-press",
  brand: {
    colors: {
      bg: "#2B2118",
      surface: "#E6D3B4",
      surface_color: "#D4B896",
      ink: "#1A120C",
      muted: "#6E5A48",
      accent: "#C45C26",
      line: "#4A3A2C",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "CRATE **PRESS**",
      items: ["A-SIDE KIT · BIN 14", "Pull · play · press"],
      photoQuery: "a721c1cf1b",
    },
    {
      role: "feature",
      title: "In the bin",
      items: ["A1", "Neon Harbor", "Jazz · 1974", "A2", "Night Bus", "Soul · 1979", "A3", "Wire Bloom", "Post · 1982"],
    },
    {
      role: "feature",
      title: "A / B sides",
      items: ["A", "Lead single", "B", "Deep cut", "Extra", "Live take"],
    },
    {
      role: "feature",
      title: "Listening notes",
      items: ["Warm", "Tube amp", "Bright", "Needle new", "Dusty", "Clean first"],
    },
    {
      role: "feature",
      title: "Press run",
      items: ["Black", "500", "Color", "200", "Test", "25"],
    },
    {
      role: "feature",
      title: "Sold wall",
      items: ["Hold for Friday", "No holds after 6", "Cash preferred", "SOLD"],
      photoQuery: "a721c1cf1b",
    },
    {
      role: "quote",
      title: "STAFF",
      items: ["If it jumps the crate, it earns the needle.", "— Saturday opener"],
    },
    {
      role: "closing",
      title: "Flip it.",
      items: ["Crate Press · A-side kit"],
    },
  ],
  kits: () => {
    const f = "crate-press";
    const kits: ReturnType<typeof writeKit>[] = [];

    // 1 Cover — photo + sleeve
    kits.push(
      writeKit("cover", "crate-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("scrim", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.4 })),
        asChrome(rect("shadow", 430, 150, 740, 640, "ink", { z: 3, opacity: 0.35 })),
        asBeat(rect("note", 400, 120, 740, 640, "surface", { z: 4 }), { morphId: "note-0" }),
        asChrome(circle("hole", 730, 160, 50, "bg", { z: 5 })),
        asLabel(text("copy0", 460, 240, 620, 40, 20, "copy0", "muted", { ...kicker, align: "center", z: 5 }), "note"),
        asTitle(
          text("title", 450, 320, 640, 220, 88, "title", "ink", {
            ...display,
            align: "center",
            lineHeight: 1.0,
            z: 5,
          })
        ),
        asLabel(text("copy1", 460, 600, 620, 50, 24, "copy1", "ink", { align: "center", z: 5 }), "note"),
      ])
    );

    // 2 In the bin — three sleeves on crate rail
    const bin: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(rect("crate", 60, 700, 1480, 140, "line", { z: 1 })),
      asTitle(text("title", 80, 50, 1440, 80, 64, "title", "surface", display)),
    ];
    [
      [100, 180],
      [560, 200],
      [1020, 170],
    ].forEach(([x, y], i) => {
      const id = "note" + i;
      bin.push(asChrome(rect("shade" + i, x + 14, y + 16, 420, 500, "ink", { opacity: 0.3, z: 2 })));
      bin.push(asBeat(rect(id, x, y, 420, 500, i === 1 ? "accent" : "surface", { z: 3 }), { morphId: "note-" + i }));
      bin.push(asChrome(circle("h" + i, x + 185, y + 30, 44, i === 1 ? "surface" : "bg", { z: 4 })));
      const ink = i === 1 ? "surface" : "ink";
      const muted = i === 1 ? "surface" : "muted";
      bin.push(asLabel(text("copy" + i * 3, x + 36, y + 100, 348, 60, 36, "copy" + i * 3, ink, { ...display, z: 4 }), id));
      bin.push(asLabel(text("copy" + (i * 3 + 1), x + 36, y + 180, 348, 80, 40, "copy" + (i * 3 + 1), ink, { z: 4 }), id));
      bin.push(
        asLabel(
          text("copy" + (i * 3 + 2), x + 36, y + 280, 348, 120, 24, "copy" + (i * 3 + 2), muted, { z: 4, lineHeight: 1.3 }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "crate-bin", f, bin));

    // 3 A/B sides — split board
    const sides: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 70, 56, "title", "surface", display)),
      asBeat(rect("note0", 80, 150, 700, 680, "surface", { z: 2 }), { morphId: "note-0" }),
      asBeat(rect("note1", 820, 150, 700, 680, "accent", { z: 2 }), { morphId: "note-1" }),
      asLabel(text("copy0", 140, 220, 580, 120, 120, "copy0", "ink", { ...display, z: 3 }), "note0"),
      asLabel(text("copy1", 140, 400, 580, 200, 36, "copy1", "muted", { z: 3, lineHeight: 1.35 }), "note0"),
      asLabel(text("copy2", 880, 220, 580, 120, 120, "copy2", "surface", { ...display, z: 3 }), "note1"),
      asLabel(text("copy3", 880, 400, 580, 200, 36, "copy3", "surface", { z: 3, lineHeight: 1.35 }), "note1"),
      asChrome(text("copy4", 140, 700, 580, 50, 22, "copy4", "muted", { ...kicker, z: 3 })),
      asChrome(text("copy5", 880, 700, 580, 50, 22, "copy5", "surface", { ...kicker, z: 3 })),
    ];
    kits.push(writeKit("feature", "crate-sides", f, sides));

    // 4 Listening notes — horizontal strips
    const listen: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 70, 56, "title", "surface", display)),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 160 + i * 220;
      const id = "note" + i;
      listen.push(asBeat(rect(id, 80, y, 1440, 180, i === 1 ? "accent" : "surface", { z: 2 }), { morphId: "note-" + i }));
      listen.push(asChrome(circle("hole" + i, 120, y + 60, 56, i === 1 ? "surface" : "bg", { z: 3 })));
      const ink = i === 1 ? "surface" : "ink";
      const muted = i === 1 ? "surface" : "muted";
      listen.push(asLabel(text("copy" + i * 2, 220, y + 40, 500, 90, 48, "copy" + i * 2, ink, { ...display, z: 3 }), id));
      listen.push(
        asLabel(text("copy" + (i * 2 + 1), 780, y + 55, 680, 70, 28, "copy" + (i * 2 + 1), muted, { z: 3 }), id)
      );
    }
    kits.push(writeKit("feature", "crate-listen", f, listen));

    // 5 Press run — hero + sides (no dots under hero)
    const press: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 70, 56, "title", "surface", display)),
      asBeat(rect("note0", 80, 150, 880, 680, "accent", { z: 2 }), { morphId: "note-0" }),
      asLabel(text("copy0", 140, 220, 760, 50, 24, "copy0", "surface", { z: 3, ...kicker }), "note0"),
      asLabel(text("copy1", 140, 320, 760, 280, 160, "copy1", "surface", { ...display, z: 3 }), "note0"),
      asLabel(text("copy2", 140, 650, 760, 50, 28, "copy2", "surface", { z: 3 }), "note0"),
      asBeat(rect("note1", 1020, 150, 500, 310, "surface", { z: 2 }), { morphId: "note-1" }),
      asLabel(text("copy3", 1060, 190, 420, 40, 22, "copy3", "muted", { z: 3 }), "note1"),
      asLabel(text("copy4", 1060, 250, 420, 140, 96, "copy4", "ink", { ...display, z: 3 }), "note1"),
      asBeat(rect("note2", 1020, 500, 500, 330, "surface_color", { z: 2 }), { morphId: "note-2" }),
      asLabel(text("copy5", 1060, 560, 420, 160, 72, "copy5", "ink", { ...display, z: 3 }), "note2"),
    ];
    kits.push(writeKit("feature", "crate-press-run", f, press));

    // 6 Sold wall
    kits.push(
      writeKit("feature", "crate-sold", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 0, 0, 920, 900),
        asChrome(rect("panel", 860, 0, 740, 900, "bg", { z: 2, opacity: 0.92 })),
        asTitle(text("title", 920, 80, 600, 80, 56, "title", "surface", display)),
        asBeat(rect("sticker", 920, 220, 280, 240, "accent", { z: 3 }), { morphId: "note-sticker" }),
        asLabel(
          text("copy3", 940, 290, 240, 120, 56, "copy3", "surface", { ...display, align: "center", z: 4 }),
          "sticker"
        ),
        asChrome(text("copy0", 920, 520, 580, 50, 24, "copy0", "muted", { z: 3 })),
        asChrome(text("copy1", 920, 600, 580, 50, 24, "copy1", "muted", { z: 3 })),
        asChrome(text("copy2", 920, 680, 580, 50, 24, "copy2", "accent", { z: 3 })),
      ])
    );

    // 7 Quote
    kits.push(
      writeKit("quote", "crate-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(rect("crate", 200, 720, 1200, 100, "line", { z: 1 })),
        asBeat(rect("note", 280, 180, 1040, 500, "surface", { z: 2 }), { morphId: "note-quote" }),
        asChrome(circle("hole", 760, 220, 48, "bg", { z: 3 })),
        asTitle(text("title", 360, 290, 880, 56, 18, "title", "accent", { ...kicker, align: "center", z: 3 })),
        asLabel(
          text("copy0", 360, 370, 880, 160, 36, "copy0", "ink", {
            ...display,
            align: "center",
            lineHeight: 1.25,
            z: 3,
          }),
          "note"
        ),
        asLabel(text("copy1", 360, 560, 880, 50, 22, "copy1", "muted", { align: "center", z: 3 }), "note"),
      ])
    );

    // 8 Close
    kits.push(
      writeKit("closing", "crate-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "surface", { z: 0 })),
        asChrome(circle("hole", 776, 200, 48, "accent")),
        asTitle(text("title", 80, 340, 1440, 140, 100, "title", "ink", { ...display, align: "center" })),
        asChrome(text("copy0", 80, 520, 1440, 50, 24, "copy0", "muted", { align: "center" })),
      ])
    );

    return kits;
  },
};

runTemplates([darkroom, cratePress]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
