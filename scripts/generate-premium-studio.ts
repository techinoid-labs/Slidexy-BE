import * as fs from "fs";
import * as path from "path";
import { circle, El, ROOT, Template, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";
import { resolvePhoto, PhotoResult } from "../engine/photos";
const JSZip = require("jszip");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const stories: Record<string,string[][]> = require("../examples/studio-pair-content.json");

const families = {
  selvedge: {
    name: "Selvedge", description: "Room Cloth, a fictional textile collection and commissioning book",
    colors: {bg:"#F3EDDF",ink:"#292E2A",accent:"#9E3F32",surface:"#B3BC9D",line:"#C7B8A4",paper:"#FFFDF3",dark:"#292E2A"},
    fonts: {display:"Garamond",body:"Calibri"}
  },
  "gatefold-cinema": {
    name:"Gatefold Cinema", description:"Before the First Train, a fictional short film treatment",
    colors:{bg:"#151B26",ink:"#FCEDDA",accent:"#FFC072",surface:"#344052",line:"#79838E",paper:"#FFFFFF",dark:"#10151C"},
    fonts:{display:"Franklin Gothic Heavy",body:"Calibri"}
  }
};
type Family = keyof typeof families;
const shadow={offsetY:8,blur:16,opacity:0.23,color:"#242324"};
const pic=(x:number,y:number,w:number,h:number)=>photo("reference",x,y,w,h,{z:3});
const heading=(x:number,y:number,w:number,h:number,size:number)=>text("title",x,y,w,h,size,"title","ink",{z:5});
const copy=(n:number,x:number,y:number,w:number,h:number,size:number,color="ink")=>
  text("body-"+n,x,y,w,h,size,"copy"+n,color,{z:5});
const moving=(name:string,x:number,y:number,w:number,h:number,color:string,z:number)=>
  rect(name,x,y,w,h,color,{z,morphId:name,shadow,keepFill:true});

function cover(cloth:boolean):El[] {
  if(cloth) return [
    moving("back-plane",605,0,995,900,"accent",1),
    moving("front-plane",630,0,970,900,"surface",2),pic(660,0,940,900),
    copy(0,64,65,520,78,25,"accent"),heading(55,315,550,170,108),
    copy(1,65,660,475,190,35)
  ];
  return [pic(0,0,1600,610),
    moving("back-plane",0,0,1600,84,"dark",4),moving("front-plane",0,570,1600,330,"dark",4),
    heading(55,605,940,240,94),copy(0,65,22,1450,52,25,"accent"),copy(1,1080,670,460,170,30)];
}

// Material cross-section and overhead blocking plan. Each diagram uses the
// same content slots as its key, so labels survive edits to the prose.
function detailPlate(cloth:boolean):El[] {
  const plate=cloth?"surface":"dark";
  const els=[rect("plate",0,0,785,900,plate), heading(830,62,710,200,66)];
  const rows=[290,475,660];
  for(const [i,y] of rows.entries()){
    els.push(copy(2*i,837,y,680,60,33,"accent"),copy(2*i+1,837,y+58,675,123,26));
  }
  if(cloth){
    for(const [i,y] of rows.entries()){
      const x=95+i*32, w=495-i*32;
      els.push(rect("fold-"+i,x,y-60,w,58,["paper","accent","ink"][i]),
        rect("return-"+i,x+w-32,y-6,32,62,["paper","accent","ink"][i]));
      for(let j=0;j<12;j++)els.push(rect("thread-"+i+"-"+j,x+12+j*31,y-51,2,38,["line","paper","line"][i]));
      els.push(rect("leader-"+i,x+w+12,y-2,765-x-w,2,"ink"));
    }
  }else{
    // An open threshold separates the stairs from the operator's booth.
    els.push(rect("wall-left",100,152,235,8,"line"),rect("wall-right",465,152,212,8,"line"),
      rect("booth-wall",669,155,8,264,"line"),rect("landing-wall",100,155,8,548,"line"));
    for(let i=0;i<6;i++)els.push(rect("tread-"+i,108,505+i*39,301,3,"line"));
    const marks=[[370,425],[490,227],[555,605]];
    for(const [i,[x,y]] of marks.entries()){
      els.push(circle("position-"+i,x,y,24,"accent"),
        text("plan-key-"+i,x+36,y-5,165,45,23,"copy"+(2*i),"paper"));
    }
  }
  return els;
}

function photograph(cloth:boolean,index:number):El[] {
  if(cloth){
    const left=index===4;
    const x=left?75:830, words=left?845:75;
    return [rect("mount",x+22,105,656,655,"surface",{shadow}),pic(x,80,655,655),
      heading(words,100,650,178,66),copy(0,words,312,645,270,29),copy(1,words,585,645,230,29,"accent")];
  }
  if(index===4)return [pic(0,0,770,900),heading(850,88,675,185,67),
    copy(0,850,330,650,260,31),copy(1,850,620,650,180,30,"accent")];
  return [pic(0,0,1600,420),rect("caption-field",0,400,1600,500,"bg",{z:4}),
    heading(74,440,550,255,72),copy(0,680,450,820,215,30),copy(1,680,686,820,170,28,"accent")];
}

function threeParts(cloth:boolean, index:number):El[] {
  const els = [heading(75,62,1450,165,72)];
  if(cloth && index===3){
    for(const [i,fill] of ["paper","surface","accent"].entries()){
      const x=76+495*i;
      els.push(rect("sample-"+i,x,250,438,209,fill,{shadow}),copy(i*2,x,500,440,75,38),
        copy(i*2+1,x,604,440,230,29));
      // A different repeat for each swatch: open warp, rib and bound edge.
      const thread=["line","ink","paper"][i];
      const pitch=[27,12,19][i];
      for(let offset=12;offset<428;offset+=pitch)
        els.push(rect("warp-"+i+"-"+offset,x+offset,262,i===1?3:1,185,thread,{z:2}));
      for(let offset=12;offset<199;offset+=(i===2?12:27))
        els.push(rect("weft-"+i+"-"+offset,x+9,250+offset,420,i===2?2:1,thread,{z:2}));
    }
  }else if(cloth){
    for(let i=0;i<3;i++){
      const y=237+i*184;
      els.push(rect("selvedge-"+i,78,y,12,121,["surface","accent","ink"][i]),
        copy(i*2,130,y,445,122,41),copy(i*2+1,630,y,860,140,31));
    }
  }else{
    for(let i=0;i<3;i++){
      const x=75+492*i,y=260+55*i;
      els.push(rect("edge-"+i,x,y,435,5,"accent"),copy(i*2,x,y+43,435,106,44),
        copy(i*2+1,x,y+165,435,255,30));
    }
  }
  return els;
}

function narrative(cloth:boolean,index:number):El[] {
  if(cloth && index===1)return [rect("leaf",0,0,710,900,"surface"),
    heading(76,205,565,390,95),copy(0,800,150,705,270,32),copy(1,800,509,705,220,32)];
  if(cloth)return [heading(80,95,1435,200,85),rect("rule",80,320,1420,3,"accent"),
    copy(0,80,405,665,360,34),copy(1,850,450,635,305,32)];
  if(index===9)return [rect("final-field",0,0,1600,900,"dark"),heading(90,82,1350,170,96),
    copy(0,95,330,888,410,39),rect("cut",1050,350,3,345,"accent"),copy(1,1110,370,395,370,30,"accent")];
  return [heading(70,91,655,360,91),rect("frame-line",75,605,565,7,"accent"),
    copy(0,775,135,720,265,32),copy(1,775,490,720,275,32)];
}

function chartLayout(cloth:boolean):El[]{
  const x=cloth?75:760, width=cloth?790:755, words=cloth?935:76;
  return [heading(75,55,1460,162,73),rect("chart-mount",x,245,width,530,"paper",{shadow}),
    {id:"comparison",type:"chart",x:x+16,y:265,width:width-32,height:475,z:3},
    copy(0,words,270,cloth?585:625,275,30),copy(1,words,600,cloth?585:625,205,29,"accent")];
}

// Keep the automatic start conditions authored by PowerPoint. The cover calls
// for two translations, each targeting an independent editable native shape.
async function animateCover(file:string, cloth:boolean) {
  const zip=await JSZip.loadAsync(fs.readFileSync(file));
  const part="ppt/slides/slide1.xml";
  let xml=await zip.file(part).async("string");
  const template=fs.readFileSync(path.join(__dirname,"lib","turntable-reveal.xml"),"utf8");
  const dom=new DOMParser().parseFromString('<root xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'+template+'</root>',"application/xml");
  const timers=Array.from(dom.getElementsByTagName("p:cTn")) as any[];
  const spin=timers.find(t=>t.getAttribute("id")==="8").parentNode;
  spin.parentNode.removeChild(spin);
  const paths=Array.from(dom.getElementsByTagName("p:animMotion")) as any[];
  const offsets=cloth?["M 0.038 0.014 L 0 0 E","M 0.018 0.009 L 0 0 E"]:
    ["M 0 0.18 L 0 0 E","M 0 -0.18 L 0 0 E"];
  paths.forEach((motion,i)=>{
    motion.setAttribute("path",offsets[i]);
    motion.getElementsByTagName("p:cTn")[0].setAttribute("dur",cloth?(i===0?"1050":"790"):"1100");
  });
  let timing=new XMLSerializer().serializeToString(dom.getElementsByTagName("p:timing")[0]);
  for(const [token,name] of [["DISC_ID","back-plane"],["SLEEVE_ID","front-plane"]]){
    const id=xml.match(new RegExp('<p:cNvPr id="(\\d+)" name="!!morph:'+name+'"'))?.[1];
    if(!id)throw Error("Missing cover plane "+name);
    timing=timing.split(token).join(id);
  }
  xml=xml.replace(/<p:timing>[\s\S]*?<\/p:timing>/,"");
  zip.file(part,xml.replace("</p:sld>",timing+"</p:sld>"));
  fs.writeFileSync(file,await zip.generateAsync({type:"nodebuffer",compression:"DEFLATE"}));
}

async function build(id:Family) {
  const cloth=id==="selvedge", family=families[id], layouts:El[][]=[];
  const slides=stories[id].map(([title,...items],index)=>{
    const role=index===0?"cover":index===11?"closing":"feature";
    const slide:El={title,role,items};
    if([0,2,4,7].includes(index))slide.photoQuery=items.pop();
    if(index===0)layouts.push(cover(cloth));
    else if(slide.photoQuery)layouts.push(photograph(cloth,index));
    else if(index===5){
      layouts.push(chartLayout(cloth));
      slide.chart={type:"bar",labels:cloth?["Sheer","Fold","Upholstery"]:["Platform","Stairwell","Booth","Gate"],
        series:[{name:cloth?"Grams per square metre":"Screen minutes",values:cloth?[120,240,420]:[4,2,3,2]}],
        colors:[cloth?"#9E3F32":"#485D73"],showLegend:false};
    }else if(index===6)layouts.push(detailPlate(cloth));
    else if(items.length===6)layouts.push(threeParts(cloth,index));
    else if(role==="closing")layouts.push([rect("end-field",0,0,1600,900,cloth?"surface":"dark"),
      copy(0,80,115,1220,75,31,"accent"),heading(72,270,1440,245,cloth?100:120),copy(1,80,640,1130,160,40)]);
    else layouts.push(narrative(cloth,index));
    return slide;
  });
  const tpl:Template={id,name:family.name,description:family.description,family:id,
    brand:{colors:family.colors,fonts:family.fonts},premium:true,motion:false,slides,
    kits:()=>slides.map((s,i)=>writeKit(s.role,id+"-"+(i+1),id,layouts[i]))};
  const audit:Array<PhotoResult & {query:string}>=[];
  const output=path.join(ROOT,"out",id);
  const previous:typeof audit=process.argv.includes("--keep-art")
    ? JSON.parse(fs.readFileSync(path.join(output,"image-sources.json"),"utf8")) : [];
  await renderTemplate(tpl,false,async query=>{
    const found=previous.find(p=>p.query===query && fs.existsSync(p.path)) ??
      await resolvePhoto(query,"landscape","color",family.colors,new Set(audit.map(p=>p.pexelsId)),"preserve");
    audit.push({...found,query});
    return found;
  });
  fs.writeFileSync(path.join(output,"image-sources.json"),JSON.stringify(audit,null,2));
  await animateCover(path.join(output,id+".pptx"),cloth);
}
(async()=>{for(const id of Object.keys(families) as Family[])await build(id);})().catch(e=>{console.error(e);process.exitCode=1;});
