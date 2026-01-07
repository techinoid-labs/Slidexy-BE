const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");

async function getBulletsService(topic, titles, meta = {}) {
  const prompt = `
You are an expert in creating modern 2025 presentation content (Canva/Gamma style: concise, impactful, minimal text).
For the topic "${topic}", generate bullets for each slide title in this array: ${JSON.stringify(titles)}.
For each slide, output an array of 3-6 bullet points (strings). Use engaging, professional language.

${meta.goal ? `Goal: ${meta.goal}.` : ''}
${meta.tone ? `Tone: ${meta.tone}.` : ''}
${meta.audience ? `Audience: ${meta.audience}.` : ''}

Output ONLY a valid JSON array of arrays, e.g., [["Bullet 1", "Bullet 2"], [...]].
One sub-array per slide. No explanations.
  `;

  const result = await textGenModel.generateContent(prompt);
  let cleaned = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  const jsonString = cleaned.slice(start, end + 1);

  try {
    const bulletsArrays = JSON5.parse(jsonString);
    // Convert to KonvaComponents (bullet_point elements)
    return bulletsArrays.map((bullets, index) =>
      bullets.map((bullet, bulletIndex) => ({
        konva_component: "Konva.Text",
        element_type: "bullet_point",
        text: bullet,
        properties: {
          fontSize: 18, // Placeholder; frontend will style
          fontFamily: "Montserrat, sans-serif",
          fill: "#4B5563",
          x: 0, // Placeholder position
          y: 0,
          width: 400,
          height: 30,
          align: "left",
          zIndex: 1000 + bulletIndex,
        },
      }))
    );
  } catch (err) {
    throw new Error("Failed to parse bullets from AI");
  }
}

module.exports = { getBulletsService };