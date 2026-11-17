import * as fs from "fs";
import * as path from "path";
import { circle, El, photo, rect, ROOT, text, writeKit } from "./lib/designKit";
import { resolvePhoto } from "../engine/photos";
const { renderDeckFromSpec } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const JSZip = require("jszip");

const family = "turntable";
const output = path.join(ROOT, "out", family);
const brand = {
  colors: { bg: "#F2EAD8", ink: "#1D2526", accent: "#AA3C25", surface: "#FDF9EC",
    vinyl: "#191B1F", groove: "#41444B", label: "#F79A76", inner: "#CED5BE", line: "#A39B85" },
  fonts: { display: "Franklin Gothic Heavy", body: "Calibri" }
};
const query = "swimming pool underwater sunlight ripples";
const tracks = [
  [["Waterline", 205], ["Slow Lane", 237], ["Under Glass", 196], ["Deep End", 245]],
  [["Blue Tile", 218], ["Short Wave", 182], ["Night Swim", 263], ["Last Light", 194]]
] as const;
const duration = (sec: number) => Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
const totals = tracks.map(side => side.reduce((sum, [,seconds]) => sum + seconds, 0));
const frontShadow = { offsetY: 8, blur: 12, opacity: 0.30, color: "#17191C" };

// A small print detail on the label makes the rotation visible as it clears the sleeve.
function pressing(x: number): El[] {
  const diameter = 596, y = 138;
  const layers: El[] = [];
  function ring(name: string, inset: number, color: string) {
    const element = circle(name, x + inset, y + inset, diameter - 2 * inset, color,
      { z: 1 + layers.length / 100, morphId: name, keepFill: true });
    layers.push(element);
  }
  ring("vinyl", 0, "vinyl");
  for (const inset of [10, 18, 32, 48, 64, 82, 105, 132, 155]) {
    ring("groove-" + inset, inset, "groove");
    ring("land-" + inset, inset + 2, "vinyl");
  }
  ring("centre-label", 199, "label");
  for (const [index, width] of [41, 29, 18].entries()) {
    const name = "label-stripe-" + index;
    layers.push(rect(name, x + 323, y + 259 + index * 8, width, 3, "ink",
      {z: 1 + layers.length / 100, morphId: name, keepFill: true}));
  }
  ring("spindle", 290, "ink");
  return layers;
}

function packageScene(reveal: boolean) {
  return [
    ...pressing(reveal ? 516 : 378),
    rect("inner", reveal ? 176 : 162, 132, 610, 610, "inner", { z: 2, morphId: "inner", shadow: frontShadow }),
    rect("jacket", 98, 106, 620, 620, "surface", { z: 3, morphId: "jacket", shadow: frontShadow }),
    photo("cover-art", 116, 124, 584, 330, { z: 4, morphId: "cover-art" }),
    text("album", 128, 465, 555, 155, 57, "copy0", "ink", { z: 5, morphId: "album" }),
    text("artist", 131, 633, 520, 54, 27, "copy1", "accent", { morphId: "artist" }),
    text("title", 1150, 142, 412, 170, 51, "title"),
    text("detail", 1150, 342, 378, 280, 28, "copy2"),
    text("edition", 1150, 665, 380, 75, 22, "copy3", "accent"),
    text("caption", 98, 805, 1450, 66, 25, "copy4")
  ];
}

