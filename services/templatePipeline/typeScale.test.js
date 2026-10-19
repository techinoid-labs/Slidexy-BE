/**
 * Every composed deck has a title at least 180px.
 *
 *   node services/templatePipeline/typeScale.test.js
 */

const assert = require("assert");
const { composeDeck } = require("./composeDeck");

function idea() {
  return {
    name: "Harbor radio",
    title: "Harbor",
    subtitle: "Night watch",
    cover: "band",
    close: "left",
    density: "balanced",
    align: "left",
    designLanguage: "editorial",
    groundMode: "flat",
    photo: "",
    palette: {
      name: "Harbor",
      bg: "#F4F7F8",
      surface: "#E6EEEF",
      card: "#FFFFFF",
      ink: "#122026",
      muted: "#4C626A",
      rule: "#D0DEE2",
      accent: "#0E4D6C",
      accent2: "#C46B2F",
      onAccent: "#F4F7F8",
    },
    fonts: { display: "Fraunces", text: "Source Sans 3" },
  };
}

function sizeOf(tokens, value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.startsWith("{type.") && value.endsWith("}")) {
    const key = value.slice(6, -1);
    const size = tokens.type && tokens.type[key];
    if (typeof size === "number") return size;
  }
  return 0;
}

function largest(deck) {
  let max = 0;
  Object.values(deck.layouts || {}).forEach((layout) => {
    (layout.elements || []).forEach((element) => {
      if (element.type !== "text") return;
      max = Math.max(max, sizeOf(deck.tokens, element.textStyle && element.textStyle.fontSize));
    });
  });
  return max;
}

async function main() {
  for (let seed = 1; seed <= 5; seed += 1) {
    const deck = await composeDeck(seed, idea());
    const max = largest(deck);
    assert.ok(max >= 180, "deck " + seed + " largest type is " + max);
  }
  console.log("type scale test passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
