/**
 * Signature Element Language (SEL) — composable builders for unique visual anatomy.
 *
 * Rule: every creative family must own 3–5 named SEL units that do not appear
 * in other families. Generators compose these instead of inventing one-off rects.
 *
 *   import { filmStrip, dial, neonBadge, FAMILY_SEL } from "./sel";
 */
import { El, text, rect, circle, photo } from "./designKit";

export type SelTier = "A" | "B";

export type SelUnitId =
  | "filmStrip"
  | "dial"
  | "neonBadge"
  | "waveform"
  | "nodeChain"
  | "destinationBoard"
  | "radioPlate"
  | "hearthSurround"
  | "colorWheels"
  | "startLights"
  | "sonarRings"
  | "porthole"
  | "pressureGauge"
  | "constellationMap"
  | "eclipseBite"
  | "orbitTracks"
  | "heatBars"
  | "slagChips"
  | "pourPath"
  | "prismShards"
  | "spectrumStrip"
  | "roseWindow"
  | "vinylSpines"
  | "songTicket"
  | "neonArch"
  | "tentStripe"
  | "prizeTag"
  | "ferrisCab"
  | "waxSeal"
  | "callingCard"
  | "letterRule"
  | "stampBlock"
  | "postcardFrame"
  | "softRibbon"
  | "bulbRow"
  | "marqueePanel"
  | "stubTicket"
  | "laneStripe"
  | "pinSet"
  | "scoreBox"
  | "combCell"
  | "jarLabel"
  | "hiveBar"
  | "magazineSpine"
  | "mastheadRule"
  | "issueBadge"
  | "glassPane"
  | "plinthBlock"
  | "captionRail"
  | "clipBar"
  | "tabIndex"
  | "folioSheet"
  | "whiteCube"
  | "wallLabel"
  | "pedestalDot"
  | "plateRack"
  | "inkWell"
  | "pullPrint";

export type SelUnitDef = {
  id: SelUnitId;
  name: string;
  description: string;
  /** Tier A = flagship BE/PPTX; Tier B = also safe for Flutter text/image/shape. */
  tier: SelTier;
  morphIds: string[];
};

export type FamilySel = {
  family: string;
  metaphor: string;
  units: SelUnitId[];
  motion: {
    cover: "fade" | "cameraPan";
    feature: "entrances" | "scatter";
    close: "pulse" | "float" | "kenBurns";
  };
};

