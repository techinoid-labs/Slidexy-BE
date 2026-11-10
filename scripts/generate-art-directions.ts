import * as fs from "fs";
import * as path from "path";
const ROOT=path.join(__dirname,".."), OUT=path.join(ROOT,"out","art-directions");
const {renderDeckFromSpec}=require("../engine/render");
const {validateKitObject}=require("../engine/validateSchema");
const {renderSlidePng}=require("./slideSvg");
const {exportDeckPptx}=require("../services/templatePipeline/catalog");
const {createCanvas,loadImage}=require("canvas");
const text=(id:string,x:number,y:number,width:number,height:number,fontSize:number,value:string,extra:any={})=>({id,type:"text",x,y,width,height,fontSize,value,z:4,fontWeight:400,tokenColor:"ink",fontRole:id==="title"?"display":"body",lineHeight:1.12,...extra});
const rect=(id:string,x:number,y:number,width:number,height:number,tokenFill="accent")=>({id,type:"shape",shape:"rect",x,y,width,height,tokenFill,z:1});
const photo=(x:number,y:number,width:number,height:number)=>({id:"photo",type:"image",x,y,width,height,z:1});
const families:any[]=[
{id:"editorial",brand:{colors:{bg:"#EEE8DC",surface:"#EEE8DC",ink:"#302C25",muted:"#62594D",accent:"#A8482D",line:"#C3B8A6"},fonts:{display:"Georgia",body:"Calibri"}},image:"0d31bc91f0819a44fefa98dbb69469735ba46591",slides:[
[ text("edition",80,55,500,44,25,"FIELDNOTES  /  VOL. 01"),rect("rule",80,119,1440,2,"line"), photo(920,185,600,540),text("title",75,205,870,360,125,"A closer\nlook.",{fontWeight:400}),text("subtitle",82,660,610,100,32,"New perspectives on the spaces\nand objects around us."),text("footer",80,815,900,40,24,"CULTURE  /  MATERIAL  /  EVERYDAY LIFE"),text("page",1440,815,80,40,24,"01",{align:"right"})],
[rect("side",0,0,570,900,"accent"),text("number",70,90,420,260,200,"01",{fontRole:"display",tokenColor:"bg"}),text("sidecopy",80,655,410,130,36,"Look closer.\nThere is more here.",{tokenColor:"bg"}),text("kicker",660,75,700,40,24,"AN EDITORIAL PERSPECTIVE"),text("title",655,185,810,250,90,"Details make\nthe difference."),rect("rule",660,500,820,2,"line"),text("copy",660,548,700,155,34,"A small change in texture, light or proportion can transform how a place feels."),text("foot",660,802,740,40,24,"OBSERVATION BEFORE INTERVENTION")]],
},
{id:"architecture",brand:{colors:{bg:"#151817",surface:"#151817",ink:"#F3F0E7",muted:"#C2C9C1",accent:"#CBDD94",line:"#515951"},fonts:{display:"Segoe UI",body:"Segoe UI"}},image:"06deb5843eea",slides:[
[photo(0,0,1600,565),rect("tagback",55,28,510,65,"ink"),text("tag",70,40,500,40,24,"ATELIER / SPATIAL PRACTICE",{color:"#151817"}),text("title",65,615,1100,175,102,"Space to belong.",{fontWeight:300}),text("caption",1150,645,370,120,27,"A study of shared spaces\nand quiet moments."),rect("rule",70,815,1460,1,"line"),text("foot",70,840,900,35,22,"SELECTED WORKS     /     CONCEPT STUDY"),text("year",1420,840,110,35,22,"2026",{align:"right"})],
[photo(680,0,920,900),text("index",65,65,400,50,30,"PROJECT 01"),text("title",65,220,570,270,86,"Built for\ndaily life.",{fontWeight:300}),rect("line",70,555,470,2,"line"),text("copy",70,600,460,160,29,"Natural light, clear circulation and generous shared space shape a calmer working day."),text("foot",70,825,480,35,22,"WORKPLACE  /  SPATIAL STUDY")]],
},
{id:"executive",brand:{colors:{bg:"#F3F5F5",surface:"#F3F5F5",ink:"#123B3B",muted:"#466464",accent:"#D4F265",line:"#C5D5D2"},fonts:{display:"Arial",body:"Arial"}},slides:[
[rect("hero",1020,0,580,900,"ink"),rect("accent",1095,100,430,430,"accent"),text("metric",1130,200,370,190,136,"2.4×",{fontWeight:700}),text("metriclabel",1100,570,425,130,32,"A clearer view\nof what comes next.",{tokenColor:"bg"}),text("brand",80,65,800,45,25,"NORTH / STRATEGY & OPERATIONS"),text("title",75,245,900,300,110,"Clarity drives\nprogress.",{fontWeight:700}),text("body",80,650,750,100,31,"An executive perspective on growth,\nperformance and the next decision."),text("foot",80,815,850,40,24,"ILLUSTRATIVE STRATEGY BRIEF  /  2026")],
[text("tag",80,55,1300,40,24,"PERFORMANCE SNAPSHOT  /  ILLUSTRATIVE DATA"),text("title",75,155,1400,160,80,"Focus on the strongest signal.",{fontWeight:700}),text("big",80,385,510,200,150,"+38%",{fontWeight:700}),text("label",85,620,490,90,31,"Growth in the leading segment"),rect("divider",650,360,2,420,"line"),text("h1",750,350,700,50,30,"Segment performance"),text("lab1",750,445,400,40,26,"Leading segment"),rect("bar1",750,500,700,40,"ink"),text("lab2",750,575,400,40,26,"Core segment"),rect("bar2",750,630,470,40,"muted"),text("lab3",750,705,400,40,26,"Emerging segment"),rect("bar3",750,760,260,40,"accent"),text("foot",80,835,1350,35,22,"SAMPLE DATA  /  REPLACE WITH YOUR OWN METRICS")]],
}];
async function main(){
fs.mkdirSync(OUT,{recursive:true});const previews:string[]=[];
const cache=path.join(ROOT,"engine/cache/photos");const names=fs.readdirSync(cache);
for(const f of families){
 const specs:any[]=[];const selections:any[]=[];
 for(let i=0;i<2;i++){
 const role=i===0?"cover":"feature",variant="direction-"+f.id+"-"+(i===0?"cover":"body");
 const kit:any={id:role+"/"+variant,role,variant,family:f.id,preserveLayout:true,status:"draft",requiresPhoto:false,photoSlots:[],slots:{},fit:{},pptxMapping:{},layout:{elements:[]}};
 const sample:any={role,variantHint:variant,title:"",items:[]};
 for(const raw of f.slides[i]){
 const e:any={...raw,morphId:raw.id};
 if(e.type==="text"){const slot=e.id==="title"?"title":"copy"+sample.items.length;
 const from=e.id==="title"?"title":"items"+sample.items.length;
 if(e.id==="title")sample.title=e.value;else sample.items.push(e.value);
 delete e.value;e.slot=slot;kit.slots[slot]={kind:"text",from,optional:false};kit.pptxMapping[slot]={kind:"text"};
 kit.fit[slot]={minFont:e.fontSize,maxFont:e.fontSize,lineClamp:Math.max(1,Math.floor(e.height/(e.fontSize*1.12))),shrinkMin:1};
 }else if(e.type==="image"){e.slot="photo";kit.photoSlots.push("photo");kit.requiresPhoto=true;kit.slots.photo={kind:"image",from:"photo",optional:false};kit.pptxMapping.photo={kind:"picture"};sample.photoQuery="studio interior concept";}
 kit.layout.elements.push(e);
 }
 validateKitObject(kit);fs.writeFileSync(path.join(ROOT,"kit",role,variant+".json"),JSON.stringify(kit,null,2));
 specs.push(sample);selections.push({role,variant});
 }
 const spec={style:{palette:"ink-night",typePair:"modern-segoe",imageTreatment:"full-bleed",motif:"bar-accent"},slides:specs};
 const img=f.image?names.find((n:string)=>n.startsWith(f.image)):null;
 if(f.image&&!img)throw new Error("Missing curated image "+f.image);
 const deck=await renderDeckFromSpec(spec,selections,{id:"direction-"+f.id,brand:f.brand,photoResolver:async()=>({path:path.join(cache,img),pexelsId:"local:"+img})});
 const dir=path.join(OUT,f.id);fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,"spec.json"),JSON.stringify({spec,brand:f.brand,selections},null,2));
 for(let i=0;i<2;i++){const lid=deck.layoutSequence[i];for(const e of deck.layouts[lid].elements){if(e.textContent?.spans.some((s:any)=>/…/.test(s.text)))throw new Error("Truncation "+f.id+"/"+e.id);}
 const out=path.join(dir,(i===0?"cover":"body")+".png");const warnings=renderSlidePng(deck,lid,out);if(warnings.length)throw new Error(warnings.join(";"));previews.push(out);}
 await exportDeckPptx(deck,path.join(dir,"proof.pptx"));console.log("Exported "+f.id);
}
const c=createCanvas(1600,1460),ctx=c.getContext("2d");ctx.fillStyle="#26282A";ctx.fillRect(0,0,1600,1460);
for(let i=0;i<previews.length;i++){const x=i%2*800,y=Math.floor(i/2)*486;ctx.drawImage(await loadImage(previews[i]),x+8,y+34,784,441);ctx.fillStyle="#fff";ctx.font="18px Segoe UI";ctx.fillText(families[Math.floor(i/2)].id.toUpperCase()+" / "+(i%2?"BODY":"COVER"),x+12,y+24);}
fs.writeFileSync(path.join(OUT,"comparison.png"),c.toBuffer("image/png"));
}
main().catch(e=>{console.error(e);process.exitCode=1});




