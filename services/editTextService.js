const { textGenModel } = require("../utils/geminiModels");

const promptMap = {
  improve: (text) => `Suggest 3 improved versions of this text:\n"${text}"`,
  "fix-grammar": (text) =>
    `Suggest 3 grammatically correct versions of this text:\n"${text}"`,
  shorten: (text) =>
    `Rewrite this text in a shorter and more concise way. Provide 3 variations:\n"${text}"`,
  expand: (text) =>
    `Elaborate on this text and add more useful detail. Provide 3 expanded versions:\n"${text}"`,
  simplify: (text) =>
    `Rewrite this text to be easier to understand using plain English. Provide 3 simplified versions:\n"${text}"`,
  professionalize: (text) =>
    `Make this text sound more professional or business-like. Provide 3 versions:\n"${text}"`,
  summarize: (text) =>
    `Summarize this text into 3 different brief versions:\n"${text}"`,
  custom: (text, customPrompt) => `${customPrompt}\n"${text}"`,
};

async function generateTextEdits(text, action, customPrompt = "") {
  let prompt;

  if (action === "custom") {
    if (!customPrompt.trim()) throw new Error("Custom prompt is required.");
    prompt = promptMap["custom"](text, customPrompt);
  } else {
    prompt = promptMap[action]?.(text);
    if (!prompt) throw new Error("Invalid action type.");
  }

  const result = await textGenModel.generateContent(prompt);
  const output = await result.response.text();

  const suggestions = output
    .split(/\n+/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter((s) => s.length > 0);

  return suggestions;
}

module.exports = {
  generateTextEdits,
};