/** Catalog of the 10 core SEL builders. */
export const SEL_UNITS: Record<SelUnitId, SelUnitDef> = {
  filmStrip: {
    id: "filmStrip",
    name: "Film strip",
    description: "Horizontal sprocket frames with one developed photo cell",
    tier: "A",
    morphIds: ["plate"],
  },
  dial: {
    id: "dial",
    name: "Exposure dial",
    description: "Concentric circle gauge with needle",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  neonBadge: {
    id: "neonBadge",
    name: "Neon badge",
    description: "Solid circle stamp with short label",
    tier: "B",
    morphIds: ["accent"],
  },
  waveform: {
    id: "waveform",
    name: "Waveform HUD",
    description: "Vertical equalizer bars for scopes / signal",
    tier: "B",
    morphIds: ["accent"],
  },
  nodeChain: {
    id: "nodeChain",
    name: "Node chain",
    description: "Horizontal process nodes connected by a wire",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  destinationBoard: {
    id: "destinationBoard",
    name: "Destination board",
    description: "Transit LED plate with route badge",
    tier: "B",
    morphIds: ["titlePlate", "accent"],
  },
  radioPlate: {
    id: "radioPlate",
    name: "Radio call plate",
    description: "Pit-wall callout plate with LED rail",
    tier: "B",
    morphIds: ["titlePlate", "accent"],
  },
  hearthSurround: {
    id: "hearthSurround",
    name: "Hearth surround",
    description: "Thick fireplace frame around a photo with ember bar",
    tier: "A",
    morphIds: ["plate", "accent"],
  },
  colorWheels: {
    id: "colorWheels",
    name: "Color wheels",
    description: "Lift / Gamma / Gain concentric wheels",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  startLights: {
    id: "startLights",
    name: "Start lights",
    description: "Row of race-start circles",
    tier: "B",
    morphIds: ["accent"],
  },
  sonarRings: {
    id: "sonarRings",
    name: "Sonar rings",
    description: "Concentric detection rings for deep-ocean decks",
    tier: "A",
    morphIds: ["plate", "accent"],
  },
  porthole: {
    id: "porthole",
    name: "Porthole",
    description: "Thick circular viewport framing a photo",
    tier: "A",
    morphIds: ["plate"],
  },
  pressureGauge: {
    id: "pressureGauge",
    name: "Pressure gauge",
    description: "Bathysphere depth / PSI dial cluster",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  constellationMap: {
    id: "constellationMap",
    name: "Constellation map",
    description: "Star nodes linked by hairline routes",
    tier: "A",
    morphIds: ["accent", "plate"],
  },
  eclipseBite: {
    id: "eclipseBite",
    name: "Eclipse bite",
    description: "Overlapping celestial discs that form a crescent",
    tier: "A",
    morphIds: ["plate", "accent"],
  },
  orbitTracks: {
    id: "orbitTracks",
    name: "Orbit tracks",
    description: "Nested elliptical / rounded orbit lanes",
    tier: "B",
    morphIds: ["plate"],
  },
  heatBars: {
    id: "heatBars",
    name: "Heat bars",
    description: "Temperature strip ladder for foundry decks",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  slagChips: {
    id: "slagChips",
    name: "Slag chips",
    description: "Irregular cooled-metal sample tiles",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  pourPath: {
    id: "pourPath",
    name: "Pour path",
    description: "Diagonal molten pour channel",
    tier: "A",
    morphIds: ["accent"],
  },
  prismShards: {
    id: "prismShards",
    name: "Prism shards",
    description: "Angled glass shard cluster",
    tier: "A",
    morphIds: ["accent", "plate"],
  },
  spectrumStrip: {
    id: "spectrumStrip",
    name: "Spectrum strip",
    description: "Segmented refraction bar",
    tier: "B",
    morphIds: ["accent"],
  },
  roseWindow: {
    id: "roseWindow",
    name: "Rose window",
    description: "Radial cathedral glass segments",
    tier: "A",
    morphIds: ["plate", "accent"],
  },
  vinylSpines: {
    id: "vinylSpines",
    name: "Vinyl spines",
    description: "Stacked record-spine strips for jukebox decks",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  songTicket: {
    id: "songTicket",
    name: "Song ticket",
    description: "Perforated request ticket plate",
    tier: "B",
    morphIds: ["titlePlate", "accent"],
  },
  neonArch: {
    id: "neonArch",
    name: "Neon arch",
    description: "Diner jukebox arch frame",
    tier: "A",
    morphIds: ["accent", "plate"],
  },
  tentStripe: {
    id: "tentStripe",
    name: "Tent stripe",
    description: "Carnival awning stripe field",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  prizeTag: {
    id: "prizeTag",
    name: "Prize tag",
    description: "Carnival booth prize ticket tags",
    tier: "B",
    morphIds: ["accent"],
  },
  ferrisCab: {
    id: "ferrisCab",
    name: "Ferris cab",
    description: "Ferris-wheel gondola chip row",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  waxSeal: {
    id: "waxSeal",
    name: "Wax seal",
    description: "Letterpress wax seal stamp",
    tier: "B",
    morphIds: ["accent"],
  },
  callingCard: {
    id: "callingCard",
    name: "Calling card",
    description: "Soft parlor calling-card stack",
    tier: "A",
    morphIds: ["plate", "titlePlate"],
  },
  letterRule: {
    id: "letterRule",
    name: "Letter rule",
    description: "Hairline letterpress rules with end marks",
    tier: "B",
    morphIds: ["accent"],
  },
  stampBlock: {
    id: "stampBlock",
    name: "Stamp block",
    description: "Postage stamp grid for linen post decks",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  postcardFrame: {
    id: "postcardFrame",
    name: "Postcard frame",
    description: "Soft bordered postcard photo plate",
    tier: "A",
    morphIds: ["plate"],
  },
  softRibbon: {
    id: "softRibbon",
    name: "Soft ribbon",
    description: "Horizontal ribbon band with fold notches",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  bulbRow: {
    id: "bulbRow",
    name: "Bulb row",
    description: "Theater marquee light bulbs",
    tier: "B",
    morphIds: ["accent"],
  },
  marqueePanel: {
    id: "marqueePanel",
    name: "Marquee panel",
    description: "Title letterboard panel for theater decks",
    tier: "A",
    morphIds: ["titlePlate", "plate"],
  },
  stubTicket: {
    id: "stubTicket",
    name: "Stub ticket",
    description: "Torn theater ticket stub",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  laneStripe: {
    id: "laneStripe",
    name: "Lane stripe",
    description: "Bowling lane wood + arrow guides",
    tier: "A",
    morphIds: ["plate", "accent"],
  },
  pinSet: {
    id: "pinSet",
    name: "Pin set",
    description: "Tenpin triangle chip set",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  scoreBox: {
    id: "scoreBox",
    name: "Score box",
    description: "Bowling score frame boxes",
    tier: "B",
    morphIds: ["plate"],
  },
  combCell: {
    id: "combCell",
    name: "Comb cell",
    description: "Honeycomb cell cluster",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  jarLabel: {
    id: "jarLabel",
    name: "Jar label",
    description: "Apothecary / honey jar label cards",
    tier: "A",
    morphIds: ["titlePlate", "plate"],
  },
  hiveBar: {
    id: "hiveBar",
    name: "Hive bar",
    description: "Soft hive shelf bars",
    tier: "B",
    morphIds: ["accent"],
  },
  magazineSpine: {
    id: "magazineSpine",
    name: "Magazine spine",
    description: "Newsstand magazine spine stack",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  mastheadRule: {
    id: "mastheadRule",
    name: "Masthead rule",
    description: "Editorial masthead double rule",
    tier: "B",
    morphIds: ["accent"],
  },
  issueBadge: {
    id: "issueBadge",
    name: "Issue badge",
    description: "Magazine issue number badge",
    tier: "B",
    morphIds: ["accent"],
  },
  glassPane: {
    id: "glassPane",
    name: "Glass pane",
    description: "Museum vitrine glass frame around work",
    tier: "A",
    morphIds: ["plate"],
  },
  plinthBlock: {
    id: "plinthBlock",
    name: "Plinth block",
    description: "Gallery plinth / pedestal block",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  captionRail: {
    id: "captionRail",
    name: "Caption rail",
    description: "Wall caption plaque rail",
    tier: "B",
    morphIds: ["titlePlate", "accent"],
  },
  clipBar: {
    id: "clipBar",
    name: "Clip bar",
    description: "Metal dossier binder clip",
    tier: "B",
    morphIds: ["accent"],
  },
  tabIndex: {
    id: "tabIndex",
    name: "Tab index",
    description: "Side index tabs for dossier folios",
    tier: "B",
    morphIds: ["accent", "plate"],
  },
  folioSheet: {
    id: "folioSheet",
    name: "Folio sheet",
    description: "Stacked dossier paper sheets",
    tier: "A",
    morphIds: ["titlePlate", "plate"],
  },
  whiteCube: {
    id: "whiteCube",
    name: "White cube",
    description: "Gallery white-cube wall field",
    tier: "A",
    morphIds: ["plate"],
  },
  wallLabel: {
    id: "wallLabel",
    name: "Wall label",
    description: "Museum wall didactic label",
    tier: "B",
    morphIds: ["titlePlate", "accent"],
  },
  pedestalDot: {
    id: "pedestalDot",
    name: "Pedestal dot",
    description: "Floor marker dots under works",
    tier: "B",
    morphIds: ["accent"],
  },
  plateRack: {
    id: "plateRack",
    name: "Plate rack",
    description: "Printmaker plate rack slots",
    tier: "B",
    morphIds: ["plate", "accent"],
  },
  inkWell: {
    id: "inkWell",
    name: "Ink well",
    description: "Ink pot / well circle",
    tier: "B",
    morphIds: ["accent"],
  },
  pullPrint: {
    id: "pullPrint",
    name: "Pull print",
    description: "Fresh print pull mat with photo",
    tier: "A",
    morphIds: ["plate"],
  },
};

/** Family → metaphor + owned SEL set. Review rejects families missing a unique set. */
export const FAMILY_SEL: FamilySel[] = [
  {
    family: "darkroom",
    metaphor: "Photo lab / proof sheet",
    units: ["filmStrip", "dial", "neonBadge"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "grade",
    metaphor: "Color-grade edit suite",
    units: ["waveform", "colorWheels", "nodeChain", "neonBadge"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "gulhane",
    metaphor: "Transit destination board",
    units: ["destinationBoard", "neonBadge", "nodeChain"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "gridlock",
    metaphor: "Pit-lane radio",
    units: ["radioPlate", "startLights", "neonBadge", "waveform"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "hearth",
    metaphor: "Interior fireplace folio",
    units: ["hearthSurround", "neonBadge", "dial"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "oxide",
    metaphor: "Street mural atelier",
    units: ["neonBadge", "waveform", "radioPlate"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "lantern",
    metaphor: "Night cafe counter",
    units: ["destinationBoard", "neonBadge", "hearthSurround"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "rosso",
    metaphor: "Private garage bay",
    units: ["neonBadge", "waveform", "startLights"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "abyss",
    metaphor: "Bathysphere / sonar lab",
    units: ["sonarRings", "porthole", "pressureGauge"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "eclipse",
    metaphor: "Planetarium vault",
    units: ["constellationMap", "eclipseBite", "orbitTracks"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "voltaic",
    metaphor: "Molten foundry pour",
    units: ["heatBars", "slagChips", "pourPath"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "prism",
    metaphor: "Stained-glass crypt",
    units: ["prismShards", "spectrumStrip", "roseWindow"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "jukebox",
    metaphor: "Diner jukebox reel",
    units: ["vinylSpines", "songTicket", "neonArch"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "carnival",
    metaphor: "Night carnival lot",
    units: ["tentStripe", "prizeTag", "ferrisCab"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "parlor",
    metaphor: "Soft parlor stationery",
    units: ["waxSeal", "callingCard", "letterRule"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "linen",
    metaphor: "Linen postcard rack",
    units: ["stampBlock", "postcardFrame", "softRibbon"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "marquee",
    metaphor: "Theater marquee night",
    units: ["bulbRow", "marqueePanel", "stubTicket"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "strike",
    metaphor: "Bowling alley lane",
    units: ["laneStripe", "pinSet", "scoreBox"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "apiary",
    metaphor: "Soft honey apiary",
    units: ["combCell", "jarLabel", "hiveBar"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "newsstand",
    metaphor: "Corner newsstand rack",
    units: ["magazineSpine", "mastheadRule", "issueBadge"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "vitrine",
    metaphor: "Museum vitrine portfolio",
    units: ["glassPane", "plinthBlock", "captionRail"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "dossier",
    metaphor: "Clipped dossier portfolio",
    units: ["clipBar", "tabIndex", "folioSheet"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
  {
    family: "mezzanine",
    metaphor: "White-cube mezzanine gallery",
    units: ["whiteCube", "wallLabel", "pedestalDot"],
    motion: { cover: "fade", feature: "entrances", close: "float" },
  },
  {
    family: "platepress",
    metaphor: "Printmaker plate rack",
    units: ["plateRack", "inkWell", "pullPrint"],
    motion: { cover: "fade", feature: "entrances", close: "pulse" },
  },
];

export function familySel(family: string): FamilySel | undefined {
  return FAMILY_SEL.find((f) => f.family === family);
}

export function assertUniqueSel(family: string, units: SelUnitId[]) {
  if (units.length < 3) throw Error(`SEL: family ${family} needs ≥3 units (got ${units.length})`);
  const overlap = FAMILY_SEL.filter((f) => f.family !== family).flatMap((f) => {
    const shared = f.units.filter((u) => units.includes(u));
    return shared.length >= 3 ? [`${f.family}:{${shared.join(",")}}`] : [];
  });
  // Soft check: identical 3+ sets are forbidden; partial reuse is allowed.
  if (overlap.length) throw Error(`SEL: ${family} reuses a full set with ${overlap.join(", ")}`);
}

type StripOpts = {
  x?: number;
  y?: number;
  frames?: number;
  activeIndex?: number;
  frameW?: number;
  frameH?: number;
  gap?: number;
  photoExtras?: El;
  z?: number;
};

/** Horizontal film strip with sprocket holes; one frame holds the photo. */
export function filmStrip(prefix: string, opts: StripOpts = {}): El[] {
  const x0 = opts.x ?? 80;
  const y0 = opts.y ?? 420;
  const frames = opts.frames ?? 5;
  const active = opts.activeIndex ?? 2;
  const fw = opts.frameW ?? 260;
  const fh = opts.frameH ?? 320;
  const gap = opts.gap ?? 30;
  const z = opts.z ?? 1;
  const out: El[] = [];
  for (let i = 0; i < frames; i++) {
    const x = x0 + i * (fw + gap);
    out.push(rect(prefix + "frame" + i, x, y0, fw, fh, "surface", { z, morphId: i === active ? "plate" : undefined }));
    out.push(rect(prefix + "holeT" + i, x + 20, y0 + 10, 18, 18, "bg", { z: z + 1 }));
    out.push(rect(prefix + "holeB" + i, x + 20, y0 + fh - 28, 18, 18, "bg", { z: z + 1 }));
    if (i === active) {
      out.push(
        photo(prefix + "photo", x + 20, y0 + 40, fw - 40, fh - 80, {
          tone: "bw-harsh",
          zoom: 1.2,
          z: z + 1,
          ...(opts.photoExtras || {}),
        })
      );
    } else {
      out.push(rect(prefix + "blank" + i, x + 20, y0 + 40, fw - 40, fh - 80, "line", { z: z + 1 }));
    }
  }
  return out;
}

type DialOpts = {
  x: number;
  y: number;
  size?: number;
  fill?: string;
  inner?: string;
  needle?: string;
  z?: number;
};

/** Concentric exposure / gauge dial. */
export function dial(prefix: string, opts: DialOpts): El[] {
  const size = opts.size ?? 260;
  const z = opts.z ?? 1;
  const fill = opts.fill ?? "surface";
  const inner = opts.inner ?? "bg";
  const needle = opts.needle ?? "accent";
  const mid = Math.round(size * 0.62);
  const core = Math.round(size * 0.38);
  return [
    circle(prefix + "outer", opts.x, opts.y, size, fill, { z, morphId: "plate" }),
    circle(prefix + "mid", opts.x + Math.round((size - mid) / 2), opts.y + Math.round((size - mid) / 2), mid, inner, { z: z + 1 }),
    rect(prefix + "needle", opts.x + Math.round(size / 2) - 3, opts.y + Math.round(size * 0.12), 6, Math.round(size * 0.38), needle, {
      z: z + 2,
      morphId: "accent",
    }),
  ];
}

type BadgeOpts = {
  x: number;
  y: number;
  size?: number;
  fill?: string;
  ink?: string;
  slot: string;
  fontSize?: number;
  z?: number;
};

/** Circle stamp / neon ON badge. */
export function neonBadge(prefix: string, opts: BadgeOpts): El[] {
  const size = opts.size ?? 200;
  const z = opts.z ?? 3;
  const pad = Math.round(size * 0.1);
  return [
    circle(prefix + "badge", opts.x, opts.y, size, opts.fill ?? "accent", { z, morphId: "accent", shapeTreatment: "depth" }),
    text(prefix + "label", opts.x + pad, opts.y + Math.round(size * 0.28), size - pad * 2, Math.round(size * 0.5), opts.fontSize ?? 56, opts.slot, opts.ink ?? "bg", {
      textStyleRole: "stat",
      fontRole: "display",
      align: "center",
      z: z + 1,
      morphId: "accent-label",
    }),
  ];
}

type WaveOpts = {
  x: number;
  y: number;
  count?: number;
  barW?: number;
  gap?: number;
  heights?: number[];
  fills?: string[];
  z?: number;
};

/** Vertical waveform / equalizer bars. */
export function waveform(prefix: string, opts: WaveOpts): El[] {
  const count = opts.count ?? 8;
  const barW = opts.barW ?? 48;
  const gap = opts.gap ?? 22;
  const z = opts.z ?? 3;
  const heights = opts.heights || Array.from({ length: count }, (_, i) => 80 + (i % 3) * 60);
  const fills = opts.fills || heights.map((_, i) => (i % 2 ? "accent" : "ink"));
  return heights.map((h, i) =>
    rect(prefix + "wf" + i, opts.x + i * (barW + gap), opts.y, barW, h, fills[i], {
      z,
      opacity: 0.85,
      morphId: i === count - 1 ? "accent" : undefined,
    })
  );
}

type NodeOpts = {
  x?: number;
  y?: number;
  labels: string[]; // slot ids for numbers, then names — expects 2*n slots provided by caller via copy pairing
  nodeW?: number;
  nodeH?: number;
  gap?: number;
  activeIndex?: number;
  z?: number;
};

/**
 * Process node chain. Caller supplies copy slots: copy0=num, copy1=label, copy2=num…
 * `labels` length = node count; slot indices are sequential from `slotStart`.
 */
export function nodeChain(prefix: string, opts: NodeOpts & { slotStart?: number }): El[] {
  const n = opts.labels.length;
  const nodeW = opts.nodeW ?? 220;
  const nodeH = opts.nodeH ?? 160;
  const gap = opts.gap ?? 140;
  const x0 = opts.x ?? 140;
  const y0 = opts.y ?? 340;
  const z = opts.z ?? 2;
  const active = opts.activeIndex ?? Math.min(2, n - 1);
  const slotStart = opts.slotStart ?? 0;
  const wireW = (n - 1) * (nodeW + gap) - gap + nodeW;
  const out: El[] = [
    rect(prefix + "wire", x0 + Math.round(nodeW / 2), y0 + Math.round(nodeH / 2) - 3, wireW - nodeW, 6, "line", { z: z - 1 }),
  ];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (nodeW + gap);
    const on = i === active;
    out.push(rect(prefix + "node" + i, x, y0, nodeW, nodeH, on ? "accent" : "surface", { z, morphId: on ? "plate" : undefined }));
    out.push(
      text(prefix + "num" + i, x + 20, y0 + 30, nodeW - 40, 50, 32, "copy" + (slotStart + i * 2), on ? "bg" : "accent", {
        textStyleRole: "display",
        fontRole: "display",
        align: "center",
      })
    );
    out.push(
      text(prefix + "lab" + i, x + 20, y0 + 90, nodeW - 40, 40, 24, "copy" + (slotStart + i * 2 + 1), on ? "bg" : "ink", {
        align: "center",
      })
    );
    if (i < n - 1) {
      out.push(circle(prefix + "bead" + i, x + nodeW + Math.round((gap - 30) / 2), y0 + Math.round(nodeH / 2) - 15, 30, "ink", { z: z + 1, morphId: "accent" }));
    }
  }
  return out;
}

type BoardOpts = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  titleSlot?: string;
  kickerSlot?: string;
  subSlot?: string;
  badgeSlot?: string;
  z?: number;
};

/** Transit-style destination board with LED rail + route badge. */
export function destinationBoard(prefix: string, opts: BoardOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 520;
  const w = opts.w ?? 1440;
  const h = opts.h ?? 300;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "board", x, y, w, h, "bg", { z, morphId: "titlePlate", shapeTreatment: "depth" }),
    rect(prefix + "led", x, y, w, 12, "accent", { z: z + 1 }),
    text(prefix + "kicker", x + 40, y + 40, 900, 40, 22, opts.kickerSlot || "copy0", "muted", {
      textStyleRole: "kicker",
      fontRole: "label",
      z: z + 1,
    }),
    text(prefix + "title", x + 30, y + 80, 1100, 120, 96, opts.titleSlot || "title", "ink", {
      textStyleRole: "display",
      fontRole: "display",
      letterSpacing: 4,
      z: z + 1,
      morphId: "title",
    }),
    text(prefix + "sub", x + 40, y + 220, 900, 40, 26, opts.subSlot || "copy1", "surface_color", { z: z + 1 }),
    ...neonBadge(prefix, {
      x: x + w - 280,
      y: y + 60,
      size: 180,
      slot: opts.badgeSlot || "copy2",
      fontSize: 64,
      z: z + 1,
    }),
  ];
}

type RadioOpts = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  titleSlot?: string;
  kickerSlot?: string;
  callSlot?: string;
  badgeSlot?: string;
  z?: number;
};

/** Pit-lane radio call plate. */
export function radioPlate(prefix: string, opts: RadioOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 160;
  const w = opts.w ?? 980;
  const h = opts.h ?? 520;
  const z = opts.z ?? 3;
  return [
    rect(prefix + "plate", x, y, w, h, "surface", { z, morphId: "titlePlate", shapeTreatment: "depth" }),
    rect(prefix + "led", x, y, w, 14, "accent", { z: z + 1 }),
    text(prefix + "kicker", x + 40, y + 50, 800, 40, 22, opts.kickerSlot || "copy0", "muted", {
      textStyleRole: "kicker",
      fontRole: "label",
      z: z + 1,
    }),
    text(prefix + "title", x + 30, y + 120, 900, 180, 110, opts.titleSlot || "title", "ink", {
      textStyleRole: "display",
      fontRole: "display",
      letterSpacing: 2,
      z: z + 1,
      morphId: "title",
    }),
    text(prefix + "call", x + 40, y + 340, 700, 80, 56, opts.callSlot || "copy1", "accent", {
      textStyleRole: "display",
      fontRole: "display",
      z: z + 1,
    }),
    ...neonBadge(prefix, {
      x: 1280,
      y: 620,
      size: 200,
      slot: opts.badgeSlot || "copy2",
      fontSize: 64,
      z: z,
    }),
  ];
}

type HearthOpts = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  photoExtras?: El;
  z?: number;
};

/** Fireplace surround framing a photo. */
export function hearthSurround(prefix: string, opts: HearthOpts = {}): El[] {
  const x = opts.x ?? 180;
  const y = opts.y ?? 80;
  const w = opts.w ?? 1240;
  const h = opts.h ?? 740;
  const z = opts.z ?? 1;
  const inset = 80;
  const barH = 40;
  return [
    rect(prefix + "outer", x, y, w, h, "surface_color", { z, morphId: "plate" }),
    rect(prefix + "inner", x + inset - 20, y + 70, w - (inset - 20) * 2, h - 220, "bg", { z: z + 1 }),
    photo(prefix + "photo", x + inset, y + 90, w - inset * 2, h - 260, {
      zoom: 1.15,
      z: z + 2,
      ...(opts.photoExtras || {}),
    }),
    rect(prefix + "ember", x + inset - 20, y + h - 120, w - (inset - 20) * 2, barH, "accent", {
      z: z + 2,
      morphId: "accent",
    }),
  ];
}

type WheelsOpts = {
  x?: number;
  y?: number;
  count?: number;
  size?: number;
  gap?: number;
  slotStart?: number;
  z?: number;
};

/** Lift / Gamma / Gain style color wheels. */
export function colorWheels(prefix: string, opts: WheelsOpts = {}): El[] {
  const count = opts.count ?? 3;
  const size = opts.size ?? 360;
  const gap = opts.gap ?? 120;
  const x0 = opts.x ?? 140;
  const y0 = opts.y ?? 220;
  const z = opts.z ?? 1;
  const slotStart = opts.slotStart ?? 0;
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + i * (size + gap);
    const mid = Math.round(size * 0.72);
    const core = Math.round(size * 0.33);
    out.push(circle(prefix + "outer" + i, x, y0, size, "surface", { z, morphId: i === 1 ? "plate" : undefined }));
    out.push(
      circle(prefix + "mid" + i, x + Math.round((size - mid) / 2), y0 + Math.round((size - mid) / 2), mid, "surface_color", { z: z + 1 })
    );
    out.push(
      circle(prefix + "core" + i, x + Math.round((size - core) / 2), y0 + Math.round((size - core) / 2), core, i === 1 ? "ink" : "accent", {
        z: z + 2,
        morphId: i === 0 ? "accent" : undefined,
      })
    );
    out.push(
      text(prefix + "name" + i, x + 40, y0 + size + 40, size - 80, 50, 36, "copy" + (slotStart + i * 2), "ink", {
        textStyleRole: "display",
        fontRole: "display",
        align: "center",
      })
    );
    out.push(
      text(prefix + "sub" + i, x + 40, y0 + size + 100, size - 80, 40, 24, "copy" + (slotStart + i * 2 + 1), "muted", {
        align: "center",
      })
    );
  }
  return out;
}

type LightsOpts = {
  x?: number;
  y?: number;
  count?: number;
  size?: number;
  gap?: number;
  lit?: number;
  z?: number;
};

/** F1-style start light row. */
export function startLights(prefix: string, opts: LightsOpts = {}): El[] {
  const count = opts.count ?? 5;
  const size = opts.size ?? 100;
  const gap = opts.gap ?? 50;
  const lit = opts.lit ?? count - 1;
  const z = opts.z ?? 1;
  return Array.from({ length: count }, (_, i) =>
    circle(prefix + "light" + i, (opts.x ?? 420) + i * (size + gap), opts.y ?? 220, size, i < lit ? "accent" : "line", {
      z,
      morphId: i === 0 ? "accent" : undefined,
    })
  );
}

type SonarOpts = { x?: number; y?: number; size?: number; rings?: number; z?: number };

/** Concentric sonar detection rings. */
export function sonarRings(prefix: string, opts: SonarOpts = {}): El[] {
  const size = opts.size ?? 720;
  const rings = opts.rings ?? 4;
  const x = opts.x ?? 40;
  const y = opts.y ?? 90;
  const z = opts.z ?? 1;
  const out: El[] = [];
  for (let i = 0; i < rings; i++) {
    const inset = Math.round((size * i) / (rings * 2.2));
    const s = size - inset * 2;
    out.push(
      circle(prefix + "ring" + i, x + inset, y + inset, s, i === rings - 1 ? "accent" : "line", {
        z: z + i,
        opacity: i === rings - 1 ? 0.85 : 0.35 + i * 0.12,
        morphId: i === 0 ? "plate" : i === rings - 1 ? "accent" : undefined,
      })
    );
  }
  return out;
}

type PortholeOpts = {
  x?: number;
  y?: number;
  size?: number;
  z?: number;
  photoExtras?: El;
};

/** Thick circular viewport with inset photo. */
export function porthole(prefix: string, opts: PortholeOpts = {}): El[] {
  const size = opts.size ?? 520;
  const x = opts.x ?? 980;
  const y = opts.y ?? 180;
  const z = opts.z ?? 2;
  const rim = Math.round(size * 0.08);
  const glass = size - rim * 2;
  return [
    circle(prefix + "rim", x, y, size, "surface_color", { z, morphId: "plate" }),
    circle(prefix + "inner", x + rim, y + rim, glass, "bg", { z: z + 1 }),
    photo(prefix + "photo", x + rim + 12, y + rim + 12, glass - 24, glass - 24, {
      zoom: 1.2,
      z: z + 2,
      ...(opts.photoExtras || {}),
    }),
  ];
}

type PressureOpts = { x?: number; y?: number; size?: number; z?: number; fill?: string };

/** Compact bathysphere pressure / depth gauge. */
export function pressureGauge(prefix: string, opts: PressureOpts = {}): El[] {
  const size = opts.size ?? 200;
  const x = opts.x ?? 80;
  const y = opts.y ?? 620;
  const z = opts.z ?? 2;
  const mid = Math.round(size * 0.55);
  return [
    circle(prefix + "body", x, y, size, opts.fill ?? "surface", { z, morphId: "plate" }),
    circle(prefix + "face", x + Math.round((size - mid) / 2), y + Math.round((size - mid) / 2), mid, "bg", { z: z + 1 }),
    rect(prefix + "needle", x + Math.round(size / 2) - 3, y + Math.round(size * 0.18), 6, Math.round(size * 0.34), "accent", {
      z: z + 2,
      morphId: "accent",
    }),
    circle(prefix + "hub", x + Math.round(size / 2) - 10, y + Math.round(size / 2) - 10, 20, "accent", { z: z + 3 }),
  ];
}

type ConstellationOpts = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  nodes?: Array<[number, number]>;
  z?: number;
};

/** Star nodes with thin connecting bars (normalized 0–1 coords inside box). */
export function constellationMap(prefix: string, opts: ConstellationOpts = {}): El[] {
  const x0 = opts.x ?? 80;
  const y0 = opts.y ?? 120;
  const w = opts.w ?? 900;
  const h = opts.h ?? 560;
  const z = opts.z ?? 2;
  const nodes = opts.nodes ?? [
    [0.08, 0.55],
    [0.22, 0.22],
    [0.4, 0.38],
    [0.58, 0.18],
    [0.72, 0.48],
    [0.88, 0.3],
    [0.62, 0.72],
  ];
  const out: El[] = [];
  const pts = nodes.map(([nx, ny]) => ({
    x: x0 + Math.round(nx * w),
    y: y0 + Math.round(ny * h),
  }));
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const width = Math.max(4, Math.abs(b.x - a.x));
    const height = Math.max(4, Math.abs(b.y - a.y));
    // Approximate link with a thin horizontal + vertical stub (no diagonal primitive)
    out.push(rect(prefix + "hx" + i, left, a.y - 1, width, 3, "line", { z, opacity: 0.55 }));
    out.push(rect(prefix + "vy" + i, b.x - 1, top, 3, height, "line", { z, opacity: 0.55 }));
  }
  pts.forEach((p, i) => {
    const s = i === 2 || i === 5 ? 28 : 16;
    out.push(
      circle(prefix + "star" + i, p.x - Math.round(s / 2), p.y - Math.round(s / 2), s, i === 2 ? "accent" : "ink", {
        z: z + 1,
        morphId: i === 2 ? "accent" : i === 0 ? "plate" : undefined,
      })
    );
  });
  return out;
}

type EclipseOpts = { x?: number; y?: number; size?: number; offset?: number; z?: number };

/** Two overlapping discs forming an eclipse crescent. */
export function eclipseBite(prefix: string, opts: EclipseOpts = {}): El[] {
  const size = opts.size ?? 640;
  const x = opts.x ?? 860;
  const y = opts.y ?? 120;
  const offset = opts.offset ?? Math.round(size * 0.28);
  const z = opts.z ?? 1;
  return [
    circle(prefix + "sun", x, y, size, "accent", { z, morphId: "accent", opacity: 0.95 }),
    circle(prefix + "moon", x + offset, y - Math.round(offset * 0.15), size, "bg", { z: z + 1, morphId: "plate" }),
  ];
}

type OrbitOpts = { x?: number; y?: number; size?: number; tracks?: number; z?: number };

/** Nested rounded orbit lanes. */
export function orbitTracks(prefix: string, opts: OrbitOpts = {}): El[] {
  const size = opts.size ?? 520;
  const tracks = opts.tracks ?? 3;
  const x = opts.x ?? 980;
  const y = opts.y ?? 200;
  const z = opts.z ?? 1;
  const out: El[] = [];
  for (let i = 0; i < tracks; i++) {
    const inset = i * 48;
    const s = size - inset * 2;
    out.push(
      circle(prefix + "orbit" + i, x + inset, y + inset, s, "line", {
        z: z + i,
        opacity: 0.25 + i * 0.15,
        morphId: i === 0 ? "plate" : undefined,
      })
    );
  }
  out.push(circle(prefix + "body", x + Math.round(size / 2) - 36, y + Math.round(size / 2) - 36, 72, "accent", { z: z + tracks }));
  return out;
}

type HeatOpts = { x?: number; y?: number; w?: number; bars?: number; z?: number };

/** Temperature ladder strips. */
export function heatBars(prefix: string, opts: HeatOpts = {}): El[] {
  const bars = opts.bars ?? 6;
  const x = opts.x ?? 80;
  const y = opts.y ?? 620;
  const w = opts.w ?? 1440;
  const z = opts.z ?? 2;
  const gap = 14;
  const h = 28;
  const out: El[] = [];
  for (let i = 0; i < bars; i++) {
    const bw = Math.round(w * (0.35 + (i / (bars - 1)) * 0.65));
    out.push(
      rect(prefix + "heat" + i, x, y + i * (h + gap), bw, h, i >= bars - 2 ? "accent" : i % 2 ? "surface_color" : "surface", {
        z,
        morphId: i === bars - 1 ? "accent" : i === 0 ? "plate" : undefined,
      })
    );
  }
  return out;
}

type SlagOpts = { x?: number; y?: number; count?: number; z?: number };

/** Irregular cooled-metal sample chips. */
export function slagChips(prefix: string, opts: SlagOpts = {}): El[] {
  const count = opts.count ?? 5;
  const x0 = opts.x ?? 80;
  const y0 = opts.y ?? 200;
  const z = opts.z ?? 2;
  const sizes = [
    [280, 180],
    [220, 240],
    [300, 160],
    [200, 200],
    [260, 220],
  ];
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const [w, h] = sizes[i % sizes.length];
    const x = x0 + (i % 3) * 340 + (i % 2) * 40;
    const y = y0 + Math.floor(i / 3) * 260 + (i % 2) * 30;
    out.push(
      rect(prefix + "slag" + i, x, y, w, h, i === 1 ? "accent" : i % 2 ? "surface" : "surface_color", {
        z,
        morphId: i === 0 ? "plate" : i === 1 ? "accent" : undefined,
      })
    );
  }
  return out;
}

type PourOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Diagonal molten pour approximated with stepped bars. */
export function pourPath(prefix: string, opts: PourOpts = {}): El[] {
  const x = opts.x ?? 200;
  const y = opts.y ?? 80;
  const w = opts.w ?? 1100;
  const h = opts.h ?? 720;
  const z = opts.z ?? 1;
  const steps = 7;
  const out: El[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const bw = Math.round(120 + t * 40);
    const bh = Math.round(h / steps + 20);
    out.push(
      rect(prefix + "pour" + i, x + Math.round(t * (w - bw)), y + Math.round(t * (h - bh)), bw, bh, "accent", {
        z,
        opacity: 0.55 + t * 0.4,
        morphId: i === steps - 1 ? "accent" : undefined,
      })
    );
  }
  return out;
}

type ShardOpts = { x?: number; y?: number; count?: number; z?: number };

/** Angled glass shard cluster (rect proxies at staggered offsets). */
export function prismShards(prefix: string, opts: ShardOpts = {}): El[] {
  const count = opts.count ?? 6;
  const x0 = opts.x ?? 900;
  const y0 = opts.y ?? 120;
  const z = opts.z ?? 2;
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const w = 90 + (i % 3) * 40;
    const h = 280 + (i % 2) * 80;
    out.push(
      rect(prefix + "shard" + i, x0 + i * 70, y0 + (i % 3) * 40, w, h, i % 3 === 0 ? "accent" : i % 3 === 1 ? "surface_color" : "ink", {
        z: z + i,
        opacity: i % 3 === 2 ? 0.2 : 0.9,
        morphId: i === 0 ? "accent" : i === 1 ? "plate" : undefined,
      })
    );
  }
  return out;
}

type SpectrumOpts = { x?: number; y?: number; w?: number; h?: number; segs?: number; z?: number };

/** Segmented refraction / spectrum bar. */
export function spectrumStrip(prefix: string, opts: SpectrumOpts = {}): El[] {
  const segs = opts.segs ?? 8;
  const x = opts.x ?? 80;
  const y = opts.y ?? 780;
  const w = opts.w ?? 1440;
  const h = opts.h ?? 48;
  const z = opts.z ?? 2;
  const gap = 8;
  const sw = Math.floor((w - gap * (segs - 1)) / segs);
  const fills = ["accent", "surface_color", "ink", "surface", "accent", "line", "surface_color", "ink"];
  return Array.from({ length: segs }, (_, i) =>
    rect(prefix + "seg" + i, x + i * (sw + gap), y, sw, h, fills[i % fills.length], {
      z,
      opacity: fills[i % fills.length] === "ink" ? 0.25 : 1,
      morphId: i === 0 ? "accent" : undefined,
    })
  );
}

type RoseOpts = { x?: number; y?: number; size?: number; petals?: number; z?: number };

/** Radial rose-window segments as nested circles + petal bars. */
export function roseWindow(prefix: string, opts: RoseOpts = {}): El[] {
  const size = opts.size ?? 560;
  const x = opts.x ?? 80;
  const y = opts.y ?? 160;
  const petals = opts.petals ?? 8;
  const z = opts.z ?? 1;
  const out: El[] = [
    circle(prefix + "outer", x, y, size, "surface_color", { z, morphId: "plate" }),
    circle(prefix + "mid", x + 50, y + 50, size - 100, "bg", { z: z + 1 }),
    circle(prefix + "core", x + Math.round(size / 2) - 60, y + Math.round(size / 2) - 60, 120, "accent", {
      z: z + 3,
      morphId: "accent",
    }),
  ];
  const cx = x + Math.round(size / 2);
  const cy = y + Math.round(size / 2);
  const reach = Math.round(size * 0.38);
  for (let i = 0; i < petals; i++) {
    const ang = (Math.PI * 2 * i) / petals - Math.PI / 2;
    const px = cx + Math.round(Math.cos(ang) * reach) - 18;
    const py = cy + Math.round(Math.sin(ang) * reach) - 18;
    out.push(circle(prefix + "petal" + i, px, py, 36, i % 2 ? "accent" : "ink", { z: z + 2, opacity: i % 2 ? 0.9 : 0.35 }));
  }
  return out;
}

type VinylOpts = { x?: number; y?: number; count?: number; h?: number; z?: number };

/** Stacked vinyl spine strips. */
export function vinylSpines(prefix: string, opts: VinylOpts = {}): El[] {
  const count = opts.count ?? 8;
  const x = opts.x ?? 80;
  const y = opts.y ?? 160;
  const h = opts.h ?? 560;
  const z = opts.z ?? 1;
  const w = 48;
  const gap = 14;
  return Array.from({ length: count }, (_, i) =>
    rect(prefix + "spine" + i, x + i * (w + gap), y, w, h - (i % 3) * 40, i % 3 === 0 ? "accent" : i % 2 ? "surface" : "surface_color", {
      z,
      morphId: i === 0 ? "plate" : i === 3 ? "accent" : undefined,
    })
  );
}

type TicketOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Perforated song-request ticket. */
export function songTicket(prefix: string, opts: TicketOpts = {}): El[] {
  const x = opts.x ?? 900;
  const y = opts.y ?? 200;
  const w = opts.w ?? 560;
  const h = opts.h ?? 360;
  const z = opts.z ?? 2;
  const out: El[] = [
    rect(prefix + "body", x, y, w, h, "surface", { z, morphId: "titlePlate" }),
    rect(prefix + "stub", x, y, 28, h, "accent", { z: z + 1, morphId: "accent" }),
  ];
  for (let i = 0; i < 6; i++) {
    out.push(circle(prefix + "perf" + i, x + 10, y + 40 + i * 50, 16, "bg", { z: z + 2 }));
  }
  return out;
}

type ArchOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Neon diner arch (rect + round top proxy). */
export function neonArch(prefix: string, opts: ArchOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 80;
  const w = opts.w ?? 700;
  const h = opts.h ?? 700;
  const z = opts.z ?? 1;
  return [
    rect(prefix + "cols", x, y + Math.round(h * 0.22), w, Math.round(h * 0.78), "surface_color", { z, morphId: "plate" }),
    circle(prefix + "dome", x, y, w, "accent", { z: z + 1, morphId: "accent", opacity: 0.9 }),
    rect(prefix + "cut", x, y + Math.round(w / 2), w, Math.round(h * 0.55), "bg", { z: z + 2 }),
  ];
}

type StripeOpts = { x?: number; y?: number; w?: number; h?: number; stripes?: number; z?: number };

/** Carnival awning stripes. */
export function tentStripe(prefix: string, opts: StripeOpts = {}): El[] {
  const stripes = opts.stripes ?? 10;
  const x = opts.x ?? 0;
  const y = opts.y ?? 0;
  const w = opts.w ?? 1600;
  const h = opts.h ?? 180;
  const z = opts.z ?? 1;
  const sw = Math.ceil(w / stripes);
  return Array.from({ length: stripes }, (_, i) =>
    rect(prefix + "stripe" + i, x + i * sw, y, sw + 1, h, i % 2 ? "accent" : "ink", {
      z,
      opacity: i % 2 ? 1 : 0.85,
      morphId: i === 0 ? "plate" : i === 1 ? "accent" : undefined,
    })
  );
}

type PrizeOpts = { x?: number; y?: number; count?: number; z?: number };

/** Prize booth tags. */
export function prizeTag(prefix: string, opts: PrizeOpts = {}): El[] {
  const count = opts.count ?? 4;
  const x0 = opts.x ?? 80;
  const y0 = opts.y ?? 240;
  const z = opts.z ?? 2;
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + (i % 2) * 360;
    const y = y0 + Math.floor(i / 2) * 220;
    out.push(rect(prefix + "tag" + i, x, y, 320, 180, i === 0 ? "accent" : "surface", { z, morphId: i === 0 ? "accent" : undefined }));
    out.push(circle(prefix + "hole" + i, x + 140, y + 16, 36, "bg", { z: z + 1 }));
  }
  return out;
}

type FerrisOpts = { x?: number; y?: number; count?: number; size?: number; z?: number };

/** Ferris gondola chips in an arc-ish row. */
export function ferrisCab(prefix: string, opts: FerrisOpts = {}): El[] {
  const count = opts.count ?? 6;
  const x0 = opts.x ?? 200;
  const y0 = opts.y ?? 520;
  const size = opts.size ?? 120;
  const z = opts.z ?? 2;
  return Array.from({ length: count }, (_, i) => {
    const lift = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 80);
    return circle(prefix + "cab" + i, x0 + i * (size + 40), y0 - lift, size, i === 2 ? "accent" : "surface_color", {
      z,
      morphId: i === 2 ? "accent" : i === 0 ? "plate" : undefined,
    });
  });
}

type SealOpts = { x?: number; y?: number; size?: number; z?: number };

/** Wax seal stamp. */
export function waxSeal(prefix: string, opts: SealOpts = {}): El[] {
  const size = opts.size ?? 160;
  const x = opts.x ?? 1300;
  const y = opts.y ?? 80;
  const z = opts.z ?? 3;
  const inner = Math.round(size * 0.62);
  return [
    circle(prefix + "wax", x, y, size, "accent", { z, morphId: "accent" }),
    circle(prefix + "core", x + Math.round((size - inner) / 2), y + Math.round((size - inner) / 2), inner, "surface", {
      z: z + 1,
      opacity: 0.35,
    }),
  ];
}

type CardOpts = { x?: number; y?: number; w?: number; h?: number; stack?: number; z?: number };

/** Soft calling-card stack. */
export function callingCard(prefix: string, opts: CardOpts = {}): El[] {
  const x = opts.x ?? 200;
  const y = opts.y ?? 220;
  const w = opts.w ?? 720;
  const h = opts.h ?? 420;
  const stack = opts.stack ?? 3;
  const z = opts.z ?? 2;
  const out: El[] = [];
  for (let i = 0; i < stack; i++) {
    out.push(
      rect(prefix + "card" + i, x + i * 18, y + i * 14, w, h, i === stack - 1 ? "surface" : "surface_color", {
        z: z + i,
        morphId: i === stack - 1 ? "titlePlate" : i === 0 ? "plate" : undefined,
      })
    );
  }
  return out;
}

type RuleOpts = { x?: number; y?: number; w?: number; z?: number };

/** Letterpress rule with end diamonds (circles). */
export function letterRule(prefix: string, opts: RuleOpts = {}): El[] {
  const x = opts.x ?? 200;
  const y = opts.y ?? 200;
  const w = opts.w ?? 800;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "rule", x + 24, y + 10, w - 48, 3, "accent", { z, morphId: "accent" }),
    circle(prefix + "L", x, y, 24, "accent", { z }),
    circle(prefix + "R", x + w - 24, y, 24, "accent", { z }),
  ];
}

type StampOpts = { x?: number; y?: number; cols?: number; rows?: number; z?: number };

/** Postage stamp grid. */
export function stampBlock(prefix: string, opts: StampOpts = {}): El[] {
  const cols = opts.cols ?? 3;
  const rows = opts.rows ?? 2;
  const x0 = opts.x ?? 80;
  const y0 = opts.y ?? 200;
  const z = opts.z ?? 2;
  const w = 200;
  const h = 240;
  const gap = 24;
  const out: El[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = x0 + c * (w + gap);
      const y = y0 + r * (h + gap);
      out.push(
        rect(prefix + "stamp" + i, x, y, w, h, i === 0 ? "accent" : "surface", {
          z,
          morphId: i === 0 ? "accent" : i === 1 ? "plate" : undefined,
        })
      );
      out.push(rect(prefix + "inset" + i, x + 16, y + 16, w - 32, h - 56, "bg", { z: z + 1, opacity: 0.2 }));
    }
  }
  return out;
}

type PostOpts = { x?: number; y?: number; w?: number; h?: number; z?: number; photoExtras?: El };

/** Soft postcard frame around a photo. */
export function postcardFrame(prefix: string, opts: PostOpts = {}): El[] {
  const x = opts.x ?? 700;
  const y = opts.y ?? 120;
  const w = opts.w ?? 820;
  const h = opts.h ?? 620;
  const z = opts.z ?? 1;
  return [
    rect(prefix + "mat", x, y, w, h, "surface", { z, morphId: "plate" }),
    rect(prefix + "inner", x + 28, y + 28, w - 56, h - 56, "bg", { z: z + 1 }),
    photo(prefix + "photo", x + 44, y + 44, w - 88, h - 88, { zoom: 1.1, z: z + 2, ...(opts.photoExtras || {}) }),
  ];
}

type RibbonOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Soft ribbon band with fold notches. */
export function softRibbon(prefix: string, opts: RibbonOpts = {}): El[] {
  const x = opts.x ?? 0;
  const y = opts.y ?? 740;
  const w = opts.w ?? 1600;
  const h = opts.h ?? 80;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "band", x, y, w, h, "accent", { z, morphId: "accent" }),
    rect(prefix + "foldL", x, y, 40, h, "surface_color", { z: z + 1, morphId: "plate", opacity: 0.45 }),
    rect(prefix + "foldR", x + w - 40, y, 40, h, "surface_color", { z: z + 1, opacity: 0.45 }),
  ];
}

type BulbOpts = { x?: number; y?: number; count?: number; size?: number; gap?: number; z?: number };

/** Theater marquee bulb row. */
export function bulbRow(prefix: string, opts: BulbOpts = {}): El[] {
  const count = opts.count ?? 12;
  const size = opts.size ?? 36;
  const gap = opts.gap ?? 18;
  const x = opts.x ?? 80;
  const y = opts.y ?? 80;
  const z = opts.z ?? 3;
  return Array.from({ length: count }, (_, i) =>
    circle(prefix + "bulb" + i, x + i * (size + gap), y, size, i % 3 === 0 ? "accent" : "ink", {
      z,
      opacity: i % 3 === 0 ? 1 : 0.35,
      morphId: i === 0 ? "accent" : undefined,
    })
  );
}

type MarqueeOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Letterboard marquee panel. */
export function marqueePanel(prefix: string, opts: MarqueeOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 160;
  const w = opts.w ?? 900;
  const h = opts.h ?? 420;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "outer", x, y, w, h, "surface_color", { z, morphId: "plate" }),
    rect(prefix + "inner", x + 24, y + 24, w - 48, h - 48, "bg", { z: z + 1, morphId: "titlePlate", opacity: 0.55 }),
  ];
}

type StubOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Torn theater ticket stub. */
export function stubTicket(prefix: string, opts: StubOpts = {}): El[] {
  const x = opts.x ?? 1100;
  const y = opts.y ?? 200;
  const w = opts.w ?? 380;
  const h = opts.h ?? 220;
  const z = opts.z ?? 2;
  const out: El[] = [
    rect(prefix + "body", x, y, w, h, "accent", { z, morphId: "accent" }),
    rect(prefix + "stub", x + w - 70, y, 70, h, "surface", { z: z + 1, morphId: "plate" }),
  ];
  for (let i = 0; i < 5; i++) {
    out.push(circle(prefix + "perf" + i, x + w - 78, y + 24 + i * 36, 16, "bg", { z: z + 2 }));
  }
  return out;
}

type LaneOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Bowling lane with arrow chevrons (rect proxies). */
export function laneStripe(prefix: string, opts: LaneOpts = {}): El[] {
  const x = opts.x ?? 200;
  const y = opts.y ?? 200;
  const w = opts.w ?? 1200;
  const h = opts.h ?? 420;
  const z = opts.z ?? 1;
  const out: El[] = [
    rect(prefix + "wood", x, y, w, h, "surface", { z, morphId: "plate" }),
    rect(prefix + "gutterL", x, y, 40, h, "bg", { z: z + 1, opacity: 0.5 }),
    rect(prefix + "gutterR", x + w - 40, y, 40, h, "bg", { z: z + 1, opacity: 0.5 }),
  ];
  for (let i = 0; i < 5; i++) {
    out.push(rect(prefix + "arrow" + i, x + 180 + i * 160, y + Math.round(h / 2) - 8, 80, 16, "accent", { z: z + 2, morphId: i === 0 ? "accent" : undefined }));
  }
  return out;
}

type PinOpts = { x?: number; y?: number; size?: number; z?: number };

/** Tenpin triangle (7 visible chips for clarity). */
export function pinSet(prefix: string, opts: PinOpts = {}): El[] {
  const x0 = opts.x ?? 1100;
  const y0 = opts.y ?? 180;
  const size = opts.size ?? 56;
  const z = opts.z ?? 2;
  const rows = [1, 2, 3, 4];
  const out: El[] = [];
  let n = 0;
  rows.forEach((count, r) => {
    const rowW = count * (size + 12);
    const startX = x0 - Math.round(rowW / 2);
    for (let c = 0; c < count; c++) {
      out.push(
        circle(prefix + "pin" + n, startX + c * (size + 12), y0 + r * (size + 10), size, n === 0 ? "accent" : "ink", {
          z,
          opacity: n === 0 ? 1 : 0.55,
          morphId: n === 0 ? "accent" : n === 1 ? "plate" : undefined,
        })
      );
      n++;
    }
  });
  return out;
}

type ScoreOpts = { x?: number; y?: number; frames?: number; z?: number };

/** Bowling score frame boxes. */
export function scoreBox(prefix: string, opts: ScoreOpts = {}): El[] {
  const frames = opts.frames ?? 5;
  const x = opts.x ?? 80;
  const y = opts.y ?? 700;
  const z = opts.z ?? 2;
  const w = 220;
  const gap = 16;
  return Array.from({ length: frames }, (_, i) =>
    rect(prefix + "frame" + i, x + i * (w + gap), y, w, 120, i === frames - 1 ? "accent" : "surface", {
      z,
      morphId: i === 0 ? "plate" : undefined,
    })
  );
}

type CombOpts = { x?: number; y?: number; cols?: number; rows?: number; size?: number; z?: number };

/** Honeycomb cell cluster (circle proxies). */
export function combCell(prefix: string, opts: CombOpts = {}): El[] {
  const cols = opts.cols ?? 4;
  const rows = opts.rows ?? 3;
  const size = opts.size ?? 90;
  const x0 = opts.x ?? 900;
  const y0 = opts.y ?? 180;
  const z = opts.z ?? 1;
  const out: El[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const ox = r % 2 ? Math.round(size / 2) : 0;
      out.push(
        circle(prefix + "cell" + i, x0 + c * (size + 8) + ox, y0 + r * (size * 0.78), size, i === 2 ? "accent" : "surface_color", {
          z,
          morphId: i === 2 ? "accent" : i === 0 ? "plate" : undefined,
        })
      );
    }
  }
  return out;
}

type JarOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Apothecary / honey jar label card. */
export function jarLabel(prefix: string, opts: JarOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 200;
  const w = opts.w ?? 520;
  const h = opts.h ?? 360;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "jar", x, y, w, h, "surface", { z, morphId: "titlePlate" }),
    rect(prefix + "band", x, y + Math.round(h * 0.35), w, Math.round(h * 0.28), "accent", { z: z + 1, morphId: "plate", opacity: 0.85 }),
  ];
}

type HiveOpts = { x?: number; y?: number; count?: number; w?: number; z?: number };

/** Soft hive shelf bars. */
export function hiveBar(prefix: string, opts: HiveOpts = {}): El[] {
  const count = opts.count ?? 4;
  const x = opts.x ?? 80;
  const y = opts.y ?? 620;
  const w = opts.w ?? 700;
  const z = opts.z ?? 2;
  return Array.from({ length: count }, (_, i) =>
    rect(prefix + "bar" + i, x, y + i * 48, w - i * 40, 28, i === 0 ? "accent" : "surface_color", {
      z,
      morphId: i === 0 ? "accent" : undefined,
    })
  );
}

type MagOpts = { x?: number; y?: number; count?: number; z?: number };

/** Newsstand magazine spine stack. */
export function magazineSpine(prefix: string, opts: MagOpts = {}): El[] {
  const count = opts.count ?? 7;
  const x = opts.x ?? 80;
  const y = opts.y ?? 160;
  const z = opts.z ?? 1;
  const widths = [70, 54, 88, 60, 76, 50, 82];
  let cursor = x;
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const w = widths[i % widths.length];
    out.push(
      rect(prefix + "spine" + i, cursor, y, w, 560 - (i % 3) * 30, i % 3 === 0 ? "accent" : i % 2 ? "surface" : "surface_color", {
        z,
        morphId: i === 0 ? "plate" : i === 3 ? "accent" : undefined,
      })
    );
    cursor += w + 10;
  }
  return out;
}

type MastOpts = { x?: number; y?: number; w?: number; z?: number };

/** Editorial masthead double rule. */
export function mastheadRule(prefix: string, opts: MastOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 120;
  const w = opts.w ?? 900;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "thick", x, y, w, 6, "ink", { z, morphId: "accent" }),
    rect(prefix + "thin", x, y + 14, w, 2, "accent", { z }),
  ];
}

type IssueOpts = { x?: number; y?: number; size?: number; z?: number };

/** Magazine issue badge. */
export function issueBadge(prefix: string, opts: IssueOpts = {}): El[] {
  const size = opts.size ?? 160;
  const x = opts.x ?? 1320;
  const y = opts.y ?? 80;
  const z = opts.z ?? 3;
  return [circle(prefix + "badge", x, y, size, "accent", { z, morphId: "accent", shapeTreatment: "depth" })];
}

type GlassOpts = { x?: number; y?: number; w?: number; h?: number; z?: number; photoExtras?: El };

/** Museum vitrine glass frame with inset photo. */
export function glassPane(prefix: string, opts: GlassOpts = {}): El[] {
  const x = opts.x ?? 200;
  const y = opts.y ?? 80;
  const w = opts.w ?? 1200;
  const h = opts.h ?? 620;
  const z = opts.z ?? 1;
  return [
    rect(prefix + "frame", x, y, w, h, "surface_color", { z, morphId: "plate" }),
    rect(prefix + "glass", x + 28, y + 28, w - 56, h - 56, "bg", { z: z + 1, opacity: 0.35 }),
    photo(prefix + "photo", x + 48, y + 48, w - 96, h - 96, { zoom: 1.1, z: z + 2, ...(opts.photoExtras || {}) }),
  ];
}

type PlinthOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Gallery plinth block. */
export function plinthBlock(prefix: string, opts: PlinthOpts = {}): El[] {
  const x = opts.x ?? 520;
  const y = opts.y ?? 720;
  const w = opts.w ?? 560;
  const h = opts.h ?? 100;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "plinth", x, y, w, h, "surface", { z, morphId: "plate" }),
    rect(prefix + "edge", x, y, w, 12, "accent", { z: z + 1, morphId: "accent" }),
  ];
}

type RailOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Wall caption plaque. */
export function captionRail(prefix: string, opts: RailOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 740;
  const w = opts.w ?? 520;
  const h = opts.h ?? 100;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "rail", x, y, w, h, "surface", { z, morphId: "titlePlate" }),
    rect(prefix + "tick", x, y, 8, h, "accent", { z: z + 1, morphId: "accent" }),
  ];
}

type ClipOpts = { x?: number; y?: number; w?: number; z?: number };

/** Metal dossier binder clip. */
export function clipBar(prefix: string, opts: ClipOpts = {}): El[] {
  const x = opts.x ?? 680;
  const y = opts.y ?? 40;
  const w = opts.w ?? 240;
  const z = opts.z ?? 4;
  return [
    rect(prefix + "clip", x, y, w, 48, "accent", { z, morphId: "accent" }),
    rect(prefix + "jaw", x + 20, y + 48, w - 40, 28, "ink", { z: z + 1, opacity: 0.55 }),
  ];
}

type TabOpts = { x?: number; y?: number; count?: number; z?: number };

/** Side index tabs. */
export function tabIndex(prefix: string, opts: TabOpts = {}): El[] {
  const count = opts.count ?? 5;
  const x = opts.x ?? 1480;
  const y = opts.y ?? 160;
  const z = opts.z ?? 2;
  return Array.from({ length: count }, (_, i) =>
    rect(prefix + "tab" + i, x, y + i * 110, 100, 90, i === 0 ? "accent" : "surface_color", {
      z,
      morphId: i === 0 ? "accent" : i === 1 ? "plate" : undefined,
    })
  );
}

type SheetOpts = { x?: number; y?: number; w?: number; h?: number; stack?: number; z?: number };

/** Stacked dossier sheets. */
export function folioSheet(prefix: string, opts: SheetOpts = {}): El[] {
  const x = opts.x ?? 160;
  const y = opts.y ?? 100;
  const w = opts.w ?? 1100;
  const h = opts.h ?? 680;
  const stack = opts.stack ?? 3;
  const z = opts.z ?? 1;
  const out: El[] = [];
  for (let i = 0; i < stack; i++) {
    out.push(
      rect(prefix + "sheet" + i, x + i * 16, y + i * 12, w, h, i === stack - 1 ? "surface" : "surface_color", {
        z: z + i,
        morphId: i === stack - 1 ? "titlePlate" : i === 0 ? "plate" : undefined,
      })
    );
  }
  return out;
}

type CubeOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** White-cube wall field. */
export function whiteCube(prefix: string, opts: CubeOpts = {}): El[] {
  const x = opts.x ?? 0;
  const y = opts.y ?? 0;
  const w = opts.w ?? 1600;
  const h = opts.h ?? 900;
  const z = opts.z ?? 0;
  return [
    rect(prefix + "wall", x, y, w, h, "bg", { z }),
    rect(prefix + "base", x, y + h - 80, w, 80, "surface", { z: z + 1, morphId: "plate" }),
  ];
}

type LabelOpts = { x?: number; y?: number; w?: number; h?: number; z?: number };

/** Museum wall didactic label. */
export function wallLabel(prefix: string, opts: LabelOpts = {}): El[] {
  const x = opts.x ?? 80;
  const y = opts.y ?? 620;
  const w = opts.w ?? 420;
  const h = opts.h ?? 180;
  const z = opts.z ?? 3;
  return [
    rect(prefix + "label", x, y, w, h, "surface", { z, morphId: "titlePlate" }),
    rect(prefix + "rule", x + 24, y + 28, 80, 4, "accent", { z: z + 1, morphId: "accent" }),
  ];
}

type PedOpts = { x?: number; y?: number; count?: number; gap?: number; size?: number; z?: number };

/** Floor pedestal marker dots. */
export function pedestalDot(prefix: string, opts: PedOpts = {}): El[] {
  const count = opts.count ?? 4;
  const x = opts.x ?? 400;
  const y = opts.y ?? 820;
  const gap = opts.gap ?? 220;
  const size = opts.size ?? 28;
  const z = opts.z ?? 2;
  return Array.from({ length: count }, (_, i) =>
    circle(prefix + "dot" + i, x + i * gap, y, size, i === 0 ? "accent" : "ink", {
      z,
      opacity: i === 0 ? 1 : 0.35,
      morphId: i === 0 ? "accent" : undefined,
    })
  );
}

type RackOpts = { x?: number; y?: number; slots?: number; z?: number };

/** Printmaker plate rack slots. */
export function plateRack(prefix: string, opts: RackOpts = {}): El[] {
  const slots = opts.slots ?? 6;
  const x = opts.x ?? 80;
  const y = opts.y ?? 160;
  const z = opts.z ?? 1;
  const out: El[] = [rect(prefix + "shelf", x, y + 480, slots * 160 + 40, 40, "surface_color", { z, morphId: "plate" })];
  for (let i = 0; i < slots; i++) {
    out.push(
      rect(prefix + "slot" + i, x + 20 + i * 160, y, 120, 480, i % 2 ? "surface" : "ink", {
        z: z + 1,
        opacity: i % 2 ? 1 : 0.2,
        morphId: i === 0 ? "accent" : undefined,
      })
    );
  }
  return out;
}

type WellOpts = { x?: number; y?: number; size?: number; z?: number };

/** Ink well. */
export function inkWell(prefix: string, opts: WellOpts = {}): El[] {
  const size = opts.size ?? 160;
  const x = opts.x ?? 1320;
  const y = opts.y ?? 640;
  const z = opts.z ?? 3;
  const inner = Math.round(size * 0.55);
  return [
    circle(prefix + "well", x, y, size, "ink", { z, morphId: "accent" }),
    circle(prefix + "pool", x + Math.round((size - inner) / 2), y + Math.round((size - inner) / 2), inner, "accent", {
      z: z + 1,
      opacity: 0.85,
    }),
  ];
}

type PullOpts = { x?: number; y?: number; w?: number; h?: number; z?: number; photoExtras?: El };

/** Fresh print pull mat. */
export function pullPrint(prefix: string, opts: PullOpts = {}): El[] {
  const x = opts.x ?? 420;
  const y = opts.y ?? 100;
  const w = opts.w ?? 760;
  const h = opts.h ?? 560;
  const z = opts.z ?? 2;
  return [
    rect(prefix + "mat", x, y, w, h, "surface", { z, morphId: "plate" }),
    photo(prefix + "photo", x + 40, y + 40, w - 80, h - 120, { zoom: 1.15, z: z + 1, ...(opts.photoExtras || {}) }),
    rect(prefix + "edge", x + 40, y + h - 60, w - 80, 20, "accent", { z: z + 2 }),
  ];
}

/** Serialize catalog for gallery / routing docs. */
export function selCatalogJson() {
  return {
    version: 1,
    rule: "Every creative family owns 3–5 named SEL units; identical sets across families are rejected.",
    units: Object.values(SEL_UNITS),
    families: FAMILY_SEL,
  };
}
