const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname,"..");
for(const warm of [true,false]){
 const id=warm?"atelier-form":"signal-orange";
 const rows=require("../examples/"+(warm?"loom-register":"quay-line")+"-presentation-content.json");
 const brand=warm?{colors:{bg:"#EEE9DD",ink:"#293B32",accent:"#8C482F",surface:"#D2D8C6",line:"#A39B86"},fonts:{display:"Georgia",body:"Calibri"}}:{colors:{bg:"#F3EFDF",ink:"#172320",accent:"#F44D23",surface:"#D7DFD2",line:"#62746D"},fonts:{display:"Arial",body:"Calibri"}};
 const deck={name:warm?"Atelier Form":"Signal Orange",description:warm?"A photographic textile collection proposal with architectural spacing.":"A bold transport proposal with orange fields and geometric journey diagrams.",brand,spec:{style:{palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"},slides:[]},selections:[]};
 for(let i=0;i<12;i++){
  const edge=i===0||i===11, role=i===0?"cover":"feature",variant=id+"-"+i;
  const row=edge?[i===0?(warm?"Spaces with\nsoftness":"MOVE\nBETTER."):(warm?"Bring the\ncollection home":"THE NEXT\nSTOP."),warm?"A considered textile collection":"A clearer passenger journey",warm?"Material, craft and a focused launch plan.":"A six-week pilot for three city stations."]:rows[i-1];
  let elements=[],slots={},fit={},pptxMapping={},items=[];
  function shape(x,y,width,height,tokenFill,shape="rect"){elements.push({id:"s"+elements.length,morphId:"s"+elements.length,type:"shape",shape,x,y,width,height,tokenFill,z:1});}
  function text(value,x,y,width,height,size,title=false,color="ink",bold=false){
   const slot=title?"title":"c"+items.length;
   slots[slot]={kind:"text",from:title?"title":"items"+items.length};
   if(!title)items.push(value);
   fit[slot]={minFont:size,maxFont:size,lineClamp:12,shrinkMin:1};
   pptxMapping[slot]={kind:"text"};
   elements.push({id:slot,morphId:slot,type:"text",slot,x,y,width,height,fontSize:size,fontRole:title?"display":"body",textStyleRole:title?"display":"body",fontWeight:title||bold?700:400,tokenColor:color,z:4});
  }
  const imageIndex=[0,2,5,11].indexOf(i);
  const hasPhoto=imageIndex>=0;
  function photo(x,y,width,height){slots.photo={kind:"image",from:"photo"};elements.push({id:"photo",morphId:"photo",type:"image",slot:"photo",x,y,width,height,z:0});}
  if(edge){
   if(warm){photo(0,0,1600,900);shape(75,90,730,720,"bg");text(row[0],125,240,640,310,78,true);text(row[1],125,135,630,65,28);text(row[2],125,640,610,125,30);}
   else{shape(0,0,900,900,"accent");photo(900,0,700,900);text(row[0],65,170,800,350,132,true);text(row[1],70,650,750,85,36);text(row[2],70,760,750,85,28);}
  }else if(hasPhoto){
   if(warm){photo(0,0,650,900);text(row[0],720,70,800,160,57,true);for(let j=0;j<3;j++){text(row[j*2+1],720,275+j*175,800,55,31,false,"accent",true);text(row[j*2+2],720,335+j*175,800,115,25);}}
   else {photo(0,0,1600,350);shape(0,350,520,550,"accent");text(row[0],60,425,420,360,58,true);for(let j=0;j<3;j++){text(row[j*2+1],580,400+j*160,950,50,29,false,"ink",true);text(row[j*2+2],580,455+j*160,950,105,25);}}
  }else if(i===6){
   text(row[0],75,70,1440,160,62,true);
   for(let j=0;j<3;j++){const x=75+j*495;shape(x,300,440,4,"accent");text(row[j*2+1],x,340,440,165,125,false,"accent",true);text(row[j*2+2],x,565,430,260,28);}
  }else if(warm){
   const mode=i%3;
   if(mode===0){shape(0,0,510,900,"surface");text(row[0],65,110,385,390,58,true);for(let j=0;j<3;j++){text(row[j*2+1],580,100+j*240,900,70,34,false,"accent",true);text(row[j*2+2],580,185+j*240,900,140,28);shape(580,345+j*240,940,2,"line");}}
   else if(mode===1){text(row[0],75,75,1450,155,62,true);for(let j=0;j<3;j++){const x=75+j*495;shape(x,295+j*50,440,380,"surface");text(row[j*2+1],x+22,325+j*50,395,85,31,false,"accent",true);text(row[j*2+2],x+22,440+j*50,395,230,26);}}
   else {text(row[0],75,75,1450,155,62,true);for(let j=0;j<3;j++){let x=95+j*495;shape(x,285,84,84,"accent","ellipse");text(String(j+1),x+25,300,55,60,37,false,"bg",true);text(row[j*2+1],x,410,430,100,32,false,"ink",true);text(row[j*2+2],x,550,430,250,28);if(j<2)shape(x+84,325,390,3,"line");}}
  }else{
   const mode=i%3;
   if(mode===0){shape(0,0,1600,245,"accent");text(row[0],65,55,1460,150,66,true);for(let j=0;j<3;j++){let y=300+j*180;shape(65,y,75,75,"ink");text(String(j+1),85,y+10,55,60,38,false,"bg",true);text(row[j*2+1],180,y,400,115,32,false,"ink",true);text(row[j*2+2],650,y,865,145,28);}}
   else if(mode===1){shape(0,0,95,900,"accent");text(row[0],160,75,1300,170,58,true);for(let j=0;j<3;j++){const x=160+j*465;shape(x,300,420,4,"ink");text(row[j*2+1],x,345,410,120,34,false,"ink",true);text(row[j*2+2],x,515,400,280,26);}}
   else{shape(1050,0,550,900,"accent");text(row[0],75,75,875,190,67,true);text(row[1],1100,235,430,160,47,false,"ink",true);text(row[2],1100,460,415,260,28);for(let j=1;j<3;j++){text(row[j*2+1],75,335+(j-1)*240,870,80,34,false,"ink",true);text(row[j*2+2],75,430+(j-1)*240,865,145,28);}}
  }
  if(!edge)text("Illustrative proposal",75,855,650,35,24);
  const kit={id:role+"/"+variant,role,variant,family:id,status:"draft",preserveLayout:true,requiresPhoto:hasPhoto,photoSlots:hasPhoto?["photo"]:[],slots,fit,pptxMapping,layout:{elements}};
  fs.writeFileSync(path.join(root,"kit",role,variant+".json"),JSON.stringify(kit,null,2));
  deck.spec.slides.push({role,title:row[0],items,...(hasPhoto?{photoQuery:id+"-"+imageIndex}:{})});
  deck.selections.push({role,variant});
 }
 fs.writeFileSync(path.join(root,"examples",id+".json"),JSON.stringify(deck,null,2));
}


