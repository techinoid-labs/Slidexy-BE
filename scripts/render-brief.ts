import * as fs from "fs";
import * as path from "path";
import {planBrief} from "../engine/planBrief";
const {renderDeckFromSpec}=require("../engine/render");
const {renderSlidePng}=require("./slideSvg");
const {exportDeckPptx}=require("../services/templatePipeline/catalog");
async function main(){
  const input=path.resolve(process.argv[2]||"examples/cafe-operations.json");
  const output=path.resolve(process.argv[3]||path.join("out","briefs",path.basename(input,".json")));
  const brief=JSON.parse(fs.readFileSync(input,"utf8").replace(/^\uFEFF/,""));
  const plan=planBrief(brief);
  fs.mkdirSync(output,{recursive:true});
  const deck=await renderDeckFromSpec(plan.spec,plan.selections,{id:"matched-brief",brand:plan.brand,...(plan.spec.slides.some(s=>s.photoQuery==="cafe-latte-pour") ? {photoResolver:async()=>({path:path.join(__dirname,"../engine/cache/photos/081717d2845206b0247501e7693f75590c0b41bc.png"),pexelsId:"local:cafe-latte-pour"})} : {})});
  deck.name=brief.subject;
  for(const [index,id] of deck.layoutSequence.entries()){
    for(const element of deck.layouts[id].elements){
      if(element.textContent?.spans.some((s:any)=>s.text.includes("…")))throw Error("Text overflow on slide "+(index+1));
      if(element.tableContent)Object.assign(element.tableContent,{headerFill:plan.brand.colors.ink,headerColor:plan.brand.colors.bg,altRowFill:plan.brand.colors.surface});
    }
    const warnings=renderSlidePng(deck,id,path.join(output,"slide-"+(index+1)+".png"));
    if(warnings.length)throw Error(warnings.join(", "));
  }
  await exportDeckPptx(deck,path.join(output,"deck.pptx"));
  fs.writeFileSync(path.join(output,"selection.json"),JSON.stringify(plan,null,2));
  console.log(plan.family,plan.selections.map(s=>s.variant));
}
main().catch(e=>{console.error(e);process.exitCode=1});

