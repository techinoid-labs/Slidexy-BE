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

  const { goal, tone, audience, length } = meta || {};
  const metaPrompt = formatMetaPrompt({ goal, tone, audience, length });

  const prompt = `
You are an expert slide creator. Based on the following content, generate a professional presentation broken into multiple slides.

Important Instructions:
- You MUST generate exactly ${slideCount} slides, however give importance to how many slides based on the "${rawText}" has mentioned in the prompt within the quotation.
- DO NOT summarize the content into fewer slides even if the content seems short.
- If the content appears limited, create multiple slides by expanding, elaborating, or repeating key ideas with different perspectives.

CANVAS DIMENSIONS:
- All slides must be designed to fit within a canvas of **960 pixels width** and **540 pixels height**. Use spacing, font sizes, and element distribution that keeps everything clean and readable.

- Each slide must contain:
  - Title (max 8 words)
  - max 2 to 3 bullet points (max 10 words each)

- Match the generated text content to be matching the the below meta object like tone, audience etc:
 - ${metaPrompt}

- Use this exact JSON format:

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
       x:"based on the CANVAS dimensions",
       y: "based on CANVAS dimensions",
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
        x:"based on the CANVAS dimensions",
       y: "based on CANVAS dimensions",
          "fontStyle": "normal"
        }
      }
    ]
  }
]

Return valid PURE JSON only. DO NOT include any markdown, explanations or code fences. Do not prefix with \`\`\`.

${metaPrompt}

Content:
"""${rawText}"""
`;

  console.log("Prompt:", prompt);

  const result = await textGenModel.generateContent(prompt);
  const raw = result.response.text();

  const rawCleaned = raw.replace(/```json|```/g, "").trim();
  const firstBracket = rawCleaned.indexOf("[");
  const lastBracket = rawCleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error("No JSON array found in model response");
  }
  const jsonString = rawCleaned.slice(firstBracket, lastBracket + 1);

  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("JSON parsing error. Raw output:", raw);
    throw new Error("Failed to parse model response as valid JSON.");
  }
}

module.exports = { generateSlideText };
