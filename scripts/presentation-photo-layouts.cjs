// Photographic compositions shared by the two presentation revisions.
module.exports = function photoLayout(kit, slide, index, warm) {
  if (![0,1,2,4,7,11].includes(index)) return;
  const edge = index === 0 || index === 11;
  const key = warm ? ([2,4].includes(index) ? "loom-detail" : "loom-room") : ([1,7].includes(index) ? "quay-platform" : "quay-train");
  slide.photoQuery = key;
  kit.requiresPhoto = true;
  kit.photoSlots = ["photo"];
  kit.slots.photo = {kind:"image",from:"photo"};
  const original = kit.layout.elements;
  const title = original.find(e=>e.slot==="title");
  const footer = original.filter(e=>e.type==="text" && e.y>=820);
  const content = original.filter(e=>e.type==="text" && e.slot!=="title" && e.y<820);
  const elements = [];
  const photo = (x,y,width,height)=>elements.push({id:"photo-main",morphId:"photo-main",type:"image",slot:"photo",x,y,width,height,z:1});
  const move = (el,x,y,width,height,fontSize)=>{
    if (!el) return;
    elements.push({...el,x,y,width,height,fontSize});
    kit.fit[el.slot]={minFont:fontSize,maxFont:fontSize,lineClamp:12,shrinkMin:1};
  };
  const box=(x,y,width,height,tokenFill)=>elements.push({id:"panel-"+elements.length,morphId:"panel-"+elements.length,type:"shape",shape:"rect",x,y,width,height,tokenFill,z:2});
  if(edge && warm){
    photo(770,0,830,900);
    box(0,0,770,900,"bg");
    move(title,65,235,650,280,73);
    move(content[0],65,80,640,100,24);
    move(content[1],65,580,635,190,30);
  }else if(edge){
    photo(0,340,1600,560);
    box(0,0,1600,340,"bg");
    move(title,70,65,1000,230,76);
    move(content[0],1140,35,380,120,24);
    move(content[1],1140,165,380,165,24);
  }else if(index===2){
    photo(warm?80:1020,275,warm?500:500,495);
    move(title,75,65,1430,150,59);
    for(let j=0;j<3;j++){
      const x=warm?650:75;
      move(content[j*2],x,280+j*165,830,60,30);
      move(content[j*2+1],x,340+j*165,830,102,24);
    }
  }else if(index===4){
    photo(75,260,1450,210);
    move(title,75,65,1440,140,59);
    for(let j=0;j<3;j++){
      const x=75+j*495;
      move(content[j*2],x,510,445,85,28);
      move(content[j*2+1],x,590,440,215,24);
    }
  }else{
    photo(warm?0:1080,0,warm?545:520,810);
    const x=warm?610:75;
    move(title,x,65,890,150,55);
    for(let j=0;j<3;j++){
      move(content[j*2],x,265+j*175,875,65,30);
      move(content[j*2+1],x,330+j*175,875,110,24);
    }
  }
  if(!edge) elements.push(...footer);
  kit.layout.elements=elements;
};




