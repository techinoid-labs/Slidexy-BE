const { textGenModel } = require("../utils/geminiModels");

async function generateSlideText(rawText) {
  const isInfographic = /infographic/i.test(rawText); // keyword check
  
  const prompt = isInfographic
    ? `
You are an expert in designing infographic-style presentation slides.

Convert the following content into exactly 3 slides using this strict JSON format:

[
  {
    "slide_id": "slide-1",
    "slide_title": {
      "text": "Slide title here",
      "konva_component": "Konva.Text",
      "properties": {
        "fontSize": 48,
        "fontFamily": "Inter",
        "fill": "#333",
        "fontStyle": "bold"
      }
    },
    "visual_description": "Brief description of the infographic-style visual layout.",
    "imagePrompt": "A specific infographic prompt like: bar chart comparing cloud providers",
    "image_url": null,
    "image_caption": "",
    "elements": [
      {
        "element_type": "bullet_point",
        "text": "Bullet point 1 (max 15 words)",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 26,
          "fontFamily": "Inter",
          "fill": "#444",
          "fontStyle": "normal"
        }
      },
      {
        "element_type": "bullet_point",
        "text": "Bullet point 2 (max 15 words)",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 26,
          "fontFamily": "Inter",
          "fill": "#444",
          "fontStyle": "normal"
        }
      }
    ]
  }
]

⚠️ Requirements:
- Return exactly 3 slide objects in a valid JSON array
- Use keys: "slide_title", "elements", "visual_description", "imagePrompt", "image_url", "image_caption"
- Do NOT use keys like "title" or "bulletPoints"
- All bullet points should be concise (max 15 words)
- Ensure JSON is fully valid (no markdown, no explanation, no extra text)

Content:
"""${rawText}"""
`
    : `
You are an expert slide creator. Based on the following content, generate a professional presentation broken into multiple slides.

Important Instructions:
- You MUST generate between 3 slides.
- DO NOT summarize the content into fewer slides even if the content seems short.
- If the content appears limited, create multiple slides by expanding, elaborating, or repeating key ideas with different perspectives.
- Each slide must contain:
  - Title (max 8 words)
  - 3 to 5 bullet points (max 15 words each)
- Use this exact JSON format:

[
  {
    "slide_id": "slide-1",
    "slide_title": {
      "text": "Title of the slide",
      "konva_component": "Konva.Text",
      "properties": {
        "fontSize": 48,
        "fontFamily": "Inter",
        "fill": "#333",
        "fontStyle": "bold"
      }
    },
    "elements": [
      {
        "element_type": "bullet_point",
        "text": "Bullet point text",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 26,
          "fontFamily": "Inter",
          "fill": "#444",
          "fontStyle": "normal"
        }
      }
    ]
  }
]

Return valid PURE JSON only. DO NOT include any markdown, explanations or code fences. Do not prefix with \`\`\`.

Content:
"""${rawText}"""
`;

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
