import * as fs from "fs";
import * as path from "path";
import { artDirection } from "./library-art-direction";
const { renderDeckFromSpec } = require("../engine/render");
const { validateKitObject } = require("../engine/validateSchema");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { createCanvas, loadImage } = require("canvas");
const system = require("../engine/design-system/families.json");
const ROOT = path.join(__dirname, "..");
const content = [
  ["opening", "A clearer direction.", "A working brief for the decisions, evidence and people that shape what happens next."],
  ["agenda", "The conversation ahead.", "Understand the context. Define the opportunity. Compare the options. Agree on a first step."],
  ["problem", "Where does the friction begin?", "Describe one moment that prevents people from making progress. Use a specific observation rather than a broad assumption."],
  ["insight", "One useful observation.", "Put the most relevant finding here. Explain what it changes about the decision in front of us."],
  ["opportunity", "A smaller, sharper opportunity.", "Choose a problem the team can influence. State whom it helps and what a better outcome would look like."],
  ["comparison", "Two possible paths.", "Compare the options against the same criteria. Make their costs, limitations and expected benefits visible."],
  ["process", "Make the work visible.", "Define the question. Build a small response. Review what happened. Use the evidence to decide the next step."],
  ["evidence", "Evidence before confidence.", "Replace the example with your own evidence. State the source, sample and limitations alongside the finding."],
  ["team", "People make it happen.", "Name the decision owner, delivery lead and reviewer. Make responsibility clear before work begins."],
  ["risks", "What could change the plan?", "Record the biggest uncertainty, its early warning sign and the action the team will take if it appears."],
  ["next", "Agree on the next move.", "Choose one action, one owner and a review date. Leave with a decision the team can act on."],
  ["closing", "Make the next step count.", "Turn the conversation into a useful action. Set a date to return with what you learned."]
];
function textStyleRole(slot: string, size: number) {
  if (slot === "folio" || size >= 120) return "stat";
  if (slot === "purpose" || slot === "label") return "kicker";
  if (slot === "title" && size >= 96) return "display";
  if (slot === "title") return "headline";
  if (slot === "body") return "body";
  return "body";
}
function text(id: string, x: number, y: number, w: number, h: number, size: number, slot: string, color="ink", extras: any = {}) {
  const role = extras.textStyleRole || textStyleRole(slot, size);
  return {
    id,
    type: "text",
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    fontRole: slot === "title" || role === "display" || role === "stat" || role === "quote" ? "display" : "body",
    fontWeight: slot === "title" || role === "display" || role === "stat" ? 700 : 400,
    lineHeight: 1.12,
    tokenColor: color,
    slot,
    textStyleRole: role,
    typeTreatment: extras.typeTreatment,
    z: 4,
    ...extras,
  };
}
function rect(id:string,x:number,y:number,w:number,h:number,fill:string){return {id,type:"shape",shape:"rect",x,y,width:w,height:h,tokenFill:fill,z:1};}
async function main(){
 for(const family of system.families.filter((f:any)=>f.id!=="play-lab")){
  const dir=path.join(ROOT,"out/design-library",family.id);fs.mkdirSync(dir,{recursive:true});
  const selections:any[]=[],samples:any[]=[],silhouettes:string[]=[];
  for(let i=0;i<content.length;i++){
   const [purpose,title,body]=content[i];
   if(title.length>system.rules.titleMaxCharacters||body.length>system.rules.bodyMaxCharacters)throw Error("Content budget exceeded");
   const role=i===0?"cover":"feature",variant=`library-${family.id}-${purpose}`;
   const editorial=family.id==="editorial",mode=i%4;
   const el:any[]=[];let titleBox:number[],bodyBox:number[];let color="ink";
   if(editorial){
    if(mode===0){el.push(rect("side",0,0,420,900,"accent"));titleBox=[500,150,1000,320,92];bodyBox=[510,590,880,180,35];el.push(text("folio",70,80,280,190,120,"folio","bg",{textStyleRole:"stat",typeTreatment:"outline"}));}
    else if(mode===1){titleBox=[80,140,1400,270,100];bodyBox=[760,560,720,220,36];el.push(rect("rule",80,470,1400,2,"line"),text("folio",80,580,500,160,130,"folio","accent"));}
    else if(mode===2){titleBox=[80,150,700,400,88];bodyBox=[920,370,580,270,36];el.push(rect("divider",850,100,2,680,"line"));}
    else {titleBox=[170,200,1260,320,100];bodyBox=[300,610,1000,180,36];el.push(rect("rule",650,130,300,5,"accent"));}
   }else{
    if(mode===0){el.push(rect("panel",1030,0,570,900,"ink"),rect("marker",1100,120,420,120,"accent"));titleBox=[70,180,900,330,94];bodyBox=[1100,350,420,330,32];el.push(text("folio",1120,135,380,110,70,"folio"));}
    else if(mode===1){titleBox=[80,80,1400,250,94];bodyBox=[80,590,850,180,38];el.push(rect("baseline",80,420,1440,15,"ink"),rect("marker",1120,550,380,220,"accent"));}
    else if(mode===2){el.push(rect("panel",0,0,760,900,"ink"));titleBox=[70,170,620,380,90];bodyBox=[880,320,620,280,36];color="bg";}
    else {titleBox=[80,180,1400,300,110];bodyBox=[600,610,880,180,36];el.push(rect("marker",80,610,360,160,"accent"));}
   }
   el.push(text("title",...titleBox as [number,number,number,number,number],"title",color));
   el.push(text("body",...bodyBox as [number,number,number,number,number],"body",!editorial&&mode===0?"bg":"ink"));
   el.push(text("purpose",editorial&&mode===0?500:!editorial&&mode===2?880:80,820,700,40,25,"purpose","muted"));
   if (["comparison","evidence","team","next"].includes(purpose)) {
    el.splice(0,el.length,
      text("title",80,80,1400,240,editorial?90:94,"title"),
      rect("rule",80,320,1440,editorial?2:8,"accent"),
      {id:"evidence-table",type:"table",x:80,y:390,width:1440,height:370,z:3},
      text("purpose",80,820,1400,40,25,"purpose","muted"));
   }
   const art=artDirection(family.id,purpose);
   if(art)el.splice(0,el.length,...art.elements);
   const silhouette=art?`${family.id}-${purpose}`:`${family.id}-${mode}`;if(silhouettes.at(-1)===silhouette)throw Error("Repeated adjacent silhouette");silhouettes.push(silhouette);
   const slots:any={title:{kind:"text",from:"title"},body:{kind:"text",from:"items2"},purpose:{kind:"text",from:"items0"},folio:{kind:"text",from:"items1"}};
   if(art)art.copy.forEach((_:string,n:number)=>slots["art"+n]={kind:"text",from:"items"+(n+3)});
   if(art?.photo)slots.photo={kind:"image",from:"photo",optional:false};
   const fit:any={};for(const e of el.filter(e=>e.type==="text"))fit[e.slot]={minFont:e.fontSize,maxFont:e.fontSize,lineClamp:Math.max(1,Math.floor(e.height/(e.fontSize*1.12))),shrinkMin:1};
   const kit={id:`${role}/${variant}`,role,variant,family:family.id,status:"approved",preserveLayout:true,requiresPhoto:!!art?.photo,photoSlots:art?.photo?["photo"]:[],slots,fit,pptxMapping:{},layout:{elements:el}};
   validateKitObject(kit);fs.writeFileSync(path.join(ROOT,"kit",role,variant+".json"),JSON.stringify(kit,null,2));
   const tables:any={comparison:[["CRITERION","OPTION A","OPTION B"],["Effort","Small first test","Larger initial change"],["Learning","Fast feedback","Broader coverage"],["Risk","Limited scope","More assumptions"]],evidence:[["FINDING","SOURCE","LIMITATION"],["Add your finding","Interview or dataset","State sample size"],["Add supporting evidence","Observation or test","State uncertainty"]],team:[["RESPONSIBILITY","OWNER","CONTRIBUTION"],["Decision","Sponsor","Approve scope"],["Delivery","Team lead","Coordinate work"],["Review","Research lead","Check evidence"]],next:[["ACTION","OWNER","REVIEW"],["Prepare a first test","Delivery lead","Day 1"],["Collect feedback","Research lead","Day 3"],["Decide next step","Sponsor","Day 5"]]};
   selections.push({role,variant});samples.push({role,title,body,photoQuery:art?.photo?"abstract tactile painting":undefined,table:tables[purpose],items:[purpose.toUpperCase(),String(i+1).padStart(2,"0"),body,...(art?.copy||[])]});
  }
  const spec={style:{palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"},slides:samples};
  const deck=await renderDeckFromSpec(spec,selections,{id:`library-${family.id}`,brand:family.brand,photoResolver:async()=>({path:path.join(ROOT,"engine/cache/photos/0d31bc91f0819a44fefa98dbb69469735ba46591.png"),pexelsId:"local:editorial-art"})});deck.name=family.name;deck.description="12 editable layouts for context, decisions, evidence and action.";
  for(const lid of deck.layoutSequence)for(const e of deck.layouts[lid].elements)if(e.tableContent){Object.assign(e.tableContent,{headerFill:family.brand.colors.ink,headerColor:family.brand.colors.bg,altRowFill:family.brand.colors.surface_color,fontSize:30});}
  for(let i=0;i<12;i++){const lid=deck.layoutSequence[i];for(const e of deck.layouts[lid].elements)if(e.textContent?.spans.some((s:any)=>s.text.includes("…")))throw Error(`${family.id}/${i+1}/${e.id}: truncated`);const warnings=renderSlidePng(deck,lid,path.join(dir,`slide-${String(i+1).padStart(2,"0")}.png`));if(warnings.length)throw Error(warnings.join(";"));}
  fs.writeFileSync(path.join(dir,"deck.json"),JSON.stringify(deck,null,2));fs.writeFileSync(path.join(dir,"spec.json"),JSON.stringify({spec,selections,brand:family.brand},null,2));
  await exportDeckPptx(deck,path.join(dir,"deck.pptx"));
  const c=createCanvas(1600,2916),ctx=c.getContext("2d");ctx.fillStyle="#292929";ctx.fillRect(0,0,c.width,c.height);for(let i=0;i<12;i++)ctx.drawImage(await loadImage(path.join(dir,`slide-${String(i+1).padStart(2,"0")}.png`)),i%2*800+8,Math.floor(i/2)*486+20,784,441);fs.writeFileSync(path.join(dir,"preview.png"),c.toBuffer("image/png"));
  console.log(`PASS ${family.id}: 12 kits, content budgets, silhouette rhythm, text fit, PNG/PPTX`);
  if(process.argv.includes("--publish-local")){
   const job=`library-${family.id}-${Date.now()}`,stage=path.join(ROOT,"docs/template-pipeline/admin-dashboard/tmp",job);
   fs.mkdirSync(stage,{recursive:true});for(const name of fs.readdirSync(dir).filter((n:string)=>n==="deck.json"||n==="deck.pptx"||/^slide-\d{2}\.png$/.test(n)))fs.copyFileSync(path.join(dir,name),path.join(stage,name));
   const staged=JSON.parse(JSON.stringify(deck));
   for(const lid of staged.layoutSequence)for(const e of staged.layouts[lid].elements){
    if(!e.imageContent?.url?.startsWith("photos/"))continue;
    const name=path.basename(e.imageContent.url),assetDir=path.join(ROOT,"generated-templates/photos/composer",job);
    fs.mkdirSync(assetDir,{recursive:true});fs.copyFileSync(path.join(ROOT,"generated-templates",e.imageContent.url),path.join(assetDir,name));
    e.imageContent.url=`photos/composer/${job}/${name}`;
   }
   fs.writeFileSync(path.join(stage,"deck.json"),JSON.stringify(staged,null,2));
   const result=await require("../services/templatePipeline/adminCatalog").publishTemplate(job);
   const catalog=require("../services/templatePipeline/catalog");
   if(catalog.readCatalog(result.id).slides.length!==12)throw Error("Missing published previews");
   const download=await catalog.buildPptx(result.id);if(download.buffer.length<1000)throw Error("Empty download");
   fs.writeFileSync(path.join(dir,"release.json"),JSON.stringify({...result,verifiedPreviews:12,downloadBytes:download.buffer.length},null,2));
  }
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

