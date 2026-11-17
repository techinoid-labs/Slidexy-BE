/**
 * Carta Folio — new Atelier draft from beige-minimal portfolio craft.
 *
 * Steal: paper ground, wine accent, condensed display, framed photos, chrome ritual.
 * Not a clone: original talk-track + Slidexy atelier identity.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-carta-folio.ts [--publish-local]
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

const display = { fontRole: "display", fontWeight: 700, lockFont: true };
const kicker = { fontRole: "label", letterSpacing: 1.4, fontWeight: 600, lockFont: true };
/** Soft accent words — Georgia reads more editorial than plain Poppins. */
const soft = { fontRole: "body", fontWeight: 500, lockFont: true, fontFace: "Georgia" };
const BODY = 26;
const LABEL = 18;
const body = { fontRole: "body", lockFont: true, lineHeight: 1.42, fontSize: BODY };

const WINE = "#B91646";
const TEAL = "#105652";
const MUSTARD = "#F9C041";
const TAUPE = "#DFD8CA";

function chromeTop(nameLiteral = "carta folio"): El[] {
  return [
    asChrome(rect("topRule", 80, 70, 1440, 1.5, "ink", { z: 5 })),
    asChrome(text("brand", 80, 28, 500, 32, LABEL, "", "ink", { ...kicker, literal: nameLiteral, z: 8 })),
    asChrome(circle("d0", 1420, 36, 12, "ink", { z: 5 })),
    asChrome(circle("d1", 1444, 36, 12, "ink", { z: 5 })),
    asChrome(circle("d2", 1468, 36, 12, "ink", { z: 5 })),
  ];
}

function chromeBottom(pageLiteral: string): El[] {
  return [
    asChrome(rect("botRule", 80, 820, 1440, 1.5, "ink", { z: 5 })),
    asChrome(text("url", 80, 840, 420, 28, 14, "", "muted", { ...kicker, letterSpacing: 0.8, literal: "atelier.slidexy", z: 8 })),
    // Tight tracking + right-align was colliding with the arrow (looked mirrored).
    asChrome(
      text("page", 1100, 840, 300, 28, 14, "", "muted", {
        fontRole: "label",
        fontWeight: 600,
        lockFont: true,
        letterSpacing: 0.6,
        literal: pageLiteral,
        align: "right",
        z: 8,
      })
    ),
    asChrome(rect("arrow", 1420, 848, 36, 2, "ink", { z: 5 })),
  ];
}

/** Thick accent frame + thin ink stroke around a photo slot. */
function photoFrame(id: string, x: number, y: number, w: number, h: number, accent: string, z = 3): El[] {
  // Thick accent mat + thin ink hairline (ref portfolio craft).
  const mat = 28;
  const ink = 3;
  return [
    asChrome(rect(`${id}Fill`, x, y, w, h, accent, { z, ignoreContrast: true })),
    asChrome(rect(`${id}Ink`, x + mat - ink, y + mat - ink, w - (mat - ink) * 2, h - (mat - ink) * 2, "ink", { z: z + 1, ignoreContrast: true })),
    asChrome(photo(id, x + mat, y + mat, w - mat * 2, h - mat * 2, { z: z + 2, mask: "rect" })),
  ];
}

