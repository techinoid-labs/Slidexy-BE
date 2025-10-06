const { textGenModel } = require("../utils/geminiModels");

async function generateSlideText(rawText, meta = {}, slideCount = 3) {
  function formatMetaPrompt(meta = {}) {
    const lines = [];
    if (meta.goal) lines.push(`- Goal: ${meta.goal}`);
    if (meta.tone) lines.push(`- Tone: ${meta.tone}`);
    if (meta.audience) lines.push(`- Audience: ${meta.audience}`);
    if (meta.length) lines.push(`- Desired Length: ${meta.length}`);
    return lines.length > 0
      ? `\n📌 CONTEXTUAL PREFERENCES:\n${lines.join("\n")}\n`
      : "";
  }


let safeRawText = typeof rawText === "string"
  ? rawText
  : JSON.stringify(rawText, null, 2);

  const { goal, tone, audience, length } = meta || {};
  const metaPrompt = formatMetaPrompt({ goal, tone, audience, length });

  const prompt = `
You are an expert slide creator. Based on the following content, generate a professional presentation broken into multiple slides.

Important Instructions:
- You MUST generate exactly ${slideCount} slides, unless the content explicitly specifies a different number of slides, in which case prioritize the number mentioned in the content.
- DO NOT summarize the content into fewer slides even if the content seems short.
- If the content is limited, create multiple slides by expanding, elaborating, or presenting key ideas from different perspectives.
- Ensure the generated slides are highly relevant to the provided content, preserving its context and intent.

CANVAS DIMENSIONS:
- All slides must fit within a canvas of **960 pixels width** and **540 pixels height**.
- Use spacing, font sizes, and element distribution for clean, readable slides.

SLIDE CONTENT REQUIREMENTS:
- Each slide must contain:
  - Title (max 8 words)
  - 3 to 5 bullet points (5 to 10 words each)
- Match the generated text to the following meta preferences:
${metaPrompt}
You must use this exact content to create the slides: CONTENT TO USE (do not ignore) Relevant content is marked between the triple backticks.:
\`\`\`
${safeRawText}
\`\`\`

OUTPUT FORMAT:
- Return valid JSON in the following structure:
[
  {
    "slide_id": "slide-1",
    "slide_title": {
      "text": "Title of the slide",
      "konva_component": "Konva.Text",
      "properties": {
        "fontSize": 38,
        "fontFamily": "Inter",
        "fill": "#333",
        "fontWeight": "bold",
        "x": 30,
        "y": 20,
        "fontStyle": "bold"
      }
    },
    "elements": [
      {
        "element_type": "bullet_point",
        "text": "Bullet point text",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 18,
          "fontFamily": "Inter",
          "fill": "#444",
          "x": 50,
          "y": 80,
          "fontStyle": "normal"
        }
      }
    ]
  }
]

`;

  try {
    const result = await textGenModel.generateContent(prompt);

    // Safely extract model text depending on SDK
    const raw =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result.response?.text?.() ||
      "";

    // Clean and extract JSON
    const rawCleaned = raw.replace(/```json|```/g, "").trim();
    const firstBracket = rawCleaned.indexOf("[");
    const lastBracket = rawCleaned.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON array found in model response");
    }
    const jsonString = rawCleaned.slice(firstBracket, lastBracket + 1);
  

    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Error processing Gemini response:", err);
    throw new Error("Failed to generate valid slide JSON.");
  }
}

module.exports = { generateSlideText };
