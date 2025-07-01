const { textGenModel } = require("../utils/geminiModels");

async function generateSlideText(rawText, isInfographicMode) {
  console.log(
    "✅ generateSlideText running with isInfographicMode =",
    isInfographicMode
  );

  const prompt = isInfographicMode
    ? `
You are an expert infographic presentation designer trained in the clean, pastel, flat-icon style of Napkin.AI.

🎯 TASK:
Turn the following content into exactly **3 infographic slides**, each with a meaningful **visual chart or diagram**.

✅ EVERY SLIDE MUST INCLUDE:
- A clear and concise title
- A **chart-style infographic visual** (e.g., flowchart, pie chart, bar chart, timeline, matrix, cycle, quadrant)
- ALL TEXT inside the infographic image must be in correct, readable English with no spelling or grammar errors
- 2–4 short bullet points (15 words max, aligned to the visual content)
- Don't use any watermark in the slides.

🎨 VISUAL REQUIREMENTS:
- Visual layout must be a proper infographic type (not illustrations or metaphors)
- Style must mimic Napkin.AI: large pastel icons, white background, minimal text, structured layout, clean fonts, soft shadows
- Avoid clutter, clipart, or realistic rendering

🧠 LOGIC:
Each image must clearly map to a layout like:
- flowchart (for sequences/processes),
- pie chart (for percentages),
- bar chart (for comparisons),
- timeline (for progression),
- matrix/grid (for categories),
- radial diagram (for relationships),
- step diagram (for instructional content)

📤 FORMAT:
Return exactly 3 slide objects in a **valid JSON array** with the following format (no markdown or extra text):

[
  {
    "slide_id": "slide-1",
    "slide_title": {
      "text": "Slide title here",
      "konva_component": "Konva.Text",
      "properties": {
        "fontSize": 38,
        "fontFamily": "Inter",
        "fill": "#333",
        "fontStyle": "bold"
      }
    },
    "visual_description": "Describe the infographic layout, e.g., '3-step process with icons and arrows in a horizontal flowchart'",
    "imagePrompt": "Create a high-resolution, flat infographic using a white background, pastel colors, large vector icons, and soft typography. Use layout type: [flowchart, pie chart, bar chart, timeline, matrix, radial diagram, quadrant]. Follow Napkin.AI's style: crystal-clear visuals, minimal labels, soft shadows, no visual noise, structured content, modern design.",
    "image_url": null,
    "image_caption": "",
    "elements": [
      {
        "element_type": "bullet_point",
        "text": "Short bullet point 1 (max 10 words)",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 20,
          "fontFamily": "Inter",
          "fill": "#444",
          "fontStyle": "normal"
        }
      },
      {
        "element_type": "bullet_point",
        "text": "Short bullet point 2 (max 10 words)",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 20,
          "fontFamily": "Inter",
          "fill": "#444",
          "fontStyle": "normal"
        }
      }
    ]
  }
]

📌 NOTE:
- All image content must be in correct English
- All visuals or image should be crystal clear and it should not be blurred.
- Do not use non-English text or placeholder gibberish in any visual label
- All visuals must directly support the bullet content
- Output must only include the JSON array — no commentary

CONTENT TO TRANSFORM:
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
  - max 2 to 3 bullet points (max 10 words each)
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