const listElements: El[] = [text("title", 90, 62, 1410, 132, 79, "title")];
const listCopy: string[] = [];
function listText(id: string, value: string, x: number, y: number, w: number, size: number, color = "ink") {
  listElements.push(text(id, x, y, w, 65, size, "copy" + listCopy.length, color));
  listCopy.push(value);
}
tracks.forEach((side, s) => {
  const x = 90 + s * 770;
  listText("side-" + s, s ? "SIDE B" : "SIDE A", x, 240, 380, 43, "accent");
  side.forEach(([name, sec], i) => {
    const y = 346 + i * 92;
    listText("track-" + s + i, String(i + 1).padStart(2, "0") + "     " + name, x, y, 490, 33);
    listText("duration-" + s + i, duration(sec), x + 494, y, 124, 33);
    listElements.push(rect("rule-" + s + i, x, y + 65, 605, 2, "line"));
  });
  listText("total-" + s, "Playing time     " + duration(totals[s]), x, 760, 625, 28);
});
const slides: El[] = [
  { role: "cover", title: "Turntable", photoQuery: query, items: ["Pool Music", "NORA VALE   /   STEREO LP",
    "Eight pieces for electric piano, brushed drums and tape, written after closing time at the municipal pool.",
    "FIRST PRESSING   /   TT–004", "Pool Music   •   A fictional release from Tidal Tone Records"] },
  { role: "feature", title: "Inside the sleeve", photoQuery: query, items: ["Pool Music", "NORA VALE   /   STEREO LP",
    "The pool photograph wraps the outer jacket. A sage inner sleeve carries the session credits. Slide it aside to reveal the coral label on black vinyl.",
    "PACKAGING STUDY   /   TT–004", "Pictured from front to back     Printed jacket     /     Inner sleeve     /     12-inch record"] },
  { role: "feature", title: "The running order", items: listCopy },
  { role: "feature", title: "The shape of the record", items: ["PLAYING TIME IN SECONDS",
    "Night Swim runs for 4:23, the longest track on either side. It follows Short Wave, the shortest piece at 3:02.",
    "Side A runs 26 seconds longer than Side B. Together the eight tracks play for " + duration(totals[0] + totals[1]) + "."],
    chart: { type: "bar", labels: ["Track 1","Track 2","Track 3","Track 4"], series: tracks.map((side, s) =>
      ({name: s ? "Side B" : "Side A", values: side.map(([,sec]) => sec)})), colors: ["#AA3C25","#536B68"], showLegend: true } }
];

