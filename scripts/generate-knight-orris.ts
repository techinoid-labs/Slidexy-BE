import * as fs from "fs";
import * as path from "path";
import { circle, El, photo, rect, renderTemplate, ROOT, Template, text, writeKit } from "./lib/designKit";
import { PhotoResult, resolvePhoto } from "../engine/photos";

type Page = {title:string; items:string[]; elements:El[]; photoQuery?:string; chart?:El};
const title=(x:number,y:number,w:number,h:number,size:number,color="ink")=>text("title",x,y,w,h,size,"title",color);
const body=(i:number,x:number,y:number,w:number,h:number,size:number,color="ink")=>
  text("copy-"+i,x,y,w,h,size,"copy"+i,color);
const field=(color:string)=>rect("ground",0,0,1600,900,color,{z:0,keepFill:true});
const picture=(x:number,y:number,w:number,h:number)=>photo("photograph",x,y,w,h,{z:2});
const bar=(id:string,x:number,y:number,w:number,h:number,fill:string)=>rect(id,x,y,w,h,fill,{z:2,keepFill:true});
const knightBrand={fonts:{display:"Impact",body:"Arial"},colors:{bg:"#F9F8ED",ink:"#171914",accent:"#38591B",lime:"#D7FF51",paper:"#F9F8ED",slate:"#707964"}};
const orrisBrand={fonts:{display:"Garamond",body:"Calibri"},colors:{bg:"#F7ECF0",ink:"#382143",accent:"#7C446E",rose:"#E8C4D5",paper:"#FFF8F4",violet:"#A48BC9",amber:"#CF874B"}};

