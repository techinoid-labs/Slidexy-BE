const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname,"..");
for(const graphic of [true,false]){
 const id=graphic?"offset-studio":"form-space";
 const content=require("../examples/"+id+"-content.json");
 const brand=graphic?{colors:{bg:"#F0EFDF",ink:"#252522",accent:"#4A38D5",surface:"#DFEF75",line:"#A0A096"},fonts:{display:"Arial",body:"Calibri"}}:{colors:{bg:"#EDEAE4",ink:"#303733",accent:"#895D46",surface:"#D2CEC4",line:"#A29D92"},fonts:{display:"Georgia",body:"Calibri"}};
 const deck={name:graphic?"Offset Studio":"Form & Space",description:graphic?"A graphic design portfolio with editable identity studies and campaign artwork.":"An architecture portfolio with conceptual case studies and reference photography.",brand,spec:{style:{palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"},slides:[]},selections:[]};
 for(let i=0;i<12;i++){
  const edge=i===0||i===11,role=i===0?"cover":"feature",variant=id+"-"+i;
  const row=edge?[i===0?(graphic?"OFFSET\nSTUDIO":"FORM\n& SPACE"):(graphic?"Have a brief?\nLet's talk.":"Begin with\na place."),graphic?"Independent graphic design":"Architecture & interior concepts",i===0?"Selected work / Concept portfolio":"hello@example.com • example.com"]:content[i-1];
  const els=[],slots={},fit={},pptxMapping={},items=[];
  function shape(x,y,width,height,tokenFill,form="rect"){
   let key="s"+els.length;els.push({id:key,morphId:key,type:"shape",shape:form,x,y,width,height,tokenFill,z:1});
  }
  function text(value,x,y,width,height,size,title=false,color="ink",bold=false){
   let slot=title?"title":"c"+items.length;
   slots[slot]={kind:"text",from:title?"title":"items"+items.length};
   if(!title)items.push(value);
   fit[slot]={minFont:size,maxFont:size,lineClamp:15,shrinkMin:1};pptxMapping[slot]={kind:"text"};
   els.push({id:slot,morphId:slot,type:"text",slot,x,y,width,height,fontSize:size,fontRole:title?"display":"body",textStyleRole:title?"display":"body",fontWeight:title||bold?700:400,tokenColor:color,z:4});
  }
  const photoIndex=[0,2,3,5,6,11].indexOf(i);
  const hasPhoto=!graphic&&photoIndex>=0;
  function photo(x,y,width,height){
   slots.photo={kind:"image",from:"photo"};els.push({id:"photo",morphId:"photo",type:"image",slot:"photo",x,y,width,height,z:0});
  }
  function copy(j,x,y,width,size=29){
   text(row[j*2+1],x,y,width,65,32,false,"accent",true);
   text(row[j*2+2],x,y+90,width,220,size);
  }
  // Original specimen artwork remains editable as text and native shapes.
  function artwork(x,y,w,h,project){
   shape(x,y,w,h,project===1?"surface":"accent");
   if(project===0){
    shape(x+w*.25,y+h*.15,w*.5,w*.5,"surface","ellipse");
    shape(x+w*.34,y+h*.15+w*.09,w*.32,w*.32,"accent","ellipse");
    text("AFTER\nIMAGE",x+25,y+h*.59,w-50,h*.34,Math.min(70,h*.10),false,"bg",true);
    text("LIVE ELECTRONIC SESSIONS",x+25,y+h-55,w-50,40,24,false,"bg");
   }else if(project===1){
    shape(x+w*.15,y+h*.18,w*.7,h*.64,"bg");
    text("COMMON",x+w*.19,y+h*.31,w*.64,110,Math.min(62,w*.10),false,"ink",true);
    shape(x+w*.19,y+h*.48,w*.62,55,"accent");
    text("PANTRY / SMALL BATCH",x+w*.19,y+h*.64,w*.62,90,24,false,"ink");
   }else{
    shape(x+30,y+30,w-60,h-60,"bg");
    shape(x+55,y+55,w-110,h-110,"accent");
    text("OPEN\nHOUSE",x+85,y+h*.23,w-150,h*.38,Math.min(76,w*.12),false,"bg",true);
    text("ART • TALKS • WORKSHOPS",x+65,y+h*.8,w-100,60,24,false,"bg");
   }
  }
  if(edge){
   if(graphic){
    shape(1000,0,600,900,"surface");shape(1110,200,400,400,"accent","ellipse");shape(1200,290,220,220,"surface","ellipse");
    text(row[0],65,205,930,350,i===0?132:95,true);
    text(row[1],70,80,900,75,32);text(row[2],70,750,900,80,30);
   }else{
    photo(0,0,1600,650);shape(0,650,1600,250,"bg");
    text(row[0].replace("\n"," "),65,680,950,160,86,true);
    text(row[1],1100,690,435,80,28);text(row[2],1100,795,435,80,24);
   }
  }else if(graphic&&[2,3,5,7].includes(i)){
   let project=i===5?1:i===7?2:0;
   artwork(65,65,660,730,project);
   text(row[0],800,65,735,170,64,true);
   copy(0,800,285,715,28);copy(1,800,560,715,28);
  }else if(hasPhoto){
   const imageLeft=i%2===1;
   photo(imageLeft?0:800,0,800,820);
   let x=imageLeft?865:65;
   text(row[0],x,65,670,170,57,true);
   copy(0,x,280,650,27);copy(1,x,555,650,27);
  }else if(i===4){
   text(row[0],65,65,1450,150,64,true);
   if(graphic){
    artwork(65,260,460,550,0);
    artwork(565,260,360,360,0);
    text(row[1],1000,275,530,70,32,false,"accent",true);text(row[2],1000,370,530,190,26);
    text(row[3],1000,585,530,70,32,false,"accent",true);text(row[4],1000,660,530,180,24);
   }else{
    for(let j=0;j<4;j++){shape(95+j*170,300+j*25,130,230-j*25,j%2?"surface":"accent");}
    text("Conceptual threshold sequence",95,600,700,70,27);
    copy(0,850,265,680,27);copy(1,850,550,680,27);
   }
  }else if(i===8||i===9){
   text(row[0],65,65,1450,150,64,true);
   shape(65,270,1450,3,"ink");
   for(let j=0;j<2;j++){
    const x=65+j*780;
    text(String(j+1).padStart(2,"0"),x,310,190,160,110,false,"accent",true);
    text(row[j*2+1],x+210,320,480,100,36,false,"ink",true);
    text(row[j*2+2],x,545,660,270,28);
   }
  }else{
   if(graphic){shape(0,0,510,900,"accent");text(row[0],55,130,400,430,63,true,"bg");}
   else{shape(65,65,460,730,"surface");text(row[0],100,140,380,440,56,true);}
   copy(0,610,145,880,32);copy(1,610,490,880,32);
  }
  if(!edge)text(graphic?"Fictional case study • Original specimen artwork":"Concept study • Stock reference photography",graphic&&[1,6,10].includes(i)?610:65,850,graphic&&[1,6,10].includes(i)?900:1450,40,24);
  const kit={id:role+"/"+variant,role,variant,family:id,status:"draft",preserveLayout:true,requiresPhoto:hasPhoto,photoSlots:hasPhoto?["photo"]:[],slots,fit,pptxMapping,layout:{elements:els}};
  fs.writeFileSync(path.join(root,"kit",role,variant+".json"),JSON.stringify(kit,null,2));
  deck.spec.slides.push({role,title:row[0],items,...(hasPhoto?{photoQuery:id+"-"+[0,3,1,2,4,5][photoIndex]}:{})});
  deck.selections.push({role,variant});
 }
 fs.writeFileSync(path.join(root,"examples",id+".json"),JSON.stringify(deck,null,2));
}




