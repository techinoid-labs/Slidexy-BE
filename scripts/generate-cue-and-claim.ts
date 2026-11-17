import * as path from "path";
import { El, ROOT, circle, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";

type Box=[number,number,number,number,number,string?,El?];
type Line=[string,Box];
type Slide={title:string,items:string[],elements:El[],art?:string,chart?:El};
const art=(x:number,y:number,w:number,h:number)=>photo("illustration",x,y,w,h,{z:2});
const shape=(id:string,x:number,y:number,w:number,h:number,color:string,z=1)=>rect(id,x,y,w,h,color,{keepFill:true,z});
const bg=(color:string)=>shape("ground",0,0,1600,900,color,0);
const display={textStyleRole:"display"};
const spaced={letterSpacing:2};
const centered={align:"center"};
const poster={...display,letterSpacing:1.6};
const chartBox=(x:number,y:number,w:number,h:number)=>({id:"figure",type:"chart",x,y,width:w,height:h,z:3});
function slide(head:Line,body:Line[],layers:El[]=[],imageKey?:string,chart?:El):Slide{
  const words=[head,...body].map(([_,[x,y,w,h,size,color,style]],i)=>{
    const slot=i===0?"title":"copy"+(i-1);
    return text(slot,x,y,w,h,size,slot,color||"ink",{z:5,...(i===0?display:{}),...style});
  });
  return {title:head[0],items:body.map(item=>item[0]),elements:[...layers,...words],art:imageKey,chart};
}
const theatre={fonts:{display:"Bodoni MT",body:"Consolas"},colors:{bg:"#151318",ink:"#FFF6ED",accent:"#FF776E",red:"#A52132",paper:"#F3E8D7",black:"#151318",ash:"#C8C2BF",line:"#5A5356"}};
const depot={fonts:{display:"Bernard MT Condensed",body:"Candara"},colors:{bg:"#F9EDCD",ink:"#143C43",accent:"#A73724",sky:"#B8DDE1",sun:"#F6BC45",paper:"#FFF6D9",teal:"#164F51",red:"#AE3827"}};
function ticks(x:number,y:number,count:number,gap:number,color:string){
 return Array.from({length:count},(_,i)=>shape("tick-"+i,x+i*gap,y,2,i%4===0?28:12,color));
}
function claimTag(x:number,y:number,w:number,h:number){
 return [shape("tag-shadow",x+12,y+14,w,h,"sun"),shape("tag-paper",x,y,w,h,"paper",2),circle("eyelet",x+24,y+24,36,"ink",{z:3}),circle("hole",x+33,y+33,18,"sky",{z:4})];
}
const cue:Slide[]=[
 slide(["Cueglass",[68,255,1040,228,151,"ink",{fontWeight:400,letterSpacing:2}]],[
 ["Live surtitles for touring opera",[79,565,790,110,35]],["Illustrative seed pitch",[81,91,700,57,25,"accent",spaced]]],[art(0,0,1600,900)],"cueglass-cover"),
 slide(["A breath changes the cue.",[82,99,1430,160,94]],[
 ["Wait.",[83,310,600,165,105,"ash",display]],["Now.",[781,478,666,162,108,"accent",display]],["When a singer holds a note, the translation must wait. An operator follows the performance, watches the conductor and releases one prepared line at a time.",[79,696,1423,145,31]]],[shape("cue-line",82,660,1434,3,"line"),...ticks(84,630,33,44,"line")]),
 slide(["From the last row",[73,721,705,165,58]],[
 ["I left the lamp burning.",[320,57,960,85,46,"ink",{...centered}]],["A single translation sits above the action. The operator clears it when the singer finishes the phrase.",[844,736,691,132,26,"ash"]]],[art(0,0,1600,900),shape("surtitle-panel",287,43,1026,98,"black",3),shape("stage-apron",0,697,1600,203,"black",3)],"cueglass-house"),
 slide(["Inside the prompt book",[71,64,1455,148,82]],[
 ["014   STANDBY",[82,269,575,68,33,"ash",spaced]],["The door is still open.",[641,256,866,103,47]],["015   ON AIR",[82,455,575,71,35,"ink",spaced]],["I left the lamp burning.",[642,429,880,110,51]],["016   NEXT",[82,657,575,72,34,"ash",spaced]],["Will you come home?",[643,637,870,117,47,"ash"]]],[shape("active-cue",0,398,1600,159,"red"),shape("margin",585,225,2,549,"line")]),
 slide(["A human has the button",[921,89,595,226,66]],[
 ["The stage manager approves the running order. The operator rehearses the triggers and sees the current and next lines at once.",[924,377,591,211,29]],["If the cast skips ahead, the operator can jump to a cue or clear the display. A local copy travels with the touring company.",[924,642,590,193,28,"ash"]]],[art(0,0,850,900)],"cueglass-desk"),
 slide(["Book once for the tour",[77,69,1430,145,83,"black"]],[
 ["$1,200",[70,259,768,177,111,"red",display]],["Production setup",[78,471,699,72,37,"black"]],["Covers script import, one approved language track and a technical rehearsal with the house operator.",[78,590,677,192,30,"black"]],["$180",[877,329,605,164,102,"black",display]],["Per performance",[884,519,625,76,38,"black"]],["A ten-show run would invoice $3,000. Additional translation is quoted separately.",[884,641,600,153,29,"black"]]],[bg("paper"),shape("score-rule",797,236,2,551,"red")]),
 slide(["The first buyer is a touring producer",[68,453,693,290,72]],[
 ["A company translating the same production for multiple houses already has approved text. Its producer buys the setup; each venue receives a display test and handover.",[830,458,672,223,29]],["Planning case: 40 producers × 3 tours × $3,000 yields $360,000 in annual bookings at full adoption.",[830,709,680,138,26,"accent"]]],[art(0,0,1600,387)],"cueglass-rehearsal"),
 slide(["What a rehearsal can prove",[75,60,1435,145,78,"black"]],[
 ["Cue edits carried into opening night, illustrative test",[76,217,1450,66,28,"red"]],["Compare two runs of the same excerpt. Count missed, late and incorrect lines from the stage manager’s annotated score. The figures illustrate the pilot method.",[1015,359,493,330,29,"black"]]],[bg("paper"),chartBox(65,332,883,456)],undefined,{type:"bar",labels:["Missed","Late","Incorrect"],series:[{name:"First run",values:[4,8,3]},{name:"After rehearsal",values:[1,3,1]}],showLegend:true,colors:["#AB2631","#292530"]}),
 slide(["The alternatives on the desk",[76,67,1438,138,78]],[
 ["Slides",[78,297,425,89,46,"accent",display]],["Easy to prepare. A last-minute cut means checking slide order and the operator’s separate notes.",[78,427,430,259,31]],["Venue systems",[573,353,459,96,46,"accent",display]],["A strong fit for resident companies. A tour must confirm what every host can import and display.",[575,490,423,244,30]],["Cueglass",[1080,417,431,94,45,"accent",display]],["The company carries a reviewed cue file and a local playback copy. Every host signs off on the same excerpt.",[1080,552,425,246,30]]]),
 slide(["Two desks, one sign-off",[78,69,1430,146,78]],[
 ["Ada Fenn / dramaturgy",[78,295,682,109,40,"accent"]],["Ada owns translations, approvals and line breaks. She signs off on readability from the last row before the first paid performance.",[80,460,661,272,30]],["Eli Moss / show control",[845,385,680,109,40,"accent"]],["Eli owns playback and recovery. Every tour leaves rehearsal with a tested spare machine and an operator who has practiced a restart.",[848,544,649,251,30]]],[shape("divide",789,247,2,539,"line")]),
 slide(["Before the curtain rises",[76,63,1428,145,80]],[
 ["Call 1",[85,282,304,81,43,"accent"]],["Commission three paid productions and test the same scene from three seating positions.",[462,277,1015,138,32]],["Call 2",[85,476,310,80,43,"accent"]],["Complete thirty shows. Log every manual recovery and rehearse the common failure modes again.",[462,471,1015,140,32]],["Call 3",[85,669,310,80,43,"accent"]],["Secure two repeat bookings and publish a standard venue handover packet.",[462,663,1008,137,32]]],[...([242,436,630].map((y,i)=>shape("call-"+i,83,y,1428,2,"line")))]),
 slide(["Hold for opening night.",[76,89,1450,162,93]],[
 ["$750k seed",[70,302,1210,198,127,"accent",display]],["$330k for local playback, $240k for tour onboarding and $180k for rehearsal support. The 15-month target is thirty performances and two repeat producers.",[79,589,1002,206,31]],["Illustrative company and financial model.",[1152,663,355,137,25,"ash"]]],[shape("last-line",79,541,1439,3,"accent")])
];
const found:Slide[]=[
 slide(["Lost Property Club",[66,123,636,370,102,"ink",poster]],[
 ["A return desk for independent hotels.",[76,560,590,148,37]],["Illustrative seed pitch",[76,794,583,62,25,"ink",spaced]]],[art(0,0,1600,900),rect("sky-wash",0,0,670,900,"sky",{z:3,gradient:{angle:0,stops:[{hex:"#B8DDE1",pos:0,alpha:.4},{hex:"#B8DDE1",pos:1,alpha:0}]}})],"found-cover"),
 slide(["Somewhere on this shelf.",[73,66,1445,143,85]],[
 ["A guest calls about a hat. The morning desk remembers a hat, but the night desk moved it. A useful answer depends on who picked up the phone.",[75,683,878,177,31]],["One shelf record follows the item across shifts.",[1030,701,477,129,34,"accent",display]]],[art(0,229,1600,391)],"found-shelf"),
 slide(["A dent beats a description.",[822,89,690,239,72]],[
 ["Found: green flask",[852,410,626,89,43,"accent",display]],["Private detail: crescent dent at the base. Staff log one identifying mark and keep it off the guest-facing notice. The claimant describes it before release.",[852,537,610,240,32]]],[bg("sky"),art(66,77,698,745),...claimTag(797,349,724,470)],"found-tag"),
 slide(["The claim changes hands",[76,63,1450,146,79]],[
 ["Reported",[80,310,460,108,64,"ink",display]],["Guest records the item, date and a private detail. A reference number works across phone and email.",[82,460,427,230,31]],["Matched",[562,366,468,111,64,"accent",display]],["Staff compare the description with the shelf record and hold the item while they check ownership.",[563,516,427,234,31]],["Returned",[1051,418,466,111,64,"ink",display]],["A handoff or courier receipt closes the record. The next shift sees who released it and when.",[1054,565,430,231,31]]],[bg("sun"),...([273,329,381].map((y,i)=>shape("tab-"+i,79+i*485,y,425,4,"ink")))]),
 slide(["One counter, two ways home",[75,520,655,230,71]],[
 ["A guest can collect at the desk with the claim number. For delivery, the desk confirms the address and sends a prepaid shipping link.",[802,537,697,191,32]],["The property keeps its own release and retention policy. Staff record exceptions against the item.",[802,741,689,115,27,"accent"]]],[art(0,0,1600,460)],"found-return"),
 slide(["The desk pays a flat fee",[74,73,1410,148,78]],[
 ["$95",[130,332,582,153,112,"accent",{...display,typeTreatment:"offset-3d"}]],["per property / month",[136,555,558,118,43]],["A hotel gets unlimited staff logins, an item register and a guest claim page. Shipping is passed through at cost.",[854,351,631,224,34]],["At $25 in modeled monthly support and hosting, one property contributes $70 before sales and overhead.",[855,630,622,170,30]]],[bg("sky"),...claimTag(75,253,684,530)]),
 slide(["How much desk time comes back?",[75,73,1455,158,72]],[
 ["Minutes per enquiry, modeled front-desk trial",[78,236,1380,70,31,"accent"]],["75 enquiries a month × 5 minutes saved gives 6¼ hours back to the desk. Staff time a sample during both shifts before and after rollout.",[1020,361,482,310,33]]],[chartBox(73,340,866,442)],undefined,{type:"bar",labels:["Manual search","Shared register"],series:[{name:"Minutes",values:[8,3]}],showLegend:false,colors:["#196568"]}),
 slide(["Start with one city’s keys",[77,78,1420,143,80,"paper"]],[
 ["250 hotels",[77,302,837,167,93,"sun",display]],["At $95 per month, 250 subscribing properties represent $285,000 in annual recurring revenue. This is a full-adoption scenario for the initial sales list.",[80,523,808,247,34,"paper"]],["The first introduction",[990,317,523,102,43,"sun",display]],["Sell through local hotel operators’ groups. Start with one building and invite its sister properties only after two shifts use the register every day.",[993,481,492,283,31,"paper"]]],[bg("teal")]),
 slide(["What a notebook still does well",[72,70,1460,148,74]],[
 ["The notebook",[80,298,650,95,51,"ink",display]],["It costs almost nothing and stays at the counter. A remote enquiry still requires someone to find the right page and check the shelf.",[82,458,640,265,33]],["The shared register",[855,372,670,104,51,"accent",display]],["A second property or a night manager can look up the item, see the last action and leave a record for the person who opens the desk tomorrow.",[857,537,645,244,32]]],[bg("sun"),shape("crease",783,259,3,530,"ink")]),
 slide(["Who runs the return desk?",[72,72,1455,145,78]],[
 ["June Park",[118,346,606,85,55,"accent",display]],["Hotel operations. June owns property onboarding, shelf labels and the release checklist used by desk staff.",[119,481,584,210,32]],["Omar Bell",[863,434,605,91,55,"accent",display]],["Product engineering. Omar owns claim matching, staff access and the activity record that carries across shifts.",[865,563,577,206,32]]],[bg("sky"),...claimTag(70,239,679,492).map(e=>({...e,id:"june-"+e.id})),...claimTag(816,325,679,489).map(e=>({...e,id:"omar-"+e.id}))]),
 slide(["Thirty desks in twelve months",[73,75,1450,145,76]],[
 ["First 5",[82,295,433,101,53,"accent",display]],["Pilot for six weeks. Measure time per enquiry and check unclaimed items against the physical shelf.",[82,465,432,239,31]],["Next 10",[579,295,437,101,53,"accent",display]],["Charge the monthly fee and document the first successful handover across sister properties.",[580,465,428,243,31]],["Final 15",[1082,295,427,101,53,"accent",display]],["Train via the property manager. Seek paid renewals from four of the original five pilots.",[1082,465,427,237,31]]],[shape("shelf",74,768,1445,24,"sun")]),
 slide(["Return to sender.",[69,80,1440,170,95,"paper"]],[
 ["$480k pre-seed",[75,305,1400,179,110,"sun",display]],["$210k builds the product, $150k funds hotel onboarding and $120k runs support and field trials. The twelve-month target is 30 paying properties.",[81,589,918,205,33,"paper"]],["Illustrative company and financial model.",[1100,690,409,99,25,"paper"]]],[bg("teal"),shape("address-rule",78,527,1430,3,"sun")])
];
async function build(id:string,name:string,description:string,brand:El,pages:Slide[]){
 const slides=pages.map(({elements,art,...data},i)=>({...data,photoQuery:art,role:i===0?"cover":i===pages.length-1?"closing":"feature"}));
 await renderTemplate({id,name,description,brand,family:id,premium:true,motion:false,slides,kits:()=>pages.map((p,i)=>writeKit(slides[i].role,id+"-"+(i+1),id,p.elements))},false,
   async key=>({path:path.join(ROOT,"assets","cue-and-claim",key+".png"),pexelsId:"local:"+key}));
}
(async()=>{await build("cueglass","Cueglass","A touring opera surtitling pitch.",theatre,cue);await build("lost-property-club","Lost Property Club","A hotel lost-property software pitch.",depot,found);})().catch(e=>{console.error(e);process.exitCode=1;});
