// Five identical cycles on a strip 1.25 times the 1600-unit slide width.
// All consumers use these same Bezier control points.
function waveCommands() {
  const commands = [["M", 0, 90]];
  for (let i = 0; i < 5; i++) {
    const x = i * 400;
    commands.push(["C", x + 66, 10, x + 134, 10, x + 200, 90]);
    commands.push(["C", x + 266, 170, x + 334, 170, x + 400, 90]);
  }
  commands.push(["L", 2000, 180], ["L", 0, 180], ["Z"]);
  return commands;
}

function waveGeometryXml() {
  const point = (x, y) => `<a:pt x="${x}" y="${y}"/>`;
  const commands = waveCommands().map(([kind, ...p]) => {
    if (kind === "M") return `<a:moveTo>${point(...p)}</a:moveTo>`;
    if (kind === "L") return `<a:lnTo>${point(...p)}</a:lnTo>`;
    if (kind === "Z") return "<a:close/>";
    return `<a:cubicBezTo>${point(p[0], p[1])}${point(p[2], p[3])}${point(p[4], p[5])}</a:cubicBezTo>`;
  }).join("");
  return `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="2000" b="180"/><a:pathLst><a:path w="2000" h="180" stroke="false" extrusionOk="false">${commands}</a:path></a:pathLst></a:custGeom>`;
}

module.exports = { waveCommands, waveGeometryXml };
