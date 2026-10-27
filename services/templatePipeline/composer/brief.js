/**
 * Design brief for composer mode.
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
  // Brace-balanced slice so trailing prose after the object does not break parse.
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

/** Expand manifest slots into named keys: bullet-1..n, item-1..n, … */
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

function copySchemaFromManifest(manifest) {
  const byRole = {};
  (manifest.components || []).forEach((comp) => {
    (comp.roles || []).forEach((role) => {
      if (!byRole[role]) byRole[role] = [];
      const keys = expandSlotKeys(comp.slots);
      keys.forEach((slot) => {
        if (!byRole[role].some((s) => s.key === slot.key)) byRole[role].push(slot);
      });
    });
  });
  return byRole;
}

/** Flat prompt shape: { role: { "bullet-1": "string <=80", ... } } with optional marked. */
function copyPromptShape(manifest) {
  const schema = copySchemaFromManifest(manifest);
  const shape = {};
  Object.keys(schema).forEach((role) => {
    shape[role] = {};
    schema[role].forEach((slot) => {
      const hint = "string <=" + (slot.maxChars || 80);
      shape[role][slot.key] = slot.optional ? hint + " (optional)" : hint;
    });
  });
  return shape;
}

function briefPrompt(prompt, direction, manifest) {
  const shape = copyPromptShape(manifest);
  const components = (manifest.components || []).map((c) => ({
    id: c.id,
    variants: c.variants,
    roles: c.roles,
    slots: expandSlotKeys(c.slots).map((s) => ({
      key: s.key,
      maxChars: s.maxChars,
      optional: s.optional || undefined,
    })),
  }));
  return [
    "Invent a 9 to 11 slide presentation plan for: " + JSON.stringify(prompt) + ".",
    "Brand context: " + JSON.stringify(direction && direction.profile ? direction.profile : {}) + ".",
    "Mood: " + JSON.stringify(direction && direction.mood ? direction.mood : "") + ".",
    "Use only these kit components: " + JSON.stringify(components) + ".",
    "paletteBucket must be one of " + JSON.stringify(manifest.paletteBuckets) + ".",
    "fontPair must be one of " + JSON.stringify(manifest.fontPairs) + ".",
    "density must be one of " + JSON.stringify(manifest.densities) + ".",
    "coverPattern must be one of " + JSON.stringify(manifest.coverPatterns) + ".",
    "signature must be one of " + JSON.stringify(manifest.signatures) + ".",
    "Cover all of: Cover, Contents, at least three of About/Problem/Solution, at least one of Proof/Market, at least one of Model/People/Next, Close.",
    "At least one slide must use component statement, big-number, or divider.",
    "Name accentRole as the plan role that carries the accent moment (divider accent-block or big-number on a dark card).",
    "copy MUST be an object keyed by role. Each role value is an object of named string slots — never arrays.",
    "Required named keys per role (maxChars listed inline; longer copy will be cut): " + JSON.stringify(shape) + ".",
    "Every required slot must be a non-empty string within maxChars. Optional slots may be omitted.",
    "Do NOT invent placeholder filler; write real copy for the brand.",
    COPY_RULES.join(" "),
    "Return JSON only: { plan:[{role,component,variant}], accentRole, paletteBucket, fontPair, density, coverPattern, signature, mood, copy:{ [role]:{ [slotKey]: string } } }.",
  ].join("\n");
}

async function designBrief(prompt, direction, manifest, nonce, deps) {
  const ask = (deps && deps.askModel) || askModel;
  const result = await ask(briefPrompt(prompt, direction, manifest));
  return parseJson(result.text);
}

function refinePrompt(prompt, direction, manifest, brief, roles, failures) {
  return [
    "Refine this presentation plan for: " + JSON.stringify(prompt) + ".",
    "Brand: " + JSON.stringify(direction && direction.profile ? direction.profile : {}) + ".",
    "Frozen paletteBucket=" + brief.paletteBucket + ", fontPair=" + brief.fontPair + ", density=" + brief.density + ".",
    "Only change component and/or variant for these failing roles: " + JSON.stringify(roles) + ".",
    "Failures: " + JSON.stringify(failures) + ".",
    "Current plan: " + JSON.stringify(brief.plan) + ".",
    "Kit components: " + JSON.stringify((manifest.components || []).map((c) => ({ id: c.id, variants: c.variants, roles: c.roles, slots: expandSlotKeys(c.slots) }))) + ".",
    "Return JSON only with the same shape. Keep copy for non-failing roles unchanged; fill every required slot key for failing roles.",
  ].join("\n");
}

