import * as fs from "fs";
import * as path from "path";
const {renderDeckFromSpec} = require("../engine/render");
const {validateKitObject} = require("../engine/validateSchema");
const {renderSlidePng} = require("./slideSvg");
const {exportDeckPptx} = require("../services/templatePipeline/catalog");
const {createCanvas,loadImage} = require("canvas");
const sharp = require("sharp");
const root = path.join(__dirname,"..");
const out = path.join(root,"out/concept-gallery");
const families = [
 ["Field Atlas","#F0EBD4","#263E32","#BD5737","Georgia"],
 ["Photo Essay","#F8F5EE","#221C19","#B25B43","Georgia"],
 ["Technical Drawing","#153651","#ECF4EF","#A0DBD4","Consolas"],
 ["Swiss Poster","#F1F0E7","#101112","#ED422C","Arial"],
 ["Museum Catalogue","#F6EFE1","#342E27","#866544","Georgia"],
 ["Storyboard","#FBF1CF","#29231F","#CF683F","Arial"],
 ["Financial Ledger","#E9EEE8","#183A36","#397262","Consolas"],
 ["Paper Collage","#FBE1C1","#392933","#BB5161","Georgia"],
 ["Transit Diagram","#FFF9E9","#172847","#207F89","Arial"],
 ["Scientific Plate","#EBEFE4","#25352C","#637C53","Georgia"]
];
const pages = [
 ["The pickup counter","A cafe service study","Reducing the wait for a morning coffee."],
 ["One queue or two?","Single pickup","Split pickup"],
 ["Six minutes faster","18 min / single pickup","12 min / split pickup"]
];
const note=["Morning service / concept study","One counter for all drinks, or separate counters for hot and cold orders.","Illustrative mean wait per order. Equal observation periods."];
const coffee=["081717d284","092c8c1420","0d7b07d1c3"];
function compose(style:number,page:number){
 const nodes:any[]=[];
 let asset="";
 const shape=(x:number,y:number,width:number,height:number,fill:string,kind="rect")=>nodes.push({id:"mark"+nodes.length,type:"shape",shape:kind,x,y,width,height,tokenFill:fill,z:1});
 const label=(slot:string,x:number,y:number,width:number,height:number,size:number,color="ink")=>nodes.push({id:slot,type:"text",slot,x,y,width,height,fontSize:size,fontRole:slot==="title"?"display":"body",fontWeight:slot==="title"?700:400,tokenColor:color,lineHeight:1.1,z:4});
 const pic=(x:number,y:number,width:number,height:number,key:string)=>{asset=key;nodes.push({id:"photo",type:"image",slot:"photo",x,y,width,height,z:1});};
 const title=(x:number,y:number,w:number,h:number,s:number,c="ink")=>label("title",x,y,w,h,s,c);
 const pair=(x:number,y:number,x2:number,y2:number,w:number,s=38,c="ink")=>{label("a",x,y,w,125,s,c);label("b",x2,y2,w,135,s,c);};
 const foot=(x=70,y=800,w=1450,c="ink")=>label("note",x,y,w,94,27,c);
 switch(style){
 case 0: // Floor plan and keyed marginal legend.
  shape(0,0,940,900,"surface");for(const [x,y,w,h] of [[90,140,680,8],[90,140,8,520],[90,660,680,8],[770,140,8,360],[235,275,350,90],[630,440,90,150]])shape(x,y,w,h,"ink");
  for(let j=0;j<5;j++)shape(130+j*109,525,26,26,"accent","ellipse");
  title(970,90,560,300,70);pair(975,405,975,545,540,35);foot(975,725,550);break;
 case 1: // Photo sequence with caption strip.
  if(page===0){pic(0,0,1600,600,coffee[0]);title(65,620,1050,170,92);pair(1110,625,1110,690,425,25);foot(70,815,1400);}
  else{pic(70,80,800,730,coffee[page]);title(935,105,590,210,76);pair(935,365,935,505,570);foot(935,685,570);}break;
 case 2: // Exploded counter assembly on a drafting grid.
  for(let j=0;j<10;j++)shape(65+j*92,120,1,590,"muted");
  for(let j=0;j<7;j++)shape(65,135+j*90,835,1,"muted");
  for(let j=0;j<3;j++){shape(180+j*90,255+j*110,400,36,"accent");shape(570+j*90,260+j*110,170,3,"ink");}
  title(985,95,545,255,64);pair(985,375,985,530,545,34);foot(70,795,1440);break;
 case 3: // Oversized typographic poster.
  shape(0,0,32,900,"accent"); title(65,55,1490,360,page===0?154:142);
  shape(80,490,1450,14,"ink");pair(80,560,840,560,680,50);foot();break;
 case 4: // An exhibit and a wall label.
  pic(440,80,720,480,coffee[page===0?2:page===1?1:0]);shape(450,580,700,2,"line");
  title(65,635,720,170,68);pair(825,645,825,716,690,29);foot(75,818,1450);break;
 case 5: // Three illustrated frames. Queue dots split across pickup points.
  title(65,55,1450,170,95);
  for(let j=0;j<3;j++){const x=65+j*500;shape(x,280,470,290,"ink");shape(x+7,287,456,276,"bg");shape(x+40,455,360,17,"accent");for(let k=0;k<4-j;k++)shape(x+45+k*61,358,36,36,"ink","ellipse");if(j>0)shape(x+295,330,88,92,"accent");}
  pair(70,605,830,605,690,40);foot();break;
 case 6: // Ruled ledger with aligned columns.
  label("edition",70,62,1400,55,27);title(70,155,1450,190,92);
  for(const y of [125,390,544,700])shape(70,y,1460,2,"ink");
  shape(770,390,2,310,"ink");label("a",95,425,645,110,40);label("b",825,570,640,115,40);foot();break;
 case 7: // Layered paper, photograph and offset caption.
  shape(40,100,820,610,"accent");pic(110,155,690,480,coffee[page]);shape(670,350,875,300,"surface");
  title(715,385,770,230,79);pair(80,702,830,702,700,34);foot(80,825,1450);break;
 case 8: // Route forks with station labels.
  title(70,60,1460,200,103);shape(85,500,600,22,"ink");shape(670,340,22,350,"ink");shape(675,335,790,22,"accent");shape(675,678,790,22,"ink");
  for(const [x,y] of [[85,485],[650,320],[1400,320],[650,660],[1400,660]]){shape(x,y,55,55,"ink","ellipse");shape(x+11,y+11,33,33,"bg","ellipse");}
  pair(760,230,760,560,740,40);foot();break;
 case 9: // Magnified specimen with measurement scale and notes.
  pic(65,170,670,570,coffee[2]);for(let j=0;j<=10;j++)shape(65+j*66,748,2,j%5===0?38:16,"ink");
  title(790,120,745,225,80);shape(790,398,700,2,"line");pair(790,442,790,592,710,37);foot(80,820,1450);break;
 }
 // Evidence layouts keep each family's notation while encoding both measured waits.
 if(page===2){
  if(style===0 || style===2){
   shape(125,720,540,12,"ink");shape(125,750,360,12,"accent");
  }else if(style===3){
   nodes.length=0;shape(0,0,1600,325,"accent");title(70,55,1460,225,140);
   label("a",70,395,1400,100,65);shape(75,520,1170,23,"ink");
   label("b",70,580,1400,100,65);shape(75,705,780,23,"ink");foot();
  }else if(style===5){
   // The 3 frames represent successive six-minute intervals.
   for(let j=0;j<3;j++){shape(90+j*500,540,410,9,"ink");if(j<2)shape(90+j*500,520,410,9,"accent");}
  }else if(style===6){
   shape(825,455,540,32,"ink");shape(825,505,360,16,"accent");
  }else if(style===8){
   // Short route terminates two thirds of the way from the branch point.
   nodes.length=0;title(70,65,1450,190,100);shape(110,335,18,355,"ink");
   for(const [y,width,tone] of [[335,1260,"ink"],[665,840,"accent"]] as const){
    shape(110,y,width,18,tone);shape(95+width,y-15,46,46,tone,"ellipse");
   }
   label("a",150,235,1000,90,44);label("b",150,565,1000,90,44);foot();
  }else if(style===9){
   nodes.length=0;asset="";title(80,55,1420,180,90);
   for(let j=0;j<18;j++){
    const x=95+(j%6)*85,y=270+Math.floor(j/6)*92;
    shape(x,y,48,67,"ink","ellipse");
    if(j<12)shape(x+790,y,48,67,"accent","ellipse");
   }
   pair(90,610,880,610,635,42);foot();
  }
 }
 return {nodes,asset};
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const shots:string[][]=[];
 for(let i=0;i<families.length;i++){
  const [name,bg,ink,accent,font]=families[i],slug=name.toLowerCase().replace(/ /g,"-");
  const dir=path.join(out,slug);fs.mkdirSync(dir,{recursive:true});
  const brand={colors:{bg,ink,accent,line:ink,muted:i===2?"#45637A":ink,surface:i===0?"#D6DFC3":"#F6EDD8"},fonts:{display:font,body:"Arial"}};
  const slides:any[]=[],selections:any[]=[];
  for(let p=0;p<3;p++){
   const {nodes,asset}=compose(i,p),role=p===0?"cover":"feature",variant="concept-"+slug+"-"+["cover","comparison","evidence"][p];
   const slots:any={},fit:any={},pptxMapping:any={};
   for(const n of nodes){n.morphId=n.id;if(n.type==="text"){slots[n.slot]={kind:"text",from:({title:"title",a:"items0",b:"items1",note:"items2",edition:"items3"} as any)[n.slot]};fit[n.slot]={minFont:n.fontSize,maxFont:n.fontSize,lineClamp:Math.max(1,Math.floor(n.height/(n.fontSize*1.1))),shrinkMin:1};pptxMapping[n.slot]={kind:"text"};}}
   if(asset){slots.photo={kind:"image",from:"photo"};pptxMapping.photo={kind:"picture"};}
   const kit={id:role+"/"+variant,role,variant,family:slug,status:"draft",preserveLayout:true,requiresPhoto:!!asset,photoSlots:asset?["photo"]:[],slots,fit,pptxMapping,layout:{elements:nodes}};
   validateKitObject(kit);fs.writeFileSync(path.join(root,"kit",role,variant+".json"),JSON.stringify(kit,null,2));
   slides.push({role,title:pages[p][0],items:[...pages[p].slice(1),note[p],"SERVICE OPERATIONS / WORKING PAPER"],photoQuery:asset||undefined});selections.push({role,variant});
  }
  const spec={style:{palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"},slides};
  const deck=await renderDeckFromSpec(spec,selections,{id:slug,brand,photoResolver:async(q:string)=>{const folder=path.join(root,"engine/cache/photos");const file=fs.readdirSync(folder).find(f=>f.startsWith(q));if(!file)throw Error("Missing cafe photo "+q);return {path:path.join(folder,file),pexelsId:"local:"+q};}});
  deck.name=name; const images:string[]=[];
  for(let p=0;p<3;p++){const lid=deck.layoutSequence[p];for(const node of deck.layouts[lid].elements)if(node.textContent?.spans.some((s:any)=>s.text.includes("…")))throw Error(name+" "+p+" "+node.id+" truncated");
   const file=path.join(dir,["cover","comparison","evidence"][p]+".png");const warnings=renderSlidePng(deck,lid,file);if(warnings.length)throw Error(name+" "+warnings.join(", "));images.push(file);}
  await exportDeckPptx(deck,path.join(dir,slug+".pptx"));fs.writeFileSync(path.join(dir,"manifest.json"),JSON.stringify({name,brand,spec,selections},null,2));shots.push(images);console.log(name);
 }
 for(const gray of [false,true]){const cols=gray?2:3,w=512,h=288,row=332;const canvas=createCanvas(cols*w,shots.length*row),ctx=canvas.getContext("2d");ctx.fillStyle="#262626";ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<shots.length;i++){ctx.fillStyle="#fff";ctx.font="18px Arial";ctx.fillText(families[i][0],8,i*row+24);for(let j=0;j<cols;j++){const file=shots[i][j+(gray?1:0)];ctx.drawImage(await loadImage(gray?await sharp(file).grayscale().png().toBuffer():file),j*w,i*row+32,w,h);}}
  fs.writeFileSync(path.join(out,gray?"body-grayscale.png":"gallery.png"),canvas.toBuffer("image/png"));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

