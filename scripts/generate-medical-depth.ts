import * as path from "path";
import * as fs from "fs";
import { El, ROOT, circle, chevron, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";

type Frame = [number, number, number, number, number, string?, El?];
type Copy = [string, Frame];
type Page = { title: string; items: string[]; elements: El[]; art?: string; chart?: El };
const display = { textStyleRole: "display" };
const center = { ...display, align: "center" };
const plate = (id: string, x: number, y: number, w: number, h: number, tone: string, z = 1, extra: El = {}) =>
  rect(id, x, y, w, h, tone, { z, keepFill: true, ...extra });
const back = (tone: string) => plate("ground", 0, 0, 1600, 900, tone, 0);
const picture = (x: number, y: number, w: number, h: number, z = 2) => photo("object", x, y, w, h, { z });
const disc = (id: string, x: number, y: number, size: number, tone: string, z = 1) =>
  circle(id, x, y, size, tone, { z, keepFill: true });
const plot = (x: number, y: number, width: number, height: number) => ({ id: "plot", type: "chart", x, y, width, height, z: 2 });
function page(head: Copy, lines: Copy[], layers: El[] = [], art?: string, chart?: El): Page {
  const elements = [head, ...lines].map(([, frame], i) => {
    const [x, y, w, h, requestedSize, color, style] = frame;
    const size = i === 0 && head[0].length > 26 ? Math.min(requestedSize, 62) : requestedSize;
    const slot = i ? "copy" + (i - 1) : "title";
    return text(slot, x, y, w, h, size, slot, color || "ink", { z: 8, ...(i ? {} : display), ...style });
  });
  return { title: head[0], items: lines.map(([s]) => s), elements: [...layers, ...elements], art, chart };
}

const pulseBrand = {
  fonts: { display: "Bahnschrift", body: "Calibri" },
  colors: { bg: "#ECF5F3", ink: "#113A46", navy: "#113A46", deep: "#082B35", aqua: "#BDE6E0", coral: "#EA674D", paper: "#ECF5F3", accent: "#9F382B", line: "#A6C7C5" }
};
const atlasBrand = {
  fonts: { display: "Bodoni MT", body: "Gill Sans MT" },
  colors: { bg: "#F7F3E8", ink: "#382953", purple: "#382953", lavender: "#DACCF0", pink: "#DCA5BD", paper: "#F7F3E8", accent: "#76465E", line: "#B6A4CA" }
};
const lift = { blur: 22, offsetY: 14, opacity: 0.14, color: "#182732" };
const arrow = (id: string, x: number, y: number, tone: string) =>
  chevron(id, x, y, 44, 48, tone, { keepFill: true, z: 2 });
const cross = (x: number, y: number, tone: string) => [
  plate("cross-v", x + 36, y, 36, 108, tone), plate("cross-h", x, y + 36, 108, 36, tone)
];
// These native marks encode cohort counts. One mark equals one referral.
const cohort = Array.from({ length: 100 }, (_, i) =>
  disc("patient-" + i, 83 + i % 10 * 57, 302 + Math.floor(i / 10) * 43, 24,
    i < 78 ? "navy" : i < 92 ? "coral" : "line", 2)
);
const pulse: Page[] = [
  page(["PULSE",[77,49,1434,202,148,"paper",{...display,z:3}]],[
    ["CHAMBER",[73,680,1453,164,115,"paper",{...display,z:8}]],
    ["Cardiac diagnostics\nService redesign proposal",[87,333,380,163,34,"paper"]],
    ["Illustrative medical service deck",[89,581,360,90,23,"aqua"]]
  ],[back("navy"),plate("cross-arm",480,283,1120,312,"deep"),plate("cross-stem",884,0,312,900,"deep"),
     disc("halo-outer",622,108,660,"aqua"),disc("halo-inner",651,137,602,"paper",2),
     picture(683,111,543,679,5)],"pulse-heart"),
  page(["A referral needs a visible next step",[73,65,1450,146,79]],[
    ["The proposed service connects booking, scanning and report delivery in one accountable pathway.",[80,247,1410,100,37]],
    ["Referral received",[88,428,421,84,39,"navy",display]],
    ["The coordinator checks that the request contains the information needed for clinical review.",[90,551,414,187,31]],
    ["Appointment agreed",[587,428,427,84,39,"navy",display]],
    ["The booking team confirms access needs and tells the patient who to contact if plans change.",[589,551,417,187,31]],
    ["Report returned",[1086,428,423,84,39,"navy",display]],
    ["The referring team receives the report and owns communication about the next clinical step.",[1088,551,416,187,31]],
    ["Proposed service workflow. Clinical prioritization follows the provider’s approved local pathway.",[83,803,1430,60,25,"accent"]]
  ],[plate("flow",84,374,1424,5,"line"),arrow("a",521,436,"coral"),arrow("b",1020,436,"coral")]),
  page(["Every referral has a status",[75,61,1440,144,82]],[
    ["100 referrals at the weekly review",[81,220,1400,71,31,"accent"]],
    ["78 booked",[788,318,700,100,59,"navy",display]],
    ["A date and location have been agreed with the patient.",[792,425,704,90,31]],
    ["14 awaiting contact",[788,543,705,91,45,"accent",display]],
    ["The coordinator owns the next call and records the attempt.",[792,638,704,87,30]],
    ["8 need clarification",[788,748,705,83,40,"navy",display]],
    ["One mark = one referral. Synthetic cohort of 100.",[83,790,630,67,25,"accent"]]
  ],[...cohort,plate("count-rule",729,306,2,512,"line")]),
  page(["The appointment starts before arrival",[76,64,1440,146,77,"paper"]],[
    ["Clear instructions reduce uncertainty",[84,622,1410,86,43,"paper",display]],
    ["Confirm the place and time, access requirements and the contact number for changes. The local patient leaflet supplies preparation instructions.",[86,739,903,119,31,"paper"]],
    ["Conceptual illustration of an echo service.",[1123,767,388,81,23,"aqua"]]
  ],[back("navy"),picture(0,234,1600,348)],"pulse-room"),
  page(["Four handovers, one accountable pathway",[75,61,1450,146,71]],[
    ["REVIEW",[86,323,300,82,35,"paper"]],
    ["Clinician checks the referral and assigns the appropriate pathway.",[87,449,298,206,31,"paper"]],
    ["BOOK",[481,323,300,82,35,"navy"]],
    ["Coordinator agrees the slot and records communication needs.",[482,449,298,206,31]],
    ["SCAN",[877,323,300,82,35,"paper"]],
    ["Sonographer acquires images and documents the study.",[878,449,298,206,31,"paper"]],
    ["REPORT",[1271,323,262,82,35,"navy"]],
    ["Authorized staff issue the report to the referrer.",[1272,449,250,206,31]],
    ["Each handover carries an owner, a timestamp and an unresolved-actions field.",[83,789,1430,70,30,"accent"]]
  ],[plate("review",62,279,348,449,"navy",1,{shadow:lift}),plate("book",457,279,348,449,"aqua",1,{shadow:lift}),
     plate("scan",852,279,348,449,"navy",1,{shadow:lift}),plate("report",1247,279,305,449,"aqua",1,{shadow:lift}),
     arrow("r1",413,474,"coral"),arrow("r2",808,474,"coral"),arrow("r3",1203,474,"coral")]),
  page(["The queue grows when arrivals exceed slots",[74,62,1450,143,73]],[
    ["Synthetic weekly referral and completed-study counts",[80,218,1400,64,28,"accent"]],
    ["A capacity question",[1078,337,434,105,44,"navy",display]],
    ["Review demand and completed studies together. A week with fewer completions can reflect staffing, access or equipment availability.",[1081,482,425,237,31]],
    ["Sample data illustrate the reporting format.",[1081,770,424,71,24,"accent"]]
  ],[plot(64,318,940,488)],undefined,{type:"line",labels:["W1","W2","W3","W4","W5","W6"],series:[{name:"Referrals",values:[52,58,55,62,60,64]},{name:"Completed",values:[48,50,54,56,58,62]}],colors:["#EA674D","#113A46"],showLegend:true}),
  page(["A week has 64 planned study slots",[74,63,1440,142,79]],[
    ["8 sessions × 8 slots",[83,236,1400,97,49,"accent",display]],
    ["Room A",[83,382,300,77,33]],
    ["Room B",[83,553,300,77,33]],
    ["MON",[424,341,208,60,26]],["TUE",[684,341,208,60,26]],["WED",[944,341,208,60,26]],["THU",[1204,341,208,60,26]],
    ["8",[444,423,163,92,52,"paper",center]],["8",[704,423,163,92,52,"paper",center]],["8",[964,423,163,92,52,"paper",center]],["8",[1224,423,163,92,52,"paper",center]],
    ["8",[444,594,163,92,52,"navy",center]],["8",[704,594,163,92,52,"navy",center]],["8",[964,594,163,92,52,"navy",center]],["8",[1224,594,163,92,52,"navy",center]],
    ["Illustrative capacity plan. Slot duration and staffing require local approval. The model reserves separate time for reporting, breaks and room preparation.",[83,763,1425,106,28,"accent"]]
  ],[...[0,1,2,3].flatMap(i=>[plate("room-a"+i,408+i*260,405,224,117,"navy"),plate("room-b"+i,408+i*260,576,224,117,"aqua")])]),
  page(["The report closes the information loop",[75,60,1450,144,78,"paper"]],[
    ["Study completed",[96,303,612,96,47,"navy",display]],
    ["Images and the study record are available to the reporting professional.",[100,435,589,144,32,"navy"]],
    ["Report authorized",[894,303,612,96,47,"navy",display]],
    ["The referring clinician receives the findings through the agreed channel.",[898,435,589,144,32,"navy"]],
    ["Communication recorded",[96,672,1390,103,50,"paper",display]],
    ["The pathway records the receiving team and unresolved follow-up actions.",[100,790,1370,62,30,"paper"]]
  ],[back("navy"),plate("report-left",75,273,656,337,"paper",2,{shadow:lift}),
     plate("report-right",873,273,656,337,"paper",2,{shadow:lift}),arrow("report-arrow",779,415,"coral")]),
  page(["A shorter wait is a measurable aim",[75,61,1440,143,79]],[
    ["Synthetic median days from referral to appointment",[81,218,1400,64,28,"accent"]],
    ["Track the distribution",[1068,344,445,110,44,"navy",display]],
    ["The median describes the middle of the queue. Review long waits separately and break results down by the locally assigned pathway.",[1071,496,433,235,31]],
    ["Example values show a possible dashboard view; they represent no measured service.",[1071,760,433,87,24,"accent"]]
  ],[plot(63,323,930,476)],undefined,{type:"bar",labels:["Month 1","Month 2","Month 3","Month 4"],series:[{name:"Median days",values:[28,25,23,21]}],colors:["#113A46"],showLegend:false}),
  page(["Quality checks sit beside throughput",[75,60,1440,144,80]],[
    ["Measure",[83,289,350,69,31,"accent"]],
    ["Definition",[508,289,585,69,31,"accent"]],
    ["Example",[1240,289,275,69,31,"accent"]],
    ["Referral completeness",[83,401,380,96,32]],
    ["Requests containing the locally required information",[508,401,615,104,31]],
    ["92 / 100",[1240,401,275,96,35]],
    ["Report delivery",[83,547,380,96,32]],
    ["Authorized reports with a recorded receiving team",[508,547,615,104,31]],
    ["96 / 100",[1240,547,275,96,35]],
    ["Patient feedback",[83,693,380,96,32]],
    ["Respondents who understood the next step",[508,693,615,104,31]],
    ["41 / 50",[1240,693,275,96,35]],
    ["Synthetic audit values. Denominators describe different groups.",[83,829,1400,48,24,"accent"]]
  ],[...[365,511,657,803].map((y,i)=>plate("audit"+i,80,y,1440,2,"line"))]),
  page(["Ownership prevents a referral from stalling",[75,61,1440,144,76]],[
    ["Clinical lead",[106,297,620,96,49,"navy",display]],
    ["Approves the pathway and reviews exceptions. Owns clinical escalation and reporting permissions.",[109,428,607,181,32]],
    ["Service coordinator",[904,297,611,96,49,"navy",display]],
    ["Owns contact attempts, access arrangements and the weekly queue review.",[907,428,593,181,32]],
    ["Shared review",[107,709,420,83,39,"accent",display]],
    ["A weekly meeting examines open referrals, available sessions and unresolved report-delivery issues.",[604,708,895,140,32]]
  ],[plate("owner-a",78,265,681,366,"aqua"),plate("owner-b",876,265,650,366,"aqua"),plate("link",759,440,117,4,"coral")]),
  page(["The pilot tests the whole pathway",[75,61,1440,144,81,"paper"]],[
    ["MONTH 1",[84,285,440,83,37,"aqua"]],
    ["Map and rehearse",[84,401,440,101,48,"paper",display]],
    ["Confirm handovers and run sample referrals through booking and reporting.",[87,539,422,187,32,"paper"]],
    ["MONTH 2",[583,285,440,83,37,"aqua"]],
    ["Open a small cohort",[583,401,440,101,45,"paper",display]],
    ["Review every incomplete record and patient contact issue in the first sessions.",[586,539,422,187,32,"paper"]],
    ["MONTH 3",[1082,285,440,83,37,"aqua"]],
    ["Review the evidence",[1082,401,440,101,44,"paper",display]],
    ["Compare access, workload and quality measures before adding sessions.",[1085,539,422,187,32,"paper"]],
    ["Expansion depends on locally agreed clinical and operational sign-off.",[86,795,1410,65,28,"aqua"]]
  ],[back("navy"),plate("timeline",83,247,1436,4,"coral")]),
  page(["A funded pilot with a defined decision",[74,61,1450,143,76]],[
    ["£180k",[84,262,1410,179,125,"navy",display]],
    ["Illustrative 90-day service-development budget",[88,453,1390,72,32,"accent"]],
    ["£90k",[89,584,417,94,56,"navy",display]],["Staff capacity and training",[89,716,417,112,31]],
    ["£54k",[587,584,417,94,56,"navy",display]],["Equipment access and room setup",[587,716,417,112,31]],
    ["£36k",[1085,584,417,94,56,"navy",display]],["Coordination and evaluation",[1085,716,417,112,31]]
  ],[plate("budget1",84,539,720,12,"navy"),plate("budget2",804,539,432,12,"coral"),plate("budget3",1236,539,288,12,"aqua")]),
  page(["The next step stays visible",[75,73,1440,159,86,"paper"]],[
    ["A service proposal for clinical and operational review",[84,307,1290,160,55,"paper",display]],
    ["The pilot decision combines access measures, report-delivery records, patient feedback and staff workload.",[88,523,1000,180,36,"paper"]],
    ["Fictional service and synthetic data. The heart is a conceptual illustration. Clinical processes require local approval.",[88,741,1390,85,25,"aqua"]],
    ["Reference · Leeds Teaching Hospitals, Cardiac Ultrasound. Link in template sources.",[88,832,1390,50,20,"aqua"]]
  ],[back("navy"),...cross(1340,520,"aqua")])
];
const atlas: Page[] = [
  page(["SLIDE",[73,64,1436,221,159,"purple",{...display,z:3}]],[
    ["ATLAS",[70,569,465,229,143,"purple",{...display,z:8}]],
    ["Pathology operations\nFrom specimen to signed report",[91,313,420,156,34]],
    ["Illustrative laboratory transformation proposal",[91,832,1400,48,23,"accent"]]
  ],[back("lavender"),plate("rail-top",0,278,1600,2,"paper"),plate("rail-bottom",0,804,1600,2,"paper"),
     picture(534,191,972,648,5),plate("label-ground",62,302,444,198,"lavender",6),plate("title-ground",60,562,472,228,"lavender",6),
     plate("footer",0,817,1600,83,"lavender",6)],"atlas-slides"),
  page(["The specimen carries a chain of evidence",[75,61,1450,149,79]],[
    ["A complete report depends on a traceable route through the laboratory. Every transfer must preserve the link to the original request.",[82,254,1400,115,36]],
    ["Identity",[104,469,407,95,52,"purple",display]],
    ["The specimen, request and laboratory identifier remain connected.",[106,603,394,170,32]],
    ["Material",[607,469,407,95,52,"purple",display]],
    ["Blocks and slides retain their relationship to the parent case.",[609,603,394,170,32]],
    ["Decision",[1107,469,407,95,52,"purple",display]],
    ["The authorized report returns through the agreed clinical channel.",[1109,603,394,170,32]]
  ],[plate("base",80,420,1440,4,"line"),disc("i1",80,405,34,"pink"),disc("i2",583,405,34,"pink"),disc("i3",1083,405,34,"pink")]),
  page(["One case can create several tracked objects",[75,59,1450,147,73]],[
    ["CASE 024",[83,400,320,98,43,"purple",center]],
    ["Block A",[578,292,305,78,35,"purple",{align:"center"}]],
    ["Block B",[578,601,305,78,35,"purple",{align:"center"}]],
    ["A1 · A2 · A3",[1106,277,387,77,33,"purple",{align:"center"}]],
    ["B1 · B2 · B3",[1106,586,387,77,33,"purple",{align:"center"}]],
    ["Illustrative lineage of one case, two blocks and six slides. Local preparation determines the actual number of objects.",[84,790,1420,88,27,"accent"]]
  ],[plate("case",80,357,325,183,"lavender",2,{shadow:lift}),
     plate("stem",444,329,3,308,"line"),plate("case-link",405,447,41,3,"line"),
     plate("branch-a",444,329,116,3,"line"),plate("branch-b",444,637,116,3,"line"),
     plate("block-a",560,268,340,145,"pink",2,{shadow:lift}),plate("block-b",560,577,340,145,"pink",2,{shadow:lift}),
     arrow("to-a",966,315,"purple"),arrow("to-b",966,624,"purple"),
     ...[0,1,2].flatMap(i=>[plate("slide-a"+i,1086+i*136,365,112,140,"lavender",1,{shadow:lift}),plate("slide-b"+i,1086+i*136,644,112,130,"lavender",1,{shadow:lift}),plate("label-a"+i,1093+i*136,372,98,25,"paper",2),plate("label-b"+i,1093+i*136,651,98,25,"paper",2),disc("tissue-a"+i,1120+i*136,426,43,"pink",2),disc("tissue-b"+i,1120+i*136,702,43,"pink",2)])]),
  page(["Preparation makes the material readable",[76,63,1440,145,82,"paper"]],[
    ["The laboratory records the work performed on each case and links the resulting slides to the reporting record.",[87,695,1000,144,35,"paper"]],
    ["Conceptual laboratory illustration. The tissue artwork has no diagnostic meaning.",[1190,704,325,135,24,"lavender"]]
  ],[back("purple"),picture(0,233,1600,411)],"atlas-lab"),
  page(["The route from receipt to authorization",[75,60,1450,145,78]],[
    ["Receive",[84,300,431,91,48,"purple",display]],
    ["Reconcile the specimen and request. Record discrepancies through the local process.",[86,417,422,177,30]],
    ["Prepare",[584,300,431,91,48,"purple",display]],
    ["Create and track the required blocks and slides under the approved laboratory procedure.",[586,417,422,177,30]],
    ["Examine",[1084,300,431,91,48,"purple",display]],
    ["The reporting professional reviews the prepared material and requests further work when needed.",[1086,417,422,177,30]],
    ["Authorize and communicate",[86,704,706,99,47,"paper",display]],
    ["The report reaches the requesting team with its identity and status intact.",[868,711,621,129,31,"paper"]]
  ],[plate("top-rule",82,255,1438,3,"line"),arrow("stage1",519,330,"accent"),arrow("stage2",1019,330,"accent"),plate("authorization",65,668,1470,200,"purple")]),
  page(["The queue has several kinds of work",[75,61,1450,144,82]],[
    ["Synthetic snapshot of 200 open cases",[81,219,1410,65,29,"accent"]],
    ["Different work, different owners",[1010,339,501,148,46,"purple",display]],
    ["The coordinator reviews the stage of each case before assigning capacity. Cases awaiting information remain visible in the same review.",[1013,532,489,230,32]],
    ["Stage counts sum to 200 cases.",[1014,803,483,52,24,"accent"]]
  ],[plot(61,322,879,489)],undefined,{type:"bar",labels:["Preparation","Reporting","Further work","Information"],series:[{name:"Open cases",values:[70,84,30,16]}],colors:["#76538F"],showLegend:false}),
  page(["Turnaround has several components",[76,62,1440,144,80]],[
    ["Illustrative median stage intervals, working days",[82,221,1390,68,29,"accent"]],
    ["Receipt → preparation",[83,347,530,81,32]],
    ["Preparation → reporting",[83,478,530,81,32]],
    ["Reporting → authorization",[83,609,530,81,32]],
    ["2.0 days",[1348,347,176,81,31]],["3.0 days",[1348,478,176,81,31]],["1.0 day",[1348,609,176,81,31]],
    ["These stage medians describe separate distributions. The end-to-end median must be measured directly from case timestamps.",[84,773,1415,102,29,"accent"]]
  ],[plate("stage-a",657,347,400,57,"lavender",1,{shadow:lift}),
     plate("stage-b",657,478,600,57,"purple",1,{shadow:lift}),plate("stage-c",657,609,200,57,"pink",1,{shadow:lift})]),
  page(["Exceptions need a visible return path",[75,62,1450,144,79]],[
    ["Case reaches review",[107,309,605,98,48,"purple",display]],
    ["The reviewer checks the material and information required for the report.",[110,448,583,161,32]],
    ["Further work requested",[901,309,605,98,46,"purple",display]],
    ["The request records the responsible team and the next review point.",[904,448,582,161,32]],
    ["Returned to the reporting queue",[107,720,1373,92,48,"paper",center]]
  ],[plate("review-case",78,276,655,369,"lavender",2,{shadow:lift}),
     plate("extra-work",872,276,655,369,"pink",2,{shadow:lift}),arrow("extra-arrow",778,429,"purple"),
     plate("return",732,645,3,53,"line"),plate("return-rule",733,672,468,3,"line"),
     plate("return-stem",1198,645,3,30,"line"),plate("report-queue",78,698,1449,155,"purple")]),
  page(["Workload changes with the case mix",[75,60,1450,145,81]],[
    ["Synthetic weekly case counts by local workload group",[82,218,1400,65,28,"accent"]],
    ["Counts support planning",[1063,340,451,113,44,"purple",display]],
    ["A count of cases alone cannot describe reporting effort. Review the local workload mix alongside staff availability and open exceptions.",[1066,498,437,238,31]],
    ["Groups A and B are fictional planning categories.",[1066,788,436,65,23,"accent"]]
  ],[plot(63,321,925,491)],undefined,{type:"line",labels:["W1","W2","W3","W4","W5"],series:[{name:"Group A",values:[80,85,78,92,88]},{name:"Group B",values:[30,32,40,38,45]}],colors:["#382953","#BA6A90"],showLegend:true}),
  page(["Quality measures keep the handovers visible",[75,60,1450,146,74]],[
    ["Receipt checks",[100,294,619,98,49,"purple",display]],
    ["198 / 200",[100,423,619,117,76,"accent",display]],
    ["Cases with a complete receipt record in the synthetic audit.",[103,581,600,137,32]],
    ["Report routing",[895,294,619,98,49,"purple",display]],
    ["196 / 200",[895,423,619,117,76,"accent",display]],
    ["Authorized reports with a recorded destination in the synthetic audit.",[898,581,600,137,32]],
    ["The pilot also records corrections and repeat work so throughput gains can be reviewed with quality.",[102,787,1392,86,28,"accent"]]
  ],[plate("audit-left",77,261,662,485,"lavender"),plate("audit-right",872,261,662,485,"pink")]),
  page(["The case record connects five roles",[75,62,1450,144,80]],[
    ["CASE RECORD",[560,409,480,97,44,"paper",center]],
    ["Reception",[94,289,404,78,38,"purple",display]],["Identity and receipt",[95,388,403,78,29]],
    ["Preparation team",[1089,289,422,78,37,"purple",display]],["Material and slide lineage",[1090,388,419,78,29]],
    ["Reporter",[95,613,403,78,38,"purple",display]],["Review and further work",[96,710,402,78,29]],
    ["Coordinator",[1089,613,422,78,38,"purple",display]],["Queue and outstanding actions",[1090,710,419,78,29]],
    ["Requesting team",[558,720,482,78,36,"purple",center]],
    ["Receives the authorized report",[558,809,482,60,25,"purple",{align:"center"}]]
  ],[plate("record",535,358,530,217,"purple",2,{shadow:lift}),plate("left-join",470,467,65,3,"line"),
     plate("right-join",1065,467,65,3,"line"),plate("left-vertical",470,362,3,328,"line"),
     plate("right-vertical",1127,362,3,328,"line"),plate("down-join",799,575,3,126,"line")]),
  page(["A staged rollout protects traceability",[75,61,1450,145,79]],[
    ["Weeks 1–2",[84,304,405,85,37,"accent"]],
    ["Map the identifiers",[518,298,988,86,43,"purple",display]],
    ["Test the relationship between case, block, slide and report in sample records.",[520,402,983,89,31]],
    ["Weeks 3–6",[84,526,405,85,37,"accent"]],
    ["Run one laboratory section",[518,520,988,86,43,"purple",display]],
    ["Review every exception and correction with the staff who handle the handover.",[520,624,983,89,31]],
    ["Weeks 7–12",[84,748,405,85,37,"accent"]],
    ["Decide on expansion",[518,742,988,86,43,"purple",display]]
  ],[...[262,484,706].map((y,i)=>plate("phase"+i,80,y,1440,3,"line"))]),
  page(["The pilot has a £240k planning envelope",[75,61,1450,145,76]],[
    ["£96k",[95,321,412,116,71,"paper",display]],["Laboratory capacity",[98,478,401,84,34,"paper"]],
    ["Backfill and supervised training during the pilot.",[100,604,393,157,30,"paper"]],
    ["£84k",[593,321,412,116,71,"purple",display]],["Tracking and integration",[596,478,401,103,32]],
    ["Identifier mapping and the interfaces needed for the case record.",[598,620,393,153,30]],
    ["£60k",[1090,321,412,116,71,"purple",display]],["Evaluation and support",[1093,478,401,103,32]],
    ["Audit time, issue resolution and rollout coordination.",[1095,620,393,153,30]],
    ["Illustrative budget for service planning; actual procurement and staffing costs require local estimates.",[85,835,1420,44,23,"accent"]]
  ],[plate("cost1",76,280,454,521,"purple",1,{shadow:lift}),plate("cost2",574,280,454,521,"lavender",1,{shadow:lift}),plate("cost3",1071,280,454,521,"pink",1,{shadow:lift})]),
  page(["A clear record behind every report",[75,74,1440,159,89,"paper"]],[
    ["The pilot decision rests on traceability, workload and the quality of each handover.",[87,308,1370,173,58,"paper",display]],
    ["The proposed review joins open-case counts, stage intervals, correction records and staff feedback before another laboratory section joins.",[90,536,1320,163,35,"paper"]],
    ["Fictional laboratory and synthetic data. All laboratory images are conceptual AI artwork, with no diagnostic interpretation.",[91,740,1370,95,26,"lavender"]],
    ["Reference · NHS Scientist Training Programme, Histopathology sample journey. Link in template sources.",[91,839,1370,44,20,"lavender"]]
  ],[back("purple"),plate("glass-line1",85,260,1420,3,"pink"),plate("glass-line2",85,279,1420,1,"lavender")])
];
async function build(id: string, name: string, brand: El, pages: Page[], description: string) {
  const slides = pages.map(({ art, elements, ...data }, i) => ({
    ...data, photoQuery: art, role: i === 0 ? "cover" : i === pages.length - 1 ? "closing" : "feature"
  }));
  await renderTemplate({
    id, name, family: id, brand, description, premium: true, motion: false, slides,
    kits: () => pages.map((p, i) => writeKit(slides[i].role, id + "-" + (i + 1), id, p.elements))
  }, false, async key => ({ path: path.join(ROOT, "assets", "medical-depth", key + ".png"), pexelsId: "local:" + key }));
  fs.copyFileSync(path.join(ROOT, "assets", "medical-depth", "SOURCES.md"), path.join(ROOT, "out", id, "SOURCES.md"));
}
(async () => {
  await build("pulse-chamber", "Pulse Chamber", pulseBrand, pulse, "Cardiac diagnostics service proposal with sculptural depth, patient cohorts and editable operational infographics.");
  await build("slide-atlas", "Slide Atlas", atlasBrand, atlas, "Pathology operations proposal with floating glass, specimen lineage and editable laboratory infographics.");
})().catch(error => { console.error(error); process.exitCode = 1; });




