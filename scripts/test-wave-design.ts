import assert from "node:assert/strict";
import { applyWaveDesign, waveOptionsFromArgs } from "../engine/waveDesign";
import { expandMotionScenes } from "../engine/motion";

function fixture() {
  const roles = ["cover", "divider", "feature", "divider", "closing", "closing", "closing"];
  const deck: any = {tokens:{color:{accent:"#123456"}},layoutSequence:roles.map((_,i)=>String(i)),layouts:{}};
  roles.forEach((role,i)=>deck.layouts[i]={role,elements:[{type:"text",x:100,y:100,width:800,height:200}]});
  deck.layouts[4].elements.push({type:"text",x:100,y:820,width:800,height:30});
  deck.layouts[6].motion = {transition:"morph"};
  return deck;
}
const deck = expandMotionScenes(fixture(), {morph:false,ambient:false,wave:{style:"subtle"}});
assert.deepEqual(deck.engine.waveDesign.report.filter(r=>r.status==="applied").map(r=>r.layoutId),["0","3"]);
assert.equal(deck.layouts[0].motion.ambient.durationMs,12000);
assert.equal(deck.layouts[0].elements.at(-1).shapeContent.fill,"#123456");
assert.equal(deck.engine.waveDesign.report[4].reason,"frequency");
const crowded = fixture();
applyWaveDesign(crowded,{roles:["closing"]});
assert.equal(crowded.engine.waveDesign.report[4].reason,"occupied-footer");
assert.equal(crowded.engine.waveDesign.report[5].reason,"motion-policy");
applyWaveDesign(deck,{style:"subtle"});
assert.equal(deck.layouts[0].elements.filter(e=>e.waveDecoration).length,1);
applyWaveDesign(deck,{style:"balanced",mode:"static"});
assert.equal(deck.layouts[0].motion.ambient,undefined);
assert.equal(deck.layouts[0].elements.at(-1).height,130);
assert.equal(deck.layouts[0].elements[0].height,200);
assert.deepEqual(waveOptionsFromArgs(["--wave=expressive","--static-wave"]),{style:"expressive",mode:"static"});
assert.throws(()=>waveOptionsFromArgs(["--wave=invalid"]));
const disabled = fixture();
applyWaveDesign(disabled,false);
assert.equal(disabled.engine,undefined);
console.log("Wave design passed: integration, spacing, Morph guards, density, idempotence, static mode, CLI.");
