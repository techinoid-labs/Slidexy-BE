const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
for (const ocean of [true, false]) {
  const id = ocean ? "tidal-lab" : "night-market";
  const rows = require("../examples/" + id + "-content.json");
  const brand = ocean
    ? { colors:{bg:"#092C40",ink:"#EAF7EF",accent:"#80E3C0",surface:"#16455B",line:"#4D91A5"},fonts:{display:"Arial",body:"Calibri"} }
    : { colors:{bg:"#FFF1D6",ink:"#421838",accent:"#CB3468",surface:"#F5CCD3",line:"#227C78"},fonts:{display:"Georgia",body:"Calibri"} };
  const deck = {name:ocean?"Tidal Lab":"Night Market",description:ocean?"An ocean monitoring briefing with a station schematic, native chart and research photography.":"A food festival sponsorship proposal with a menu composition, running order and native budget chart.",brand,spec:{style:{palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"},slides:[]},selections:[]};
  for(let i=0;i<12;i++) {
    const edge=i===0||i===11, role=i===0?"cover":"feature", variant=id+"-"+i;
    const row=edge?[i===0?(ocean?"TIDAL\nLAB":"NIGHT\nMARKET"):(ocean?"The next\nfield season":"Meet us at\nthe market"),ocean?"COASTAL OBSERVATORY":"FOOD • MUSIC • NEIGHBOURS",ocean?"A proposal for three stations and four seasonal visits.":"An evening of independent kitchens and shared tables."]:rows[i-1];
    const elements=[],slots={},fit={},pptxMapping={},items=[];
    let chart;
    function rect(x,y,width,height,tokenFill,form="rect"){
      const eid="shape-"+elements.length;
      elements.push({id:eid,morphId:eid,type:"shape",shape:form,x,y,width,height,tokenFill,z:1});
    }
    function text(value,x,y,width,height,size,title=false,color="ink",bold=false){
      const slot=title?"title":"copy"+items.length;
      slots[slot]={kind:"text",from:title?"title":"items"+items.length};
      if(!title) items.push(value);
      fit[slot]={minFont:size,maxFont:size,lineClamp:14,shrinkMin:1};
      pptxMapping[slot]={kind:"text"};
      elements.push({id:slot,morphId:slot,type:"text",slot,x,y,width,height,fontSize:size,fontRole:title?"display":"body",textStyleRole:title?"display":"body",fontWeight:title||bold?700:400,tokenColor:color,z:4});
    }
    const photoIndex=[0,5,6,11].indexOf(i);
    const hasPhoto=photoIndex>=0;
    function photo(x,y,width,height){
      slots.photo={kind:"image",from:"photo"};
      elements.push({id:"photo",morphId:"photo",type:"image",slot:"photo",x,y,width,height,z:0});
    }
    function pair(j,x,y,width,bodyHeight=155,size=27){
      text(row[1+j*2],x,y,width,65,30,false,"accent",true);
      text(row[2+j*2],x,y+78,width,bodyHeight,size);
    }
    if(edge){
      if(ocean){
        photo(0,0,1600,900);
        rect(0,0,820,900,"bg");
        for(let n=0;n<6;n++)rect(840+n*27,0,7,900,"accent");
        text(row[0],70,180,710,330,i===0?120:85,true);
        text(row[1],70,75,700,55,26,false,"accent",true);
        text(row[2],70,660,680,140,34);
      }else{
        photo(850,0,750,900);
        rect(0,0,850,900,"bg");
        for(let n=0;n<12;n++)rect(815,n*80,70,70,"bg","ellipse");
        text(row[1],65,80,730,60,27,false,"accent",true);
        text(row[0],65,230,720,320,i===0?110:85,true);
        text(row[2],65,660,700,150,33);
        for(let n=0;n<9;n++)rect(65+n*81,840,38,12,"line");
      }
    }else{
      if(ocean){rect(65,65,7,120,"accent");text(row[0],100,60,1420,145,58,true);}
      else{rect(0,0,1600,22,"accent");text(row[0],65,70,1460,140,60,true);rect(65,225,1470,3,"ink");}
      if(i===2 && ocean){
        // Schematic station positions, intentionally independent of real geography.
        rect(65,270,730,520,"surface");
        for(let n=0;n<7;n++)rect(95,310+n*65,650,2,"line");
        const points=[[180,370],[430,520],[670,680]];
        points.forEach(([x,y],j)=>{rect(x-24,y-24,48,48,"accent","ellipse");text(String.fromCharCode(65+j),x-12,y-15,40,45,26,false,"bg",true);});
        text("Station schematic • positions illustrative",100,810,700,40,24);
        for(let j=0;j<3;j++)pair(j,855,265+j*190,670,130,25);
      }else if(i===2 && !ocean){
        rect(65,275,1470,500,"surface");
        for(let j=0;j<3;j++){
          const y=305+j*150;
          text(row[1+j*2],100,y,400,100,32,false,"ink",true);
          text(row[2+j*2],565,y,900,120,28);
          if(j<2)rect(100,y+135,1380,2,"accent");
        }
      }else if((i===4 && ocean)||(i===7 && !ocean)){
        chart=ocean?{type:"line",labels:["Visit 1","Visit 2","Visit 3","Visit 4"],series:[{name:"River",values:[12,21,16,14]},{name:"Bay",values:[8,12,10,9]},{name:"Reef",values:[4,5,4,5]}],colors:["#80E3C0","#F4C978","#82ACFF"],showLegend:true}:{type:"bar",labels:["Services","Production","Music","Reserve"],series:[{name:"Illustrative allocation (%)",values:[40,30,20,10]}],colors:["#CB3468"],showLegend:false};
        chart.ink="#172B39";
        elements.push({id:"chart",morphId:"chart",type:"chart",x:65,y:320,width:780,height:400,z:2});
        text(ocean?"River 12–21   /   Bay 8–12   /   Reef 4–5":"Services 40%  /  Production 30%  /  Music 20%  /  Reserve 10%",65,260,800,60,24);
        if(ocean) chart.labels.forEach((label,j)=>text(label,100+j*190,735,180,35,24));
        text(ocean?"Illustrative readings • arbitrary units":"Illustrative allocation • percent",65,785,780,45,24);
        for(let j=0;j<3;j++)pair(j,920,275+j*185,610,125,24);
      }else if(hasPhoto){
        if(ocean){
          photo(65,270,730,525);
          for(let j=0;j<3;j++)pair(j,855,260+j*185,670,130,25);
        }else{
          photo(850,265,685,525);
          for(let j=0;j<3;j++)pair(j,65,260+j*185,710,130,25);
          rect(820,265,12,525,"accent");
        }
      }else if([3,7,9].includes(i)){
        if(ocean){
          rect(150,340,1250,4,"accent");
          for(let j=0;j<3;j++){
            let x=65+j*500;
            rect(x+65,305,70,70,"accent","ellipse");
            text(String(j+1).padStart(2,"0"),x+80,320,60,55,29,false,"bg",true);
            pair(j,x,435,440,235,28);
          }
        }else{
          for(let j=0;j<3;j++){
            let x=65+j*500;
            rect(x,290,440,485,j%2?"surface":"bg");
            rect(x,290,440,9,"accent");
            text(row[1+j*2],x+15,340,405,110,34,false,"ink",true);
            text(row[2+j*2],x+15,500,405,255,27);
          }
        }
      }else if(i===4 && !ocean){
        for(let j=0;j<3;j++){
          const y=290+j*170;
          rect(65,y,360,130,"accent");
          text(row[1+j*2],85,y+20,320,100,28,false,"bg",true);
          text(row[2+j*2],490,y+5,1000,130,29);
        }
      }else if(i===8){
        rect(65,280,1470,60,"surface");
        text(ocean?"FIELD CONSTRAINT":"CHANNEL",90,290,450,45,26,false,"ink",true);
        text(ocean?"RESPONSE":"APPROACH",560,290,950,45,26,false,"ink",true);
        for(let j=0;j<3;j++){
          let y=370+j*145;
          text(row[j*2+1],90,y,420,100,28,false,"accent",true);
          text(row[j*2+2],560,y,920,125,27);
          rect(90,y+132,1400,1,"line");
        }
      }else{
        if(ocean){
          rect(65,270,495,520,"surface");
          text(row[1],95,315,430,115,35,false,"accent",true);
          text(row[2],95,480,420,250,29);
          pair(1,650,280,855,145,29);
          pair(2,650,550,855,145,29);
        }else{
          rect(65,280,430,490,"accent");
          text(row[1],95,325,370,125,36,false,"bg",true);
          text(row[2],95,510,360,245,24,false,"bg");
          pair(1,565,280,950,145,29);
          pair(2,565,550,950,145,29);
        }
      }
      text("Sample proposal",65,850,600,40,24);
    }
    const kit={id:role+"/"+variant,role,variant,family:id,status:"draft",preserveLayout:true,requiresPhoto:hasPhoto,photoSlots:hasPhoto?["photo"]:[],slots,fit,pptxMapping,layout:{elements}};
    fs.writeFileSync(path.join(root,"kit",role,variant+".json"),JSON.stringify(kit,null,2));
    deck.spec.slides.push({role,title:row[0],items,...(hasPhoto?{photoQuery:id+"-"+photoIndex}:{}),...(chart?{chart}:{})});
    deck.selections.push({role,variant});
  }
  fs.writeFileSync(path.join(root,"examples",id+".json"),JSON.stringify(deck,null,2));
}



