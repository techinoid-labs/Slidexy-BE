const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { buildPptx } = require("../services/templatePipeline/catalog");

(async () => {
  const download = await buildPptx("idea-wall");
  const outDir = path.join(__dirname, "..", "out", "idea-wall");
  const dest = path.join(outDir, "idea-wall.pptx");
  const tmp = path.join(outDir, "idea-wall.export.pptx");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(tmp, download.buffer);
  try {
    fs.copyFileSync(tmp, dest);
    fs.unlinkSync(tmp);
  } catch {
    console.warn("target locked, left export pptx");
  }
  fs.writeFileSync(
    path.join(__dirname, "..", "app-library", "published", "idea-wall", "deck.pptx"),
    download.buffer
  );
  const finalPath = fs.existsSync(dest) ? dest : tmp;
  console.log("Wrote", finalPath, download.buffer.length);

  const zip = await JSZip.loadAsync(download.buffer);
  const s1 = await zip.file("ppt/slides/slide1.xml").async("string");
  console.log("interactiveSeq", /interactiveSeq/.test(s1));
  console.log("cancelBubble", /cancelBubble/.test(s1));
  console.log("advClick", /advClick="1"/.test(s1));
  const t = s1.match(/<p:transition[\s\S]*?<\/p:transition>/)[0];
  console.log(t);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
