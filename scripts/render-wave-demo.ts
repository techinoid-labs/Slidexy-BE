import * as fs from "fs";
import * as path from "path";
const { renderDeckFromSpec } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
async function main() {
  const spec = {
    style: { palette: "ink-night", typePair: "modern-segoe", motif: "bar-accent" },
    slides: [
      { role: "cover", title: "Ideas in motion", items: ["An editable presentation with a continuous vector wave."] },
      { role: "cover", title: "Keep the conversation moving", items: ["The next slide starts its own wave loop."] }
    ]
  };
  const deck = await renderDeckFromSpec(spec, spec.slides.map(() => ({role:"cover",variant:"rolling-wave"})), {
    id: "rolling-wave-demo",
    brand: {colors:{bg:"#092C40",ink:"#F1F8F3",accent:"#61CDB5",surface:"#16455B",line:"#4D91A5"},fonts:{display:"Arial",body:"Calibri"}}
  });
  deck.id = "rolling-wave-demo";
  deck.name = "Rolling Wave";
  const out = path.resolve(__dirname, "../out/rolling-wave-demo");
  fs.mkdirSync(out, {recursive:true});
  for (const [i,id] of deck.layoutSequence.entries()) {
    const warnings = renderSlidePng(deck,id,path.join(out,"slide-"+(i+1)+".png"));
    if (warnings.length) throw Error(warnings.join("\n"));
  }
  fs.writeFileSync(path.join(out,"deck.json"),JSON.stringify(deck,null,2));
  await exportDeckPptx(deck,path.join(out,"rolling-wave-demo.pptx"));
  console.log(out);
}
main().catch(error=>{console.error(error);process.exitCode=1;});

