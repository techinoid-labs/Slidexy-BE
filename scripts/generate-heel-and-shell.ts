import * as path from "path";
import { El, ROOT, circle, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";

type Frame=[number,number,number,number,number,string?,El?];
type Copy=[string,Frame];
type Page={title:string;items:string[];elements:El[];art?:string;chart?:El};
const display={textStyleRole:"display"};
const center={align:"center",textStyleRole:"display"};
const plate=(id:string,x:number,y:number,w:number,h:number,tone:string,z=1,extra:El={})=>rect(id,x,y,w,h,tone,{z,keepFill:true,...extra});
const back=(tone:string)=>plate("ground",0,0,1600,900,tone,0);
const picture=(x:number,y:number,w:number,h:number,z=2)=>photo("object",x,y,w,h,{z});
const ring=(id:string,x:number,y:number,w:number,tone:string,z:number)=>circle(id,x,y,w,tone,{z,keepFill:true});
const plot=(x:number,y:number,w:number,h:number)=>({id:"plot",type:"chart",x,y,width:w,height:h,z:2});
const shadow={blur:18,offsetY:12,opacity:.25,color:"#0D1C24"};
function page(head:Copy,lines:Copy[],layers:El[]=[],art?:string,chart?:El):Page{
 const elements=[head,...lines].map(([,frame],i)=>{
   const [x,y,w,h,size,color,style]=frame, slot=i?"copy"+(i-1):"title";
   return text(slot,x,y,w,h,size,slot,color||"ink",{z:8,...(i?{}:display),...style});
 });
 return {title:head[0],items:lines.map(([s])=>s),elements:[...layers,...elements],art,chart};
}
const gym={fonts:{display:"Impact",body:"Trebuchet MS"},colors:{bg:"#E8DEFD",ink:"#211B37",blue:"#2537A5",lilac:"#C5ACF1",orange:"#FF803D",white:"#FFFAF3",accent:"#8E310D"}};
const reef={fonts:{display:"Baskerville Old Face",body:"Gill Sans MT"},colors:{bg:"#F6F1E7",ink:"#123C3B",jade:"#164F49",deep:"#0D3532",sea:"#A4CCBE",brass:"#D5BB83",paper:"#FAF4E5",accent:"#77552E"}};
const heel:Page[]=[
 page(["HEEL",[121,68,1000,308,232,"white",{...display,z:3}]],[
 ["TURN",[839,537,709,294,197,"white",{...display,z:8}]],["Climbing-shoe repair through the gym desk",[74,665,367,153,32,"white"]],["Illustrative seed pitch",[74,829,520,53,23,"lilac"]]],
 [back("blue"),ring("spot",607,57,707,"lilac",1),plate("kick",0,470,1600,30,"orange",2),picture(456,143,886,664,5)],"heel-cover"),
 page(["The rubber goes first.",[78,76,1440,155,88]],[
 ["The upper still fits.",[78,258,1430,161,102,"accent",display]],["Climbers break in a pair over months. Once the toe rubber thins, a familiar shoe can sit in a bag while its owner tries to find a repairer who will take it.",[82,555,797,241,34]],["The gym already sees the shoe, the wear and the climber in the same visit.",[1000,577,477,198,34]]],[back("lilac")]),
 page(["The desk takes the pair",[903,81,614,207,74]],[
 ["Gym staff photograph the toe and heel and attach a numbered bag tag. The repairer accepts the job or sends a revised quote before cutting rubber.",[905,354,600,222,31]],["A weekly collection consolidates the bags. The desk can look up the return date without calling the workshop.",[905,646,586,170,30]]],[picture(0,0,841,900)],"heel-bench"),
 page(["Keep the shape that fits",[881,77,650,240,75]],[
 ["The cobbler removes worn rubber, checks the underlying rand and fits the agreed sole. A second person checks the bond and the pair number before dispatch.",[885,394,621,213,31]],["The climber collects at the gym. A fit issue goes back under the same job number with a photograph and notes.",[885,666,621,160,29,"accent"]]],[picture(0,0,827,900)],"heel-fit"),
 page(["One pair through the queue",[71,74,1440,149,80]],[
 ["MON",[77,300,426,119,72,"white",display]],["Desk intake and a photographed condition check. The climber approves the quote.",[78,470,417,233,31,"white"]],["WED",[576,354,422,114,72,"white",display]],["Batch repair. A second check catches mismatched tags and unfinished edges.",[576,508,419,237,31,"white"]],["FRI",[1080,412,427,119,72,"white",display]],["Return to the original desk with care notes and a pickup message.",[1080,574,418,188,31,"white"]]],[back("orange"),plate("mon",53,271,490,480,"blue"),plate("wed",550,325,490,480,"blue"),plate("fri",1048,380,490,470,"blue")]),
 page(["A standard resole",[74,72,1430,154,86,"white"]],[
 ["$68",[69,259,745,203,142,"orange",display]],["Paid by the climber for a standard pair. Rand repairs are quoted separately after inspection.",[79,518,693,206,35,"white"]],["$42 direct cost",[873,314,648,108,47,"white",display]],["Labor and materials cost $32, the gym receives $6 and bag handling costs $4. The remaining $26 funds fixed overhead and growth.",[875,499,624,257,33,"white"]]],[back("blue"),plate("tear",818,246,5,552,"lilac")]),
 page(["Which route pays for itself?",[74,64,1450,146,78]],[
 ["Weekly contribution after a $260 fixed driver cost • illustrative dollars",[80,229,1440,67,28,"accent"]],["Ten pairs cover the weekly route cost. At twenty pairs the route contributes $260 after that cost. The model excludes head-office overhead.",[1025,369,478,297,33]]],[plot(69,321,879,469)],undefined,{type:"bar",labels:["5 pairs","10 pairs","15 pairs","20 pairs"],series:[{name:"Contribution ($)",values:[-130,0,130,260]}],colors:["#3847A5"],showLegend:false}),
 page(["Start with one climbing district",[70,67,1460,168,76]],[
 ["24 gyms",[72,277,804,150,96,"blue",display]],["Assume twelve pairs a week at each desk for 48 weeks. At $68 per pair, full adoption represents $940,032 in annual sales.",[77,492,770,233,33]],["The route test",[963,320,550,90,44,"accent",display]],["Sign neighboring desks before expanding the map. A gym that cannot fill a weekly bag joins a fortnightly pickup route.",[963,478,535,249,31]]],[back("lilac")]),
 page(["Why the gym holds the bag",[73,80,1445,150,79]],[
 ["Mail-in",[76,299,440,91,49,"accent",display]],["Wide coverage, but every climber packs and tracks their own parcel.",[77,446,429,216,33]],["Local cobbler",[577,299,445,91,49,"accent",display]],["A direct relationship works for regulars. The climber still makes two separate trips.",[577,446,433,229,33]],["Gym desk",[1080,299,431,91,49,"blue",display]],["A pickup on a normal climbing night. The workshop receives enough pairs to plan the batch.",[1080,446,428,240,33]]],[back("white"),plate("baseline",74,761,1437,12,"orange")]),
 page(["A bench lead and a route lead",[73,75,1450,147,78]],[
 ["Alex Tan / repair",[83,290,676,117,47,"blue",display]],["Alex owns the bond check, rubber stock and training. The first workshop hire must complete a supervised batch before handling customer pairs.",[85,447,646,266,33]],["Lou Finch / gym operations",[850,368,666,122,45,"accent",display]],["Lou owns desk onboarding and weekly collections. Each gym gets one named contact and a shared list of jobs awaiting approval.",[852,531,640,248,32]]],[back("lilac")]),
 page(["Earn the next route",[73,73,1440,146,84]],[
 ["First 90 days",[78,274,440,87,41,"accent"]],["Open four desks. Follow the first hundred pairs from drop-off to collection.",[79,422,433,225,32]],["By month six",[580,274,434,87,41,"accent"]],["Reach ten pairs a week per route and keep the proposed rework rate below 3%.", [581,422,428,227,32]],["By month twelve",[1083,274,432,100,40,"accent"]],["Operate twelve desks and renew at least three of the first four gym partnerships.",[1084,422,426,233,32]]],[back("white")]),
 page(["Resole the first pair.",[65,63,1460,174,86,"white"]],[
 ["$620k seed",[67,290,1430,207,127,"orange",display]],["$260k equips two benches, $200k hires and trains repair staff, and $160k funds pickup routes and gym onboarding.",[77,598,915,200,34,"white"]],["Twelve desks in twelve months. Illustrative company and financial model.",[1090,645,423,140,28,"white"]]],[back("blue"),plate("finish",76,554,1445,8,"lilac")])
];
const shell:Page[]=[
 page(["Shell Index",[346,561,908,156,99,"ink",center]],[
 ["An oyster-shell collection network",[362,717,876,78,32,"ink",{align:"center",letterSpacing:1}]],["Illustrative seed pitch",[93,800,265,62,22,"paper"]]],
 [back("deep"),plate("rim-shadow",146,72,1308,678,"deep",1),plate("rim",132,52,1310,676,"brass",2),plate("lining",151,71,1272,638,"jade",3),plate("well",184,102,1205,574,"deep",4),picture(428,81,744,558,5),plate("label-shadow",309,569,1008,232,"deep",6),plate("nameplate",293,550,1015,240,"paper",7,{shadow}),ring("pin-left",311,570,16,"brass",8),ring("pin-right",1274,570,16,"brass",8)],"shell-cover"),
 page(["After the dinner rush",[72,475,701,201,76]],[
 ["At closing time, shells from dozens of plates end up in a bin. Across the harbor, a nursery needs suitable material and a record of where it came from.",[830,474,681,198,32]],["Shell Index coordinates the pickups, storage lots and signed transfers between them.",[833,710,674,147,30,"accent"]]],[picture(0,0,1600,410)],"shell-dock"),
 page(["A shell needs a record",[72,73,1440,147,79]],[
 ["LOT 042",[113,335,621,103,62,"jade",display]],["North Quay / Tuesday pickup",[117,488,605,103,36]],["A venue receives a lidded tote. The driver logs the source, pickup time and gross weight; the yard records empty-bin weight and a photograph.",[845,297,657,237,31]],["Lots stay separate until a partner accepts the paperwork and its material checks.",[847,633,643,162,30,"accent"]]],[back("sea"),plate("ticket-cast",89,269,682,436,"jade"),plate("ticket",72,252,682,436,"paper",2),ring("pin",91,270,17,"brass",3)]),
 page(["The receiving nursery signs",[902,101,625,230,70]],[
 ["The nursery sets the receiving conditions. Shell Index records what passes inspection, what needs further holding and what must leave the restoration stream.",[905,395,595,227,31]],["A signed transfer closes the lot. The originating restaurant receives a receipt for the accepted quantity.",[907,664,587,172,29,"accent"]]],[picture(0,0,825,900)],"shell-return"),
 page(["Follow a tonne through the yard",[72,65,1460,149,76]],[
 ["1,000 kg",[80,304,455,123,63,"jade",display]],["Collected shell mass after deducting bin tare.",[82,470,425,155,31]],["920 kg",[577,353,448,123,63,"jade",display]],["Eligible after sorting. The other 80 kg are logged as unsuitable for this lot.",[579,524,426,196,31]],["900 kg",[1082,399,435,123,63,"jade",display]],["Accepted at transfer. A further 20 kg remain in holding pending review.",[1084,562,416,207,31]]],[back("paper"),...([271,322,369].map((y,i)=>plate("mass-"+i,80+500*i,y,432-i*35,10,"brass")))]),
 page(["Venues pay for collection",[77,78,1420,144,77,"paper"]],[
 ["$160 / month",[74,295,888,155,86,"brass",display]],["One scheduled weekly bin exchange, a pickup log and accepted-weight receipts. A missed or contaminated bin is documented on site.",[80,509,820,244,32,"paper"]],["$94 direct cost",[978,317,526,111,44,"sea",display]],["Route labor and fuel account for $62, bins and washing for $18, and yard handling for $14. Contribution is $66 per venue-month.",[980,490,511,253,30,"paper"]]],[back("jade")]),
 page(["Density changes the route",[73,69,1445,149,78]],[
 ["Illustrative route labor and fuel per venue-month, dollars",[80,230,1394,70,29,"accent"]],["A compact route spreads a shift over more stops. The pilot records actual drive time, bin-change time and kilograms accepted per venue.",[1009,361,498,288,33]]],[plot(66,324,883,452)],undefined,{type:"line",labels:["6 stops","10 stops","14 stops","18 stops"],series:[{name:"Route cost ($)",values:[96,76,62,57]}],colors:["#20665B"],showLegend:false}),
 page(["Start around one harbor",[72,69,1430,154,80]],[
 ["80 venues",[78,277,795,159,91,"jade",display]],["At $160 per month, eighty subscribing restaurants would produce $153,600 in annual collection revenue. Receiving-yard capacity limits the rollout.",[82,485,756,249,32]],["First customers",[970,303,537,100,43,"accent",display]],["Start with restaurant groups that can commit three nearby kitchens. Enroll a route only after a receiving partner signs off on expected volume.",[970,460,528,277,31]]],[back("sea")]),
 page(["Why keep the lots separate?",[74,69,1447,153,76]],[
 ["General waste",[80,287,438,95,42,"accent",display]],["Easy to arrange. The venue loses the recovery record when shells enter a mixed bin.",[81,444,424,242,31]],["Volunteer runs",[579,287,445,95,42,"accent",display]],["Valuable local capacity. Weekly continuity depends on people and storage being available.",[580,444,427,255,31]],["Booked route",[1079,287,438,95,42,"jade",display]],["A named driver, a retained lot number and a receiving signature give both ends a record to reconcile.",[1080,444,425,258,31]]],[back("paper"),plate("ledger-rule",76,751,1440,3,"brass")]),
 page(["The people at each end",[74,76,1440,145,81]],[
 ["Iris Hart / collection",[83,278,670,115,44,"jade",display]],["Iris designs the pickup runs and kitchen training. Her team can trace a disputed bin weight to the driver, time and original receipt.",[85,433,642,255,32]],["Mara Quinn / receiving",[850,379,668,117,44,"accent",display]],["Mara owns yard inspections and partner handovers. She holds a lot when the paperwork or condition falls short of the receiver’s requirements.",[852,552,645,250,32]]],[back("sea")]),
 page(["A pilot with three gates",[73,66,1440,150,81]],[
 ["Pickup",[83,278,390,83,44,"accent"]],["Eight kitchens complete six consecutive weekly exchanges, each with a time and weight record.",[508,271,985,136,32]],["Receiving",[83,478,395,83,44,"accent"]],["The yard reconciles every kilogram as held, rejected or transferred. A partner signs for each accepted lot.",[508,472,985,140,32]],["Renewal",[83,673,394,82,44,"accent"]],["At least six kitchens renew at full price before the second route opens.",[508,665,985,126,32]]],[...([245,442,635].map((y,i)=>plate("rule-"+i,78,y,1440,2,"brass")))]),
 page(["Fund the first harbor route",[73,78,1450,156,80,"paper"]],[
 ["$540k seed",[74,300,1280,176,107,"brass",display]],["$230k for bins and the receiving yard, $190k for collection staff and $120k for records and restaurant onboarding. The round funds a 15-month pilot.",[79,575,910,222,33,"paper"]],["Target: two signed receivers and 40 paying venues. Illustrative company and figures.",[1069,633,442,166,27,"sea"]]],[back("deep"),plate("inlay",76,524,1434,4,"brass")])
];
async function build(id:string,name:string,brand:El,pages:Page[],description:string){
 const slides=pages.map(({art,elements,...data},i)=>({...data,photoQuery:art,role:i===0?"cover":i===pages.length-1?"closing":"feature"}));
 await renderTemplate({id,name,family:id,brand,description,premium:true,motion:false,slides,kits:()=>pages.map((p,i)=>writeKit(slides[i].role,id+"-"+(i+1),id,p.elements))},false,async key=>({path:path.join(ROOT,"assets","heel-and-shell",key+".png"),pexelsId:"local:"+key}));
}
(async()=>{await build("heel-turn","Heel Turn",gym,heel,"Illustrative climbing-shoe repair seed pitch.");await build("shell-index","Shell Index",reef,shell,"Illustrative oyster-shell collection seed pitch.");})().catch(e=>{console.error(e);process.exitCode=1;});
