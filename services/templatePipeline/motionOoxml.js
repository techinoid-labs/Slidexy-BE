/**
 * Native OOXML Motion Engine — Morph, transitions, premium entrances, ambient.
 * Premium Motion Smoothing: accel/decel ease curves, stagger, Morph isolation.
 */

const JSZip = require("jszip");

const P14 = "http://schemas.microsoft.com/office/powerpoint/2010/main";
const P159 = "http://schemas.microsoft.com/office/powerpoint/2015/main";

/** Ease-In-Out on entrances / finite anims (50% accel + 50% decel window). */
const EASE = { accel: 50000, decel: 50000 };
/** Full smoothness for ambient loops. */
const AMBIENT_EASE = { accel: 100000, decel: 100000 };

const STAGGER_MS = 200;
/** 20px rise on 900-tall design canvas → relative path units. */
const FADE_UP_DY = (20 / 900).toFixed(5);

/** Classic + premium entrance presets. */
const ENTRANCE_TEMPLATES = {
  fadeIn: {
    presetID: 10,
    presetClass: "entr",
    presetSubtype: 0,
    dur: 550,
    filter: "fade",
    kind: "animEffect",
  },
  flyInFromBottom: {
    presetID: 2,
    presetClass: "entr",
    presetSubtype: 4,
    dur: 700,
    filter: "fly(fromBottom)",
    kind: "animEffect",
  },
  zoomIn: {
    presetID: 53,
    presetClass: "entr",
    presetSubtype: 16,
    dur: 650,
    kind: "animScale",
  },
  /** Title settle: fade + rise 20px with ease. */
  fadeUp: {
    presetID: 2,
    presetClass: "entr",
    presetSubtype: 4,
    dur: 700,
    kind: "fadeUp",
  },
  /** Accent line reveal L→R. */
  wipeRight: {
    presetID: 22,
    presetClass: "entr",
    presetSubtype: 10,
    dur: 600,
    filter: "wipe(right)",
    kind: "animEffect",
  },
  /** Soft land: 105% → 100% + fade. */
  zoomSettle: {
    presetID: 53,
    presetClass: "entr",
    presetSubtype: 16,
    dur: 750,
    kind: "zoomSettle",
  },
};

const AMBIENT_TEMPLATES = {
  waveLoop: {
    presetID: 0,
    presetClass: "path",
    presetSubtype: 0,
    kind: "waveLoop",
    defaultDur: 8000,
  },
  pulse: {
    presetID: 6,
    presetClass: "emph",
    presetSubtype: 0,
    kind: "pulse",
    defaultDur: 3200,
    defaultScale: 1.035,
  },
  kenBurns: {
    presetID: 0,
    presetClass: "path",
    presetSubtype: 0,
    kind: "kenBurnsPan",
    defaultDur: 18000,
  },
  teeter: {
    presetID: 26,
    presetClass: "emph",
    presetSubtype: 0,
    kind: "teeter",
    defaultDur: 4000,
    defaultDegrees: 2,
  },
  float: {
    presetID: 0,
    presetClass: "path",
    presetSubtype: 0,
    kind: "floatPath",
    defaultDur: 16000,
  },
};

const DESIGN_W = 1600;
const DESIGN_H = 900;

function easeAttrs(ease) {
  const a = ease || EASE;
  return ` accel="${a.accel}" decel="${a.decel}"`;
}

function floatYAxisPath(radiusPx) {
  const r = Math.max(16, Math.min(48, Number(radiusPx) || 28));
  const dy = (r / DESIGN_H).toFixed(5);
  return `M 0 0 L 0 -${dy}`;
}

function kenBurnsPanPath(ambient) {
  if (ambient && typeof ambient.path === "string" && ambient.path.indexOf("M ") === 0) return ambient.path;
  const dx = ((Number(ambient && ambient.panXPx) || 28) / DESIGN_W).toFixed(5);
  const dy = ((Number(ambient && ambient.panYPx) || 16) / DESIGN_H).toFixed(5);
  return `M 0 0 L ${dx} -${dy}`;
}

