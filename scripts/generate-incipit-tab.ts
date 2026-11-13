/**
 * Incipit Tab — research-monograph design language (NEW).
 *
 * Geometry: encyclopedia thumb-index tabs on the right edge + running head rule.
 * Not diamonds, hexes, chevrons, triangles, L-brackets, orbs, belts, or cards.
 *
 * Presentation-first with dense academic content: title, abstract, contributions,
 * related work, method, setup, results, discussion, limitations, references, close.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-incipit-tab.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  photo,
  writeKit,
  runTemplates,
  El,
  asBeat,
  asChrome,
  asLabel,
  asTitle,
  asStage,
} from "./lib/designKit";

const display = { fontRole: "display", fontWeight: 700 };
const kicker = { fontRole: "label", letterSpacing: 1.8, fontWeight: 600 };

const bar = (id: string, x: number, y: number, w: number, h: number, fill: string, z = 1, opacity?: number): El =>
  asChrome(rect(id, x, y, w, h, fill, { z, ...(opacity != null ? { opacity } : {}) }));

/** Right-edge thumb index tabs. `active` tab is pulled out / accented. */
function tabs(active: number, labels: string[], z = 2): El[] {
  const out: El[] = [];
  const n = labels.length;
  const top = 96;
  const gap = 10;
  const h = Math.floor((740 - gap * (n - 1)) / n);
  labels.forEach((label, i) => {
    const y = top + i * (h + gap);
    const isOn = i === active;
    const w = isOn ? 128 : 96;
    const x = 1600 - w;
    out.push(
      asChrome(
        rect(`tab${i}`, x, y, w, h, isOn ? "accent" : "surface_color", {
          z: isOn ? z + 1 : z,
          opacity: isOn ? 1 : 0.78,
        })
      )
    );
    if (isOn) {
      out.push(asChrome(rect(`tabn${i}`, x - 10, y + h * 0.22, 12, h * 0.56, "accent", { z: z + 2 })));
    }
    out.push(
      asChrome(
        text(`tabl${i}`, x + 8, y + Math.max(8, h * 0.3), w - 14, 28, 12, "", isOn ? "surface" : "ink", {
          fontRole: "label",
          fontWeight: 700,
          letterSpacing: 0.6,
          literal: label,
          align: "center",
          z: z + 3,
        })
      )
    );
  });
  return out;
}

// Short codes so thumb faces stay single-line (encyclopedia index).
const TAB_LABELS = ["Tit", "Abs", "Cx", "Lit", "Meth", "Exp", "Res", "Disc", "Lim", "Bib", "End"];

