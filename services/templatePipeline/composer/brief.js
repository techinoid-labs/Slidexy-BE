/**
 * Composer brief: plan first, then copy against the repaired plan.
 * Copy is keyed by slide index so duplicate roles cannot collide.
 */

const { askModel, COPY_RULES, clampCopy } = require("../thematic");

function pickIndex(seed, count) {
  let hash = 2166136261;
  const text = String(seed || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % Math.max(1, count);
}

function parseJson(raw) {
  const text = String(raw || "");
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  if (start < 0) throw new Error("Brief was not JSON");
  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;
  for (let i = start; i < body.length; i += 1) {
    const ch = body[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") { inString = true; continue; }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) throw new Error("Brief was not JSON");
  return JSON.parse(body.slice(start, end + 1));
}

function expandSlotKeys(slots) {
  const keys = [];
  (slots || []).forEach((slot) => {
    const repeat = Number(slot.repeat) || 0;
    const optionalFrom = Number(slot.optionalFrom) || 0;
    if (repeat > 0) {
      for (let i = 1; i <= repeat; i += 1) {
        keys.push({
          key: slot.dataRole + "-" + i,
          dataRole: slot.dataRole,
          maxChars: slot.maxChars,
          optional: Boolean(slot.optional) || (optionalFrom > 0 && i >= optionalFrom),
          index: i,
        });
      }
    } else {
      keys.push({
        key: slot.dataRole,
        dataRole: slot.dataRole,
        maxChars: slot.maxChars,
        optional: Boolean(slot.optional) || slot.dataRole === "kicker",
        index: 0,
      });
    }
  });
  return keys;
}

function allowedComponentsForRole(manifest, role) {
  return (manifest.components || []).filter((c) => (c.roles || []).indexOf(role) >= 0);
}

function componentHasPhoto(comp, variant) {
  if (!comp) return false;
  const slots = comp.photoSlots || [];
  if (!slots.length) return false;
  return slots.some((slot) => {
    if (slot.optional && Array.isArray(slot.variants) && slot.variants.indexOf(variant) < 0) return false;
    if (slot.optional && Array.isArray(slot.variants) && !slot.variants.length) return false;
    if (!slot.optional) return true;
    if (!slot.variants) return true;
    return slot.variants.indexOf(variant) >= 0;
  });
}

function slotsForSlide(manifest, slide) {
  const comp = (manifest.components || []).find((c) => c.id === slide.component);
  return expandSlotKeys(comp && comp.slots);
}

function defaultPlan() {
  return [
    { role: "Cover", component: "cover", variant: "word" },
    { role: "Contents", component: "agenda", variant: "numbered-list" },
    { role: "About", component: "split-copy", variant: "photo-right" },
    { role: "Problem", component: "statement", variant: "left" },
    { role: "Solution", component: "split-copy", variant: "photo-left" },
    { role: "Proof", component: "big-number", variant: "left" },
    { role: "Model", component: "process", variant: "three-step" },
    { role: "People", component: "team-grid", variant: "three" },
    { role: "Close", component: "close", variant: "plain" },
  ];
}

function planPrompt(prompt, direction, manifest) {
  const components = (manifest.components || []).map((c) => ({
    id: c.id,
    variants: c.variants,
    roles: c.roles,
  }));
  return [
    "Invent a 9 to 11 slide presentation PLAN only (no copy) for: " + JSON.stringify(prompt) + ".",
    "Brand context: " + JSON.stringify(direction && direction.profile ? direction.profile : {}) + ".",
    "Mood: " + JSON.stringify(direction && direction.mood ? direction.mood : "") + ".",
    "Use only these kit components: " + JSON.stringify(components) + ".",
    "paletteBucket must be one of " + JSON.stringify(manifest.paletteBuckets) + ".",
    "fontPair must be one of " + JSON.stringify(manifest.fontPairs) + ".",
    "density must be one of " + JSON.stringify(manifest.densities) + ".",
    "coverPattern must be one of " + JSON.stringify(manifest.coverPatterns || []) + ".",
    "signature must be one of " + JSON.stringify(manifest.signatures || []) + ".",
    "Hard plan rules: Cover first, Close last; include Contents; 9–11 slides;",
    "at least three of About/Problem/Solution; at least one of Proof/Market; at least one of Model/People/Next;",
    "no role except About/Problem/Solution appears twice; exactly one accentRole;",
    "accent-block divider only on the accentRole slide; at least one statement/big-number/divider;",
    "no two consecutive slides with the same component+variant; at most half the slides carry a photo.",
    "Return JSON only: { plan:[{role,component,variant}], accentRole, paletteBucket, fontPair, density, coverPattern, signature, mood }.",
  ].join("\n");
}

function copyPrompt(prompt, direction, finalPlan, manifest) {
  const slides = (finalPlan.plan || []).map((slide, index) => {
    const slots = slotsForSlide(manifest, slide).map((s) => ({
      key: s.key,
      maxChars: s.maxChars,
      optional: s.optional || undefined,
    }));
    return {
      index,
      role: slide.role,
      component: slide.component,
      variant: slide.variant,
      slots,
    };
  });
  return [
    "Write slide copy for: " + JSON.stringify(prompt) + ".",
    "Brand: " + JSON.stringify(direction && direction.profile ? direction.profile : {}) + ".",
    "Mood: " + JSON.stringify(finalPlan.mood || (direction && direction.mood) || "") + ".",
    "Use this FINAL plan only (do not change roles/components/variants): " + JSON.stringify(slides) + ".",
    "Return JSON keyed by slide index as strings: { \"0\": { slotKey: string, ... }, \"1\": { ... } }.",
    "Every required slot must be a non-empty string within maxChars (listed inline per slot); longer copy will be cut.",
    "Optional slots may be omitted. Do NOT invent placeholder filler; write real copy for the brand.",
    COPY_RULES.join(" "),
  ].join("\n");
}

function copyFillPrompt(prompt, empties) {
  return [
    "Fill ONLY these empty slide slots for: " + JSON.stringify(prompt) + ".",
    "Slots: " + JSON.stringify(empties) + ".",
    "Return JSON keyed by slide index: { \"<index>\": { \"<slotKey>\": string } } with strings within each maxChars.",
    "Longer copy will be cut. No placeholders.",
  ].join("\n");
}

async function planBrief(prompt, direction, manifest, nonce, deps) {
  const ask = (deps && deps.askModel) || askModel;
  const planFn = (deps && deps.planBrief) || null;
  if (planFn) return planFn(prompt, direction, manifest, nonce, deps);
  const result = await ask(planPrompt(prompt, direction, manifest));
  return parseJson(result.text);
}

async function copyBrief(prompt, direction, finalPlan, manifest, deps) {
  const ask = (deps && deps.askModel) || askModel;
  const copyFn = (deps && deps.copyBrief) || null;
  if (copyFn) return copyFn(prompt, direction, finalPlan, manifest, deps);
  const result = await ask(copyPrompt(prompt, direction, finalPlan, manifest));
  return parseJson(result.text);
}

async function copyFill(prompt, empties, deps) {
  const ask = (deps && deps.askModel) || askModel;
  const fillFn = (deps && deps.copyFill) || null;
  if (fillFn) return fillFn(prompt, empties, deps);
  const result = await ask(copyFillPrompt(prompt, empties));
  return parseJson(result.text);
}

const APS_ROLES = { About: true, Problem: true, Solution: true };
const PROOF_ROLES = { Proof: true, Market: true };
const LATE_ROLES = { Model: true, People: true, Next: true };

/** Start of narrative band: immediately after Contents (or after Cover if Contents missing). */
function narrativeBandStart(plan) {
  const contentsIdx = plan.findIndex((s) => s.role === "Contents");
  if (contentsIdx >= 0) return contentsIdx + 1;
  return plan[0] && plan[0].role === "Cover" ? 1 : 0;
}

/** End of narrative band (exclusive): first Proof/Market, else first Model/People/Next, else Close. */
function narrativeBandEnd(plan) {
  const start = narrativeBandStart(plan);
  let before = plan.findIndex((s, i) => i >= start && PROOF_ROLES[s.role]);
  if (before < 0) before = plan.findIndex((s, i) => i >= start && LATE_ROLES[s.role]);
  if (before < 0) before = plan.findIndex((s, i) => i >= start && s.role === "Close");
  if (before < 0) before = plan.length;
  return Math.max(start, Math.min(before, plan.length));
}

/** New APS inserts go at the start of the narrative band (typically index 2). */
function narrativeInsertAt(plan) {
  return narrativeBandStart(plan);
}

const APS_ORDER = { About: 0, Problem: 1, Solution: 2 };

/** Stable-sort APS slides inside the narrative band: About → Problem → Solution (repeats keep relative order). */
function sortNarrativeBand(plan, fallbacks) {
  const start = narrativeBandStart(plan);
  const end = narrativeBandEnd(plan);
  if (end <= start) return plan;
  const band = plan.slice(start, end);
  const aps = [];
  const others = [];
  band.forEach((slide, i) => {
    if (APS_ROLES[slide.role]) aps.push({ slide, i });
    else others.push({ slide, i });
  });
  if (aps.length < 2) return plan;
  const before = aps.map((x) => x.slide.role).join(">");
  aps.sort((a, b) => {
    const oa = APS_ORDER[a.slide.role];
    const ob = APS_ORDER[b.slide.role];
    if (oa !== ob) return oa - ob;
    return a.i - b.i;
  });
  const after = aps.map((x) => x.slide.role).join(">");
  if (before === after) return plan;
  // Rebuild band: non-APS keep absolute positions; APS fill APS slots in sorted order
  const apsSlots = band.map((s, i) => (APS_ROLES[s.role] ? i : -1)).filter((i) => i >= 0);
  const sorted = aps.map((x) => x.slide);
  const nextBand = band.slice();
  apsSlots.forEach((slot, idx) => { nextBand[slot] = sorted[idx]; });
  const next = plan.slice(0, start).concat(nextBand, plan.slice(end));
  fallbacks.push({
    field: "plan.narrativeSort",
    got: before,
    used: after,
    reason: "narrative band About → Problem → Solution; repeats keep relative order",
  });
  return next;
}

/** Move APS slides that sit after Model/People/Next into the narrative band (before Proof/Market). */
function relocateNarrativeRoles(plan, fallbacks) {
  let guard = 0;
  while (guard < plan.length) {
    guard += 1;
    const firstLate = plan.findIndex((s) => LATE_ROLES[s.role]);
    if (firstLate < 0) break;
    const bad = plan.findIndex((s, i) => i > firstLate && APS_ROLES[s.role]);
    if (bad < 0) break;
    const [slide] = plan.splice(bad, 1);
    // Place at end of current narrative band so existing APS stay in order ahead of the moved slide.
    const at = narrativeBandEnd(plan);
    plan.splice(at, 0, slide);
    fallbacks.push({
      field: "plan.narrativeOrder",
      got: slide.role + "@" + bad,
      used: String(at),
      reason: "narrative roles after Contents and before Proof/Market; never after Model/People/Next",
    });
  }
  return plan;
}

function normalizeSlide(manifest, slide, index, seed, fallbacks) {
  const role = String(slide && slide.role || "");
  const comps = allowedComponentsForRole(manifest, role);
  const list = comps.length ? comps : (manifest.components || []);
  let component = list.find((c) => c.id === (slide && slide.component)) || null;
  if (!component) {
    const ids = list.map((c) => c.id);
    const used = ids[pickIndex(seed + ":comp:" + index + ":" + String(slide && slide.component), Math.max(1, ids.length))] || ids[0];
    fallbacks.push({ field: "plan[" + index + "].component", got: slide && slide.component, used, reason: "component not allowed for role" });
    component = list.find((c) => c.id === used) || list[0];
  }
  let variant = slide && slide.variant;
  if (!component || (component.variants || []).indexOf(variant) < 0) {
    const variants = (component && component.variants) || ["word"];
    const used = variants[pickIndex(seed + ":var:" + index + ":" + String(variant), variants.length)];
    fallbacks.push({ field: "plan[" + index + "].variant", got: variant, used, reason: "variant not in component" });
    variant = used;
  }
  return {
    role: role || (component && component.roles[0]) || "About",
    component: component.id,
    variant,
  };
}

function validatePlan(raw, manifest, prompt, nonce) {
  const fallbacks = [];
  const seed = String(prompt || "") + "|" + String(nonce || "");
  const next = {
    plan: [],
    accentRole: raw && raw.accentRole,
    paletteBucket: raw && raw.paletteBucket,
    fontPair: raw && raw.fontPair,
    density: raw && raw.density,
    coverPattern: raw && raw.coverPattern,
    signature: raw && raw.signature,
    mood: raw && raw.mood,
  };

  function pick(field, got, list, reason) {
    const used = list[pickIndex(seed + ":" + field + ":" + String(got), list.length)];
    fallbacks.push({ field, got, used, reason: reason || undefined });
    return used;
  }

  const buckets = manifest.paletteBuckets || ["light-neutral"];
  if (buckets.indexOf(next.paletteBucket) < 0) next.paletteBucket = pick("paletteBucket", next.paletteBucket, buckets, "paletteBucket allowlist");

  const pairs = manifest.fontPairs || ["corp-calibri"];
  if (pairs.indexOf(next.fontPair) < 0) next.fontPair = pick("fontPair", next.fontPair, pairs, "fontPair allowlist");

  const densities = manifest.densities || ["balanced"];
  if (densities.indexOf(next.density) < 0) next.density = pick("density", next.density, densities, "density allowlist");

  const covers = manifest.coverPatterns || ["oversized"];
  if (covers.length && covers.indexOf(next.coverPattern) < 0) next.coverPattern = pick("coverPattern", next.coverPattern, covers, "coverPattern allowlist");

  const sigs = manifest.signatures || ["frame"];
  if (sigs.length && sigs.indexOf(next.signature) < 0) next.signature = pick("signature", next.signature, sigs, "signature allowlist");

  let plan = Array.isArray(raw && raw.plan) ? raw.plan.slice() : [];
  if (!plan.length) {
    plan = defaultPlan();
    fallbacks.push({ field: "plan", got: raw && raw.plan, used: "default-plan", reason: "empty plan" });
  }

  plan = plan.map((slide, index) => normalizeSlide(manifest, slide, index, seed, fallbacks));

  // Cover first
  if (!plan.length || plan[0].role !== "Cover") {
    const coverComp = (manifest.components || []).find((c) => c.id === "cover") || { id: "cover", variants: ["word"] };
    const existing = plan.findIndex((s) => s.role === "Cover");
    if (existing > 0) {
      const [c] = plan.splice(existing, 1);
      plan.unshift(c);
      fallbacks.push({ field: "plan.cover", got: "index=" + existing, used: "0", reason: "Cover must be first" });
    } else if (plan[0] && plan[0].role !== "Cover") {
      plan.unshift({ role: "Cover", component: coverComp.id, variant: (coverComp.variants || ["word"])[0] });
      fallbacks.push({ field: "plan.cover", got: plan[1] && plan[1].role, used: "Cover", reason: "Cover must be first" });
    }
  } else if (plan[0].component !== "cover") {
    plan[0].component = "cover";
    plan[0].variant = "word";
    fallbacks.push({ field: "plan[0].component", got: plan[0].component, used: "cover", reason: "Cover uses cover component" });
  }

  // Close last
  const closeComp = (manifest.components || []).find((c) => c.id === "close") || { id: "close", variants: ["plain"] };
  const closeIdx = plan.findIndex((s) => s.role === "Close");
  if (closeIdx < 0) {
    plan.push({ role: "Close", component: closeComp.id, variant: (closeComp.variants || ["plain"])[0] });
    fallbacks.push({ field: "plan.close", got: null, used: "Close", reason: "Close must be last" });
  } else if (closeIdx !== plan.length - 1) {
    const [c] = plan.splice(closeIdx, 1);
    plan.push(c);
    fallbacks.push({ field: "plan.close", got: "index=" + closeIdx, used: String(plan.length - 1), reason: "Close must be last" });
  }
  if (plan[plan.length - 1].component !== "close") {
    plan[plan.length - 1].component = "close";
    plan[plan.length - 1].variant = (closeComp.variants || ["plain"])[0];
    fallbacks.push({ field: "plan.close.component", got: plan[plan.length - 1].component, used: "close", reason: "Close uses close component" });
  }

  // Contents present
  if (!plan.some((s) => s.role === "Contents")) {
    const agenda = (manifest.components || []).find((c) => c.id === "agenda") || { id: "agenda", variants: ["numbered-list"] };
    plan.splice(1, 0, { role: "Contents", component: agenda.id, variant: (agenda.variants || ["numbered-list"])[0] });
    fallbacks.push({ field: "plan.contents", got: null, used: "Contents", reason: "Contents required" });
  }

  // Deduplicate non-APS roles (keep first)
  const seen = {};
  const deduped = [];
  plan.forEach((slide, index) => {
    if (!APS_ROLES[slide.role] && seen[slide.role]) {
      fallbacks.push({ field: "plan.duplicateRole", got: slide.role + "@" + index, used: "dropped", reason: "role may not repeat except About/Problem/Solution" });
      return;
    }
    seen[slide.role] = true;
    deduped.push(slide);
  });
  plan = deduped;

  // Ensure APS coverage (at least 3) — insert in the narrative band
  const apsHave = plan.filter((s) => APS_ROLES[s.role]).map((s) => s.role);
  ["About", "Problem", "Solution"].forEach((role) => {
    if (apsHave.indexOf(role) >= 0) return;
    if (apsHave.length >= 3) return;
    const comps = allowedComponentsForRole(manifest, role);
    const pick = comps[0] || { id: "split-copy", variants: ["photo-right"] };
    const insertAt = narrativeInsertAt(plan);
    plan.splice(insertAt, 0, { role, component: pick.id, variant: (pick.variants || ["photo-right"])[0] });
    apsHave.push(role);
    fallbacks.push({
      field: "plan.aps",
      got: null,
      used: role + "@" + insertAt,
      reason: "at least three of About/Problem/Solution; narrative after Contents before Proof/Market",
    });
  });
  while (plan.filter((s) => APS_ROLES[s.role]).length < 3) {
    const role = ["About", "Problem", "Solution"][plan.filter((s) => APS_ROLES[s.role]).length % 3];
    const comps = allowedComponentsForRole(manifest, role);
    const pick = comps.find((c) => c.id === "statement") || comps[0];
    const insertAt = narrativeInsertAt(plan);
    plan.splice(insertAt, 0, {
      role,
      component: pick.id,
      variant: (pick.variants || ["left"])[0],
    });
    fallbacks.push({
      field: "plan.aps",
      got: "count<" + 3,
      used: role + "@" + insertAt,
      reason: "at least three of About/Problem/Solution; narrative after Contents before Proof/Market",
    });
  }

  // Proof/Market
  if (!plan.some((s) => s.role === "Proof" || s.role === "Market")) {
    const comps = allowedComponentsForRole(manifest, "Proof");
    const pick = comps.find((c) => c.id === "big-number") || comps[0];
    plan.splice(Math.max(1, plan.length - 1), 0, {
      role: "Proof",
      component: pick.id,
      variant: (pick.variants || ["left"])[0],
    });
    fallbacks.push({ field: "plan.proofMarket", got: null, used: "Proof", reason: "at least one of Proof/Market" });
  }

  // Model/People/Next
  if (!plan.some((s) => s.role === "Model" || s.role === "People" || s.role === "Next")) {
    const comps = allowedComponentsForRole(manifest, "Model");
    const pick = comps.find((c) => c.id === "process") || comps[0];
    plan.splice(Math.max(1, plan.length - 1), 0, {
      role: "Model",
      component: pick.id,
      variant: (pick.variants || ["three-step"])[0],
    });
    fallbacks.push({ field: "plan.modelPeopleNext", got: null, used: "Model", reason: "at least one of Model/People/Next" });
  }

  // Accent moment component
  if (!plan.some((s) => s.component === "statement" || s.component === "big-number" || s.component === "divider")) {
    const mid = Math.max(1, Math.min(plan.length - 2, Math.floor(plan.length / 2)));
    const moment = (manifest.components || []).find((c) => c.id === "statement")
      || (manifest.components || []).find((c) => c.id === "divider");
    if (moment && (moment.roles || []).indexOf(plan[mid].role) >= 0) {
      fallbacks.push({ field: "plan.accentMoment", got: plan[mid].component, used: moment.id, reason: "at least one statement/big-number/divider" });
      plan[mid].component = moment.id;
      plan[mid].variant = (moment.variants || [])[0];
    }
  }

  // Length 9–11 — pad with About in the narrative band (not after Model/People/Next)
  while (plan.length < 9) {
    const role = "About";
    const comps = allowedComponentsForRole(manifest, role);
    const pick = comps.find((c) => c.id === "statement") || comps[0];
    const insertAt = narrativeInsertAt(plan);
    plan.splice(insertAt, 0, { role, component: pick.id, variant: (pick.variants || ["left"])[0] });
    fallbacks.push({
      field: "plan.length",
      got: plan.length - 1,
      used: "About@" + insertAt,
      reason: "9 to 11 slides; narrative after Contents before Proof/Market",
    });
  }
  while (plan.length > 11) {
    // Drop a middle non-Cover/Contents/Close slide
    let drop = -1;
    for (let i = plan.length - 2; i >= 2; i -= 1) {
      if (plan[i].role !== "Contents") { drop = i; break; }
    }
    if (drop < 0) break;
    fallbacks.push({ field: "plan.length", got: plan[drop].role, used: "dropped", reason: "9 to 11 slides" });
    plan.splice(drop, 1);
  }

  // Re-assert Cover first / Close last after inserts
  const coverAt = plan.findIndex((s) => s.role === "Cover");
  if (coverAt > 0) {
    const [c] = plan.splice(coverAt, 1);
    plan.unshift(c);
  }
  const closeAt = plan.findIndex((s) => s.role === "Close");
  if (closeAt >= 0 && closeAt !== plan.length - 1) {
    const [c] = plan.splice(closeAt, 1);
    plan.push(c);
  }

  // Move any APS that still sits after Model/People/Next into the narrative band
  plan = relocateNarrativeRoles(plan, fallbacks);

  // Sort narrative band About → Problem → Solution (repeats keep relative order)
  plan = sortNarrativeBand(plan, fallbacks);

  // Consecutive same component+variant
  for (let i = 1; i < plan.length; i += 1) {
    const prev = plan[i - 1];
    const cur = plan[i];
    if (prev.component === cur.component && prev.variant === cur.variant) {
      const comp = (manifest.components || []).find((c) => c.id === cur.component);
      const alts = ((comp && comp.variants) || []).filter((v) => v !== cur.variant);
      if (alts.length) {
        const used = alts[pickIndex(seed + ":dup-var:" + i, alts.length)];
        fallbacks.push({ field: "rhythm.duplicateVariant", got: cur.component + "/" + cur.variant, used, reason: "no consecutive same component+variant" });
        cur.variant = used;
      } else {
        const allowed = allowedComponentsForRole(manifest, cur.role).filter((c) => c.id !== cur.component);
        if (allowed.length) {
          const pickC = allowed[pickIndex(seed + ":dup-comp:" + i, allowed.length)];
          fallbacks.push({ field: "rhythm.duplicateComponent", got: cur.component, used: pickC.id, reason: "no consecutive same component+variant" });
          cur.component = pickC.id;
          cur.variant = (pickC.variants || [])[0] || cur.variant;
        }
      }
    }
  }

  // Photo cap (Cover counts toward half)
  const photoIdx = [];
  plan.forEach((slide, index) => {
    const comp = (manifest.components || []).find((c) => c.id === slide.component);
    if (componentHasPhoto(comp, slide.variant)) photoIdx.push(index);
  });
  const maxPhoto = Math.floor(plan.length / 2);
  while (photoIdx.length > maxPhoto) {
    const index = photoIdx.pop();
    if (index === 0) continue; // prefer dropping non-cover first; if only cover left, stop
    const slide = plan[index];
    const comp = (manifest.components || []).find((c) => c.id === slide.component);
    const plain = ((comp && comp.variants) || []).find((v) => !componentHasPhoto(comp, v));
    if (plain) {
      fallbacks.push({ field: "rhythm.photoCap", got: slide.component + "/" + slide.variant, used: plain, reason: "at most half slides carry a photo" });
      slide.variant = plain;
    } else {
      const allowed = allowedComponentsForRole(manifest, slide.role).filter((c) => !componentHasPhoto(c, (c.variants || [])[0]));
      if (allowed.length) {
        const pickC = allowed[0];
        fallbacks.push({ field: "rhythm.photoCap", got: slide.component, used: pickC.id, reason: "at most half slides carry a photo" });
        slide.component = pickC.id;
        slide.variant = (pickC.variants || [])[0];
      }
    }
  }

  // accentRole + accent-block only on that role
  const roles = plan.map((s) => s.role);
  let accent = next.accentRole;
  const accentSlide = plan.find((s) => s.role === accent);
  const accentOk = accent && roles.indexOf(accent) >= 0 && accentSlide
    && (accentSlide.component === "divider" || accentSlide.component === "big-number" || accentSlide.component === "statement");
  if (!accentOk) {
    const candidates = plan.filter((s) => s.component === "divider" || s.component === "big-number" || s.component === "statement");
    const pickS = candidates[pickIndex(seed + ":accentRole", Math.max(1, candidates.length))] || plan[Math.floor(plan.length / 2)];
    next.accentRole = pickS.role;
    fallbacks.push({ field: "accentRole", got: accent, used: next.accentRole, reason: "exactly one accentRole by hash" });
    accent = next.accentRole;
  }

  plan.forEach((slide, index) => {
    if (slide.component === "divider" && slide.variant === "accent-block" && slide.role !== next.accentRole) {
      slide.variant = "number";
      fallbacks.push({ field: "plan[" + index + "].variant", got: "accent-block", used: "number", reason: "accent-block divider only on accentRole" });
    }
  });
  const accentHit = plan.find((s) => s.role === next.accentRole);
  if (accentHit && accentHit.component === "divider" && accentHit.variant !== "accent-block") {
    fallbacks.push({ field: "rhythm.accentVariant", got: accentHit.variant, used: "accent-block", reason: "accentRole divider uses accent-block" });
    accentHit.variant = "accent-block";
  }

  next.plan = plan;
  return { plan: next, fallbacks };
}

function copyBlockForIndex(rawCopy, index, role) {
  if (!rawCopy || typeof rawCopy !== "object") return {};
  if (Object.prototype.hasOwnProperty.call(rawCopy, String(index))) {
    const block = rawCopy[String(index)];
    return block && typeof block === "object" ? block : {};
  }
  if (Object.prototype.hasOwnProperty.call(rawCopy, index)) {
    const block = rawCopy[index];
    return block && typeof block === "object" ? block : {};
  }
  // Legacy role-keyed copy (4f replay)
  if (role && rawCopy[role] && typeof rawCopy[role] === "object") return rawCopy[role];
  return {};
}

function validateCopy(rawCopy, finalPlan, manifest) {
  const fallbacks = [];
  const copy = {};
  (finalPlan.plan || []).forEach((slide, index) => {
    const keys = slotsForSlide(manifest, slide);
    const block = copyBlockForIndex(rawCopy, index, slide.role);
    const cleaned = {};
    keys.forEach((slot) => {
      let value = block[slot.key];
      if (value == null || value === "") {
        if (slot.optional) return;
        cleaned[slot.key] = "";
        return;
      }
      const raw = String(value);
      const max = slot.maxChars || 160;
      if (raw.length > max) {
        cleaned[slot.key] = clampCopy(raw.slice(0, max));
        fallbacks.push({
          field: "copy." + index + "." + slot.key,
          got: "len=" + raw.length,
          used: "clamped:" + max,
          reason: "over maxChars",
        });
      } else {
        cleaned[slot.key] = clampCopy(raw);
      }
    });
    copy[String(index)] = cleaned;
  });
  return { copy, fallbacks };
}

function listEmptySlots(finalPlan, copy, manifest) {
  const empties = [];
  (finalPlan.plan || []).forEach((slide, index) => {
    const block = (copy && copy[String(index)]) || {};
    slotsForSlide(manifest, slide).forEach((slot) => {
      if (slot.optional) return;
      const value = block[slot.key];
      if (value == null || String(value).trim() === "") {
        empties.push({
          index,
          role: slide.role,
          component: slide.component,
          variant: slide.variant,
          key: slot.key,
          maxChars: slot.maxChars,
        });
      }
    });
  });
  return empties;
}

function mergeCopyFill(copy, fill, empties, manifest, finalPlan) {
  const next = JSON.parse(JSON.stringify(copy || {}));
  const fallbacks = [];
  empties.forEach((slot) => {
    const block = copyBlockForIndex(fill, slot.index, slot.role);
    let value = block[slot.key];
    if (value == null || String(value).trim() === "") return;
    const raw = String(value);
    const max = slot.maxChars || 160;
    if (!next[String(slot.index)]) next[String(slot.index)] = {};
    if (raw.length > max) {
      next[String(slot.index)][slot.key] = clampCopy(raw.slice(0, max));
      fallbacks.push({ field: "copyFill." + slot.index + "." + slot.key, got: "len=" + raw.length, used: "clamped:" + max, reason: "copyFill clamp" });
    } else {
      next[String(slot.index)][slot.key] = clampCopy(raw);
      fallbacks.push({ field: "copyFill." + slot.index + "." + slot.key, got: "", used: "filled", reason: "copyFill" });
    }
  });
  // Re-validate shape
  const validated = validateCopy(next, finalPlan, manifest);
  return { copy: validated.copy, fallbacks: fallbacks.concat(validated.fallbacks) };
}

/** Remap index-keyed copy when validatePlan reorders/inserts slides (match by role+component+variant, then role). */
function remapCopyToPlan(oldPlan, oldCopy, newPlan) {
  const used = {};
  const next = {};
  (newPlan || []).forEach((slide, newIdx) => {
    let found = -1;
    for (let i = 0; i < (oldPlan || []).length; i += 1) {
      if (used[i]) continue;
      const prev = oldPlan[i];
      if (prev.role === slide.role && prev.component === slide.component && prev.variant === slide.variant) {
        found = i;
        break;
      }
    }
    if (found < 0) {
      for (let i = 0; i < (oldPlan || []).length; i += 1) {
        if (used[i]) continue;
        if (oldPlan[i].role === slide.role) {
          found = i;
          break;
        }
      }
    }
    if (found >= 0) {
      used[found] = true;
      next[String(newIdx)] = Object.assign({}, (oldCopy && (oldCopy[String(found)] || oldCopy[found])) || {});
    } else {
      next[String(newIdx)] = {};
    }
  });
  return next;
}

/**
 * Map a legacy 4f role-keyed brief into plan + index-keyed copy for --replay.
 * proof-4f-a / proof-4f-b remain replayable this way.
 */
function migrateLegacyBrief(stored) {
  if (!stored || typeof stored !== "object") return stored;
  const next = JSON.parse(JSON.stringify(stored));
  if (!next.plan) return next;
  const legacy = next.copy && typeof next.copy === "object" ? next.copy : {};
  const keyed = {};
  let looksLegacy = false;
  Object.keys(legacy).forEach((key) => {
    if (!/^\d+$/.test(key)) looksLegacy = true;
  });
  if (looksLegacy) {
    next.plan.forEach((slide, index) => {
      keyed[String(index)] = legacy[slide.role] && typeof legacy[slide.role] === "object"
        ? Object.assign({}, legacy[slide.role])
        : {};
    });
    next.copy = keyed;
    next._migratedFromRoleCopy = true;
  }
  return next;
}

/** Back-compat: single-shot validate used by older tests. */
function validateBrief(brief, manifest, prompt, nonce) {
  const planResult = validatePlan(brief, manifest, prompt, nonce);
  const copyResult = validateCopy(brief && brief.copy, planResult.plan, manifest);
  return {
    brief: Object.assign({}, planResult.plan, { copy: copyResult.copy }),
    fallbacks: planResult.fallbacks.concat(copyResult.fallbacks),
  };
}

async function designBrief(prompt, direction, manifest, nonce, deps) {
  // Legacy single-shot: plan then copy (2 model calls inside). Prefer planBrief+copyBrief.
  const planRaw = await planBrief(prompt, direction, manifest, nonce, deps);
  const planResult = validatePlan(planRaw, manifest, prompt, nonce);
  const copyRaw = await copyBrief(prompt, direction, planResult.plan, manifest, deps);
  const copyResult = validateCopy(copyRaw, planResult.plan, manifest);
  return Object.assign({}, planResult.plan, { copy: copyResult.copy });
}

module.exports = {
  planBrief,
  copyBrief,
  copyFill,
  validatePlan,
  validateCopy,
  listEmptySlots,
  mergeCopyFill,
  migrateLegacyBrief,
  remapCopyToPlan,
  narrativeInsertAt,
  planPrompt,
  copyPrompt,
  copyFillPrompt,
  slotsForSlide,
  designBrief,
  validateBrief,
  pickIndex,
  expandSlotKeys,
  parseJson,
  componentHasPhoto,
  allowedComponentsForRole,
};