function resolveFloatPath(ambient) {
  const kind = ambient && ambient.path;
  const radiusPx = ambient && ambient.radiusPx != null ? ambient.radiusPx : 8;
  if (typeof kind === "string" && kind.indexOf("M ") === 0) return kind;
  return floatYAxisPath(radiusPx);
}

function transitionXml(kind, durationMs) {
  const dur = Math.max(200, Math.min(10000, Number(durationMs) || 800));
  const spd = dur >= 1500 ? "slow" : dur >= 750 ? "med" : "fast";
  const head = `<p:transition spd="${spd}" xmlns:p14="${P14}" p14:dur="${dur}">`;
  if (kind === "morph") {
    return head + `<p159:morph xmlns:p159="${P159}" option="byObject"/></p:transition>`;
  }
  if (kind === "push") return head + `<p:push dir="r"/></p:transition>`;
  if (kind === "wipe") return head + `<p:wipe dir="l"/></p:transition>`;
  if (kind === "fade") return head + `<p:fade/></p:transition>`;
  return "";
}

function stripExistingTransition(xml) {
  return xml.replace(/<p:transition\b[\s\S]*?<\/p:transition>/g, "");
}

function stripExistingTiming(xml) {
  return xml.replace(/<p:timing\b[\s\S]*?<\/p:timing>/g, "");
}

