/** Opt-in decoration pass. Never shrinks or moves content to make room for motion. */
const { allowsAmbientOnSlide } = require("./ambient");

export const WAVE_STYLES = {
  subtle: { height: 80, durationMs: 12000 },
  balanced: { height: 130, durationMs: 10000 },
  expressive: { height: 180, durationMs: 8000 },
};
export type WaveDesignOptions = {
  style?: keyof typeof WAVE_STYLES;
  mode?: "animated" | "static";
  roles?: string[];
  maxSlides?: number;
};

export function applyWaveDesign(deck: any, options?: WaveDesignOptions | false): any {
  if (!options) return deck;
  const style = options.style || "subtle";
  if (!WAVE_STYLES[style]) throw Error("Unknown wave style: " + style);
  const preset = WAVE_STYLES[style];
  const mode = options.mode || "animated";
  if (!["animated", "static"].includes(mode)) throw Error("Unknown wave mode: " + mode);
  const max = options.maxSlides ?? 3;
  if (!Number.isInteger(max) || max < 0) throw Error("wave.maxSlides must be a nonnegative integer");
  const roles = options.roles || ["cover", "section", "divider", "closing"];
  const sequence = deck.layoutSequence || [];
  const report: any[] = [];
  let used = 0;
  let last = -2;
  sequence.forEach((id: string, index: number) => {
    const layout = deck.layouts[id];
    const elements = layout.elements || [];
    const existing = elements.find((e: any) => e.waveDecoration);
    // Idempotent: update our own decoration and motion without touching authored waves.
    if (existing) {
      layout.elements = elements.filter((e: any) => !e.waveDecoration);
      if (layout.motion?.ambient?.morphId === existing.morphId) delete layout.motion.ambient;
    }
    const els = layout.elements || [];
    let reason = "";
    if (!roles.includes(layout.role)) reason = "role";
    else if (used >= max || index === last + 1) reason = "frequency";
    else if (!allowsAmbientOnSlide(layout, deck.layouts[sequence[index + 1]])) reason = "motion-policy";
    else if (layout.motion?.ambient || els.some((e: any) => e.shapeContent?.kind === "wave" || e.morphId === "wave")) reason = "existing-motion-or-wave";
    // Conservative bounding boxes include photos, groups, footnotes and other ornaments.
    // A full-slide background plate alone is safe to draw over.
    else if (els.some((e: any) => {
      const background = e.type === "shape" && e.x === 0 && e.y === 0 && e.width === 1600 && e.height === 900;
      return !background && e.x < 1600 && e.x + e.width > 0 && e.y < 900 && e.y + e.height > 900 - preset.height - 24;
    })) reason = "occupied-footer";
    if (reason) { report.push({layoutId:id, status:"skipped", reason}); return; }
    const wave = {
      id:"wave", morphId:"wave", type:"shape", waveDecoration:true,
      x:0, y:900-preset.height, width:2000, height:preset.height,
      zIndex:Math.max(0, ...els.map((e: any) => Number(e.zIndex) || 0)) + 1,
      shapeContent:{kind:"wave",fill:deck.tokens?.color?.accent || "#61CDB5",cornerRadius:0},
    };
    layout.elements.push(wave);
    layout.motion = layout.motion || {};
    if (mode === "animated") layout.motion.ambient = {
      effect:"waveLoop", kitId:"ambient/wave-loop", morphId:"wave",
      durationMs:preset.durationMs, autoReverse:false, repeatCount:"indefinite",
    };
    used++; last = index;
    report.push({layoutId:id,status:"applied",style,mode});
  });
  deck.engine = deck.engine || {};
  deck.engine.waveDesign = {options,report};
  return deck;
}

/** Shared CLI parser for catalog and lookbook generation. */
export function waveOptionsFromArgs(args: string[]): WaveDesignOptions | undefined {
  const flag = args.find(a => a.startsWith("--wave="));
  if (!flag) return undefined;
  const style = flag.slice(7) as keyof typeof WAVE_STYLES;
  if (!Object.prototype.hasOwnProperty.call(WAVE_STYLES, style)) throw Error("Use --wave=subtle, balanced, or expressive");
  return {style,mode:args.includes("--static-wave") ? "static" : "animated"};
}
