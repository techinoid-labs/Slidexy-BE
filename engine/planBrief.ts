export type BriefSlide = {
  title: string;
  note: string;
  counter?: { entrance: string; pickup: string; observation: string };
  routes?: [string, string];
  measurements?: { unit: string; values: { label: string; value: number }[] };
  rows?: string[][];
};
export type Brief = { artDirection?: "coffeehouse"; subject: string; audience: string; goal: string; slides: BriefSlide[] };

export function planBrief(brief: Brief) {
  if (!brief.slides.length) throw Error("A brief needs at least one slide.");
  const families = [
    { id: "transit-diagram", name: "Transit Diagram", words: /\b(queue|pickup|queues|handoff|routes?|flow|operations)\b/gi, bg: "#FFF9E9", ink: "#172847", accent: "#207F89", font: "Arial" },
    { id: "financial-ledger", name: "Financial Ledger", words: /\b(finance|budget|costs?|margin|profit|accountants?|investors?)\b/gi, bg: "#E9EEE8", ink: "#183A36", accent: "#397262", font: "Consolas" },
    { id: "swiss-poster", name: "Swiss Poster", words: /\b(campaign|poster|launch|awareness|festival)\b/gi, bg: "#F1F0E7", ink: "#101112", accent: "#ED422C", font: "Arial" }
  ];
  const scores = families.map(family => ({
    family,
    score: [brief.subject,brief.audience,brief.goal].reduce((sum,field,i) =>
      sum + (field.match(family.words) || []).length * [2,1,3][i], 0)
  })).sort((a,b) => b.score-a.score);
  const family = scores[0].score ? scores[0].family : families[2];
  const selections: {role:string;variant:string}[] = [];
  const slides = brief.slides.map((source,index) => {
    if (!source.title || !source.note) throw Error("Missing title or note on slide " + (index+1));
    const structures = [source.measurements,source.rows,source.routes,source.counter].filter(Boolean);
    if (structures.length > 1) throw Error("Use one primary visual per slide.");
    let role = "feature", variant = "brief-statement";
    const slide:any = {title:source.title,caption:source.note};
    if (source.measurements) {
      const {values,unit} = source.measurements;
      if (!unit || values.length < 2 || values.some(v=>!v.label || !Number.isFinite(v.value))) throw Error("A comparison requires labeled values and a common unit.");
      variant = "brief-bars";
      slide.caption = values.map(v => v.label + " " + v.value + " " + unit).join(" / ") + ". " + source.note;
      slide.chart = {type:"bar",labels:values.map(v=>v.label),series:[{name:unit,values:values.map(v=>v.value)}],showLegend:false};
    } else if (source.rows) {
      if (source.rows.length < 2 || !source.rows[0].length || source.rows.some(row=>row.length!==source.rows![0].length)) throw Error("Expected a rectangular table with a header.");
      variant = "brief-table"; slide.table = source.rows;
    } else if (source.routes) {
      if(source.routes.length!==2 || source.routes.some(s=>!s)) throw Error("Expected two labeled branches.");
      variant = "concept-transit-diagram-comparison"; slide.items = [...source.routes,source.note];
    } else if (source.counter) {
      variant = "brief-counter-plan";
      slide.items = [source.counter.entrance,source.counter.pickup,source.counter.observation];
    } else { role = "cover"; }
    if (brief.artDirection === "coffeehouse" && family.id === "transit-diagram") {
      if (source.counter) variant = "cafe-plan";
      else if (source.routes) variant = "cafe-junction";
      else if (source.rows) variant = "cafe-pilot";
      else if (source.measurements?.values.length === 2) {
        variant = "cafe-wait";
        const [before, after] = source.measurements.values;
        const delta = Number((after.value - before.value).toFixed(2));
        slide.items = [(delta > 0 ? "+" : "") + delta + " " + source.measurements.unit];
      } else if (index === 0 && role === "cover") {
        variant = "cafe-pour";
        slide.photoQuery = "cafe-latte-pour";
      }
    }
    selections.push({role,variant});
    return {...slide,role,variantHint:variant};
  });
  if (brief.artDirection === "coffeehouse" && family.id === "transit-diagram") Object.assign(family, { bg:"#FFF3D9", ink:"#31201E", accent:"#F39855" });
  return {family:family.name,brand:{colors:{bg:family.bg,surface:family.bg,surface_color:family.bg,ink:family.ink,accent:family.accent,line:family.ink,muted:family.ink},fonts:{display:family.font,body:"Arial"}},selections,spec:{style:{palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"},slides}};
}


