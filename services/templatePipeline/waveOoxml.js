const JSZip = require("jszip");
const { morphIdToSpid } = require("./motionOoxml");
const { waveGeometryXml } = require("../../engine/waveGeometry");

async function applyWaveGeometry(buffer, deck) {
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  const hasWaves = sequence.some(id => (deck.layouts[id].elements || []).some(e => e.shapeContent?.kind === "wave"));
  if (!hasWaves) return buffer;
  const zip = await JSZip.loadAsync(buffer);
  for (const [index, id] of sequence.entries()) {
    const waves = (deck.layouts[id].elements || []).filter(e => e.shapeContent?.kind === "wave");
    if (!waves.length) continue;
    const name = `ppt/slides/slide${index + 1}.xml`;
    let xml = await zip.file(name).async("string");
    const ids = morphIdToSpid(xml);
    for (const wave of waves) {
      if (wave.width !== 2000 || wave.x !== 0 || !ids[wave.morphId]) throw new Error("Wave requires x=0, width=2000 and a unique morphId");
      const spid = ids[wave.morphId];
      xml = xml.replace(/<p:sp>[^]*?<\/p:sp>/g, block => {
        if (!new RegExp(`<p:cNvPr\\b[^>]*\\bid="${spid}"`).test(block)) return block;
        return block.replace(/<a:prstGeom\b[^]*?<\/a:prstGeom>/, waveGeometryXml());
      });
    }
    zip.file(name, xml);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}
module.exports = { applyWaveGeometry };
