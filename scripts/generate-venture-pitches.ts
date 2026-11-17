import * as path from "path";
import { El, ROOT, circle, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";

type Page = {title:string; items:string[]; art?:string; chart?:El; elements:El[]};
const T=(x:number,y:number,w:number,h:number,s:number,color="ink")=>text("headline",x,y,w,h,s,"title",color);
const B=(i:number,x:number,y:number,w:number,h:number,s:number,color="ink")=>text("copy-"+i,x,y,w,h,s,"copy"+i,color);
const ground=(color:string)=>rect("ground",0,0,1600,900,color,{z:0,keepFill:true});
const R=(id:string,x:number,y:number,w:number,h:number,color:string)=>rect(id,x,y,w,h,color,{keepFill:true});
const P=(x:number,y:number,w:number,h:number)=>photo("art",x,y,w,h,{z:2});
const chart=(x:number,y:number,w:number,h:number)=>({id:"data",type:"chart",x,y,width:w,height:h,z:2});
const night={fonts:{display:"Bahnschrift",body:"Calibri"},colors:{bg:"#071C35",ink:"#F2FAFF",accent:"#68E7F7",muted:"#A6BDCD",ice:"#E2F6F9",marine:"#07386A",copper:"#E7A575"}};
const clay={fonts:{display:"Georgia",body:"Calibri"},colors:{bg:"#F8EFDC",ink:"#34281E",accent:"#1F409B",blue:"#203E95",terra:"#93452D",paper:"#FFF8E8",sand:"#DBBE98"}};

// Two rows of paired bends form a heat-exchanger coil, continuous at alternate ends.
function coil(x:number,y:number,w:number,pitch:number){
  const els:El[]=[];
  for(let i=0;i<6;i++){
    els.push(R("run-"+i,x,y+i*pitch,w,10,"copper"));
    if(i<5)els.push(R("bend-"+i,i%2?x:x+w-10,y+i*pitch,10,pitch+10,"copper"));
  }
  return els;
}
function timeBands(){
  return Array.from({length:24},(_,i)=>R("hour-"+i,74+i*60,710,48,51,i<7?"accent":i>=14&&i<18?"copper":"marine"));
}
const n:Page[]=[
 {title:"NIGHT TANK",items:["Cooling storage for commercial buildings","Illustrative seed pitch"],art:"night-tank-cover",elements:[P(0,0,1600,900),B(1,77,84,760,65,27,"accent"),T(63,200,605,375,137),B(0,77,646,535,157,38)]},
 {title:"The expensive hour is short",items:["A building can pay for a peak it reaches only briefly. Our first customer is a facilities director with chilled-water cooling, an afternoon demand charge and spare chiller capacity overnight.","Charge overnight","Discharge at peak","In this example the tank charges before 07:00 and supplies cooling from 14:00 to 18:00. The chiller handles the rest of the day."],elements:[T(65,80,1440,153,88),B(0,75,267,825,290,39),B(3,1005,295,495,290,31,"muted"),...timeBands(),B(1,75,786,490,64,26,"accent"),B(2,910,786,535,64,26,"copper")]},
 {title:"Cold goes into the tank at night",items:["An existing chiller freezes water around a submerged coil. During the peak window, the building loop draws cooling from the tank as the ice melts.","A bypass allows the operator to isolate storage and return to normal chiller operation. The retrofit starts with a site survey of valves, available space and overnight load."],art:"night-tank-coil",elements:[P(0,0,1600,424),T(70,478,695,297,77),B(0,828,477,710,167,32),B(1,828,677,710,168,29,"muted")]},
 {title:"The peak falls by 80 kW",items:["Illustrative site model • electrical load in kW","At 16:00, modeled chiller draw drops from 240 to 160 kW. Night charging adds load earlier. The tariff and the timing of the monthly peak determine the actual saving."],chart:{type:"line",labels:["02:00","06:00","10:00","14:00","16:00","20:00"],series:[{name:"Baseline",values:[75,90,145,205,240,125]},{name:"With storage",values:[130,135,145,155,160,125]}],colors:["#A95C2C","#006F91"],showLegend:true},elements:[ground("ice"),T(74,68,1450,140,85,"marine"),B(0,78,236,1390,63,28,"marine"),chart(72,350,905,448),B(1,1035,365,485,375,36,"marine")]},
 {title:"One contract per plant",items:["$900 / month","The owner buys the installed equipment separately. The subscription covers forecasting, dispatch and monthly reporting. Mechanical contractors earn installation and service revenue.","At an assumed $22 per kW per month, an 80 kW reduction is worth $1,760 in gross monthly demand savings. After our fee, $860 remains before energy costs, financing and maintenance."],elements:[T(65,65,1500,141,84),B(0,67,265,850,175,98,"accent"),B(1,78,481,780,290,34),B(2,985,302,530,415,35,"muted")]},
 {title:"Start with 300 plants",items:["$3.24M","Annual subscription opportunity in the initial territory if all 300 qualified sites adopt at $10,800 per year. This is a planning scenario.","Screen for a central loop, sufficient tank space and a rate schedule with a meaningful demand charge. Remove sites that fail any one of those tests."],elements:[ground("marine"),T(72,85,1450,140,78),B(0,67,279,813,236,139,"accent"),B(1,77,592,820,196,33),B(2,1000,347,495,339,34)]},
 {title:"Sell through the plant room",items:["A contractor brings a year of interval data to the first meeting. We model the peak, then price a paid survey if the customer’s tariff supports the case.","The first installation includes a metered baseline and an agreed comparison period. The owner sees both peak reduction and overnight electricity use before signing a portfolio rollout."],art:"night-tank-plant",elements:[P(0,0,902,900),T(955,80,580,244,69),B(0,957,369,560,217,30),B(1,957,620,560,225,28,"muted")]},
 {title:"A pilot with an exit test",items:["Baseline","Four weeks of meter and weather data establish a comparison for similar operating days.","Dispatch","The operator can override dispatch. Every override and the reason for it appear in the site log.","Decision","Advance only if peak reduction exceeds 60 kW on ten eligible days and occupied rooms stay within the owner’s agreed temperature range."],elements:[]},
 {title:"Where storage earns its space",items:["Load scheduling","Useful where the operator can shift the activity itself. A hotel still needs occupied rooms cooled through check-in.","Battery storage","Serves many electrical loads. Our proposal targets a narrower cooling job and requires an accessible chilled-water plant.","The deciding test","Compare installed cost and annual net savings for all three options using the same site data. A poor payback ends our sales process."],elements:[]},
 {title:"Who commissions the system?",items:["Thermal engineering","Lea Moreno owns sizing, coil design and acceptance testing. Her first hire is a commissioning engineer to shorten the time between survey and sign-off.","Controls and delivery","Sam Iqbal owns dispatch software and contractor training. Each installation leaves a local operator with a tested bypass and a documented handover."],elements:[T(73,66,1450,160,80),...coil(81,340,402,63),B(0,590,282,897,75,40,"accent"),B(1,590,379,893,143,31),B(2,590,556,887,76,40,"accent"),B(3,590,645,894,160,31)]},
 {title:"Eighteen months to six sites",items:["Months 1–6","Commission two pilots and verify the meter baseline with each owner.","Months 7–12","Build the installation kit. Train two contractor crews and complete the third and fourth sites.","Months 13–18","Commission the last two sites. Seek renewals from the first cohort with a full season of billing evidence."],elements:[]},
 {title:"Fund the first cooling season",items:["$2.4M seed","$1.2M for equipment and commissioning, $720k for controls and measurement, and $480k for contractor support and sales.","The round targets six metered installations and two renewal decisions within 18 months. All venture details and figures in this pitch are fictional."],elements:[ground("ice"),T(75,76,1470,155,82,"marine"),B(0,68,310,885,232,126,"marine"),...coil(1020,265,437,52),B(1,78,625,844,179,33,"marine"),B(2,975,641,526,169,27,"marine")]}
];
function nightRows(labels:string[]){
  return [T(72,62,1460,154,81),...labels.flatMap((color,i)=>{
    const y=258+190*i;
    return [R("pipe-"+i,77,y,40,108,color),B(i*2,152,y,425,103,40,color),B(i*2+1,612,y,890,146,33)];
  })];
}
n[7].elements=nightRows(["accent","muted","copper"]);
n[8].elements=[T(77,72,1460,160,80),...["muted","copper","accent"].flatMap((c,i)=>[B(i*2,77+i*495,334,440,100,43,c),B(i*2+1,77+i*495,471,434,302,31)])];
n[10].elements=[T(70,70,1450,155,82),...["accent","muted","copper"].flatMap((c,i)=>{
 const x=72+i*494,y=255+64*i;return [R("step-"+i,x,y,462,9,c),B(i*2,x,y+35,460,90,42,c),B(i*2+1,x,y+157,438,262,32)];
})];
const s:Page[]=[
 {title:"Soft Landing",items:["Grown-to-fit packaging for touring ceramics","Illustrative seed pitch"],art:"soft-landing-cover",elements:[P(0,0,1600,900),T(65,165,682,348,123,"paper"),B(0,75,563,593,171,39,"paper"),B(1,77,793,590,64,25,"paper")]},
 {title:"A new crate at every stop",items:["When an exhibition travels, a different crew often packs the same object again. The first crew’s hand-cut foam and handwritten notes rarely tell the next handler exactly where the weight should rest.","A handle is easy to see. The place where it can safely carry weight is harder to communicate.","We sell the repeatable fit to the art shipper who has to deliver the next leg."],elements:[ground("paper"),T(85,74,1405,152,78),B(1,88,279,936,283,61,"accent"),B(0,830,569,680,230,31),B(2,91,620,585,175,33)]},
 {title:"Grow the negative space",items:["A handler approves the contact points on a digital model. Two complementary molds turn that approval into a pair of fitted cushions.","We grow a mycelium-bound fiber composite in the molds, dry the parts and check their dimensions. Each new pair uses the approved geometry."],art:"soft-landing-mold",elements:[P(638,0,962,900),T(64,92,535,257,72),B(0,69,402,517,200,31),B(1,69,651,518,203,29)]},
 {title:"A packer can read the fit",items:["The rim and handles sit inside clearance pockets. The two inserts meet at the body, where the registrar approved support.","The packer checks the orientation mark, closes the lid and records the insert revision on the loan paperwork. A replacement can be ordered against that revision."],art:"soft-landing-crate",elements:[P(86,77,778,739),T(934,98,591,210,68),B(0,935,373,583,181,33),B(1,935,614,580,201,30)]},
 {title:"The second order changes the economics",items:["$480","One-time fit and tooling fee per approved object. It covers the model review, first mold and registrar sign-off.","$96","Price per replacement pair. At $42 of direct material, labor and drying cost, one pair contributes $54 before overhead and freight."],elements:[ground("blue"),T(83,75,1430,212,74,"paper"),B(0,83,326,680,166,102,"paper"),B(2,852,326,675,166,102,"paper"),B(1,89,573,624,210,34,"paper"),B(3,855,573,640,230,34,"paper")]},
 {title:"Begin with repeat shippers",items:["40 art shippers","Assume each handles 25 suitable object families per year. At one new fit and four paid pairs per family, annual sales would be $864,000 across the initial group.","The sales list starts with shippers that service recurring ceramics exhibitions. Registrars approve object contact. The shipper owns the purchasing decision."],elements:[T(77,80,1450,145,79),B(0,83,302,865,155,87,"accent"),B(1,82,515,801,243,35),R("margin",956,288,3,480,"terra"),B(2,1033,327,470,366,34)]},
 {title:"A trial on the packing bench",items:["Packing time per object • illustrative rehearsal","Across three object types, the modeled average falls from 30 to 15 minutes. Repeat packers already have an approved fit sheet for the molded system.","Before live loans, test vibration, drop response and material compatibility with sacrificial objects. Faster packing alone does not qualify an insert."],chart:{type:"bar",labels:["Bowl","Vase","Pitcher"],series:[{name:"Hand-cut foam",values:[24,30,36]},{name:"Fitted inserts",values:[12,15,18]}],colors:["#A05A40","#274BB0"],showLegend:true},elements:[T(80,65,1440,138,76),B(0,85,209,1390,66,29,"accent"),chart(71,334,840,456),B(1,987,326,534,215,30),B(2,987,600,530,206,29)]},
 {title:"What the shipper can buy today",items:["Foam cut on site","Fast to source and easy to adjust. Each new crew has to reproduce the original support by hand.","A custom rigid case","A good choice for an object that travels in the same case for years. Storage and return freight remain part of the decision.","A fitted pair on file","Our first customers already own crates. They buy matched inserts and keep the approved geometry for the next tour."],elements:[]},
 {title:"One tour opens the next",items:["First shipment","A shipper nominates three repeat objects. We quote the molds, produce a trial pair and sit with the lead handler for fit approval.","Repeat booking","Each object receives a revision number. The shipper reorders by number before the next leg, with a fresh inspection on arrival.","Portfolio agreement","Once the shipper has ten active fits, we offer reserved production slots tied to its exhibition calendar."],elements:[]},
 {title:"Two crafts under one roof",items:["Ada Voss, collections handling","Ada leads contact-point reviews and signs off packing instructions with each registrar. Her team owns the record of every approved revision.","Mika Lane, biomaterials production","Mika runs mold tooling, drying schedules and lot inspection. The next hire will own environmental testing and the release checklist."],elements:[ground("terra"),T(78,76,1435,155,77,"paper"),B(0,84,290,687,134,43,"paper"),B(1,84,474,650,278,33,"paper"),B(2,839,375,664,137,43,"paper"),B(3,840,548,654,232,33,"paper")]},
 {title:"The next three shipments",items:["By month 4","Complete bench qualification for three vessel shapes. Document contact points, dimensional drift and impact response.","By month 9","Deliver paid trials to four shippers and track handling time, fit corrections and damage reports.","By month 15","Secure repeat orders from three shippers. Release a second mold set only after the first earns a repeat booking."],elements:[]},
 {title:"Give the next tour a softer landing",items:["$1.2M seed","$540k builds the mold and drying line. $360k funds qualification and handling trials. $300k funds shipper onboarding and repeat-order support.","The 15-month milestone is three paying repeat customers and one qualified production process. All venture details and figures in this pitch are fictional."],elements:[ground("blue"),T(76,70,1440,228,77,"paper"),B(0,76,370,812,175,102,"paper"),B(1,822,391,675,232,34,"paper"),B(2,85,687,1190,130,29,"paper")]}
];
s[7].elements=[T(80,80,1450,159,73),...["terra","accent","ink"].flatMap((c,i)=>[B(i*2,80+i*500,321,455,118,38,c),B(i*2+1,80+i*500,474,439,286,33)])];
s[8].elements=[ground("paper"),T(85,76,1420,140,77),...[0,1,2].flatMap(i=>{
 const x=88+i*486,y=246+i*67;return [R("leaf-"+i,x,y,451,368,i===1?"sand":"bg"),B(i*2,x+25,y+30,398,74,34,"accent"),B(i*2+1,x+25,y+119,398,229,28)];
})];
s[10].elements=[T(77,80,1450,149,78),...[0,1,2].flatMap(i=>[circle("seal-"+i,82,263+i*177,35,"terra"),B(i*2,157,248+i*177,395,95,44,"accent"),B(i*2+1,585,249+i*177,905,117,32)])];
async function build(id:string,name:string,description:string,brand:El,pages:Page[]){
 const slides=pages.map(({elements,art,...content},i)=>({...content,photoQuery:art,role:i===0?"cover":i===pages.length-1?"closing":"feature"}));
 await renderTemplate({id,name,description,family:id,brand,premium:true,motion:false,slides,
   kits:()=>pages.map((p,i)=>writeKit(slides[i].role,id+"-"+(i+1),id,p.elements))},false,
   async key=>({path:path.join(ROOT,"assets","venture-pitches",key+".png"),pexelsId:"local:"+key}));
}
(async()=>{
 await build("night-tank","Night Tank","Fictional thermal-storage seed pitch with modeled site economics.",night,n);
 await build("soft-landing","Soft Landing","Fictional biomaterials seed pitch for art logistics.",clay,s);
})().catch(e=>{console.error(e);process.exitCode=1});