const carta: Template = {
  id: "carta-folio",
  name: "Carta Folio • Beige portfolio kit",
  description: "Warm paper, wine accents, condensed type, framed photography — creative portfolio decks.",
  family: "carta-folio",
  premium: false,
  motion: {
    morph: false,
    ambient: true,
    continuityFade: true,
    entrancesMode: "none",
    defaultTransition: "fade",
    durationMs: 650,
  },
  brand: {
    lighting: "flat",
    colors: {
      bg: "#FBF3E4",
      surface: "#FBF3E4",
      surface_color: TAUPE,
      ink: "#000000",
      muted: "#5A5348",
      accent: WINE,
      line: "#C8C0B2",
    },
    // Arial Black maps cleanly PNG↔PPTX (Antonio/Arial Narrow drifts line counts).
    fonts: { display: "Arial Black", body: "Poppins" },
  } as any,
  slides: [
    {
      role: "cover",
      title: "FOLIO.",
      items: ["carta", "by Atelier", "presentation template"],
    },
    {
      role: "feature",
      title: "presentation",
      items: [
        "welcome",
        "the studio",
        "A quiet system for showing the work — type first, photo framed, one accent that fires.",
      ],
    },
    {
      role: "feature",
      title: "CONTENTS",
      items: [
        "table of",
        "01  About the studio",
        "02  Selected work",
        "03  Vision / mission",
        "04  Craft skills",
        "05  Contact",
        "How the pages turn.",
      ],
    },
    {
      role: "feature",
      title: "ABOUT ME",
      items: [
        "introduce",
        "Studio lead",
        "We design decks that feel printed — paper ground, heavy type, photographs that look chosen.",
        "Atelier",
        "Carta",
      ],
      photoQuery: "carta-folio-portrait",
    },
    {
      role: "feature",
      title: "AT A GLANCE",
      items: ["48", "Decks shipped", "12", "Studios", "6", "Years", "90%", "Kept for finals"],
    },
    {
      role: "feature",
      title: "SKILLS",
      items: [
        "personal",
        "Type systems and photo frames that survive the projector.",
        "Art direction",
        "Lock type before decoration.",
        "Photo edit",
        "Crop for the frame, not the feed.",
      ],
      photoQuery: "carta-folio-still",
    },
    {
      role: "feature",
      title: "FOLIO",
      items: [
        "selected",
        "Three chapters from the latest book.",
        "01  Room study",
        "02  Still life",
        "03  Desk notes",
      ],
    },
    {
      role: "feature",
      title: "PROJECT 01",
      items: [
        "A room that holds still — materials, light, and a single line of type.",
        "Interior study",
        "2026",
        "Selected work",
      ],
      photoQuery: "carta-folio-room",
    },
    {
      role: "closing",
      title: "work together.",
      items: ["let's", "Ready when you are."],
    },
  ],
  kits: () => {
    const f = "carta-folio";
    const kits: ReturnType<typeof writeKit>[] = [];

    // COVER — complete words only: soft "carta" + heavy "FOLIO." + name chip
    kits.push(
      writeKit("cover", "carta-cover", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(text("copy2", 80, 40, 500, 28, LABEL, "copy2", "ink", { ...kicker, z: 6 })),
        asChrome(circle("d0", 1420, 48, 12, "ink", { z: 5 })),
        asChrome(circle("d1", 1444, 48, 12, "ink", { z: 5 })),
        asChrome(circle("d2", 1468, 48, 12, "ink", { z: 5 })),
        asChrome(text("copy0", 400, 280, 800, 60, 40, "copy0", "accent", { ...soft, align: "center", z: 7 })),
        asTitle(text("title", 160, 360, 1280, 160, 110, "title", "ink", { ...display, align: "center", z: 6 })),
        asChrome(
          rect("chip", 620, 560, 360, 56, TAUPE, {
            z: 8,
            strokeColor: "#000000",
            strokeWidth: 1.5,
            strokeOpacity: 1,
          })
        ),
        asChrome(text("copy1", 620, 572, 360, 40, LABEL, "copy1", "ink", { ...kicker, align: "center", z: 9 })),
        asChrome(text("url", 80, 840, 500, 28, 14, "", "muted", { ...kicker, literal: "atelier.slidexy", z: 6 })),
        asChrome(rect("arrow", 1480, 848, 40, 2, "ink", { z: 5 })),
      ])
    );

    // WELCOME — readable stack: welcome → the studio → body → presentation
    kits.push(
      writeKit("feature", "carta-welcome", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...chromeTop(),
        asChrome(text("copy0", 200, 180, 600, 60, 40, "copy0", "accent", { ...soft, z: 6 })),
        asChrome(text("copy1", 200, 250, 1100, 100, 56, "copy1", "ink", { ...display, z: 6 })),
        asChrome(text("copy2", 200, 380, 900, 140, BODY, "copy2", "ink", { ...body, z: 5 })),
        asTitle(text("title", 160, 560, 1300, 140, 84, "title", "ink", { ...display, z: 6 })),
        ...chromeBottom("page 02 of 09"),
      ])
    );

    // CONTENTS
    const contents: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...chromeTop(),
      asChrome(text("copy0", 100, 140, 400, 40, 32, "copy0", "accent", { ...soft, z: 6 })),
      asTitle(text("title", 100, 190, 700, 100, 84, "title", "ink", { ...display, z: 6 })),
      asChrome(text("copy6", 100, 360, 500, 160, BODY, "copy6", "muted", { ...body, z: 6 })),
    ];
    const rows = [
      { y: 160, c: WINE, t: "copy1" },
      { y: 260, c: TEAL, t: "copy2" },
      { y: 360, c: MUSTARD, t: "copy3" },
      { y: 460, c: WINE, t: "copy4" },
      { y: 560, c: TEAL, t: "copy5" },
    ];
    rows.forEach((r, i) => {
      contents.push(
        asChrome(rect(`bar${i}`, 780, r.y, 700, 72, r.c, { z: 3, radius: 8, ignoreContrast: true })),
        asChrome(
          text(`rt${i}`, 820, r.y + 18, 620, 40, LABEL, r.t, r.c === MUSTARD ? "ink" : "surface", {
            ...kicker,
            z: 6,
          })
        )
      );
    });
    contents.push(...chromeBottom("page 03 of 09"));
    kits.push(writeKit("feature", "carta-contents", f, contents));

    // ABOUT — framed portrait + type lockup
    kits.push(
      writeKit("feature", "carta-about", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(text("copy1", 80, 40, 400, 28, LABEL, "copy1", "ink", { ...kicker, z: 6 })),
        asChrome(text("pg", 1180, 40, 340, 28, 14, "", "muted", { ...kicker, literal: "page 04 of 09", align: "right", z: 6 })),
        asChrome(text("copy0", 80, 160, 420, 50, 36, "copy0", "accent", { ...soft, z: 5 })),
        asTitle(text("title", 80, 220, 620, 160, 72, "title", "ink", { ...display, z: 6 })),
        asChrome(text("copy2", 80, 420, 520, 220, BODY, "copy2", "ink", { ...body, z: 6 })),
        ...photoFrame("photo", 700, 100, 520, 640, WINE, 3),
        asChrome(text("copy3", 1260, 300, 280, 50, 28, "copy3", "ink", { ...kicker, z: 6 })),
        asChrome(text("copy4", 1260, 360, 280, 50, 28, "copy4", "ink", { ...kicker, z: 6 })),
        asChrome(rect("arrow", 1480, 848, 40, 2, "ink", { z: 5 })),
        asChrome(text("url", 80, 840, 500, 28, 14, "", "muted", { ...kicker, literal: "atelier.slidexy", z: 6 })),
      ])
    );

    // STATS
    const stats: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...chromeTop("atelier carta"),
      asTitle(text("title", 80, 120, 900, 80, 56, "title", "ink", { ...display, z: 6 })),
    ];
    [
      { x: 80, y: 260, n: "copy0", l: "copy1", c: TEAL },
      { x: 820, y: 260, n: "copy2", l: "copy3", c: WINE },
      { x: 80, y: 540, n: "copy4", l: "copy5", c: MUSTARD },
      { x: 820, y: 540, n: "copy6", l: "copy7", c: TEAL },
    ].forEach((c, i) => {
      stats.push(
        asChrome(rect(`sc${i}`, c.x, c.y, 680, 220, TAUPE, { z: 2, radius: 12 })),
        asChrome(rect(`st${i}`, c.x, c.y, 16, 220, c.c, { z: 3, ignoreContrast: true })),
        asChrome(text(`sn${i}`, c.x + 48, c.y + 40, 560, 100, 72, c.n, "ink", { ...display, z: 6 })),
        asChrome(text(`sl${i}`, c.x + 48, c.y + 150, 560, 40, LABEL, c.l, "muted", { ...kicker, z: 6 }))
      );
    });
    stats.push(...chromeBottom("page 05 of 09"));
    kits.push(writeKit("feature", "carta-stats", f, stats));

    // SKILLS — photo + wine panel with real skill blurbs
    kits.push(
      writeKit("feature", "carta-skills", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...chromeTop("atelier carta"),
        asChrome(text("copy0", 80, 120, 400, 40, 32, "copy0", "accent", { ...soft, z: 6 })),
        asTitle(text("title", 80, 170, 500, 100, 84, "title", "ink", { ...display, z: 6 })),
        asChrome(text("copy1", 80, 360, 480, 200, BODY, "copy1", "ink", { ...body, z: 6 })),
        ...photoFrame("photo", 620, 120, 440, 580, TEAL, 3),
        asChrome(
          rect("panel", 1100, 120, 400, 580, WINE, {
            z: 3,
            strokeColor: "#000000",
            strokeWidth: 4,
            strokeOpacity: 1,
            ignoreContrast: true,
          })
        ),
        asChrome(text("copy2", 1140, 220, 320, 40, LABEL, "copy2", "surface", { ...kicker, z: 6 })),
        asChrome(text("copy3", 1140, 280, 320, 120, BODY, "copy3", "surface", { ...body, fontSize: 22, z: 6 })),
        asChrome(rect("div", 1140, 420, 280, 1.5, "surface", { z: 5, opacity: 0.45, ignoreContrast: true })),
        asChrome(text("copy4", 1140, 460, 320, 40, LABEL, "copy4", "surface", { ...kicker, z: 6 })),
        asChrome(text("copy5", 1140, 520, 320, 120, BODY, "copy5", "surface", { ...body, fontSize: 22, z: 6 })),
        ...chromeBottom("page 06 of 09"),
      ])
    );

    // PORTFOLIO INDEX
    kits.push(
      writeKit("feature", "carta-index", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...chromeTop("atelier carta"),
        asChrome(text("copy0", 400, 180, 800, 50, 36, "copy0", "accent", { ...soft, align: "center", z: 7 })),
        asTitle(text("title", 200, 240, 1200, 140, 100, "title", "ink", { ...display, align: "center", z: 6 })),
        asChrome(text("copy1", 360, 420, 880, 80, BODY, "copy1", "ink", { ...body, align: "center", z: 6 })),
        asChrome(rect("p1", 200, 560, 360, 72, WINE, { z: 4, radius: 10, ignoreContrast: true })),
        asChrome(rect("p2", 620, 560, 360, 72, TEAL, { z: 4, radius: 10, ignoreContrast: true })),
        asChrome(rect("p3", 1040, 560, 360, 72, MUSTARD, { z: 4, radius: 10, ignoreContrast: true })),
        asChrome(text("t1", 200, 580, 360, 40, LABEL, "copy2", "surface", { ...kicker, align: "center", z: 6 })),
        asChrome(text("t2", 620, 580, 360, 40, LABEL, "copy3", "surface", { ...kicker, align: "center", z: 6 })),
        asChrome(text("t3", 1040, 580, 360, 40, LABEL, "copy4", "ink", { ...kicker, align: "center", z: 6 })),
        ...chromeBottom("page 07 of 09"),
      ])
    );

    // PROJECT — framed photo + mustard meta panel with role/year
    kits.push(
      writeKit("feature", "carta-project", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(text("brand", 80, 40, 500, 28, LABEL, "", "ink", { ...kicker, literal: "atelier carta", z: 6 })),
        asChrome(text("pg", 1180, 40, 340, 28, 14, "", "muted", { ...kicker, literal: "page 08 of 09", align: "right", z: 6 })),
        asTitle(text("title", 80, 180, 560, 140, 56, "title", "ink", { ...display, z: 6 })),
        asChrome(text("copy0", 80, 360, 520, 220, BODY, "copy0", "ink", { ...body, z: 5 })),
        ...photoFrame("photo", 680, 100, 420, 620, WINE, 3),
        asChrome(
          rect("side", 1140, 180, 360, 480, MUSTARD, {
            z: 3,
            strokeColor: "#000000",
            strokeWidth: 4,
            strokeOpacity: 1,
            ignoreContrast: true,
          })
        ),
        asChrome(text("copy3", 1180, 280, 280, 40, LABEL, "copy3", "ink", { ...kicker, z: 6 })),
        asChrome(text("copy1", 1180, 360, 280, 80, 36, "copy1", "ink", { ...display, z: 6 })),
        asChrome(text("copy2", 1180, 480, 280, 60, LABEL, "copy2", "ink", { ...kicker, z: 6 })),
        asChrome(rect("arrow", 1480, 848, 40, 2, "ink", { z: 5 })),
        asChrome(text("url", 80, 840, 500, 28, 14, "", "muted", { ...kicker, literal: "atelier.slidexy", z: 6 })),
      ])
    );

    // CLOSE — let's → work together. → Ready when you are.
    kits.push(
      writeKit("closing", "carta-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...chromeTop(),
        asChrome(text("copy0", 500, 260, 600, 60, 40, "copy0", "accent", { ...soft, align: "center", z: 7 })),
        asTitle(text("title", 160, 340, 1280, 140, 72, "title", "ink", { ...display, align: "center", z: 6 })),
        asChrome(text("copy1", 400, 520, 800, 60, BODY, "copy1", "muted", { ...body, align: "center", z: 6 })),
        ...chromeBottom("page 09 of 09"),
      ])
    );

    return kits;
  },
};

runTemplates([carta]).catch((e) => {
  console.error(e);
  process.exit(1);
});
