/**
 * Compares slide boxes. A new template is too close when half or more of
 * its slides sit in the same places as a template we already have.
 */

function fingerprint(deck) {
  return (deck.layoutSequence || []).map((layoutId) => {
    const layout = deck.layouts && deck.layouts[layoutId];
    const boxes = ((layout && layout.elements) || [])
      .filter((element) => element.type === "text" || element.type === "image")
      .map((element) => [
        element.type,
        (element.textContent && element.textContent.binding)
          || (element.imageContent && element.imageContent.binding)
          || "",
        Math.round(element.x / 32),
        Math.round(element.y / 32),
        Math.round(element.width / 32),
        Math.round(element.height / 32),
      ].join(":"))
      .sort()
      .join(";");
    return layoutId + "=" + boxes;
  });
}

function similarity(left, right) {
  const other = {};
  right.forEach((line) => {
    const split = line.indexOf("=");
    other[line.slice(0, split)] = line.slice(split + 1);
  });
  let shared = 0;
  let same = 0;
  left.forEach((line) => {
    const split = line.indexOf("=");
    const id = line.slice(0, split);
    if (!(id in other)) return;
    shared += 1;
    if (other[id] === line.slice(split + 1)) same += 1;
  });
  if (!shared) return 0;
  return same / shared;
}

function tooSimilar(deck, fingerprints) {
  const mine = fingerprint(deck);
  return fingerprints.some((other) => similarity(mine, other) >= 0.85);
}

module.exports = { fingerprint, similarity, tooSimilar };
