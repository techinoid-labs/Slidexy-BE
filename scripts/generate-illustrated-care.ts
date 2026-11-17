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


const gardenBrand = {
  fonts: { display: "Trebuchet MS", body: "Calibri" },
  colors: { bg: "#F5F3E8", ink: "#203E34", green: "#203E34", lime: "#DDEB94", lilac: "#DCD2EC", paper: "#F5F3E8", accent: "#735E8D", line: "#9DAC91" }
};
const doseBrand = {
  fonts: { display: "Rockwell", body: "Calibri" },
  colors: { bg: "#FFF2DC", ink: "#173F9D", blue: "#173F9D", orange: "#B84C2D", apricot: "#F4C59F", paper: "#FFF2DC", pale: "#DEE7FC", accent: "#9B3C24", line: "#9BAED9" }
};
const softShadow = { blur: 14, offsetY: 7, opacity: 0.12, color: "#263329" };
const dotted = (id: string, x: number, y: number, count: number, gap: number, tone: string, vertical = false) =>
  Array.from({ length: count }, (_, i) => disc(id + i, x + (vertical ? 0 : i * gap), y + (vertical ? i * gap : 0), 5, tone, 1));
const node = (id: string, x: number, y: number, size: number, tone: string) =>
  circle(id, x, y, size, tone, { z: 2, keepFill: true, shadow: softShadow });
