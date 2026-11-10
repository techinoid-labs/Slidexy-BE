const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
for (const id of ["loom-register", "quay-line"]) {
  const warm = id === "loom-register";
  const examplePath = path.join(root, "examples", id + ".json");
  const deck = JSON.parse(fs.readFileSync(examplePath, "utf8"));
  const content = require("../examples/" + id + "-presentation-content.json");
  deck.description = warm ? "A textile collection launch presentation with product strategy, quality standards and a release plan." : "A harbour transit improvement proposal with passenger journeys, pilot measures and an implementation plan.";
  deck.brand.fonts.display = warm ? "Georgia" : "Arial";
  deck.spec.slides = [];
  deck.selections = [];
  for (let index = 0; index < 12; index++) {
    const cover = index === 0;
    const close = index === 11;
    const edge = cover || close;
    const row = edge ? [cover ? (warm ? "Material made\nfor living" : "A better journey\nto the harbour") : (warm ? "Ready for the\nfirst collection" : "Ready to start\nthe pilot"), cover ? (warm ? "LOOM REGISTER  /  COLLECTION PROPOSAL" : "QUAY LINE  /  SERVICE IMPROVEMENT") : "DISCUSSION & NEXT STEPS", warm ? "A focused textile range for considered interiors.\nProduct strategy, material decisions and the launch plan." : "Three stations. Six weeks. A clearer passenger experience.\nPilot scope, delivery priorities and the decision ahead."] : content[index - 1];
    const role = cover ? "cover" : "feature";
    const variant = id + "-presentation-" + index;
    const elements = [];
    const slots = {};
    const fit = {};
    const pptxMapping = {};
    const items = [];
    function shape(x, y, width, height, tokenFill, form = "rect") {
      const eid = "e" + elements.length;
      elements.push({id:eid,morphId:eid,type:"shape",shape:form,x,y,width,height,tokenFill,z:1});
    }
    function text(value,x,y,width,height,size,display=false,color="ink",isTitle=false) {
      const slot = isTitle ? "title" : "copy" + items.length;
      const from = isTitle ? "title" : "items" + items.length;
      if (!isTitle) items.push(value);
      slots[slot] = {kind:"text",from};
      pptxMapping[slot] = {kind:"text"};
      fit[slot] = {minFont:size,maxFont:size,lineClamp:12,shrinkMin:1};
      const eid = "e" + elements.length;
      elements.push({id:eid,morphId:eid,type:"text",slot,x,y,width,height,fontSize:size,textStyleRole:isTitle?"display":"body",fontWeight:display?700:400,fontRole:isTitle?"display":"body",tokenColor:color,z:4});
    }
    shape(75,820,1450,2,"line");
    text(warm?"LOOM REGISTER  /  COLLECTION STRATEGY":"QUAY LINE  /  PILOT PROPOSAL",75,842,1100,32,19);
    text(String(index+1).padStart(2,"0"),1450,840,75,35,22);
    if (edge) {
      if (warm) {
        shape(1040,0,560,790,"surface");
        for(let r=0;r<8;r++) for(let c=0;c<5;c++) {
          shape(1090+c*95,60+r*88,76,70,(r+c)%3?"bg":"accent");
          shape(1119+c*95,60+r*88,17,70,"line");
        }
      } else {
        shape(1100,0,500,790,"surface");
        shape(1220,90,12,590,"accent");
        [150,370,600].forEach(y=>{shape(1200,y,52,52,"accent","ellipse");shape(1214,y+14,24,24,"bg","ellipse");});
        shape(1230,610,280,12,"accent");
      }
      text(row[1],75,95,950,75,25);
      text(row[0],75,245,960,270,warm?82:86,true,"ink",true);
      text(row[2],75,590,900,150,31);
    } else {
      const mode = (index-1)%5;
      text(row[0],75,70,1440,145,warm?61:59,true,"ink",true);
      shape(75,230,warm?110:1450,warm?5:2,"accent");
      if (mode === 0 || mode === 1) {
        for(let j=0;j<3;j++) {
          const x=75+j*495;
          if(warm) {shape(x,290,460,465,j===1?"surface":"bg");shape(x,290,460,6,"accent");}
          else {shape(x,290,460,465,"surface");shape(x,290,9,465,j===1?"accent":"line");}
          text(row[1+j*2],x+25,325,410,100,mode===0?37:32,true);
          text(row[2+j*2],x+25,460,405,300,28);
        }
      } else if (mode === 2) {
        for(let j=0;j<3;j++) {
          const y=285+j*165;
          shape(75,y,430,140,warm?"surface":"accent");
          text(row[1+j*2],100,y+30,380,90,32,true,warm?"ink":"bg");
          text(row[2+j*2],560,y+12,930,145,28);
          shape(560,y+149,940,1,"line");
        }
      } else if(mode === 3) {
        shape(95,357,1370,6,"accent");
        for(let j=0;j<3;j++){
          const x=75+j*495;
          shape(x,338,42,42,"accent","ellipse");
          text(row[1+j*2],x,270,440,65,30,true);
          text(row[2+j*2],x,420,420,320,28);
        }
      } else {
        shape(75,285,1450,485,"surface");
        for(let j=0;j<3;j++){
          const y=310+j*150;
          text(row[1+j*2],100,y+15,350,100,32,true);
          text(row[2+j*2],510,y+5,970,125,31);
          if(j<2) shape(100,y+135,1390,1,"line");
        }
      }
      // Metric slides use a dedicated presentation layout.
      if(index===6){
        elements.splice(5);
        // Keep the previously declared slots available to the content fitter.
        for(let j=0;j<3;j++){
          const x=75+j*495;
          shape(x,290,460,465,"surface");
          const label=elements.length;
          text(row[1+j*2],x+25,300,400,160,110,true,"accent");
          text(row[2+j*2],x+25,505,400,255,28);
        }
      }
    }
    if(!edge) text("Illustrative proposal",1120,842,400,30,17);
    const kit={id:role+"/"+variant,role,variant,family:id,status:"draft",preserveLayout:true,requiresPhoto:false,photoSlots:[],slots,fit,pptxMapping,layout:{elements}};
    const slide = {role,title:row[0],items};
    require("./presentation-photo-layouts.cjs")(kit, slide, index, warm);
    fs.writeFileSync(path.join(root,"kit",role,variant+".json"),JSON.stringify(kit,null,2)+"\n");
    deck.spec.slides.push(slide);
    deck.selections.push({role,variant});
  }
  fs.writeFileSync(examplePath,JSON.stringify(deck,null,2)+"\n");
}