const paper: Template = {
  id: "incipit-tab",
  name: "Incipit Tab • Research kit",
  description:
    "Research-monograph deck — thumb-index tabs, running heads, dense abstract-to-references talk track.",
  family: "incipit-tab",
  brand: {
    colors: {
      bg: "#E8EEF2",
      surface: "#FBFCFD",
      surface_color: "#C5D0DA",
      ink: "#142033",
      muted: "#5A6B7C",
      accent: "#1F6B5E",
      line: "#8FA0B0",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "Measuring what the model refuses to say",
      items: [
        "WORKING PAPER 2026.04",
        "Abstention, calibration, and reviewer trust in long-form QA",
        "Techinoid Labs · Methods note",
      ],
      photoQuery: "paper-incipit-cover",
    },
    {
      role: "feature",
      title: "Abstract",
      items: [
        "Background",
        "Large models answer fluently even when evidence is thin. Reviewers cannot see the refusal boundary.",
        "Question",
        "Can a visible abstention policy raise trust without cutting answer usefulness below an accepted floor?",
        "Method",
        "We ran a paired review study (n=48) across three domains with a shared rubric for usefulness and trust.",
        "Finding",
        "Forced abstention cut critical errors 31% while usefulness held within 4 points of the baseline.",
      ],
    },
    {
      role: "feature",
      title: "Contributions",
      items: [
        "C1 Protocol",
        "A reusable abstention rubric that separates ‘I don’t know’ from ‘I won’t invent’.",
        "C2 Measure",
        "Trust-delta scoring that tracks reviewer confidence before and after seeing refusals.",
        "C3 Result",
        "Evidence that calibrated silence beats overconfident completion on high-stakes prompts.",
        "C4 Artifact",
        "Public prompts, rubric sheets, and anonymized reviewer notes for replication.",
      ],
    },
    {
      role: "feature",
      title: "Related work",
      items: [
        "Calibration",
        "Prior work scores probability, not the social act of refusing in front of a reader.",
        "Faithfulness",
        "Citation checks catch missing sources; they do not teach when to stop generating.",
        "UX of doubt",
        "Product studies show hedges help, but rarely measure reviewer trust after a hard refuse.",
        "Gap",
        "We treat abstention as a first-class slide in the answer, not a log-line.",
      ],
    },
    {
      role: "feature",
      title: "Method",
      items: [
        "01 Sample",
        "48 reviewers · 3 domains (clinical briefing, legal cite-check, lab methods).",
        "02 Conditions",
        "Baseline fluent answers vs policy-forced abstention on thin evidence.",
        "03 Rubric",
        "Usefulness 1–5 · Trust 1–5 · Critical-error flag · Time-to-decision.",
        "04 Analysis",
        "Paired Wilcoxon on trust/usefulness; McNemar on critical errors.",
      ],
    },
    {
      role: "feature",
      title: "Experiment setup",
      items: [
        "HOLD",
        "Same model weights. Same prompts. Only the abstention policy changes. Reviewers are blind to condition labels.",
      ],
      photoQuery: "paper-incipit-lab",
    },
    {
      role: "feature",
      title: "Results",
      items: [
        "Trust",
        "+0.7 mean trust delta under abstention (p < 0.01).",
        "Errors",
        "Critical errors 31% lower when silence is allowed.",
        "Usefulness",
        "Usefulness −0.2 (ns) — within the pre-registered indifference band.",
        "Time",
        "Median decision time fell 18s when refusals were explicit.",
      ],
      photoQuery: "paper-incipit-figure",
    },
    {
      role: "feature",
      title: "Discussion",
      items: [
        "What held",
        "Reviewers trusted the system more when it showed its stop line.",
        "What flexed",
        "Usefulness dipped only on prompts where partial answers still helped.",
        "Practice",
        "Ship a visible abstain control next to generate — not only a backend threshold.",
        "Theory",
        "Abstention is a communicative act; scoring it as accuracy alone under-measures value.",
      ],
    },
    {
      role: "feature",
      title: "Limitations",
      items: [
        "Sample",
        "Expert reviewers, not end consumers; domain set is narrow.",
        "Policy",
        "One abstention rule family; thresholds were not swept exhaustively.",
        "Blindness",
        "Style cues may still leak condition despite label blinding.",
        "Next",
        "Replicate with live traffic and longitudinal trust, not only one-shot review.",
      ],
    },
    {
      role: "feature",
      title: "References",
      items: [
        "[1] Guo et al.",
        "Calibration of modern neural nets. ICML.",
        "[2] Kadavath et al.",
        "Models mostly know what they know. arXiv.",
        "[3] Rashkin et al.",
        "Attribution in generated text. TACL.",
        "[4] This note",
        "Working paper 2026.04 — prompts in supplement.",
      ],
      photoQuery: "paper-incipit-stacks",
    },
    {
      role: "closing",
      title: "Refuse clearly. Measure the trust you earn.",
      items: ["Incipit Tab · research kit · working paper 2026.04"],
    },
  ],
  kits: () => {
    const f = "incipit-tab";
    const kits: ReturnType<typeof writeKit>[] = [];
    const pageW = 1460; // leave room for tabs

    // running head chrome
    const head = (): El[] => [
      bar("rule", 60, 72, pageW - 80, 2, "line", 1),
      asChrome(
        text("run", 60, 40, 520, 28, 13, "", "muted", {
          ...kicker,
          literal: "INCIPIT TAB · WORKING PAPER",
          z: 2,
        })
      ),
    ];

    // 1 Cover — one folio object on manuscript photo (Idea Wall pattern).
    // Dark ink on light paper only — never dark-on-dark.
    kits.push(
      writeKit("cover", "incipit-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.22 })),
        // Drop shadow under the folio
        asChrome(rect("shadow", 118, 138, 900, 640, "ink", { z: 3, opacity: 0.35 })),
        asBeat(rect("note", 100, 120, 900, 640, "surface", { z: 4 }), { morphId: "note-0" }),
        bar("spine", 100, 120, 16, 640, "accent", 5),
        // Motif pin — active thumb tab on the folio
        asChrome(rect("pin", 1000, 160, 130, 78, "accent", { z: 6 })),
        asChrome(rect("pinn", 988, 174, 14, 50, "accent", { z: 7 })),
        asChrome(
          text("pinl", 1014, 184, 104, 36, 18, "", "surface", {
            ...kicker,
            literal: "TIT",
            align: "center",
            z: 8,
          })
        ),
        ...tabs(0, TAB_LABELS, 3),
        asChrome(
          text("brand", 150, 170, 780, 80, 56, "", "ink", {
            ...display,
            literal: "INCIPIT TAB",
            letterSpacing: 1,
            z: 6,
          })
        ),
        asChrome(
          text("brand2", 150, 260, 700, 36, 15, "", "accent", {
            ...kicker,
            literal: "RESEARCH MONOGRAPH",
            z: 6,
          })
        ),
        bar("rule", 150, 314, 320, 3, "accent", 6),
        asLabel(text("copy0", 150, 345, 760, 36, 15, "copy0", "accent", { ...kicker, z: 6 }), "note"),
        asTitle(
          text("title", 150, 410, 780, 150, 34, "title", "ink", {
            ...display,
            lineHeight: 1.2,
            z: 6,
          })
        ),
        asLabel(
          text("copy1", 150, 590, 780, 80, 20, "copy1", "ink", {
            lineHeight: 1.35,
            z: 6,
          }),
          "note"
        ),
        asLabel(text("copy2", 150, 690, 700, 40, 15, "copy2", "ink", { ...kicker, z: 6 }), "note"),
      ])
    );

    // 2 Abstract — four dense blocks
    const abs: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
      ...tabs(1, TAB_LABELS, 3),
    ];
    [
      [60, 170],
      [740, 170],
      [60, 520],
      [740, 520],
    ].forEach(([x, y], i) => {
      const id = "note" + i;
      abs.push(asBeat(rect(id, x, y, 660, 310, "surface", { z: 3 }), { morphId: "note-" + i }));
      abs.push(bar(`ab${i}`, x, y, 8, 310, i === 0 ? "accent" : "surface_color", 4));
      abs.push(
        asLabel(text("copy" + i * 2, x + 28, y + 24, 600, 40, 18, "copy" + i * 2, "accent", { ...kicker, z: 4 }), id)
      );
      abs.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 28, y + 80, 600, 200, 17, "copy" + (i * 2 + 1), "ink", {
            lineHeight: 1.35,
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "incipit-abstract", f, abs));

    // 3 Contributions — stacked dense rows
    const contrib: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
      ...tabs(2, TAB_LABELS, 3),
      asChrome(rect("side", 60, 170, 4, 680, "accent", { z: 1 })),
    ];
    [0, 1, 2, 3].forEach((i) => {
      const y = 170 + i * 170;
      const id = "note" + i;
      contrib.push(asBeat(rect(id, 90, y, 1340, 150, "surface", { z: 3 }), { morphId: "note-" + i }));
      contrib.push(
        asLabel(text("copy" + i * 2, 120, y + 22, 280, 40, 20, "copy" + i * 2, "accent", { fontWeight: 700, z: 4 }), id)
      );
      contrib.push(
        asLabel(
          text("copy" + (i * 2 + 1), 420, y + 22, 960, 100, 18, "copy" + (i * 2 + 1), "ink", {
            lineHeight: 1.35,
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "incipit-contrib", f, contrib));

    // 4 Related work
    const rel: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
      ...tabs(3, TAB_LABELS, 3),
    ];
    [0, 1, 2, 3].forEach((i) => {
      const y = 170 + i * 170;
      const id = "note" + i;
      rel.push(asChrome(rect(`rm${i}`, 60, y, 70, 150, i === 3 ? "accent" : "surface_color", { z: 2 })));
      rel.push(
        asChrome(
          text(`rn${i}`, 70, y + 55, 50, 40, 18, "", i === 3 ? "surface" : "ink", {
            literal: String(i + 1).padStart(2, "0"),
            fontWeight: 700,
            align: "center",
            z: 3,
          })
        )
      );
      rel.push(asBeat(rect(id, 150, y, 1280, 150, "surface", { z: 3 }), { morphId: "note-" + i }));
      rel.push(asLabel(text("copy" + i * 2, 180, y + 22, 1220, 36, 20, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      rel.push(
        asLabel(text("copy" + (i * 2 + 1), 180, y + 70, 1220, 60, 17, "copy" + (i * 2 + 1), "muted", { z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "incipit-related", f, rel));

    // 5 Method — 2x2 dense
    const method: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
      ...tabs(4, TAB_LABELS, 3),
    ];
    [
      [60, 170],
      [740, 170],
      [60, 520],
      [740, 520],
    ].forEach(([x, y], i) => {
      const id = "note" + i;
      method.push(asBeat(rect(id, x, y, 660, 310, "surface", { z: 3 }), { morphId: "note-" + i }));
      method.push(bar(`mb${i}`, x, y, 660, 8, i % 2 === 0 ? "accent" : "line", 4));
      method.push(
        asLabel(text("copy" + i * 2, x + 28, y + 36, 600, 44, 22, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id)
      );
      method.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 28, y + 100, 600, 180, 17, "copy" + (i * 2 + 1), "muted", {
            lineHeight: 1.35,
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "incipit-method", f, method));

    // 6 Setup — photo + dense hold
    kits.push(
      writeKit("feature", "incipit-setup", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...head(),
        asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
        ...tabs(5, TAB_LABELS, 4),
        photo("photo", 820, 160, 620, 660, { z: 1 }),
        bar("pf", 820, 160, 8, 660, "accent", 3),
        asBeat(rect("note", 60, 170, 720, 640, "surface", { z: 3 }), { morphId: "note-0" }),
        asLabel(text("copy0", 100, 220, 640, 48, 20, "copy0", "accent", { ...kicker, z: 4 }), "note"),
        asLabel(
          text("copy1", 100, 300, 640, 420, 24, "copy1", "ink", {
            fontWeight: 700,
            lineHeight: 1.4,
            z: 4,
          }),
          "note"
        ),
      ])
    );

    // 7 Results — metrics + figure photo
    const res: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 700, 60, 36, "title", "ink", display)),
      ...tabs(6, TAB_LABELS, 4),
      photo("photo", 860, 160, 580, 400, { z: 1 }),
      bar("rf", 860, 160, 8, 400, "accent", 3),
      asChrome(
        text("cap", 880, 580, 540, 40, 14, "", "muted", {
          literal: "Fig. 1 — Trust delta by condition (paired).",
          z: 3,
        })
      ),
    ];
    [0, 1, 2, 3].forEach((i) => {
      const y = 170 + i * 160;
      const id = "note" + i;
      res.push(asBeat(rect(id, 60, y, 760, 140, "surface", { z: 3 }), { morphId: "note-" + i }));
      res.push(asLabel(text("copy" + i * 2, 90, y + 24, 200, 40, 20, "copy" + i * 2, "accent", { fontWeight: 700, z: 4 }), id));
      res.push(
        asLabel(text("copy" + (i * 2 + 1), 310, y + 24, 480, 90, 17, "copy" + (i * 2 + 1), "ink", { lineHeight: 1.3, z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "incipit-results", f, res));

    // 8 Discussion
    const disc: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
      ...tabs(7, TAB_LABELS, 3),
    ];
    [
      [60, 170],
      [740, 170],
      [60, 520],
      [740, 520],
    ].forEach(([x, y], i) => {
      const id = "note" + i;
      disc.push(asBeat(rect(id, x, y, 660, 310, "surface", { z: 3 }), { morphId: "note-" + i }));
      disc.push(
        asLabel(text("copy" + i * 2, x + 28, y + 28, 600, 40, 18, "copy" + i * 2, "accent", { ...kicker, z: 4 }), id)
      );
      disc.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 28, y + 90, 600, 180, 18, "copy" + (i * 2 + 1), "ink", {
            lineHeight: 1.35,
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "incipit-discuss", f, disc));

    // 9 Limitations
    const lim: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 900, 60, 36, "title", "ink", display)),
      ...tabs(8, TAB_LABELS, 3),
      bar("warn", 60, 170, 1340, 6, "accent", 2),
    ];
    [0, 1, 2, 3].forEach((i) => {
      const y = 200 + i * 160;
      const id = "note" + i;
      lim.push(asBeat(rect(id, 60, y, 1340, 140, "surface", { z: 3 }), { morphId: "note-" + i }));
      lim.push(asLabel(text("copy" + i * 2, 100, y + 24, 280, 40, 20, "copy" + i * 2, "ink", { fontWeight: 700, z: 4 }), id));
      lim.push(
        asLabel(text("copy" + (i * 2 + 1), 400, y + 24, 960, 90, 17, "copy" + (i * 2 + 1), "muted", { z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "incipit-limits", f, lim));

    // 10 References — with stacks photo strip
    const refs: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      ...head(),
      asTitle(text("title", 60, 90, 700, 60, 36, "title", "ink", display)),
      ...tabs(9, TAB_LABELS, 4),
      photo("photo", 980, 160, 460, 640, { z: 1 }),
      bar("rs", 980, 160, 8, 640, "accent", 3),
    ];
    [0, 1, 2, 3].forEach((i) => {
      const y = 170 + i * 160;
      const id = "note" + i;
      refs.push(asBeat(rect(id, 60, y, 880, 140, "surface", { z: 3 }), { morphId: "note-" + i }));
      refs.push(asLabel(text("copy" + i * 2, 90, y + 22, 820, 40, 18, "copy" + i * 2, "accent", { fontWeight: 700, z: 4 }), id));
      refs.push(
        asLabel(text("copy" + (i * 2 + 1), 90, y + 68, 820, 56, 16, "copy" + (i * 2 + 1), "ink", { z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "incipit-refs", f, refs));

    // 11 Close
    kits.push(
      writeKit("closing", "incipit-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...tabs(10, TAB_LABELS, 3),
        bar("endrule", 60, 200, 1200, 4, "accent", 2),
        asBeat(rect("note", 60, 240, 1200, 420, "surface", { z: 3 }), { morphId: "note-0" }),
        asTitle(text("title", 100, 300, 1120, 200, 44, "title", "ink", { ...display, lineHeight: 1.2, z: 4 })),
        asChrome(text("copy0", 100, 540, 1120, 48, 16, "copy0", "muted", { z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

runTemplates([paper]).catch((e) => {
  console.error(e);
  process.exit(1);
});