function morphIdToSpid(slideXml) {
  const map = {};
  const re =
    /<p:cNvPr\b[^>]*\bid="(\d+)"[^>]*\bname="([^"]+)"|<p:cNvPr\b[^>]*\bname="([^"]+)"[^>]*\bid="(\d+)"/g;
  let m;
  while ((m = re.exec(slideXml))) {
    const id = m[1] || m[4];
    const name = m[2] || m[3] || "";
    String(name)
      .split("|")
      .forEach((part) => {
        const clean = part.replace(/^!!/, "");
        const mm = clean.match(/^morph:([a-zA-Z0-9_-]+)/);
        if (mm) map[mm[1]] = id;
      });
  }
  return map;
}

/** True if spid is a picture with outer shadow / depth tag (shadow would detach on pan). */
function picHasDropShadow(slideXml, spid) {
  if (!spid) return false;
  const picRe = /<p:pic\b[\s\S]*?<\/p:pic>/g;
  let m;
  while ((m = picRe.exec(slideXml))) {
    const block = m[0];
    if (!new RegExp(`<p:cNvPr\\b[^>]*\\bid="${spid}"`).test(block) && !new RegExp(`id="${spid}"[^>]*name=`).test(block)) {
      // also match name-before-id order
      if (!new RegExp(`name="[^"]*"[^>]*id="${spid}"`).test(block)) continue;
    }
    if (!block.includes(`id="${spid}"`)) continue;
    if (/depth:1/.test(block) || /<a:outerShdw\b/.test(block)) return true;
  }
  return false;
}

function isImageMorphId(morphId) {
  const id = String(morphId || "");
  return (
    id === "hero" ||
    id === "cutout" ||
    id === "photo" ||
    /^photo-/.test(id) ||
    /^p\d$/.test(id)
  );
}

function isAccentOrTextMorphId(morphId) {
  const id = String(morphId || "");
  if (isImageMorphId(id)) return false;
  return (
    id === "title" ||
    id === "caption" ||
    id === "body" ||
    id === "accent" ||
    id === "neon" ||
    id === "titlePlate" ||
    id === "pulse-bg" ||
    id === "plate" ||
    /^body-/.test(id) ||
    /^stat-/.test(id) ||
    /^b\d$/.test(id)
  );
}

/**
 * Apply stagger: each subsequent entrance gets +200ms unless explicit delay set.
 */
function applyStagger(entrances) {
  return (entrances || []).map((ent, index) => {
    const next = Object.assign({}, ent);
    if (next.delayMs == null) next.delayMs = index * STAGGER_MS;
    return next;
  });
}

/** Morph slides: only text + accent entrances (Morph owns image motion). */
function filterEntrancesForMorph(entrances) {
  return (entrances || []).filter((ent) => isAccentOrTextMorphId(ent.morphId || ent.target));
}

function bhvrCTn(id, dur, ease, extraAttrs) {
  return `<p:cTn id="${id}" dur="${dur}"${easeAttrs(ease)}${extraAttrs || ""}/>`;
}

/**
 * Auto-play entrances (withEffect / afterEffect) — never clickEffect.
 */
function entranceParXml(templateKey, spid, cTnId, delayMs, index) {
  const t = ENTRANCE_TEMPLATES[templateKey];
  if (!t || !spid) return { xml: "", nextId: cTnId };
  let id = cTnId;
  const delay = Math.max(0, Number(delayMs) || 0);
  const rootId = id++;
  const nodeType = index === 0 ? "withEffect" : "afterEffect";
  const ease = EASE;
  let child = "";

  if (t.kind === "animScale") {
    const bhvrId = id++;
    child =
      `<p:animScale>` +
      `<p:cBhvr>` +
      bhvrCTn(bhvrId, t.dur, ease, ` fill="hold"`) +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `</p:cBhvr>` +
      `<p:from x="0" y="0"/><p:to x="100000" y="100000"/>` +
      `</p:animScale>`;
  } else if (t.kind === "fadeUp") {
    const fadeId = id++;
    const moveId = id++;
    child =
      `<p:animEffect transition="in" filter="fade">` +
      `<p:cBhvr>` +
      bhvrCTn(fadeId, t.dur, ease) +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `</p:cBhvr>` +
      `</p:animEffect>` +
      `<p:animMotion origin="layout" path="M 0 ${FADE_UP_DY} L 0 0" pathEditMode="relative" ptsTypes="A" rCtr="0 0">` +
      `<p:cBhvr additive="base">` +
      bhvrCTn(moveId, t.dur, ease, ` fill="hold"`) +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst>` +
      `</p:cBhvr>` +
      `</p:animMotion>`;
  } else if (t.kind === "zoomSettle") {
    const fadeId = id++;
    const scaleId = id++;
    child =
      `<p:animEffect transition="in" filter="fade">` +
      `<p:cBhvr>` +
      bhvrCTn(fadeId, t.dur, ease) +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `</p:cBhvr>` +
      `</p:animEffect>` +
      `<p:animScale>` +
      `<p:cBhvr>` +
      bhvrCTn(scaleId, t.dur, ease, ` fill="hold"`) +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `</p:cBhvr>` +
      `<p:from x="105000" y="105000"/><p:to x="100000" y="100000"/>` +
      `</p:animScale>`;
  } else {
    const bhvrId = id++;
    child =
      `<p:animEffect transition="in" filter="${t.filter}">` +
      `<p:cBhvr>` +
      bhvrCTn(bhvrId, t.dur, ease) +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `</p:cBhvr>` +
      `</p:animEffect>`;
  }

  const xml =
    `<p:par>` +
    `<p:cTn id="${rootId}" fill="hold" presetID="${t.presetID}" presetClass="${t.presetClass}" presetSubtype="${t.presetSubtype}" grpId="0" nodeType="${nodeType}">` +
    `<p:stCondLst><p:cond delay="${delay}"/></p:stCondLst>` +
    `<p:childTnLst>${child}</p:childTnLst>` +
    `</p:cTn>` +
    `</p:par>`;
  return { xml, nextId: id };
}

function ambientMotionPathXml(path, spid, bhvrId, dur, autoRevAttr, easing = AMBIENT_EASE) {
  return (
    `<p:animMotion origin="layout" path="${path}" pathEditMode="relative" ptsTypes="A" rCtr="0 0">` +
    `<p:cBhvr additive="base">` +
    `<p:cTn id="${bhvrId}" dur="${dur}"${easeAttrs(easing)}${autoRevAttr} repeatCount="indefinite" fill="hold"/>` +
    `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
    `<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst>` +
    `</p:cBhvr>` +
    `</p:animMotion>`
  );
}

function ambientInnerXml(ambient, spid, bhvrId) {
  const effect = ambient.effect || ambient.preset || "pulse";
  const t = AMBIENT_TEMPLATES[effect];
  if (!t || !spid) return "";
  const dur = Math.max(500, Number(ambient.durationMs) || t.defaultDur || 3000);
  const wantAutoRev = ambient.autoReverse !== false;
  const autoRev = wantAutoRev ? ` autoRev="1"` : "";
  const scalePct = Math.round((Number(ambient.scale) || t.defaultScale || 1.035) * 100000);
  const pulseBy = Math.min(4000, Math.max(2000, scalePct - 100000));
  const ease = AMBIENT_EASE;

  if (t.kind === "waveLoop") {
    return ambientMotionPathXml("M 0 0 L -0.25 0 E", spid, bhvrId, dur, "", { accel: 0, decel: 0 });
  }

  if (t.kind === "pulse") {
    return (
      `<p:animScale>` +
      `<p:cBhvr>` +
      `<p:cTn id="${bhvrId}" dur="${dur}"${easeAttrs(ease)}${autoRev} repeatCount="indefinite" fill="hold"/>` +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `</p:cBhvr>` +
      `<p:by x="${pulseBy}" y="${pulseBy}"/>` +
      `</p:animScale>`
    );
  }
  if (t.kind === "kenBurnsPan") {
    return ambientMotionPathXml(kenBurnsPanPath(ambient), spid, bhvrId, dur, autoRev);
  }
  if (t.kind === "teeter") {
    const deg = Math.min(1.5, Number(ambient.degrees) || t.defaultDegrees || 1);
    const by = Math.round(deg * 60000);
    return (
      `<p:animRot by="${by}">` +
      `<p:cBhvr>` +
      `<p:cTn id="${bhvrId}" dur="${dur}"${easeAttrs(ease)}${autoRev} repeatCount="indefinite" fill="hold"/>` +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
      `<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst>` +
      `</p:cBhvr>` +
      `</p:animRot>`
    );
  }
  if (t.kind === "floatPath") {
    return ambientMotionPathXml(resolveFloatPath(ambient), spid, bhvrId, dur, autoRev);
  }
  return "";
}

function ambientSeqXml(ambient, spid, cTnId) {
  if (!ambient || !spid) return { xml: "", nextId: cTnId };
  const effect = ambient.effect || ambient.preset || "pulse";
  const t = AMBIENT_TEMPLATES[effect];
  if (!t) return { xml: "", nextId: cTnId };
  let id = cTnId;
  const seqId = id++;
  const effectId = id++;
  const bhvrId = id++;
  const inner = ambientInnerXml(ambient, spid, bhvrId);
  if (!inner) return { xml: "", nextId: cTnId };

  const xml =
    `<p:seq concurrent="1" nextAc="seek">` +
    `<p:cTn id="${seqId}" restart="always" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq">` +
    `<p:stCondLst><p:cond delay="0"/></p:stCondLst>` +
    `<p:childTnLst>` +
    `<p:par>` +
    `<p:cTn id="${effectId}" fill="hold" presetID="${t.presetID}" presetClass="${t.presetClass}" presetSubtype="${t.presetSubtype}" grpId="0" nodeType="withEffect">` +
    `<p:stCondLst><p:cond delay="0"/></p:stCondLst>` +
    `<p:childTnLst>${inner}</p:childTnLst>` +
    `</p:cTn>` +
    `</p:par>` +
    `</p:childTnLst>` +
    `</p:cTn>` +
    `<p:nextCondLst>` +
    `<p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond>` +
    `</p:nextCondLst>` +
    `</p:seq>`;
  return { xml, nextId: id };
}

function buildTimingXml(entrances, idMap, ambient) {
  let cTnId = 3;
  const staggered = applyStagger(entrances || []);
  const entranceKids = [];
  staggered.forEach((ent, index) => {
    const morphId = ent.morphId || ent.target;
    const preset = ent.preset || ent.kind || "fadeIn";
    const spid = idMap[morphId];
    if (!spid) return;
    const built = entranceParXml(preset, spid, cTnId, ent.delayMs, index);
    if (built.xml) {
      entranceKids.push(built.xml);
      cTnId = built.nextId;
    }
  });

  let ambientXml = "";
  if (ambient && ambient.morphId) {
    const spid = idMap[ambient.morphId] || idMap[ambient.target];
    const built = ambientSeqXml(ambient, spid, cTnId);
    if (built.xml) {
      ambientXml = built.xml;
      cTnId = built.nextId;
    }
  }

  if (!entranceKids.length && !ambientXml) return "";

  const mainKids =
    entranceKids.length > 0
      ? entranceKids.join("")
      : `<p:par><p:cTn id="${cTnId++}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn></p:par>`;

  const mainSeq =
    `<p:seq concurrent="1" nextAc="seek">` +
    `<p:cTn id="2" dur="indefinite" nodeType="mainSeq">` +
    `<p:childTnLst>${mainKids}</p:childTnLst>` +
    `</p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>` +
    `</p:seq>`;

  // restart="always" so Left-Arrow / Back in slideshow replays cleanly —
  // restart="never" left Morph + timing stuck in a forward-only state.
  return (
    `<p:timing>` +
    `<p:tnLst>` +
    `<p:par>` +
    `<p:cTn id="1" dur="indefinite" restart="always" nodeType="tmRoot">` +
    `<p:childTnLst>${mainSeq}${ambientXml || ""}</p:childTnLst>` +
    `</p:cTn>` +
    `</p:par>` +
    `</p:tnLst>` +
    `</p:timing>`
  );
}

function ensureDepthShadows(slideXml) {
  return slideXml.replace(/<(p:sp|p:pic)\b[\s\S]*?<\/\1>/g, (block) => {
    if (!/name="[^"]*depth:1/.test(block)) return block;
    if (/<a:effectLst>/.test(block)) return block;
    const shadow =
      `<a:effectLst>` +
      `<a:outerShdw blurRad="101600" dist="76200" dir="2700000" algn="tl" rotWithShape="0">` +
      `<a:prstClr val="black"><a:alpha val="35000"/></a:prstClr>` +
      `</a:outerShdw>` +
      `</a:effectLst>`;
    if (/<\/p:spPr>/.test(block)) return block.replace(/<\/p:spPr>/, shadow + "</p:spPr>");
    return block;
  });
}