// The emblem is drawn in horizontal runs to keep the silhouette editable at any scale.
function knight(x:number,y:number,unit:number,color:string){
  const mask=["....#..#....","...######...","..########..",".###.######.","###########.","######.####.","..##..#####.",".....######.","....######..","...#######..","..#########.",".###########"];
  const shapes:El[]=[];
  mask.forEach((row,r)=>{for(const run of row.matchAll(/#+/g))shapes.push(bar("knight-"+r+"-"+run.index,x+run.index!*unit,y+r*unit,run[0].length*unit,unit,color));});
  return shapes;
}
function board(x:number,y:number,u:number){
  const result=[bar("board",x,y,u*8,u*8,"paper")];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2)result.push(bar("sq-"+r+"-"+c,x+c*u,y+r*u,u,u,"slate"));
  // d4 -> f5 -> e7. Rings are inset so they remain distinct from adjacent squares.
  for(const [i,[c,r]] of [[3,4],[5,3],[4,1]].entries()){
    result.push(circle("mark-"+i,x+(c+.15)*u,y+(r+.15)*u,u*.7,"ink",{z:3}),
      circle("core-"+i,x+(c+.32)*u,y+(r+.32)*u,u*.36,"lime",{z:3.1}));
  }
  return result;
}
const chess:Page[]=[
 {title:"KNIGHT RELAY",items:["EAST HALL INVITATIONAL","Doubles chess. Partners switch every fifth move."],photoQuery:"knight-relay-lacquer",
  elements:[picture(0,0,1600,900),body(0,65,64,825,58,29,"paper"),
    {...title(52,150,848,414,189,"lime"),lineHeight:0.96},
    body(1,67,593,820,84,32,"paper")]},
 {title:"THE FIFTH MOVE",items:["01–05","The opening player chooses the first five moves for their side. Their partner watches from behind the table and keeps the score sheet.","06–10","After move five, the seated player starts the opposing clock. Partners exchange seats in silence. The new player inherits the position and the remaining time."],elements:[field("lime"),title(65,45,1450,150,105),body(0,70,242,670,155,102),body(1,70,448,635,310,35),bar("seam",770,245,8,511,"ink"),body(2,855,242,640,155,102),body(3,855,448,655,350,35)]},
 {title:"ROOM FOR TWO",items:["On either side of the board, one chair faces the table and one waits behind it. The aisle stays clear so partners can change places without interrupting the next game.","Spectators follow the demonstration board from the end of the hall. Only the floor arbiter enters the playing aisle during a round."],photoQuery:"chess tournament players playing chess",elements:[picture(0,0,960,900),title(1010,89,530,236,82),body(0,1010,382,515,234,28),body(1,1010,640,515,202,28)]},
 {title:"READ THE ROUTE",items:["d4  /  f5  /  e7","A warm-up for the handover. With the other pieces removed, a knight on d4 can reach e7 in two moves through f5. The three marks follow that route from bottom to top.","The first player names the destination. Their partner names the intermediate square, then plays both jumps on the practice board."],elements:[field("ink"),...board(90,99,86),title(866,88,664,205,83,"paper"),body(0,866,337,660,95,52,"lime"),body(1,866,470,625,187,29,"paper"),body(2,866,682,620,160,29,"paper")]},
 {title:"ONE CLOCK",items:["18 minutes","Each pair starts with eighteen minutes for the entire game. The clock keeps running through every exchange of seats. There is no increment.","The arbiter checks both displays before the first move. If either partner notices a clock fault, they pause both sides and call the arbiter."],photoQuery:"chess clock on chess board",elements:[picture(0,0,1600,408),title(62,453,645,110,79),body(0,65,593,615,176,87,"accent"),body(1,777,474,739,150,30),body(2,777,661,739,170,30)]},
 {title:"SATURDAY DRAW",items:["10.00","Opening round","Pairs draw a table at check-in. The lower draw number takes White in the first game.","11.00","Second round","Partners reverse the opening seat. Pairings go up beside the hall doors after results are checked.","12.00","Final round","The leading pairs meet at the front tables. Spectators can follow the live position from the gallery."],elements:[]},
 {title:"THE SILENT SEAT",items:["“I could see the fork from behind the chair. By the time I sat down, the board had changed.”","Mara Ellis, player in the rehearsal match","The silent partner records moves throughout the game. That gives both players a common record when they replay the position after the round."],elements:[field("ink"),...knight(1030,140,39,"lime"),title(70,65,895,130,65,"lime"),body(0,70,236,885,338,64,"paper"),body(1,74,590,855,68,25,"lime"),body(2,74,690,855,160,29,"paper")]},
 {title:"COUNT THE POINTS",items:["1","A win adds one point to the pair’s total, whichever partner plays the final move.","½","A draw earns half a point for each pair. Both players initial the same result slip.","0","A loss earns zero. If the final totals tie, the event compares the combined scores of each pair’s opponents."],elements:[]},
 {title:"AT THE LAST BELL",items:["Bring the signed score sheet to the arbiter. The team at the results desk checks it against the table slip before posting the final standings.","The winning pair replays one handover position on the demonstration board. Both players explain what they saw from the second chair."],elements:[field("lime"),...knight(75,160,44,"ink"),title(740,116,780,230,97),body(0,745,425,720,176,32),body(1,745,641,720,170,32)]}
];
chess[5].elements=[title(62,55,1480,165,104)];
chess[7].elements=[field("ink"),title(63,58,1470,157,99,"paper")];
for(let i=0;i<3;i++){
  const y=253+i*185;
  chess[5].elements.push(bar("rule-"+i,70,y-17,1450,3,"ink"),body(i*3,70,y,280,110,65),body(i*3+1,382,y+7,370,120,40),body(i*3+2,790,y+9,715,137,30));
  const x=72+i*490;
  chess[7].elements.push(body(i*2,x,235,450,236,158,"lime"),body(i*2+1,x,531,420,233,32,"paper"));
}

function flacon(x:number,y:number,s:number){
  const part=(id:string,dx:number,dy:number,w:number,h:number,fill:string,extras:El={})=>
    rect(id,x+dx*s,y+dy*s,w*s,h*s,fill,{keepFill:true,...extras});
  return [part("heel-shadow",14,447,332,18,"rose",{radius:9}),part("glass",0,98,340,355,"violet",{radius:32,opacity:.54,z:2}),
    part("juice",13,211,314,220,"rose",{radius:22,z:2.1}),part("neck",132,65,76,47,"violet",{z:2}),
    part("stopper",96,0,148,75,"ink",{radius:8,z:2.2}),part("highlight",14,125,8,273,"paper",{opacity:.83,z:3}),
    part("label-stock",73,229,194,102,"paper",{z:3})];
}
const scent:Page[]=[
 {title:"Orris Hour",items:["EAU DE PARFUM","Bitter orange, iris and cedar"],photoQuery:"orris-hour-still-life",
  elements:[picture(0,0,1600,900),
    rect("pink-light",0,0,675,900,"rose",{z:3,gradient:{angle:0,stops:[
      {hex:"#F4D0CF",pos:0,alpha:0.34},{hex:"#F4D0CF",pos:1,alpha:0}]}}),
    body(0,73,212,570,63,27),
    {...title(62,293,596,325,139),fontWeight:400,lineHeight:0.98},
    body(1,75,680,580,82,35)]},
 {title:"The brief",items:["An iris for the hour before dusk.","The studio wanted the cool, powdery impression of iris to arrive slowly. An orange-peel opening gives the wearer a distinct first impression, then recedes as the floral body settles.","The sample was assessed on paper at application, at thirty minutes and again after four hours. Each reading answers a different question about the same composition."],elements:[field("rose"),title(120,84,1420,125,71),body(0,120,260,1290,220,94),body(1,125,578,620,235,30),body(2,840,578,620,235,30)]},
 {title:"The peel",items:["At application","The perfumer chose the bitterness of the rind as the opening impression. A sweeter orange trial lingered into the middle and made the iris harder to pick out.","The selected trial has a bright first minute and a clean exit. Its role is to mark the start of the wear, leaving space for the powdery centre."],photoQuery:"green mandarin citrus peel",elements:[picture(75,70,795,760),body(0,935,144,560,65,30,"accent"),title(925,245,590,155,92),body(1,935,430,573,193,30),body(2,935,653,573,184,30)]},
 {title:"Three readings on paper",items:["Relative impression in the studio trial, scored from 0 to 5.","Orange falls from five to one by the second reading. Iris reaches its highest score at thirty minutes, then gives way to cedar. The last strip still carries a faint floral impression."],chart:{type:"line",labels:["First minute","30 minutes","4 hours"],series:[{name:"Orange",values:[5,1,0]},{name:"Iris",values:[1,5,2]},{name:"Cedar",values:[0,2,4]}],colors:["#B15C16","#775599","#466D55"],showLegend:true},elements:[title(80,48,1450,160,79),body(0,82,214,1420,68,30,"accent"),{id:"readings",type:"chart",x:77,y:325,width:869,height:468,z:2},body(1,1025,360,495,390,36)]},
 {title:"The heart",items:["Thirty minutes","“I noticed the iris when I picked the strip up again. The orange had gone, but I could still remember where it had been.”","From the studio’s second blotter reading"],photoQuery:"purple iris petals macro",elements:[field("ink"),picture(980,0,620,900),body(0,85,76,790,70,29,"rose"),title(77,196,840,170,101,"paper"),body(1,85,398,790,302,49,"paper"),body(2,88,755,775,85,27,"rose")]},
 {title:"A bottle for the hand",items:["Orris Hour","50 mL","The broad base sits flat on a dressing table. Rounded shoulders leave a smooth edge where the palm rests, and a short stopper keeps the silhouette low.","The pale label leaves the fill line visible on both sides. A single dark cap gives the bottle a clear outline against the light paper carton."],elements:[field("paper"),...flacon(140,125,1.39),body(0,257,462,246,59,37),body(1,257,529,252,52,20,"accent"),title(731,126,776,220,81),body(2,737,409,720,191,33),body(3,737,645,720,166,31)]},
 {title:"At the counter",items:["One strip for now. One for later.","A guest smells the first strip at the counter. The second goes into a dated paper sleeve, with the time written on its flap so the guest can revisit the scent that afternoon.","The tester stays beside the strips. Take-home samples sit farther along the counter, where the guest can stop and speak to the host."],photoQuery:"perfume glass bottle sunlight",elements:[picture(0,0,1600,349),title(80,416,710,123,79),body(0,84,574,665,191,46,"accent"),body(1,802,416,712,192,30),body(2,802,660,712,155,30)]},
 {title:"The first filling",items:["240 bottles","180 for the opening release","The counter receives three trays of sixty. Staff open one tray at a time so unopened stock remains in its carton.","48 for partner shops","Four stockists receive twelve bottles each, with enough blotters for two weekends of sampling.","12 held by the studio","The studio keeps twelve for photography, display replacements and comparisons with the next filling."],elements:[field("rose"),title(80,70,900,148,89),body(0,85,265,705,150,74),...flacon(168,461,.75)]},
 {title:"Four hours later",items:["By evening, cedar is the clearest note on the strip. The iris sits close to it, and the orange has disappeared.","The guest takes home the whole progression in a single bottle. The card in the carton gives the three reading times for a second wear."],elements:[field("ink"),title(142,187,1290,200,112,"paper"),body(0,150,452,910,198,44,"rose"),body(1,690,702,740,135,29,"paper")]}
];
for(let i=0;i<3;i++){
  const y=119+i*247;
  scent[7].elements.push(body(1+i*2,796,y,735,83,40),body(2+i*2,796,y+93,700,142,29));
}
chess.splice(8,0,
 {title:"THE RESULT SLIP",items:["Table 04","White   /   Ellis & Fox","Black   /   Chan & Bell","½ – ½","After the players agreed a draw, both pairs checked the board number and the colour assignment. The arbiter carried the signed slip to the results desk."],elements:[field("ink"),title(75,74,1450,170,105,"paper"),bar("slip",70,299,751,481,"paper"),body(0,110,333,638,75,42),body(1,110,461,640,72,38),body(2,110,585,641,75,38),body(3,893,293,595,193,105,"lime"),body(4,897,532,603,241,34,"paper")]},
 {title:"FOUR TABLES",items:["4 boards · 4 clocks · 16 chairs","Four games can run at once. Each table seats two active players, with one waiting chair behind each side. An extra clock stays at the arbiter’s desk.","The demonstration board belongs at the end of the hall. Spectators can gather there while players keep a clear route back to their seats."],elements:[title(68,65,1450,159,99),body(0,72,252,1440,110,59,"accent"),body(1,72,466,660,288,36),body(2,825,466,670,265,36)]},
 {title:"BACK TO THE BOARD",items:["After the round","The pair resets the pieces to its first handover. The outgoing player describes the plan they had in mind. The incoming player shows the move they considered first.","The score sheet settles the move order. Each pair circles one position to replay at the open boards before the next round."],elements:[field("ink"),bar("left-edge",75,81,23,736,"lime"),title(139,112,825,280,107,"paper"),body(0,145,536,700,102,41,"lime"),body(1,909,131,596,340,34,"paper"),body(2,909,537,597,243,32,"paper")]}
);
scent.splice(8,0,
 {title:"Two trial strips",items:["Trial A","A sweeter orange opening stayed prominent at thirty minutes. Two readers described the middle as soft, but neither named the iris until the final reading.","Trial B","The leaner peel note cleared sooner. Both readers picked out the iris at the second reading. The studio chose this version for the first filling."],elements:[field("paper"),title(83,58,1420,154,90),bar("strip-a",85,300,640,85,"rose"),bar("strip-b",860,380,640,85,"violet"),body(0,106,306,550,77,42),body(2,884,387,550,79,42),body(1,93,462,625,285,34),body(3,869,542,625,270,34)]},
 {title:"The wrap",items:["A carton the colour of the blotter","The name sits on the front face. The side panel carries the volume and composition details. A narrow plum fold is visible only when the top flap opens.","The first paper mock-up was folded around a filled bottle. The studio widened the base tuck so the carton could stand square on the counter."],elements:[field("rose"),bar("panel-front",112,264,275,365,"paper"),bar("panel-side",394,264,108,365,"violet"),bar("panel-back",509,264,275,365,"paper"),bar("flap",126,182,248,75,"ink"),bar("tuck",520,636,246,67,"paper"),title(139,356,235,149,57),body(0,856,126,620,215,53),body(1,862,395,625,205,30),body(2,862,646,625,183,30)]},
 {title:"The studio appointment",items:["A twenty-minute visit","The host opens with the fresh strip and offers a second strip prepared half an hour earlier. Smelling them together makes the change in emphasis easy to follow in the guest’s own description.","At the end of the visit, the guest selects a sample and writes down the time. The studio asks for one observation after the final reading that evening."],elements:[field("paper"),title(103,97,1390,166,92),body(0,109,332,620,185,68,"accent"),body(1,805,320,677,239,32),body(2,805,609,677,226,32)]}
);
async function build(id:string,name:string,description:string,brand:El,pages:Page[]){
  const dir=path.join(ROOT,"out",id);
  fs.mkdirSync(dir,{recursive:true});
  const manifest=path.join(dir,"image-sources.json");
  const prior:Array<PhotoResult & {query:string}>=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,"utf8")):[];
  const used=new Map<string,PhotoResult & {query:string}>();
  const slides=pages.map(({elements,...data},i)=>({...data,role:i===0?"cover":i===pages.length-1?"closing":"feature"}));
  const tpl:Template={id,name,family:id,description,brand,premium:true,motion:false,slides,
    kits:()=>pages.map((p,i)=>writeKit(slides[i].role,id+"-"+(i+1),id,p.elements))};
  await renderTemplate(tpl,false,async query=>{
    if(query===pages[0].photoQuery){
      const artwork={path:path.join(ROOT,"assets","cover-art",query+".png"),pexelsId:"local:"+query,query,photographer:"AI-generated cover artwork"};
      used.set(query,artwork);
      return artwork;
    }
    const old=prior.find(p=>p.query===query && fs.existsSync(p.path));
    const result=old ?? await resolvePhoto(query,"landscape","color",brand.colors,new Set([...used.values()].map(p=>p.pexelsId)),"preserve");
    used.set(query,{...result,query});
    return result;
  });
  fs.writeFileSync(manifest,JSON.stringify([...used.values()],null,2));
}
(async()=>{
  await build("knight-relay","Knight Relay","A fictional doubles chess invitational at East Hall.",knightBrand,chess);
  await build("orris-hour","Orris Hour","A fictional fragrance development and launch presentation.",orrisBrand,scent);
})().catch(error=>{console.error(error);process.exitCode=1;});
