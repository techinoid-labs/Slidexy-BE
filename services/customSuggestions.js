const { textGenModel } = require("../utils/geminiModels");
const { generateImage } = require("./generateImage");

/**
 * Build the Gemini prompt for a custom slide suggestion.
 */
function buildCustomPrompt({ title, bullets, customPrompt }) {
  return `
${customPrompt}

Return 3 improved slide suggestions in this JSON format:
[
  {
    "title": "Slide Title",
    "bullets": ["Point A", "Point B", "Point C"],
    "image": "A description for an image to visually represent the content making sure there is no text inside but the image should be on the context of each bullet"
  }
]

Ensure each version fits a 920x420px PowerPoint slide, max 250 characters total.

Title: "${title}"

Bullet Points:
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}
`.trim();
}

/**
 * Generate custom text + image suggestions.
 */
async function generateCustomSuggestions({ title, bullets, customPrompt }) {
  const prompt = buildCustomPrompt({ title, bullets, customPrompt });
  console.log("Custom Prompt Sent:\n", prompt);

  let rawOutput;
  try {
    const result = await textGenModel.generateContent(prompt);
    rawOutput = await result.response.text();
  } catch (err) {
    console.error("Text generation error:", err);
    throw new Error("Failed to generate text suggestions.");
  }

  rawOutput = rawOutput.trim();
  console.log("Raw AI output:\n", rawOutput);

  const suggestions = [];
  try {
    if (rawOutput.startsWith("[") && rawOutput.endsWith("]")) {
      const arr = JSON.parse(rawOutput);
      arr.forEach((item) => {
        if (
          item &&
          typeof item === "object" &&
          typeof item.title === "string" &&
          Array.isArray(item.bullets)
        ) {
          suggestions.push({
            title: item.title,
            bullets: item.bullets,
            image: typeof item.image === "string" ? item.image : "",
          });
        }
      });
    } else {
      const blocks = rawOutput.match(/\{[\s\S]*?\}/g) || [];
      blocks.forEach((block) => {
        try {
          const parsed = JSON.parse(block);
          if (parsed.title && Array.isArray(parsed.bullets)) {
            suggestions.push({
              title: parsed.title,
              bullets: parsed.bullets,
              image: typeof parsed.image === "string" ? parsed.image : "",
            });
          }
        } catch {}
      });
    }
  } catch (err) {
    console.error("Parsing suggestions failed:", err);
    throw new Error("Failed to parse text suggestions.");
  }

  if (!suggestions.length) {
    throw new Error("No valid suggestions returned from AI.");
  }

  // Use generateImage to attach base64 imageUrl
  await Promise.all(
    suggestions.map(async (sug, index) => {
      try {
        const generated = await generateImage(
          {
            slide_title: { text: sug.title },
            imagePrompt: sug.image,
          },
          index
        );
        sug.imageUrl = generated.image_url;
      } catch (err) {
        console.warn("Image generation failed:", err.message);
        sug.imageUrl = null;
      }
    })
  );

  return suggestions;
}

module.exports = { generateCustomSuggestions };