/**
 * Ambient on shadowed pictures detaches the shadow — retarget or skip.
 */
function sanitizeAmbientTarget(ambient, idMap, slideXml, layout) {
  if (!ambient || !ambient.morphId) return null;
  const spid = idMap[ambient.morphId];
  if (!spid) return null;
  if (isImageMorphId(ambient.morphId) && picHasDropShadow(slideXml, spid)) {
    // Prefer a large accent/plate without pan-glitch
    const fallbacks = ["accent", "titlePlate", "neon", "pulse-bg", "plate"];
    for (const fb of fallbacks) {
      if (idMap[fb] && !picHasDropShadow(slideXml, idMap[fb])) {
        return Object.assign({}, ambient, {
          morphId: fb,
          skippedShadowImage: ambient.morphId,
          note: "retargeted off shadowed image",
        });
      }
    }
    return null;
  }
  void layout;
  return ambient;
}

function injectMotionIntoSlideXml(xml, motion) {
  if (!motion) return xml;
  let next = stripExistingTiming(stripExistingTransition(xml));
  next = ensureDepthShadows(next);

  const transition = motion.transition || "none";
  const durationMs =
    motion.durationMs != null ? motion.durationMs : transition === "morph" ? 2000 : 800;
  const transXml = transition && transition !== "none" ? transitionXml(transition, durationMs) : "";

  const idMap = morphIdToSpid(next);
  let ambient = motion.ambient && motion.ambient.effect ? motion.ambient : null;
  ambient = sanitizeAmbientTarget(ambient, idMap, next, motion.layout);

  let entrances = motion.entrances || [];
  if (motion.morphSafe) entrances = filterEntrancesForMorph(entrances);

  const timingXml = buildTimingXml(entrances, idMap, ambient);

  const payload = (transXml || "") + (timingXml || "");
  if (!payload) return next;
  if (/<\/p:sld>/.test(next)) return next.replace(/<\/p:sld>/, payload + "</p:sld>");
  return next + payload;
}