const garden: Page[] = [
  page(["MOTION",[77,63,1440,181,125,"paper",display]],[
    ["GARDEN",[75,239,1440,177,122,"paper",display]],
    ["Rehabilitation built around\neveryday goals",[84,502,574,145,39,"paper"]],
    ["Illustrative service presentation",[88,793,600,61,24,"lime"]]
  ],[back("green"),disc("petal-a",809,45,690,"lilac"),disc("petal-b",922,289,640,"lime",2),
     picture(595,173,975,731,5)] ,"motion-hero"),
  page(["Everyday goals shape the conversation",[76,62,1440,142,72]],[
    ["A person arrives with a life to return to. The service records what matters to them, then connects that goal to the plan agreed with their clinician.",[83,246,666,226,35]],
    ["The first conversation",[84,551,652,90,43,"accent",display]],
    ["What would you like to do more easily? What support do you already have? What would make appointments easier to attend?",[86,680,651,169,33]]
  ],[disc("conversation",863,239,626,"lilac"),picture(747,276,801,601,5)],"motion-room"),
  page(["A plan has four connected parts",[75,64,1440,141,74]],[
    ["PERSONAL GOAL",[574,409,452,110,43,"paper",center]],
    ["Daily activity",[90,282,386,89,38,"green",center]],
    ["Describe the task that matters to the person.",[103,382,360,117,29,"green",{align:"center"}]],
    ["Clinical plan",[1122,282,386,89,38,"green",center]],
    ["Record the plan agreed with the treating professional.",[1136,382,359,117,29,"green",{align:"center"}]],
    ["Practical support",[89,624,390,90,35,"green",center]],
    ["Agree access, appointment and communication needs.",[106,724,354,116,29,"green",{align:"center"}]],
    ["Review point",[1120,624,390,90,37,"green",center]],
    ["Set a date to discuss progress and revise the plan.",[1136,724,358,116,29,"green",{align:"center"}]]
  ],[...dotted("link-a",420,455,40,19,"line"),...dotted("link-b",420,740,40,19,"line"),
     node("goal",534,279,532,"green"),node("daily",72,247,418,"lime"),
     node("clinical",1104,247,418,"lilac"),plate("support",73,614,419,250,"lilac",2),
     plate("review",1104,614,419,250,"lime",2)]),
  page(["The first visit creates a shared record",[75,61,1440,142,74]],[
    ["Listen",[865,262,621,85,43,"accent",display]],
    ["Capture the person’s priorities in their own words. Record any support needed for the appointment.",[868,364,616,134,31]],
    ["Agree",[865,532,621,85,43,"accent",display]],
    ["The clinician and patient agree the next step and how it will be reviewed.",[868,634,616,131,31]],
    ["The illustration shows a service conversation, with no exercise instructions.",[870,803,615,61,23,"accent"]]
  ],[picture(34,221,803,602,5),...dotted("spine",821,272,28,20,"line",true)],"motion-hero"),
  page(["The pathway has a place for review",[75,61,1440,142,74]],[
    ["First contact",[81,300,402,90,40,"green",display]],
    ["Understand the referral and arrange the first conversation.",[83,421,399,150,32]],
    ["Shared plan",[584,493,402,90,40,"green",display]],
    ["Record the agreed goal, appointments and review point.",[586,614,399,150,32]],
    ["Review together",[1082,300,436,90,40,"green",display]],
    ["Discuss what has changed and record the next agreed action.",[1084,421,421,150,32]],
    ["The timing and clinical content follow the local service pathway.",[83,806,1420,57,27,"accent"]]
  ],[...dotted("path-left",100,252,72,20,"line"),...dotted("path-down",800,256,10,20,"line",true),
     node("start",80,234,41,"green"),node("middle",783,443,41,"accent"),node("finish",1480,234,41,"green")]),
  page(["One cohort, three appointment needs",[75,61,1440,143,74]],[
    ["Synthetic snapshot of 60 people",[82,222,1400,64,29,"accent"]],
    ["36",[98,347,397,128,83,"green",center]],
    ["In-person visits",[98,492,397,91,37,"green",center]],
    ["Appointment at the clinic with access requirements recorded.",[109,611,375,156,30,"green",{align:"center"}]],
    ["18",[600,347,397,128,83,"green",center]],
    ["Remote reviews",[600,492,397,91,37,"green",center]],
    ["Planned conversations using the service’s agreed remote channel.",[611,611,375,156,30,"green",{align:"center"}]],
    ["6",[1102,347,397,128,83,"green",center]],
    ["Home visits",[1102,492,397,91,37,"green",center]],
    ["Locally agreed visits with travel time included in the schedule.",[1113,611,375,156,30,"green",{align:"center"}]]
  ],[node("cohort-a",76,316,442,"lime"),node("cohort-b",578,316,442,"lilac"),node("cohort-c",1080,316,442,"lime")]),
  page(["The service plans around real journeys",[75,61,1440,143,73]],[
    ["Before the visit",[85,609,435,87,39,"accent",display]],
    ["Agree the location, transport and communication needs.",[86,722,425,116,31]],
    ["During the visit",[584,609,435,87,39,"accent",display]],
    ["Make room for questions and check the shared record.",[585,722,425,116,31]],
    ["After the visit",[1083,609,435,87,39,"accent",display]],
    ["Provide the agreed next step and a contact for queries.",[1084,722,425,116,31]]
  ],[picture(408,193,785,589,3),plate("caption-base",0,589,1600,311,"paper",6),
     ...dotted("visit-line",84,575,72,20,"line")],"motion-walk"),
  page(["Progress needs a consistent question",[75,61,1440,143,72]],[
    ["Synthetic responses to “I understand my next step”",[81,218,1400,65,29,"accent"]],
    ["A communication measure",[1043,350,465,115,41,"green",display]],
    ["Each survey asks the same question after the review. Compare response counts as well as the share of positive answers.",[1046,508,455,226,31]],
    ["40 responses per round. This example measures understanding of the plan.",[1046,785,452,77,24,"accent"]]
  ],[plot(67,321,905,472)],undefined,{type:"bar",labels:["Round 1","Round 2","Round 3"],series:[{name:"Positive responses / 40",values:[28,32,35]}],colors:["#735E8D"],showLegend:false}),
  page(["The person stays at the centre",[75,61,1440,144,77]],[
    ["PERSON",[591,407,418,90,48,"paper",center]],
    ["Treating clinician",[80,296,407,86,37,"green",display]],
    ["Agrees and reviews the clinical plan.",[82,405,401,111,30]],
    ["Coordinator",[1120,296,407,86,37,"green",display]],
    ["Arranges appointments and tracks open queries.",[1122,405,397,111,30]],
    ["Chosen supporter",[80,639,407,86,37,"green",display]],
    ["Joins discussions when the person wishes.",[82,748,401,111,30]],
    ["Receiving team",[1120,639,407,86,37,"green",display]],
    ["Receives the agreed handover at transition.",[1122,748,397,111,30]]
  ],[...dotted("hub-a",452,459,36,20,"line"),node("person",543,291,514,"green"),
     ...dotted("hub-b",452,747,36,20,"line")]),
  page(["A complete handover answers four questions",[75,61,1440,144,70]],[
    ["What matters?",[92,283,633,96,43,"accent",display]],
    ["The personal goal is clear enough for the next team to discuss.",[94,411,620,139,32]],
    ["What was agreed?",[891,283,633,96,43,"accent",display]],
    ["The current plan and its review date are recorded.",[893,411,620,139,32]],
    ["Who owns the next step?",[92,609,633,96,39,"accent",display]],
    ["A named service or professional accepts the handover.",[94,737,620,119,32]],
    ["How can the person ask?",[891,609,633,96,39,"accent",display]],
    ["The person has the contact details for queries about the plan.",[893,737,620,119,32]]
  ],[...dotted("q-middle",800,262,30,20,"line",true),...dotted("q-across",83,581,72,20,"line")]),
  page(["The pilot builds capacity in stages",[75,61,1440,144,76]],[
    ["Month 1",[84,293,412,94,42,"green",display]],
    ["Map the current service and rehearse the shared record with staff.",[86,426,410,180,33]],
    ["Month 2",[586,391,412,94,42,"green",display]],
    ["Open a small cohort and review every unresolved handover.",[588,524,410,180,33]],
    ["Month 3",[1086,489,412,94,42,"green",display]],
    ["Review access, communication and workload before adding capacity.",[1088,622,410,180,33]]
  ],[plate("step1",75,248,439,15,"lime"),plate("step2",577,346,439,15,"lilac"),plate("step3",1077,444,439,15,"lime")]),
  page(["The weekly review keeps work visible",[75,61,1440,144,73]],[
    ["Open referrals",[89,292,400,90,39,"accent",display]],
    ["24",[89,406,400,124,83,"green",display]],
    ["People awaiting the first agreed appointment.",[90,568,399,139,31]],
    ["Active plans",[589,292,400,90,39,"accent",display]],
    ["60",[589,406,400,124,83,"green",display]],
    ["People with a current plan and a scheduled review.",[590,568,399,139,31]],
    ["Handovers due",[1089,292,400,90,39,"accent",display]],
    ["12",[1089,406,400,124,83,"green",display]],
    ["Transitions requiring confirmation from the receiving team.",[1090,568,399,139,31]],
    ["Synthetic operational snapshot. These categories may overlap and should be reviewed separately.",[87,805,1420,58,25,"accent"]]
  ],[back("lime")]),
  page(["A pilot with a clear decision point",[75,61,1440,144,75]],[
    ["£150k",[84,278,695,168,116,"green",display]],
    ["Illustrative three-month budget",[88,471,680,78,32,"accent"]],
    ["£75k staff capacity\n£45k access and coordination\n£30k evaluation and training",[91,602,680,218,34]],
    ["The decision",[941,330,563,103,47,"accent",display]],
    ["Expand only after the team reviews patient communication, completed handovers and the workload required to sustain the service.",[944,480,554,266,34]]
  ],[...dotted("budget-divider",844,278,29,20,"line",true)]),
  page(["Every plan belongs to a person",[75,69,1440,153,83,"paper"]],[
    ["A rehabilitation service proposal",[86,321,651,154,49,"paper",display]],
    ["The pilot connects everyday goals with a shared record, an agreed review point and an accountable handover.",[89,514,635,211,35,"paper"]],
    ["Fictional service and synthetic data. Illustrations show service conversations. Clinical plans follow local practice.",[90,786,1370,85,25,"lime"]]
  ],[back("green"),disc("closing-petal",915,270,587,"lilac"),picture(779,259,762,571,5),
     plate("closing-note",0,778,1600,122,"green",6)],"motion-room")
];
const dose: Page[] = [
  page(["DOSE",[79,55,1440,180,123,"paper",display]],[
    ["DIALOGUE",[81,229,1434,175,111,"paper",display]],
    ["A clearer pharmacy\nconversation",[89,514,524,148,39,"paper"]],
    ["Illustrative community pharmacy proposal",[91,796,813,64,24,"paper"]]
  ],[back("blue"),plate("counter-band",637,0,963,900,"apricot"),disc("speech",718,53,728,"paper"),
     picture(557,218,1043,782,5),plate("left-ground",0,480,555,420,"blue",6)],"dose-hero"),
  page(["Questions make the consultation useful",[75,62,1440,144,76]],[
    ["A pharmacy conversation starts with the person’s questions and a clear record of what they currently use.",[85,249,684,192,37]],
    ["The proposed service",[86,526,678,99,45,"accent",display]],
    ["Arrange a consultation, record the agreed actions and make the follow-up contact visible to the person and the team.",[88,665,672,186,34]]
  ],[disc("talk-circle",864,269,628,"pale"),picture(756,276,802,602,5)],"dose-hero"),
  page(["A useful record has four parts",[75,61,1440,144,80]],[
    ["Current list",[90,273,435,91,41,"blue",display]],
    ["Record what the person reports using, including non-prescription products.",[92,393,421,158,31]],
    ["Questions",[1084,273,435,91,41,"blue",display]],
    ["Capture concerns in the person’s own words before the discussion.",[1086,393,421,158,31]],
    ["Agreed actions",[90,629,435,91,41,"blue",display]],
    ["Document the advice or referral agreed with the pharmacist.",[92,749,421,113,31]],
    ["Follow-up",[1084,629,435,91,41,"blue",display]],
    ["Record who will make contact and when the next review is due.",[1086,749,421,113,31]],
    ["CONSULTATION",[575,405,450,83,34,"paper",center]]
  ],[node("record-center",536,276,530,"blue"),
     ...dotted("record-left",452,571,35,20,"line"),plate("record-ribbon",535,397,531,113,"blue",3)]),
  page(["Objects can prompt the right questions",[75,61,1440,144,75]],[
    ["Packaging",[89,601,413,89,39,"accent",display]],
    ["Helps the conversation identify the product being discussed.",[91,716,407,128,31]],
    ["A written list",[590,601,413,89,39,"accent",display]],
    ["Provides a starting point to check with the pharmacist.",[592,716,407,128,31]],
    ["Notes",[1089,601,413,89,39,"accent",display]],
    ["Keep the person’s questions and agreed next steps together.",[1091,716,407,128,31]]
  ],[picture(336,188,939,704,4),plate("objects-caption",0,578,1600,322,"paper",6),
     ...dotted("objects-line",82,564,72,20,"orange")],"dose-items"),
  page(["Five stages keep the discussion focused",[75,61,1440,144,73]],[
    ["Connect",[89,299,270,85,36,"blue",center]],
    ["Agree the purpose and what the person wants to discuss.",[92,415,264,192,30,"blue",{align:"center"}]],
    ["Review",[381,299,270,85,36,"blue",center]],
    ["Check the information available and clarify any gaps.",[384,415,264,192,30,"blue",{align:"center"}]],
    ["Discuss",[673,299,270,85,36,"blue",center]],
    ["The pharmacist responds to the person’s questions.",[676,415,264,192,30,"blue",{align:"center"}]],
    ["Agree",[965,299,270,85,36,"blue",center]],
    ["Record the next action and the responsible person.",[968,415,264,192,30,"blue",{align:"center"}]],
    ["Follow up",[1257,299,270,85,34,"blue",center]],
    ["Confirm how the next contact will happen.",[1260,415,264,192,30,"blue",{align:"center"}]],
    ["Clinical advice and referrals follow the pharmacy’s approved practice.",[88,784,1415,69,28,"accent"]]
  ],[...dotted("consult-line",83,257,72,20,"orange"),
     ...[0,1,2,3,4].map(i=>node("stage"+i,197+i*292,237,43,i%2?"orange":"blue"))]),
  page(["The action can take different routes",[75,61,1440,144,76]],[
    ["Question discussed",[84,387,427,114,43,"paper",center]],
    ["Information clarified",[816,271,681,90,42,"blue",display]],
    ["The pharmacist records the answer and checks understanding.",[820,380,674,102,31]],
    ["Another team involved",[816,580,681,90,42,"blue",display]],
    ["The record identifies the receiving service and how the handover will be confirmed.",[820,689,674,148,31]]
  ],[plate("question",69,344,466,220,"blue",2,{shadow:softShadow}),
     ...dotted("branch",604,315,22,20,"line",true),...dotted("link",536,455,4,20,"line"),
     ...dotted("upper",604,315,10,20,"line"),...dotted("lower",604,635,10,20,"line")]),
  page(["A follow-up is a planned conversation",[75,61,1440,144,77]],[
    ["The person knows who will contact them and the purpose of the call.",[84,248,673,143,37]],
    ["A shared note",[85,501,660,91,44,"accent",display]],
    ["The team reviews the previous actions, records the discussion and agrees any further contact with the person.",[87,625,651,189,34]]
  ],[disc("home-window",880,238,603,"apricot"),picture(762,227,811,608,5)],"dose-followup"),
  page(["The pilot follows 80 consultations",[75,61,1440,144,80]],[
    ["52",[103,329,416,130,88,"paper",center]],
    ["Completed",[103,492,416,90,38,"paper",center]],
    ["Consultation and agreed actions recorded.",[116,611,390,136,31,"paper",{align:"center"}]],
    ["20",[594,329,416,130,88,"blue",center]],
    ["Booked",[594,492,416,90,38,"blue",center]],
    ["Appointment agreed and awaiting the conversation.",[607,611,390,136,31,"blue",{align:"center"}]],
    ["8",[1085,329,416,130,88,"blue",center]],
    ["Awaiting contact",[1085,492,416,90,35,"blue",center]],
    ["A named team member owns the next attempt.",[1098,611,390,136,31,"blue",{align:"center"}]],
    ["Synthetic status snapshot. Categories sum to 80.",[88,824,1400,47,25,"accent"]]
  ],[node("complete",83,291,456,"blue"),node("booked",574,291,456,"pale"),node("contact",1065,291,456,"apricot")]),
  page(["Understanding is worth measuring",[75,61,1440,144,79]],[
    ["Synthetic survey results after consultation",[82,218,1400,64,29,"accent"]],
    ["“I know my next step”",[1042,346,470,112,42,"blue",display]],
    ["Repeat the same question across review rounds. Record how many people replied so the team can interpret the result.",[1045,503,457,227,32]],
    ["30 respondents in each sample round.",[1045,785,456,67,24,"accent"]]
  ],[plot(64,321,909,483)],undefined,{type:"bar",labels:["Round 1","Round 2","Round 3"],series:[{name:"Positive responses / 30",values:[21,24,27]}],colors:["#B84C2D"],showLegend:false}),
  page(["The record travels with the action",[75,61,1440,144,80]],[
    ["Person’s question",[94,290,626,89,43,"paper",display]],
    ["The record captures the concern as the person describes it.",[97,410,616,130,32,"paper"]],
    ["Pharmacist’s action",[889,290,626,89,43,"blue",display]],
    ["The pharmacist records the discussion and the agreed next step.",[892,410,616,130,32]],
    ["Follow-up owner",[94,649,626,89,43,"blue",display]],
    ["A named role tracks the action until it is resolved or handed over.",[97,769,616,110,31]],
    ["Receiving service",[889,649,626,89,43,"blue",display]],
    ["The team records whether the handover has reached its destination.",[892,769,616,110,31]]
  ],[plate("record-a",70,259,681,305,"blue"),plate("record-b",866,259,681,305,"pale"),
     ...dotted("record-rule",81,604,72,20,"orange")]),
  page(["A small team needs clear ownership",[75,61,1440,144,76]],[
    ["Pharmacist",[95,290,610,91,44,"accent",display]],
    ["Owns the consultation, clinical advice and referral decisions within the service.",[98,413,603,173,34]],
    ["Coordinator",[892,290,610,91,44,"accent",display]],
    ["Owns booking, contact attempts and the list of unresolved follow-up actions.",[895,413,603,173,34]],
    ["Weekly review",[95,688,478,91,43,"blue",display]],
    ["The team checks outstanding actions, appointment capacity and incomplete records.",[642,686,862,151,33]]
  ],[...dotted("owner-rule",804,276,20,20,"line",true),plate("owner-bottom",81,643,1435,4,"line")]),
  page(["The pilot learns before it grows",[75,61,1440,144,81]],[
    ["Prepare",[89,300,413,89,45,"paper",display]],
    ["Agree documentation and rehearse the handover with sample records.",[92,428,400,185,33,"paper"]],
    ["Deliver",[589,300,413,89,45,"blue",display]],
    ["Open the initial appointment slots and review unresolved actions weekly.",[592,428,400,185,33]],
    ["Evaluate",[1089,300,413,89,45,"blue",display]],
    ["Compare completed contacts, patient understanding and staff workload.",[1092,428,400,185,33]],
    ["The expansion decision uses the pilot record and locally agreed service requirements.",[89,785,1410,78,28,"accent"]]
  ],[plate("pilot-a",72,270,445,417,"blue"),plate("pilot-b",572,270,445,417,"apricot"),plate("pilot-c",1072,270,445,417,"pale")]),
  page(["A £120k pilot funds the whole pathway",[75,61,1440,144,75]],[
    ["£60k",[87,295,431,113,75,"blue",display]],
    ["Consultation capacity",[90,437,416,103,35]],
    ["Pharmacist time and supervised service training.",[92,578,406,164,32]],
    ["£36k",[586,295,431,113,75,"blue",display]],
    ["Coordination",[589,437,416,103,35]],
    ["Booking, contact attempts and follow-up administration.",[591,578,406,164,32]],
    ["£24k",[1085,295,431,113,75,"blue",display]],
    ["Evaluation",[1088,437,416,103,35]],
    ["Record review, patient feedback and rollout planning.",[1090,578,406,164,32]],
    ["Illustrative three-month budget. Allocations sum to £120k.",[88,822,1400,48,25,"accent"]]
  ],[plate("allocation1",85,245,720,14,"blue"),plate("allocation2",805,245,432,14,"orange"),plate("allocation3",1237,245,288,14,"pale")]),
  page(["A clear conversation.\nAn agreed next step.",[75,62,1440,239,81,"paper"]],[
    ["Community pharmacy service proposal",[87,394,680,137,45,"paper",display]],
    ["The pilot makes questions, actions and follow-up visible to the person and the pharmacy team.",[90,566,660,185,35,"paper"]],
    ["Fictional service and synthetic data. This template provides no dosing or treatment instructions.",[91,800,1370,68,25,"paper"]]
  ],[back("blue"),disc("final-bubble",930,239,568,"apricot"),picture(809,254,742,557,5),
     plate("final-note",0,785,1600,115,"blue",6)],"dose-followup")
];
async function build(id: string, name: string, brand: El, pages: Page[], description: string) {
  const slides = pages.map(({ art, elements, ...data }, i) => ({
    ...data, photoQuery: art, role: i === 0 ? "cover" : i === pages.length - 1 ? "closing" : "feature"
  }));
  await renderTemplate({
    id, name, family: id, brand, description, premium: true, motion: false, slides,
    kits: () => pages.map((p, i) => writeKit(slides[i].role, id + "-" + (i + 1), id, p.elements))
  }, false, async key => ({ path: path.join(ROOT, "assets", "illustrated-care", key + ".png"), pexelsId: "local:" + key }));
  fs.copyFileSync(path.join(ROOT, "assets", "illustrated-care", "DESIGN-NOTES.md"), path.join(ROOT, "out", id, "DESIGN-NOTES.md"));
}
(async () => {
  await build("motion-garden", "Motion Garden", gardenBrand, garden, "Illustrated rehabilitation service deck with goal maps, patient support diagrams and editable process graphics.");
  await build("dose-dialogue", "Dose Dialogue", doseBrand, dose, "Illustrated pharmacy consultation deck with object prompts, action routes and editable service infographics.");
})().catch(error => { console.error(error); process.exitCode = 1; });
