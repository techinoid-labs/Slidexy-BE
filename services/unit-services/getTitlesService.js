const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");

async function getTitlesService(topic, slideCount = 5, meta = {}) {
  const prompt = `
You are an expert presentation designer for 2025 trends (like Canva/Gamma.ai: minimal, engaging, design-driven).
Generate exactly ${slideCount} slide titles for the topic: "${topic}".
${meta.goal ? `Goal: ${meta.goal}.` : ''}
${meta.tone ? `Tone: ${meta.tone}.` : ''}
${meta.audience ? `Audience: ${meta.audience}.` : ''}

Output ONLY a valid JSON array of strings, e.g., ["Title 1", "Title 2"].
No explanations.
  `;

  const result = await textGenModel.generateContent(prompt);
  let cleaned = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  const jsonString = cleaned.slice(start, end + 1);

  try {
    return JSON5.parse(jsonString);
  } catch (err) {
    throw new Error("Failed to parse titles from AI");
  }
}

module.exports = { getTitlesService };