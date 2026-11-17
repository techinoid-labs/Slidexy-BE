import * as path from "path";
import { El, ROOT, circle, photo, rect, renderTemplate, text, writeKit } from "./lib/designKit";

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
    const [x, y, w, h, size, color, style] = frame;
    const slot = i ? "copy" + (i - 1) : "title";
    return text(slot, x, y, w, h, size, slot, color || "ink", { z: 8, ...(i ? {} : display), ...style });
  });
  return { title: head[0], items: lines.map(([s]) => s), elements: [...layers, ...elements], art, chart };
}
const bellBrand = {
  fonts: { display: "Garamond", body: "Calibri" },
  colors: { bg: "#F1E8D9", ink: "#342431", plum: "#342431", dark: "#211720", copper: "#DAAC7D", paper: "#F1E8D9", muted: "#76594B", accent: "#7F4935" }
};
const cacaoBrand = {
  fonts: { display: "Bookman Old Style", body: "Trebuchet MS" },
  colors: { bg: "#F9F1DE", ink: "#531F31", berry: "#531F31", red: "#AB284A", mint: "#D6E8BD", paper: "#F9F1DE", pink: "#EFC0CA", accent: "#9B2343" }
};
const bell: Page[] = [
  page(["BELL",[80,155,1010,247,185,"paper",{...display,z:3}]],[
    ["WETHER",[79,588,1440,242,176,"paper",display]],
    ["A listening record for historic towers",[85,454,470,114,33,"copper"]],
    ["HERITAGE MONITORING / SEED PITCH",[84,58,1070,60,23,"copper",{letterSpacing:3}]]
  ],[back("plum"),disc("arch",850,20,615,"dark"),plate("recess",850,320,615,580,"dark"),picture(744,0,720,800,5)],"bell-cover"),
  page(["A familiar sound.\nAn unfamiliar change.",[74,87,1460,255,92]],[
    ["A keeper hears the bell every week. A subtle change in vibration can disappear into memory between inspections.",[76,442,650,237,37]],
    ["Bellwether keeps comparable recordings from the same installation, so a conservator can review a change with the original conditions attached.",[876,442,632,249,34]],
    ["The record supports an inspection decision. A specialist remains responsible for the condition assessment.",[76,765,1425,85,27,"accent"]]
  ],[plate("rule",784,441,2,277,"copper")]),
  page(["The tower is the context",[80,61,1430,138,82,"paper"]],[
    ["Every recording belongs to a bell, a mounting position and a ringing session.",[84,646,660,170,36,"paper"]],
    ["The first visit records the installation, agrees access with the keeper and establishes a repeatable listening position.",[895,651,613,164,29,"paper"]]
  ],[picture(0,0,1600,900),plate("caption",0,603,1600,297,"plum",4),plate("header",0,0,1600,210,"plum",4)],"bell-tower"),
  page(["Install once.\nCompare over time.",[849,70,665,285,68]],[
    ["A removable sensor records vibration at an agreed mounting point. Each session carries its date, ringing pattern and installation notes.",[854,398,646,228,32]],
    ["If a trace changes, the reviewer checks the recording conditions before requesting an on-site inspection.",[855,673,641,151,30,"accent"]]
  ],[picture(0,0,785,900)],"bell-sensor"),
  page(["From strike to review",[76,68,1430,143,85,"paper"]],[
    ["Listen",[80,280,410,98,53,"copper",display]],
    ["Capture a scheduled ringing session. Log sensor position and any maintenance since the last record.",[82,422,402,242,31,"paper"]],
    ["Compare",[594,341,409,101,53,"copper",display]],
    ["Match like-for-like sessions. Flag a repeatable shift and retain the original trace for review.",[596,485,399,238,31,"paper"]],
    ["Decide",[1111,402,406,98,53,"copper",display]],
    ["A specialist reviews the evidence, speaks to the keeper and records the next action.",[1113,545,394,234,31,"paper"]]
  ],[back("plum"),plate("step1",80,238,408,3,"copper"),plate("step2",594,299,408,3,"copper"),plate("step3",1111,360,408,3,"copper")]),
  page(["Read the decay",[76,61,1430,142,88]],[
    ["Illustrative normalized vibration after a strike",[79,213,1380,65,28,"accent"]],
    ["Two comparable sessions",[1080,339,427,122,45,"accent",display]],
    ["The faster decay is a review prompt. Mounting, temperature and ringing conditions must be checked before attributing it to the bell.",[1082,505,423,269,31]]
  ],[plot(65,316,935,485)],undefined,{type:"line",labels:["0.0 s","0.4 s","0.8 s","1.2 s","1.6 s"],series:[{name:"Baseline",values:[100,74,52,36,25]},{name:"Review session",values:[100,61,33,18,9]}],colors:["#342431","#AC6543"],showLegend:true}),
  page(["A tower subscription",[76,67,1440,145,87]],[
    ["£240",[76,259,774,208,147,"accent",display]],
    ["per tower / month",[82,479,742,78,39]],
    ["Includes scheduled recording, a retained session archive and one monthly specialist review. Installation is quoted after the access survey.",[82,609,731,213,32]],
    ["£144 direct cost",[952,299,555,99,45,"accent",display]],
    ["£75 review time\n£39 equipment and support\n£30 storage and site liaison",[954,450,549,191,31]],
    ["£96 contribution per tower-month before central overhead.",[954,705,548,125,30]]
  ],[plate("vertical",879,278,2,548,"copper")]),
  page(["Begin with the keeper",[76,64,1430,145,86,"paper"]],[
    ["A regional cluster",[80,282,720,116,58,"copper",display]],
    ["Recruit through conservation practices already serving several nearby towers. Each practice nominates a reviewer and an access contact.",[83,456,704,247,35,"paper"]],
    ["40 towers",[950,298,555,147,83,"paper",display]],
    ["At the proposed subscription, forty installations would generate £115,200 in annual recurring revenue.",[952,502,550,225,33,"paper"]]
  ],[back("plum")]),
  page(["A record that survives a handover",[74,63,1450,147,78]],[
    ["Keeper changes",[80,292,442,102,43,"accent",display]],
    ["The next volunteer inherits recordings, installation photographs and an open-actions list.",[81,447,429,245,32]],
    ["Contractor changes",[580,292,446,102,43,"accent",display]],
    ["A new specialist can compare the original sessions and see why a previous decision was made.",[581,447,429,245,32]],
    ["Equipment moves",[1080,292,439,102,43,"accent",display]],
    ["The installation gets a new baseline. The old series stays available with its position history.",[1081,447,429,245,32]]
  ],[plate("rule",80,751,1440,3,"copper")]),
  page(["People who can interpret the signal",[75,64,1450,148,75]],[
    ["Mira Hale",[81,283,644,107,62,"accent",display]],
    ["Conservation lead",[83,413,644,72,31]],
    ["Owns reviewer training, access protocols and the decision record. Each escalation has a named specialist.",[84,535,641,227,33]],
    ["Owen Reed",[880,379,632,108,62,"accent",display]],
    ["Instrumentation lead",[883,509,627,72,31]],
    ["Owns mounting repeatability, trace quality and the equipment log. The pilot measures how often a session must be repeated.",[884,630,625,204,32]]
  ],[plate("divider",801,278,2,551,"copper")]),
  page(["Three gates before expansion",[75,63,1445,148,80]],[
    ["ACCESS",[83,294,380,83,35,"accent"]],
    ["Six towers complete agreed installations with a keeper and specialist present.",[494,283,1009,132,35]],
    ["REPEATABILITY",[83,487,383,83,35,"accent"]],
    ["At least 95% of scheduled sessions meet the recording-quality checklist.",[494,476,1009,132,35]],
    ["RENEWAL",[83,680,380,83,35,"accent"]],
    ["Four pilot towers renew at full price after six months of documented review.",[494,669,1009,132,35]]
  ],[...([254,447,640].map((y,i)=>plate("gate"+i,80,y,1440,2,"copper")))]),
  page(["Keep the next century audible.",[76,73,1427,250,96,"paper"]],[
    ["£480k seed",[83,411,1420,166,115,"copper",display]],
    ["£190k instrumentation · £170k reviewer capacity · £120k installations and access. An 18-month pilot targets forty subscribed towers.",[84,635,933,193,33,"paper"]],
    ["Fictional venture and illustrative figures. Artwork generated for this template.",[1120,690,390,123,24,"paper"]]
  ],[back("plum"),plate("horizon",84,370,1429,2,"copper")])
];
const cacao: Page[] = [
  page(["CACAO",[66,37,1470,210,153,"berry",{...center,z:3}]],[
    ["TYPE",[785,611,729,196,139,"paper",{...display,z:8}]],
    ["Make the message edible.",[77,727,620,91,37,"berry"]],
    ["CUSTOM CHOCOLATE / ILLUSTRATIVE PITCH",[79,840,1370,39,20,"berry",{letterSpacing:2}]]
  ],[back("mint"),plate("paper-fold",28,263,1540,405,"pink",1),plate("crease",28,263,1540,9,"paper",2),picture(300,191,1035,690,5),plate("caption-ground",58,710,660,171,"mint",6),plate("footer-ground",0,832,1600,68,"mint",6),plate("type-band",747,608,853,217,"berry",7)],"cacao-cover"),
  page(["The gift should\nsay something.",[77,88,1430,268,96]],[
    ["A name. A date. A small thank-you.",[82,423,1400,109,47,"red",display]],
    ["Event planners repeatedly coordinate artwork, packaging and delivery across separate suppliers. A late wording change can trigger three new approvals.",[84,594,710,227,34]],
    ["Cacao Type puts the chocolate message, box and dispatch date into one approved order.",[961,610,548,188,35]]
  ],[back("mint"),plate("margin",864,594,3,229,"berry")]),
  page(["A box with a point of view",[80,55,1440,136,78]],[
    ["Choose the letter set, filling and sleeve. Approve a proof with the exact contents before production starts.",[84,734,873,128,32]],
    ["One order number follows the batch through packing and dispatch.",[1095,738,420,121,28,"red"]]
  ],[picture(80,217,1440,473)],"cacao-box"),
  page(["Built in the mold",[77,57,1430,142,86]],[
    ["Reusable letter forms",[82,653,647,100,42,"red",display]],
    ["A stable alphabet gives planners custom wording without a new tool for every event.",[84,771,647,99,28]],
    ["Batch discipline",[936,653,579,100,42,"red",display]],
    ["Approved recipes and a retained batch record keep repeat orders consistent.",[939,771,574,99,28]]
  ],[picture(0,216,1600,393)],"cacao-mold"),
  page(["The order has four decisions",[76,60,1450,142,77]],[
    ["MESSAGE",[100,279,585,82,38,"paper"]],
    ["Names, initials or a short phrase. The proof locks spelling and piece count.",[102,389,579,158,31,"paper"]],
    ["FILLING",[901,279,585,82,38]],
    ["Choose from the current production menu. Ingredient information travels with the proof.",[903,389,574,158,31]],
    ["SLEEVE",[100,616,585,82,38]],
    ["Match the event artwork and confirm the delivery contact on the same sheet.",[102,726,577,132,31]],
    ["DATE",[901,616,585,82,38,"paper"]],
    ["Reserve the batch slot after approval. Dispatch follows the agreed delivery window.",[903,726,574,132,31,"paper"]]
  ],[plate("q1",58,248,697,318,"berry"),plate("q2",858,248,685,318,"mint"),plate("q3",58,585,697,300,"mint"),plate("q4",858,585,685,300,"red")]),
  page(["A 100-box order",[77,58,1430,141,86]],[
    ["£2,400",[102,291,1380,185,126,"berry",center]],
    ["100 six-piece boxes at £24 each",[104,486,1380,80,35,"berry",{align:"center"}]],
    ["£600",[96,644,428,100,62,"red",center]],
    ["Ingredients and sleeves",[96,771,428,77,29,"berry",{align:"center"}]],
    ["£800",[588,644,428,100,62,"red",center]],
    ["Production and dispatch",[588,771,428,77,29,"berry",{align:"center"}]],
    ["£1,000",[1080,644,428,100,62,"red",center]],
    ["Contribution before overhead",[1080,771,428,77,27,"berry",{align:"center"}]]
  ],[back("mint"),plate("receipt-shadow",83,257,1444,327,"pink"),plate("receipt",70,244,1444,327,"paper",2)]),
  page(["The batch gets more efficient",[77,56,1440,142,78]],[
    ["Illustrative production minutes per six-piece box",[82,216,1380,64,28,"red"]],
    ["One proof. One setup.",[78,346,509,155,50,"red",display]],
    ["Larger approved batches spread mold preparation and packing setup across more boxes. Track labor separately from ingredients.",[81,551,502,243,32]]
  ],[plot(652,324,861,483)],undefined,{type:"bar",labels:["25 boxes","50 boxes","100 boxes","200 boxes"],series:[{name:"Minutes / box",values:[14,10,7,6]}],colors:["#AB284A"],showLegend:false}),
  page(["Meet planners where\nthe brief begins",[76,66,1440,235,86,"paper"]],[
    ["Tasting → proof → reorder",[82,372,1400,119,61,"mint",display]],
    ["Offer a paid tasting kit to boutique event agencies. The kit includes the available alphabet, filling menu and a proof example.",[84,584,692,236,34,"paper"]],
    ["Twelve agencies placing six £2,400 orders a year would produce £172,800 in annual sales.",[965,588,547,216,35,"paper"]]
  ],[back("berry")]),
  page(["The production calendar is the promise",[76,59,1450,144,69]],[
    ["DAY 1",[85,303,430,91,44,"red",display]],
    ["Proof approved",[86,429,426,86,35]],
    ["Spelling, allergens, quantity and address are confirmed together.",[86,572,419,170,31]],
    ["DAY 4",[588,303,430,91,44,"red",display]],
    ["Batch released",[589,429,426,86,35]],
    ["The production lead checks the recipe record and retained sample.",[589,572,419,170,31]],
    ["DAY 7",[1090,303,430,91,44,"red",display]],
    ["Boxes dispatched",[1091,429,426,86,35]],
    ["Packing counts and the courier handover are logged to the order.",[1091,572,419,170,31]]
  ],[back("mint"),plate("calendar-line",84,246,1438,5,"berry")]),
  page(["Two signatures on every batch",[77,65,1440,141,79]],[
    ["Nadia Cole",[106,297,1320,112,64,"red",display]],
    ["Chocolate & production",[106,426,550,82,34]],
    ["Owns the menu, batch release and packing standards. Trains the first two production hires.",[758,420,718,149,32]],
    ["Jules Hart",[106,621,1320,111,64,"red",display]],
    ["Orders & agency partners",[106,750,550,82,34]],
    ["Owns proofs, agency accounts and delivery promises. Keeps changes tied to the approved order.",[758,744,718,130,30]]
  ],[plate("fold-top",78,263,1440,306,"mint"),plate("fold-bottom",78,588,1440,294,"pink")]),
  page(["Earn the repeat order",[77,61,1440,142,86]],[
    ["First season",[86,291,684,112,54,"red",display]],
    ["Complete thirty paid orders. Record actual labor minutes, breakage and delivery performance for every batch.",[88,463,665,250,35]],
    ["Next season",[886,291,622,112,54,"red",display]],
    ["Target twelve active agencies, a 40% reorder rate and fewer than 2% damaged boxes at handover.",[888,463,613,250,35]],
    ["Expansion follows repeat demand and measured kitchen capacity.",[87,792,1400,65,28,"red"]]
  ],[back("mint")]),
  page(["A sweeter way\nto leave a mark.",[77,64,1450,250,94,"paper"]],[
    ["£350k seed",[84,385,1420,166,108,"mint",display]],
    ["£150k kitchen and molds\n£120k production team\n£80k tasting kits and working capital",[89,588,873,238,35,"paper"]],
    ["Twelve months to twelve active agency partners. Fictional business and financial model. AI-generated artwork.",[1113,666,397,177,26,"paper"]]
  ],[back("red"),plate("fold",65,558,947,305,"berry",1)])
];
async function build(id: string, name: string, brand: El, pages: Page[], description: string) {
  const slides = pages.map(({ art, elements, ...data }, i) => ({
    ...data, photoQuery: art, role: i === 0 ? "cover" : i === pages.length - 1 ? "closing" : "feature"
  }));
  await renderTemplate({
    id, name, family: id, brand, description, premium: true, motion: false, slides,
    kits: () => pages.map((p, i) => writeKit(slides[i].role, id + "-" + (i + 1), id, p.elements))
  }, false, async key => ({ path: path.join(ROOT, "assets", "bell-and-cacao", key + ".png"), pexelsId: "local:" + key }));
}
(async () => {
  await build("bellwether", "Bellwether", bellBrand, bell, "Historic-tower monitoring pitch with suspended bronze and archival signal records.");
  await build("cacao-type", "Cacao Type", cacaoBrand, cacao, "Custom confectionery pitch with sculptural chocolate letters and folded order sheets.");
})().catch(error => { console.error(error); process.exitCode = 1; });




