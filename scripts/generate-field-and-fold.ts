import * as path from "path";
import {El, ROOT, circle, photo, rect, renderTemplate, text, writeKit} from "./lib/designKit";

type Frame = [number,number,number,number,number,string?];
type Page = {title:string; items:string[]; elements:El[]; art?:string; chart?:El};
const img=(x:number,y:number,w:number,h:number)=>photo("plate",x,y,w,h,{z:2});
const panel=(id:string,x:number,y:number,w:number,h:number,tone:string,z=1)=>rect(id,x,y,w,h,tone,{z,keepFill:true});
const bg=(tone:string)=>panel("stock",0,0,1600,900,tone,0);
function page(title:string,heading:Frame,entries:[string,Frame][],elements:El[]=[],art?:string,chart?:El):Page{
  function type(slot:string,[x,y,w,h,size,color]:Frame){
    return text(slot,x,y,w,h,size,slot,color||"ink",{z:5,...(slot==="title"?{textStyleRole:"display"}:{})});
  }
  return {title,items:entries.map(([copy])=>copy),elements:[...elements,type("title",heading),...entries.map(([,frame],i)=>type("copy"+i,frame))],art,chart};
}
const plot=(x:number,y:number,w:number,h:number)=>({id:"comparison",type:"chart",x,y,width:w,height:h,z:3});
const marsh={fonts:{display:"Perpetua",body:"Constantia"},colors:{bg:"#F4EFD9",ink:"#1E382A",accent:"#805027",green:"#214736",mint:"#D6E5BF",paper:"#FAF5DF",gold:"#DBAC61",line:"#A7AD8B"}};
const shop={fonts:{display:"Agency FB",body:"Trebuchet MS"},colors:{bg:"#FFF0E6",ink:"#35132C",accent:"#9D004E",pink:"#FFC4D6",red:"#B90050",yellow:"#FFD420",paper:"#FFF5E8",purple:"#480E46"}};
function listeningRecord(){
  const rows=["1101101","0101111","1000101"];
  const shapes:El[]=[];
  // A clockwise sequence per station; the first observation is at twelve o'clock.
  for(const r of [239,171,103]){
    shapes.push(circle("ring-"+r,492-r,455-r,2*r,"line",{z:1}),circle("inside-"+r,494-r,457-r,2*r-4,"mint",{z:1}));
  }
  rows.forEach((row,r)=>[...row].forEach((v,c)=>{
    const angle=c*2*Math.PI/7, radius=103+r*68;
    shapes.push(circle("night-"+r+"-"+c,492+radius*Math.sin(angle)-19,455-radius*Math.cos(angle)-19,38,v==="1"?"green":"line",{z:2}));
  }));
  return shapes;
}
function folds(x:number,y:number,count:number,pitch:number,height:number){
 return Array.from({length:count},(_,i)=>panel("pleat-"+i,x+i*pitch,y+(i%2)*12,pitch+1,height-(i%2)*12,i%2?"red":"purple"));
}
const chorus:Page[]=[
 page("Chorus Ledger",[78,16,1450,141,96],[["A listening service for wetland restoration",[82,761,1060,88,42]],["Illustrative seed pitch",[1140,786,391,58,25,"accent"]]],[bg("paper"),img(335,174,930,523),panel("top-rule",77,160,1446,3,"green"),panel("bottom-rule",77,735,1446,2,"green")],"chorus-cover"),
 page("Who heard the pond last night?",[74,494,685,245,70],[["Restoration teams visit a site a few times each season. Calling can start between visits. A quiet survey sheet leaves the project ecologist with little evidence about the intervening nights.",[842,501,675,220,32]],["Chorus Ledger rents listening stations and returns a season of recordings with clips a biologist can check.",[842,735,672,134,28,"accent"]]],
 [img(0,0,1600,435)],"chorus-wetland"),
 page("Leave a listener at the waterline",[827,105,692,249,70],[["The station records short windows after dusk. A field technician swaps the card on a planned visit and checks the microphone against a reference tone.",[833,395,674,193,32]],["The lab proposes candidate calls. A reviewer listens to each retained clip, attaches a confidence note and returns uncertain calls for follow-up.",[833,645,674,192,31]]],[panel("mat",57,65,703,766,"green"),img(72,80,673,736)],"chorus-sensor"),
 page("Seven nights in the ledger",[853,113,670,193,75],[["Candidate calls confirmed by a reviewer, in a fictional three-station record",[860,334,636,120,29,"accent"]],["Inner ring   /   Reed bed",[868,488,640,53,31]],["Middle ring   /   North pool",[868,549,640,53,31]],["Outer ring   /   Drain inlet",[868,610,640,53,31]],["Dark marks indicate a confirmed call. Pale marks indicate a reviewed recording with no confirmed call. Read clockwise from the top, one mark per night.",[858,706,644,156,24]]],[bg("mint"),...listeningRecord(),panel("spine",791,75,3,755,"green")]),
 page("From raw audio to an evening’s review",[72,65,1460,148,73],[["Review hours per station-week • modeled workflow",[78,223,1370,70,29,"accent"]],["8 → 2 hours",[1000,336,516,121,62]],["For the same sample week, the reviewer spends two hours checking flagged clips and a random sample of quiet intervals. The pilot measures missed calls against a fully reviewed subset.",[1007,478,496,296,31]]],[plot(67,315,870,455)],undefined,{type:"bar",labels:["Full manual pass","Assisted review"],series:[{name:"Review hours",values:[8,2]}],colors:["#397054"],showLegend:false}),
 page("A season, priced per station",[83,55,1430,149,77],[["$1,800",[87,208,1380,204,143]],["For a twelve-week season, the customer receives a loaned recorder, candidate clips, human review and a signed evidence file.",[80,467,684,231,33]],["$720 direct cost",[842,483,660,100,48,"accent"]],["The example assigns $320 to review, $220 to equipment wear and $180 to logistics. That leaves $1,080 per station-season before overhead.",[846,602,649,179,29]]],[bg("paper"),panel("ink-rule",78,442,1438,3,"ink"),panel("ledger-foot",78,818,1438,3,"ink")]),
 page("The first buyer already writes the report",[73,80,710,280,72],[["We sell to ecology consultancies that prepare annual monitoring reports for restoration clients. One approved subcontract can serve several sites under the same project lead.",[77,420,679,237,32]],["The evidence file includes dates, station locations, reviewed clips and an explicit list of recording gaps.",[77,689,665,143,29,"accent"]]],[img(827,0,773,900)],"chorus-field"),
 page("A focused first territory",[116,81,1370,127,73],[["30 practices",[115,249,1200,125,81]],["Four projects per practice, three station-seasons per project. At $1,800 each, full adoption would yield $648,000 in annual sales.",[133,405,1073,137,31]],["How we qualify a project",[553,594,898,78,38,"accent"]],["The buyer has site permission, a named reviewer and a reporting deadline within the season. We decline work where the recording plan cannot answer the client’s question.",[558,677,896,148,27]]],[bg("mint"),panel("note-stock",500,560,1018,288,"paper"),panel("note-edge",500,560,9,288,"green")]),
 page("What the pilot must prove",[74,73,1440,152,77],[["Coverage",[80,281,370,80,42,"accent"]],["At least 90% of scheduled recording windows should yield usable audio. Reviewers log wind, flooding and equipment faults separately.",[500,275,985,141,31]],["Agreement",[80,474,370,80,42,"accent"]],["A second ecologist reviews a blind sample. Species-level disagreements stay visible in the evidence file until adjudicated.",[500,466,985,143,31]],["Renewal",[80,665,370,80,42,"accent"]],["The project lead signs off on the exported record and requests a priced deployment for the following season.",[500,658,985,125,31]]],[...([245,440,628].map((y,i)=>panel("rule-"+i,80,y,1430,2,"line")))]),
 page("Two people sign the record",[74,69,1410,151,77],[["Nell Hart · field ecology",[80,274,650,114,43]],["Nell designs the sampling plan with the project ecologist. She owns permits, station placement and the list of conditions that make a night unusable.",[81,423,655,273,33]],["Idris Vale · acoustic systems",[858,369,655,115,43]],["Idris owns recorder uptime, detection software and clip provenance. The first hire is a reviewer who can reproduce a decision from the archived recording.",[858,536,649,263,32]]],[bg("mint")]),
 page("One season to earn the next",[69,74,480,580,76],[["Before dusk",[645,78,706,68,41,"accent"]],["Sign four paid pilots. Check the field plan and reference recording with each buyer.",[646,158,821,139,31]],["During the season",[645,350,760,68,41,"accent"]],["Deploy 24 stations and audit a sample weekly. Replace failing hardware on the next field visit.",[646,431,821,133,31]],["At handover",[645,623,780,68,41,"accent"]],["Deliver the evidence files and price renewals. Expand only after two buyers commit to another season.",[646,701,826,139,31]]],[bg("paper"),panel("season-axis",578,91,3,677,"green"),...[105,377,650].map((y,i)=>circle("entry-"+i,566,y,27,"green"))]),
 page("Back the first full chorus",[79,665,748,166,67,"paper"],[["$900k seed",[84,63,1400,194,132,"gold"]],["$390k for field hardware and operations, $310k for acoustic review tools and $200k for customer pilots. The round funds a 15-month plan.",[91,287,1107,177,37,"paper"]],["The test at month 15",[869,657,622,68,38,"gold"]],["Twenty-four deployed stations, four paid pilots and two renewal commitments. All venture details and figures are illustrative.",[872,730,624,119,25,"paper"]]],[bg("green"),panel("colophon-rule",80,605,1430,3,"gold")])
];
const pleat:Page[]=[
 page("PLEAT HOUSE",[60,170,680,342,113],[["A fitting room that travels flat.",[72,557,622,135,46]],["Illustrative seed pitch",[73,78,580,56,25]]],[img(0,0,1600,900),rect("yellow-wash",0,0,686,900,"yellow",{z:3,gradient:{angle:0,stops:[{hex:"#FFD420",pos:0,alpha:.35},{hex:"#FFD420",pos:1,alpha:0}]}})],"pleat-cover"),
 page("The lease lasts four days.",[65,73,625,334,76],[["The fitting room takes a week.",[759,310,755,345,75,"paper"]],["A pop-up producer books a temporary shop, then hires a carpenter, buys sheet goods and arranges removal. A simple privacy enclosure becomes another trade to schedule.",[76,423,583,346,32]],["Our first buyer opens at least six short retail events each year.",[782,682,701,133,30,"paper"]]],[bg("yellow"),panel("overprint",710,244,890,656,"purple")]),
 page("Open the fold.",[80,515,671,190,85],[["A continuous folded wall curves back on itself to screen the entrance. Two removable feet hold its ends. The host chooses the orientation for the shop floor.",[795,490,725,218,30]],["The prototype is for indoor retail. Stability, clear entry and local accessibility requirements are checked at the venue before use.",[795,720,725,157,27]]],[img(0,0,1600,450)],"pleat-fold"),
 page("A room inside a room",[980,104,540,227,64],[["The first installation goes into a borrowed gallery. The booth stands clear of the clothes rail, and the host checks sightlines from the queue before opening.",[984,388,535,225,31]],["The same screen closes at the end of the event and returns to inventory for the next booking.",[984,669,535,155,29]]],[bg("pink"),img(0,0,910,900)],"pleat-shop"),
 page("One case. Two feet.",[74,68,1445,142,81],[["The kit arrives as a folded screen, two feet and a closure strap. On return, staff inspect the paper edges and replace a damaged segment before the next dispatch.",[74,557,550,284,34]],["Pack-out checklist",[75,396,556,94,43,"accent"]]],[img(694,281,906,619)],"pleat-pack"),
 page("One weekend on the books",[95,83,1300,129,73],[["$540",[98,301,764,216,134,"accent"]],["Rental revenue per three-day event, excluding delivery billed at cost.",[103,579,666,174,33]],["$180 variable cost",[904,321,550,92,46]],["Cleaning, repair reserve and handling leave $360 contribution per booking. At a $1,440 build cost, four bookings recover the unit investment before overhead.",[907,475,550,274,30]]],[bg("purple"),panel("ticket",49,47,1502,792,"yellow"),...Array.from({length:12},(_,i)=>panel("perforation-"+i,837,66+i*66,4,36,"purple")),circle("notch-left",14,422,72,"purple",{z:2}),circle("notch-right",1512,422,72,"purple",{z:2})]),
 page("The fourth booking pays for the booth",[70,58,1470,164,72],[["Cumulative contribution after build cost • illustrative dollars",[74,240,1430,66,28,"accent"]],["By booking six, the booth has contributed $720 beyond its build cost. Storage and fixed staff costs still come out of that balance.",[1038,384,465,284,35]]],[plot(66,335,894,456)],undefined,{type:"line",labels:["Build","1","2","3","4","5","6"],series:[{name:"Net contribution ($)",values:[-1440,-1080,-720,-360,0,360,720]}],colors:["#AC0052"],showLegend:false}),
 page("Follow the producer",[73,65,1430,135,80,"paper"],[["30 agencies",[70,234,1440,168,111,"yellow"]],["At eight suitable events per agency and two booths per event, the starting territory represents 480 annual bookings. At $540 each, that is $259,200 in modeled rental revenue.",[76,510,753,294,33,"paper"]],["The route to the rack",[924,516,595,100,41]],["Invite producers to a one-day setup trial. Quote the next three dates together and reserve stock only when a deposit lands.",[924,642,573,178,30]]],[bg("purple"),panel("booking-slip",870,468,730,432,"pink")]),
 page("Why rent the fold?",[76,78,1440,145,82],[["Curtain rail",[78,291,438,90,40]],["Lowest upfront cost. The producer still sources fabric, weights and a frame and owns the teardown.",[79,442,434,242,32]],["Built partition",[579,291,437,91,40]],["A fit for long residencies with a dedicated build crew. A one-week lease leaves little time to recover fabrication and removal costs.",[581,442,431,292,32]],["Pleat House",[1081,291,434,92,40,"accent"]],["One reusable object with a known pack size. The buyer pays for event dates and hands back the kit on collection.",[1082,442,433,267,32]]],[bg("pink"),...folds(76,751,35,40,58)]),
 page("What breaks first?",[59,69,488,219,79],[["Edge wear",[574,100,883,70,46,"accent"]],["Record dents after each return. A replaceable outer segment must be cheaper than retiring the whole wall.",[578,190,907,139,32]],["Changeover time",[574,359,878,76,46,"accent"]],["Time a two-person setup and pack-down at every pilot. The pass condition is under twenty minutes each way.",[578,448,910,130,32]],["Availability",[574,624,872,68,46,"accent"]],["Book a second weekend only when inspection and repair can finish before the next dispatch.",[578,711,901,124,32]]],[bg("yellow"),...folds(62,410,11,34,365),panel("cut-a",568,332,920,4,"ink"),panel("cut-b",568,596,920,4,"ink")]),
 page("From sample to rental fleet",[70,71,1460,145,73],[["Mira Song / industrial design",[75,294,725,107,41]],["Mira owns fold geometry, foot stability and the repair manual. She will release the second tooling run after ten units pass repeated handling tests.",[76,443,697,237,32]],["Rafi Lowe / event operations",[855,381,665,112,40,"accent"]],["Rafi owns dispatch, cleaning and agency contracts. He will pilot three venues in one city before adding a second delivery route.",[856,542,642,219,32]]],[bg("pink")]),
 page("Open for the weekend.",[71,67,1430,163,91,"paper"],[["$650k pre-seed",[63,274,1480,226,133,"yellow"]],["$300k for tooling and fleet, $200k for operations and $150k for agency trials. In twelve months the target is 60 paid bookings and six repeat agencies.",[75,611,1025,211,36,"paper"]],["Illustrative venture and financial model.",[1170,699,345,130,24,"paper"]]],[bg("purple"),...folds(0,526,40,40,38)])
];
// Use the display faces on actual headlines, including medium-sized editorial heads.
for(const p of chorus){
  const head=p.elements.find(e=>e.slot==="title")!;
  Object.assign(head,{fontWeight:400,letterSpacing:0.8});
}
for(const i of [0,5,11]){
  const head=chorus[i].elements.find(e=>e.slot==="title")!;
  head.letterSpacing=2;
}
for(const [i,slot,effect] of [[1,"copy0","outline"],[5,"copy0","offset-3d"],[11,"copy0","outline"]] as const){
  const label=pleat[i].elements.find(e=>e.slot===slot)!;
  Object.assign(label,{typeTreatment:effect,textStyleRole:"display",letterSpacing:1.4});
}
// Begin with the live installation; move the material close-up to the evidence section.
const showroomSequence=[0,3,1,4,5,6,2,8,7,9,10,11].map(i=>pleat[i]);
async function build(id:string,name:string,brand:El,pages:Page[],description:string){
 const slides=pages.map(({elements,art,...data},i)=>({...data,photoQuery:art,role:i===0?"cover":i===pages.length-1?"closing":"feature"}));
 await renderTemplate({id,name,description,brand,family:id,premium:true,motion:false,slides,kits:()=>pages.map((p,i)=>writeKit(slides[i].role,id+"-"+(i+1),id,p.elements))},false,async key=>({path:path.join(ROOT,"assets","field-and-fold",key+".png"),pexelsId:"local:"+key}));
}
(async()=>{await build("chorus-ledger","Chorus Ledger",marsh,chorus,"An illustrated wetland monitoring seed pitch.");await build("pleat-house","Pleat House",shop,showroomSequence,"A folding retail fitting-room rental pitch.");})().catch(e=>{console.error(e);process.exitCode=1;});
