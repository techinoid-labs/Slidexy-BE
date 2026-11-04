/**
 * Consulting breakdown — pull the strongest number/phrase as a hero stat.
 */
const { stripHighlightMarkers } = require("./highlight");

export type HeroStatResult = {
  hero: string;
  support: string;
  kind: "metric" | "phrase";
};

const METRIC_RE =
  /(?:\$\d[\d,]*(?:\.\d+)?[MBK]?|(?:−|-)?\d[\d,]*(?:\.\d+)?%|\d+\s*(?:pts?|days?|months?|years?|x)\b)/i;

const HERO_PLACEHOLDER = "[Number]";

function cleanSupport(raw: string, metric: string, plain: string): string {
  let support = raw
    .replace(metric, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,:;\s—–-]+|[,:;\s—–-]+$/g, "")
    .trim();
  if (support.length < 12) {
    support = plain.replace(metric, "").replace(/\s{2,}/g, " ").trim();
  }
  // Never leave raw asterisks in support if markers broke
  support = support.replace(/\*{2,}/g, "").replace(/\s{2,}/g, " ").trim();
  return support;
}

/**
 * Extract the most important number from dense prose.
 * If no metric is found, hero is "[Number]" — never asterisks or glued markup.
 */
export function extractHeroStat(paragraph: string): HeroStatResult {
  const raw = String(paragraph || "").trim();
  const text = stripHighlightMarkers(raw);
  if (!text) return { hero: HERO_PLACEHOLDER, support: "", kind: "phrase" };

  const metric = text.match(METRIC_RE);
  if (metric && metric[0]) {
    const hero = metric[0].trim();
    if (!hero || /[*]/.test(hero)) {
      return { hero: HERO_PLACEHOLDER, support: text, kind: "phrase" };
    }
    return {
      hero,
      support: cleanSupport(raw, metric[0], text),
      kind: "metric",
    };
  }

  // No reliable number — placeholder instead of phrase/asterisk glitch
  return {
    hero: HERO_PLACEHOLDER,
    support: text.replace(/\*{1,}/g, "").replace(/\s{2,}/g, " ").trim(),
    kind: "phrase",
  };
}

module.exports = { extractHeroStat, HERO_PLACEHOLDER };
