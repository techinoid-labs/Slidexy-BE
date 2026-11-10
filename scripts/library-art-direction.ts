// Purpose-specific compositions; coordinates are on the engine's 1600 × 900 canvas.
export function artDirection(family: string, purpose: string) {
 const editorial=family==="editorial", elements:any[]=[],copy:string[]=[];
 const shape=(id:string,x:number,y:number,w:number,h:number,fill:string)=>elements.push({id,type:"shape",shape:"rect",x,y,width:w,height:h,tokenFill:fill,z:1});
 const label=(value:string,x:number,y:number,w:number,h:number,size=32,color="ink",display=false)=>{const slot="art"+copy.length;copy.push(value);elements.push({id:slot,type:"text",slot,x,y,width:w,height:h,fontSize:size,fontRole:display?"display":"body",fontWeight:display?700:400,lineHeight:1.12,tokenColor:color,z:4});};
 const title=(x:number,y:number,w:number,h:number,size:number,color="ink")=>elements.push({id:"title",type:"text",slot:"title",x,y,width:w,height:h,fontSize:size,fontRole:"display",fontWeight:editorial?400:700,lineHeight:1.12,tokenColor:color,z:4});
 let photo=false;
 if(!["opening","insight","comparison","evidence","process","closing"].includes(purpose))return null;
 if(purpose==="opening"){
  if(editorial){photo=true;elements.push({id:"photo",type:"image",slot:"photo",x:820,y:0,width:780,height:900,z:1});shape("paper",0,210,970,450,"bg");label("FIELDNOTES / DESIGN & CULTURE",80,65,720,50,25);title(75,265,840,310,112);label("An exploration of texture, proportion and the details that shape experience.",85,730,650,120,31);}
  else {shape("dark",0,0,1600,900,"ink");shape("accent",1150,0,450,900,"accent");title(80,220,1040,340,122,"bg");label("NORTH / STRATEGY BRIEF",85,70,950,50,28,"bg");label("01",1190,300,340,230,180,"ink",true);label("The decisions that move the business forward.",85,720,950,100,36,"bg");}
 }else if(purpose==="insight"){
  if(editorial){shape("side",0,0,160,900,"accent");label("OBSERVATION / 01",240,65,1100,50,26);label("“",220,160,250,200,180,"accent",true);title(390,235,1110,300,96);shape("rule",400,610,950,2,"line");label("Look for the detail that changes how the whole experience feels.",400,670,900,130,38);}
  else {title(80,70,1400,190,90);label("ONE DECISION",80,360,580,60,30);label("3 to 1",70,430,670,220,150,"ink",true);shape("divider",790,350,3,410,"line");label("Choose one measurable outcome.",900,400,590,210,52);label("DISCUSSION PROMPT / ALIGN BEFORE EXECUTION",900,710,600,75,25);}
 }else if(purpose==="comparison"){
  title(80,65,1400,180,94);shape("divider",800,300,2,470,"line");
  label("A",80,320,210,160,120,"accent",true);label("B",870,320,210,160,120,"ink",true);
  label(editorial?"Quiet & focused":"A focused pilot",300,330,440,100,46);label(editorial?"Expressive & layered":"A broader rollout",1090,330,440,110,46);
  label(editorial?"One visual anchor. Restrained typography. Space for a single story.":"Test one audience and one use case. Learn quickly with limited exposure.",300,490,440,190,32);
  label(editorial?"Contrasting scales. Multiple viewpoints. A composition built for discovery.":"Reach more teams at once. Requires stronger evidence and delivery capacity.",1090,490,440,190,32);
  shape("a",80,715,660,10,"accent");shape("b",870,715,660,10,"ink");
 }else if(purpose==="process"){
  title(80,65,1430,180,96);
  const stages=editorial?["Observe","Frame","Compose"]:["Define","Test","Decide"];
  stages.forEach((name,i)=>{const x=80+i*500,y=370+i*95;shape("step"+i,x,y,440,4,editorial?"accent":"ink");label("0"+(i+1),x,y-105,150,90,64,"muted");label(name,x,y+40,440,100,58);label(["Find the meaningful question.","Make a small, concrete response.","Review the evidence together."][i],x,y+155,420,110,30);});
 }else if(purpose==="evidence"){
  title(80,65,1420,180,94);label("ILLUSTRATIVE DATA / REPLACE WITH YOUR SOURCE",80,240,1400,50,25);
  label("18 to 12",75,400,650,180,110,"ink",true);label("Minutes to complete the first task",85,620,590,100,34);
  label("Before",820,350,280,55,30);shape("before",820,425,650,72,"ink");label("18 min",1320,350,190,55,30);
  label("After",820,555,280,55,30);shape("after",820,630,650*12/18,72,"accent");label("12 min",1320,555,190,55,30);
  label("Same task and scale; example values only.",820,765,680,55,26);
 }else{
  if(editorial){shape("accent",0,0,1600,900,"accent");title(100,150,1400,330,118,"bg");shape("rule",100,590,1400,2,"bg");label("One observation. One experiment. A new perspective.",100,660,1180,140,44,"bg");}
  else{shape("dark",0,0,1600,900,"ink");title(80,150,1430,330,120,"bg");shape("action",80,610,1440,180,"accent");label("DECISION / OWNER / REVIEW DATE",120,665,1350,90,52);}
 }
 return {elements,copy,photo};
}


