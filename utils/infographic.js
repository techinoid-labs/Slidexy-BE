// services/infographicService.js
const fs = require("fs");
const path = require("path");
const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");

const referencesDir = path.join(__dirname, "../../utils/infographics");

function loadReferenceHTMLs() {
  const files = fs.readdirSync(referencesDir).filter(f => f.endsWith(".html"));
  return files.map(file => {
    const content = fs.readFileSync(path.join(referencesDir, file), "utf-8");
    return { name: file, content };
  });
}