async function refineBrief(prompt, direction, manifest, nonce, brief, roles, failures, deps) {
  const ask = (deps && deps.askModel) || askModel;
  const result = await ask(refinePrompt(prompt, direction, manifest, brief, roles, failures));
  return parseJson(result.text);
}

function allowedComponentsForRole(manifest, role) {
  return (manifest.components || []).filter((c) => (c.roles || []).indexOf(role) >= 0);
}

function validateBrief(brief, manifest, prompt, nonce) {
  const fallbacks = [];
  const seed = String(prompt || "") + "|" + String(nonce || "");
  const next = JSON.parse(JSON.stringify(brief || {}));

  function pick(field, got, list) {
    const used = list[pickIndex(seed + ":" + field + ":" + String(got), list.length)];
    fallbacks.push({ field, got, used });
    return used;
  }

  const buckets = manifest.paletteBuckets || ["light-neutral"];
  if (buckets.indexOf(next.paletteBucket) < 0) next.paletteBucket = pick("paletteBucket", next.paletteBucket, buckets);

  const pairs = manifest.fontPairs || ["corp-calibri"];
  if (pairs.indexOf(next.fontPair) < 0) next.fontPair = pick("fontPair", next.fontPair, pairs);

  const densities = manifest.densities || ["balanced"];
  if (densities.indexOf(next.density) < 0) next.density = pick("density", next.density, densities);

  const covers = manifest.coverPatterns || ["oversized"];
  if (covers.indexOf(next.coverPattern) < 0) next.coverPattern = pick("coverPattern", next.coverPattern, covers);

  const sigs = manifest.signatures || ["frame"];
  if (sigs.indexOf(next.signature) < 0) next.signature = pick("signature", next.signature, sigs);

  if (!Array.isArray(next.plan) || !next.plan.length) {
    next.plan = [
      { role: "Cover", component: "cover", variant: "word" },
      { role: "About", component: "split-copy", variant: "photo-right" },
      { role: "Problem", component: "split-copy", variant: "photo-left" },
      { role: "Proof", component: "stat-row", variant: "three-up" },
      { role: "Close", component: "close", variant: "plain" },
    ];
    fallbacks.push({ field: "plan", got: brief && brief.plan, used: "default-plan" });
  }

  next.plan = next.plan.map((slide, index) => {
    const role = String(slide.role || "");
    const comps = allowedComponentsForRole(manifest, role);
    const list = comps.length ? comps : (manifest.components || []);
    let component = list.find((c) => c.id === slide.component) || null;
    if (!component) {
      const id = pick("plan[" + index + "].component", slide.component, list.map((c) => c.id));
      component = list.find((c) => c.id === id) || list[0];
    }
    let variant = slide.variant;
    if (!component || (component.variants || []).indexOf(variant) < 0) {
      variant = pick("plan[" + index + "].variant", slide.variant, (component && component.variants) || ["word"]);
    }
    return { role: role || (component && component.roles[0]) || "About", component: component.id, variant };
  });

  next.copy = next.copy && typeof next.copy === "object" ? next.copy : {};
  next.plan.forEach((slide) => {
    const comp = (manifest.components || []).find((c) => c.id === slide.component);
    const keys = expandSlotKeys(comp && comp.slots);
    const block = next.copy[slide.role] && typeof next.copy[slide.role] === "object" ? next.copy[slide.role] : {};
    const cleaned = {};
    keys.forEach((slot) => {
      let value = block[slot.key];
      if (value == null || value === "") {
        if (slot.optional || slot.dataRole === "kicker") {
          if (slot.dataRole === "kicker" && (slide.component === "divider" || slide.component === "statement" || slide.component === "close" || slide.component === "cover")) {
            cleaned[slot.key] = "NEXT";
            fallbacks.push({ field: "copy." + slide.role + "." + slot.key, got: value, used: "kicker-fallback" });
          }
          return;
        }
        cleaned[slot.key] = "";
        return;
      }
      const raw = String(value);
      const max = slot.maxChars || 160;
      if (raw.length > max) {
        cleaned[slot.key] = clampCopy(raw.slice(0, max));
        fallbacks.push({ field: "copy." + slide.role + "." + slot.key, got: "len=" + raw.length, used: "clamped:" + max });
      } else {
        cleaned[slot.key] = clampCopy(raw);
      }
    });
    next.copy[slide.role] = cleaned;
  });

  applyRhythmRules(next, manifest, seed, fallbacks);

  return { brief: next, fallbacks };
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

function applyRhythmRules(next, manifest, seed, fallbacks) {
  const comps = manifest.components || [];
  // 1) No two consecutive identical component+variant
  for (let i = 1; i < next.plan.length; i += 1) {
    const prev = next.plan[i - 1];
    const cur = next.plan[i];
    if (prev.component === cur.component && prev.variant === cur.variant) {
      const comp = comps.find((c) => c.id === cur.component);
      const alts = ((comp && comp.variants) || []).filter((v) => v !== cur.variant);
      if (alts.length) {
        const used = alts[pickIndex(seed + ":dup-var:" + i, alts.length)];
        fallbacks.push({ field: "rhythm.duplicateVariant", got: cur.component + "/" + cur.variant, used, reason: "no consecutive same component+variant" });
        cur.variant = used;
      } else {
        const allowed = allowedComponentsForRole(manifest, cur.role).filter((c) => c.id !== cur.component);
        if (allowed.length) {
          const pick = allowed[pickIndex(seed + ":dup-comp:" + i, allowed.length)];
          fallbacks.push({ field: "rhythm.duplicateComponent", got: cur.component, used: pick.id, reason: "no consecutive same component+variant" });
          cur.component = pick.id;
          cur.variant = (pick.variants || [])[0] || cur.variant;
        }
      }
    }
  }

  // 2) At most half the slides carry a photo
  const photoIdx = [];
  next.plan.forEach((slide, index) => {
    const comp = comps.find((c) => c.id === slide.component);
    if (componentHasPhoto(comp, slide.variant) && slide.role !== "Cover") photoIdx.push(index);
  });
  const maxPhoto = Math.floor(next.plan.length / 2);
  while (photoIdx.length > maxPhoto) {
    const index = photoIdx.pop();
    const slide = next.plan[index];
    const comp = comps.find((c) => c.id === slide.component);
    const plain = ((comp && comp.variants) || []).find((v) => !componentHasPhoto(comp, v));
    if (plain) {
      fallbacks.push({ field: "rhythm.photoCap", got: slide.component + "/" + slide.variant, used: plain, reason: "at most half slides carry a photo" });
      slide.variant = plain;
    } else {
      const allowed = allowedComponentsForRole(manifest, slide.role).filter((c) => (c.photoSlots || []).length === 0);
      if (allowed.length) {
        const pick = allowed[0];
        fallbacks.push({ field: "rhythm.photoCap", got: slide.component, used: pick.id, reason: "at most half slides carry a photo" });
        slide.component = pick.id;
        slide.variant = (pick.variants || [])[0];
      }
    }
  }

  // 3) At least one statement / big-number / divider
  const hasMoment = next.plan.some((s) => s.component === "statement" || s.component === "big-number" || s.component === "divider");
  if (!hasMoment && next.plan.length > 2) {
    const mid = Math.floor(next.plan.length / 2);
    const slide = next.plan[mid];
    const moment = comps.find((c) => c.id === "statement") || comps.find((c) => c.id === "divider");
    if (moment && (moment.roles || []).indexOf(slide.role) >= 0) {
      fallbacks.push({ field: "rhythm.accentMoment", got: slide.component, used: moment.id, reason: "at least one statement/big-number/divider" });
      slide.component = moment.id;
      slide.variant = (moment.variants || [])[0];
    } else if (moment) {
      const role = (moment.roles || [])[0] || slide.role;
      fallbacks.push({ field: "rhythm.accentMoment", got: slide.role + "/" + slide.component, used: role + "/" + moment.id, reason: "at least one statement/big-number/divider" });
      slide.role = role;
      slide.component = moment.id;
      slide.variant = (moment.variants || [])[0];
    }
  }

  // 4) Exactly one accentRole
  const roles = next.plan.map((s) => s.role);
  let accent = next.accentRole;
  const accentOk = accent && roles.indexOf(accent) >= 0 && next.plan.some((s) => {
    if (s.role !== accent) return false;
    return s.component === "divider" || s.component === "big-number" || s.component === "statement";
  });
  if (!accentOk) {
    const candidates = next.plan.filter((s) => s.component === "divider" || s.component === "big-number" || s.component === "statement");
    const pick = candidates[pickIndex(seed + ":accentRole", Math.max(1, candidates.length))] || next.plan[Math.floor(next.plan.length / 2)];
    next.accentRole = pick.role;
    fallbacks.push({ field: "accentRole", got: accent, used: next.accentRole, reason: "exactly one accentRole by hash" });
    if (pick.component === "divider" && (pick.variant !== "accent-block")) {
      pick.variant = "accent-block";
      fallbacks.push({ field: "rhythm.accentVariant", got: pick.component, used: "accent-block", reason: "accentRole uses accent-block" });
    }
  }
}

module.exports = {
  designBrief,
  validateBrief,
  refineBrief,
  pickIndex,
  briefPrompt,
  refinePrompt,
  expandSlotKeys,
  copySchemaFromManifest,
  copyPromptShape,
};