/**
 * Motion fallback: when Morph is requested but unsupported, use fade.
 * Ambient loops always carry a static fallback (final frame = resting geometry).
 */
function resolveTransitionWithFallback(requested, motionRoot, per) {
  const morphSupported = motionRoot.morphSupported !== false && per.morphSupported !== false;
  if (requested === "morph" && !morphSupported) {
    return per.fallbackTransition || motionRoot.fallbackTransition || "fade";
  }
  return requested;
}

async function applyMotionOoxml(buffer, deck) {
  const motionRoot = (deck && deck.engine && deck.engine.motion) || {};
  const sequence = (deck && deck.layoutSequence) || [];
  const layouts = (deck && deck.layouts) || {};
  if (!sequence.length) return buffer;

  const zip = await JSZip.loadAsync(buffer);
  let changed = false;

  for (let i = 0; i < sequence.length; i++) {
    const layoutId = sequence[i];
    const layout = layouts[layoutId] || {};
    const slideName = "ppt/slides/slide" + (i + 1) + ".xml";
    const file = zip.file(slideName);
    if (!file) continue;
    let xml = await file.async("string");

    const per = layout.motion || {};
    let ambient = per.ambient && per.ambient.effect ? per.ambient : null;
    // Static fallback state: ambient loops must declare resting geometry (no-op if missing)
    if (ambient) {
      ambient = Object.assign({}, ambient, {
        staticFallback: true,
        fallbackFrame: "rest",
      });
    }
    const isMorphDest = !!(layout.morphDestination || layout.morphKeyframe === "end");
    const isMorphStart = layout.morphKeyframe === "start";

    let entrances = [];
    if (!isMorphStart) {
      entrances =
        per.entrances ||
        (motionRoot.entrances && !isMorphDest
          ? motionRoot.entrances
          : defaultEntrancesForLayout(layout, { morphSafe: isMorphDest }));
      if (isMorphDest) entrances = filterEntrancesForMorph(entrances);
    }

    let transition =
      per.transition ||
      (isMorphDest ? "morph" : null) ||
      motionRoot.defaultTransition ||
      (motionRoot.morph && i > 0 ? "morph" : "fade");
    transition = resolveTransitionWithFallback(transition, motionRoot, per);

    const slideMotion = {
      transition,
      durationMs:
        per.durationMs ||
        motionRoot.durationMs ||
        (transition === "morph" || isMorphDest ? 2000 : 800),
      entrances,
      ambient: isMorphStart || isMorphDest ? null : ambient,
      morphSafe: isMorphDest,
      layout,
    };

    if (isMorphStart) {
      slideMotion.transition = "none";
      slideMotion.entrances = [];
      slideMotion.ambient = null;
    }
    if (isMorphDest) {
      const morphOrFallback = resolveTransitionWithFallback("morph", motionRoot, per);
      slideMotion.transition = morphOrFallback;
      slideMotion.durationMs = per.durationMs || motionRoot.durationMs || (morphOrFallback === "morph" ? 2000 : 800);
      slideMotion.ambient = null;
    }

    // Pre-sanitize ambient against shadowed pics so deck metadata matches OOXML
    if (slideMotion.ambient) {
      const idMapPreview = morphIdToSpid(xml);
      const fixed = sanitizeAmbientTarget(slideMotion.ambient, idMapPreview, xml, layout);
      slideMotion.ambient = fixed;
      if (layout.motion) layout.motion.ambient = fixed;
      if (deck.engine && deck.engine.motion && Array.isArray(deck.engine.motion.ambientLoops)) {
        const loop = deck.engine.motion.ambientLoops.find((l) => l.layoutId === layoutId || l.slideIndex === i + 1);
        if (loop && fixed) {
          loop.morphId = fixed.morphId;
          if (fixed.skippedShadowImage) loop.skippedShadowImage = fixed.skippedShadowImage;
        } else if (loop && !fixed) {
          loop.skipped = "shadowed-image";
        }
      }
    }

    const next = injectMotionIntoSlideXml(xml, slideMotion);
    if (next !== xml) {
      zip.file(slideName, next);
      changed = true;
    }
  }

  if (!changed) return buffer;
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

function defaultEntrancesForLayout(layout, opts) {
  const morphSafe = opts && opts.morphSafe;
  const role = layout && layout.role;
  let list;
  if (role === "cover") {
    list = [
      { morphId: "title", preset: "fadeUp", delayMs: 0 },
      { morphId: "caption", preset: "fadeUp", delayMs: STAGGER_MS },
      { morphId: "accent", preset: "wipeRight", delayMs: STAGGER_MS * 2 },
    ];
  } else if (role === "feature" || role === "problem" || role === "solution") {
    list = [
      { morphId: "title", preset: "fadeUp", delayMs: 0 },
      { morphId: "body", preset: "fadeUp", delayMs: STAGGER_MS },
      { morphId: "accent", preset: "wipeRight", delayMs: STAGGER_MS * 2 },
      { morphId: "hero", preset: "zoomSettle", delayMs: STAGGER_MS },
    ];
  } else if (role === "stats") {
    list = [
      { morphId: "title", preset: "fadeUp", delayMs: 0 },
      { morphId: "pulse-bg", preset: "zoomSettle", delayMs: STAGGER_MS },
      { morphId: "stat-0", preset: "fadeUp", delayMs: STAGGER_MS },
      { morphId: "stat-1", preset: "fadeUp", delayMs: STAGGER_MS * 2 },
      { morphId: "stat-2", preset: "fadeUp", delayMs: STAGGER_MS * 3 },
    ];
  } else if (role === "testimonial") {
    list = [
      { morphId: "title", preset: "fadeUp", delayMs: 0 },
      { morphId: "body", preset: "fadeUp", delayMs: STAGGER_MS },
      { morphId: "hero", preset: "zoomSettle", delayMs: STAGGER_MS },
    ];
  } else {
    list = [
      { morphId: "title", preset: "fadeUp", delayMs: 0 },
      { morphId: "body", preset: "fadeUp", delayMs: STAGGER_MS },
    ];
  }
  if (morphSafe) return filterEntrancesForMorph(list);
  return list;
}

module.exports = {
  ENTRANCE_TEMPLATES,
  AMBIENT_TEMPLATES,
  EASE,
  AMBIENT_EASE,
  STAGGER_MS,
  transitionXml,
  applyMotionOoxml,
  injectMotionIntoSlideXml,
  morphIdToSpid,
  defaultEntrancesForLayout,
  filterEntrancesForMorph,
  applyStagger,
  ambientSeqXml,
  buildTimingXml,
};