async function main() {
  fs.mkdirSync(output, {recursive:true});
  const layouts = [packageScene(false), packageScene(true), listElements, [
    text("title", 86, 65, 1480, 135, 73, "title"),
    text("units", 90, 234, 850, 56, 25, "copy0", "accent"),
    { id:"running-times", type:"chart", x:85, y:305, width:905, height:465, z:2 },
    text("readout", 1050, 285, 468, 245, 34, "copy1"),
    text("sides", 1050, 565, 468, 205, 30, "copy2")
  ]];
  const variants = ["jacket", "reveal", "tracklist", "timings"];
  const linerNotes = [
    ["Waterline", "A1   /   3:25", "Nora Vale played the opening figure with the piano lid closed. The felt took the edge off the high notes and left room for the brushes to carry the pulse.", "At the end of the take, the drummer let the last sweep run across the snare. That sound leads straight into Slow Lane."],
    ["Blue Tile", "B1   /   3:38", "The second side starts with two chords and a bass note held across the bar. Vale leaves the first eight bars almost bare so the room tone becomes part of the rhythm.", "On the return of the theme, the tape echo comes up just enough to answer the piano. That little change marks the start of the second half."],
    ["The session", "ROOM NOTES", "The players faced each other across the piano. A room microphone caught the brushes and the piano together, giving the engineer a reference for how close the two instruments felt in the room.", "At the listening pass, the team kept the take with the strongest shared pulse. Small changes of tempo stayed in the edit."],
    ["Cut to tape", "MIX NOTES", "Two mixes went to the listening room. The first kept the brushes close. The second gave the room microphone more space. The team used the drier version for Waterline and the wider version for Night Swim.", "The final sequence leaves a breath between those textures. On headphones, the change in distance is easiest to hear just after the first piano chord."],
    ["The first pressing", "PRODUCTION SHEET", "A coral centre label identifies the first edition. The dark type around the spindle carries the side, speed and catalogue number, so the record can be matched to its jacket at a glance.", "The sage inner sleeve holds the personnel and recording credits. The outer jacket carries the pool photograph, artist and title."],
    ["Listening room", "RELEASE EVENING", "The first playback begins with both sides in sequence. Guests get the track list at the door and can follow the running times without a spoken introduction between songs.", "After the flip, Vale and the engineer return to two passages: the dry opening of Waterline and the longer tape tail on Last Light."],
    ["Press selections", "TWO ENTRY POINTS", "Waterline introduces the sound in the first few bars and works as a short radio excerpt. Night Swim gives a reviewer the widest contrast between the quiet piano figure and the full room sound.", "The press pack pairs each excerpt with its full track, recording credits and the same cover image used on the sleeve."],
    ["Last Light", "B4   /   3:14", "The final piece leaves the brushes behind for a piano phrase played twice. On the repeat, Vale lifts the pedal earlier, letting the release of the keys come through.", "The tape runs for a few seconds after the room falls quiet. That last stretch of silence belongs to the record as much as the opening note."]
  ];
  for (const [index, [title, label, first, second]] of linerNotes.entries()) {
    const closing = index === linerNotes.length - 1;
    slides.push({role:closing?"closing":"feature", title, items:[label,first,second]});
    variants.push("liner-"+(index+1));
    const layout: El[] = index % 2 === 0 ? [
      rect("label-field",0,0,600,900,"inner"),
      text("number",75,85,460,85,27,"copy0","accent"),
      text("title",75,280,465,310,67,"title"),
      text("notes",685,150,790,285,35,"copy1"),
      text("session",685,495,790,280,33,"copy2")
    ] : [
      rect("margin",0,0,1600,305,closing?"ink":"label"),
      text("title",75,85,1060,170,84,"title",closing?"surface":"ink"),
      text("number",1190,125,345,80,25,"copy0",closing?"surface":"ink"),
      text("notes",85,414,660,370,34,"copy1"),
      text("session",845,414,650,370,34,"copy2")
    ];
    layouts.push(layout);
    if(index===4){
      // Show the pressing at sleeve scale so the spindle, grooves and label
      // described by the production notes are visible together.
      layouts[layouts.length-1]=[
        rect("stock",0,0,770,900,"inner",{z:0}),
        ...pressing(84),
        text("number",831,72,665,60,23,"copy0","accent"),
        text("title",823,184,690,190,74,"title"),
        text("label-notes",832,419,654,204,29,"copy1"),
        text("sleeve-notes",832,665,648,162,27,"copy2")
      ];
    }
    if(index===2 || index===3) {
      slides[slides.length-1].photoQuery=index===2?"recording studio piano microphone":"analog reel to reel tape recorder";
      layouts[layouts.length-1]=[
        photo("session-photo",index===2?0:850,0,750,900),
        text("number",index===2?820:78,85,695,65,24,"copy0","accent"),
        text("title",index===2?820:78,175,695,155,70,"title"),
        text("notes",index===2?820:78,365,690,235,28,"copy1"),
        text("session",index===2?820:78,620,690,210,28,"copy2")
      ];
    }
  }
  const selections = slides.map((slide, i) => writeKit(slide.role, family + "-" + variants[i], family, layouts[i]));
  const spec = {style:{ palette:"ink-night", typePair:"modern-segoe", motif:"bar-accent" }, slides};
  fs.writeFileSync(path.join(ROOT,"examples","turntable.json"), JSON.stringify({brand,spec,selections},null,2));
  const artwork = process.argv.includes("--keep-art")
    ? JSON.parse(fs.readFileSync(path.join(output,"image-source.json"),"utf8"))
    : await resolvePhoto(query,"landscape","color",brand.colors,undefined,"preserve");
  fs.writeFileSync(path.join(output,"image-source.json"),JSON.stringify(artwork,null,2));
  const sources = [artwork];
  const deck = await renderDeckFromSpec(spec,selections,{id:family,brand,photoResolver:async(search:string)=>{
    if(search===query) return artwork;
    const source=await resolvePhoto(search,"landscape","color",brand.colors,undefined,"preserve");
    sources.push(source);
    return source;
  }});
  fs.writeFileSync(path.join(output,"image-sources.json"),JSON.stringify(sources,null,2));
  Object.assign(deck,{name:"Turntable",family,premium:true});
  const [opening,reveal] = deck.layoutSequence;
  deck.layouts[opening].morphKeyframe = "start";
  deck.layouts[reveal].morphDestination = true;
  deck.layouts[reveal].motion = {transition:"morph",durationMs:1000};
  for(const [index,id] of deck.layoutSequence.entries()){
    const warnings = renderSlidePng(deck,id,path.join(output,"slide-"+(index+1)+".png"));
    if(warnings.length) throw new Error(warnings.join("\n"));
    for(const element of deck.layouts[id].elements)
      if(element.textContent?.spans.some((span:El)=>span.text.includes("…"))) throw new Error("Text clipped: "+element.id);
  }
  let pptx = path.join(output,"turntable-studio.pptx");
  try {
    await exportDeckPptx(deck,pptx);
  } catch(error) {
    if ((error as NodeJS.ErrnoException).code !== "EBUSY") throw error;
    pptx = path.join(output,"turntable-studio.revised.pptx");
    await exportDeckPptx(deck,pptx);
    console.log("Original deck is open. Revised copy:",pptx);
  }
  // Move the vinyl as one editable group. The saved geometry is the final pose,
  // so print, thumbnail and static render all show the exposed label.
  const archive = await JSZip.loadAsync(fs.readFileSync(pptx));
  for (const number of [1,2]) {
    const part = "ppt/slides/slide" + number + ".xml";
    let xml = await archive.file(part).async("string");
    const shapes: string[] = xml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
    const disc = shapes.filter(s => /name="!!morph:(vinyl|groove-\d+|land-\d+|centre-label|label-stripe-\d+|spindle)"/.test(s));
    if (disc.length !== pressing(0).length || !xml.includes(disc.join(""))) throw Error("Disc export order changed");
    const groupId = 1 + Math.max(...Array.from(xml.matchAll(/<p:cNvPr id="(\d+)"/g), m => Number(m[1])));
    const xfrm = '<a:off x="0" y="0"/><a:ext cx="1" cy="1"/><a:chOff x="0" y="0"/><a:chExt cx="1" cy="1"/>';
    // Group bounds match the disc in slide coordinates while preserving child geometry.
    const outerTransform = disc[0].match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/)?.[1];
    if (!outerTransform) throw Error("Missing vinyl bounds");
    const bounds = outerTransform + outerTransform.replace("a:off","a:chOff").replace("a:ext","a:chExt");
    const group = '<p:grpSp><p:nvGrpSpPr><p:cNvPr id="'+groupId+'" name="Vinyl record"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm>'+ (bounds || xfrm) +'</a:xfrm></p:grpSpPr>'+disc.join("")+'</p:grpSp>';
    xml = xml.replace(disc.join(""),group);
    if(number===2){
      xml=xml.replace(/<p:transition\b[\s\S]*?<\/p:transition>/,"").replace(/<p:timing>[\s\S]*?<\/p:timing>/,"");
      const sleeveId = shapes.find(shape => shape.includes('name="!!morph:inner"'))?.match(/<p:cNvPr id="(\d+)"/)?.[1];
      if (!sleeveId) throw Error("Missing inner sleeve for reveal");
      const timing = fs.readFileSync(path.join(__dirname,"lib","turntable-reveal.xml"),"utf8")
        .replace(/DISC_ID/g,String(groupId)).replace(/SLEEVE_ID/g,sleeveId);
      xml=xml.replace("</p:sld>",timing+"</p:sld>");
    }
    archive.file(part,xml);
  }
  fs.writeFileSync(pptx,await archive.generateAsync({type:"nodebuffer",compression:"DEFLATE"}));
  fs.writeFileSync(path.join(output,"deck.json"),JSON.stringify(deck,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});

