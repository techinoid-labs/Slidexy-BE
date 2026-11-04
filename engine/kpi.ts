/**
 * Data-to-deck: structured KPI JSON → Stats slide with hierarchy.
 * Highest numeric magnitude → hero (stats[0] for stats/c); smallest → secondary.
 */

export type KpiInput = {
  value: number | string;
  label: string;
  suffix?: string;
  prefix?: string;
};

export type FormattedStat = {
  value: string;
  label: string;
  numeric: number;
};

function toNumber(raw: number | string): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw || "").trim().replace(/,/g, "");
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function compactNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    const v = num / 1_000_000;
    return (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + "m";
  }
  if (Math.abs(num) >= 1000) {
    const v = num / 1000;
    return (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + "k";
  }
  if (Number.isInteger(num) || Math.abs(num - Math.round(num)) < 1e-9) {
    return String(Math.round(num));
  }
  // Keep one decimal for ratings like 4.9 / 99.98
  const rounded = Math.round(num * 100) / 100;
  return String(rounded);
}

/** Compact display: 50000 → 50k, $2400000 → $2.4m; honor suffix like % / x / d. */
export function formatKpiValue(item: KpiInput): string {
  const num = toNumber(item.value);
  const suffix = item.suffix != null ? String(item.suffix) : "";
  const prefix = item.prefix != null ? String(item.prefix) : "";
  // Suffixes (% / x / d / wk) keep the raw magnitude; prefixes ($) still compact large nums.
  let core: string;
  if (suffix) {
    core =
      Number.isInteger(num) || Math.abs(num - Math.round(num)) < 1e-9
        ? String(Math.round(num))
        : String(Math.round(num * 100) / 100);
  } else {
    core = compactNumber(num);
  }
  return prefix + core + suffix;
}

export function ingestKpis(raw: KpiInput[] | string): FormattedStat[] {
  const list: KpiInput[] = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(list) || !list.length) {
    throw new Error("KPI input must be a non-empty JSON array");
  }
  const formatted = list.map((item) => ({
    value: formatKpiValue(item),
    label: String(item.label || "Metric").trim() || "Metric",
    numeric: Math.abs(toNumber(item.value)),
  }));
  // Hierarchy: highest → hero (index 0), smallest last
  formatted.sort((a, b) => b.numeric - a.numeric);
  return formatted.slice(0, 3);
}

/** Build / patch a DeckSpec stats slide from KPI array. */
export function kpisToStatsSlide(
  kpis: KpiInput[] | string,
  opts?: { title?: string }
): {
  role: "stats";
  variantHint: "c";
  title: string;
  stats: Array<{ value: string; label: string }>;
} {
  const ordered = ingestKpis(kpis);
  return {
    role: "stats",
    variantHint: "c",
    title: (opts && opts.title) || "Impact",
    stats: ordered.map((s) => ({ value: s.value, label: s.label })),
  };
}

/** Replace or insert stats slide on a DeckSpec. */
export function applyKpisToSpec(spec: any, kpis: KpiInput[] | string, opts?: { title?: string }): any {
  const slide = kpisToStatsSlide(kpis, opts);
  const slides = (spec.slides || []).slice();
  const idx = slides.findIndex((s: any) => s.role === "stats");
  if (idx >= 0) slides[idx] = { ...slides[idx], ...slide };
  else {
    const closeIdx = slides.findIndex((s: any) => s.role === "closing");
    if (closeIdx >= 0) slides.splice(closeIdx, 0, slide);
    else slides.push(slide);
  }
  return { ...spec, slides };
}

module.exports = {
  formatKpiValue,
  ingestKpis,
  kpisToStatsSlide,
  applyKpisToSpec,
};
