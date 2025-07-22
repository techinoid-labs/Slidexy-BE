const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

async function generateSingleTheme(promptText) {
  const generationConfig = {
    responseModalities: ["IMAGE", "TEXT"],
  };

  const safetySettings = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ];

  const prompt = `Generate a visually appealing presentation theme based on: "${promptText}".
**IMPORTANT: Respond ONLY with a JSON block in the following format. Ensure all properties are included.**
\`\`\`json
{
  "image_base64": "base64 image string (DO NOT populate this field, it will be handled separately by the system)",
  "font": "FontName",
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "backgroundColor": "#xxxxxx"
}
\`\`\`
Additionally, generate a clean, aesthetic background image (without characters or text) suitable for this theme. The image should be returned separately as inline image data by the model. The JSON should suggest colors and fonts that match this image's aesthetic.`;

  let response;
  try {
    response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      })
    );
  } catch (error) {
    console.error("Error generating content for theme:", error);
    throw new Error("Failed to generate theme content from model.");
  }

  const candidates = response.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned by model for theme generation.");
  }

  const parts = candidates[0]?.content?.parts;
  if (!parts) {
    throw new Error("No content parts returned by model for theme generation.");
  }

  let themeData = {
    image_base64: null, // This will store the *full* data URI
    font: "Inter",
    primaryColor: "#2A2A2A",
    secondaryColor: "#7F8C8D",
    backgroundColor: "#F8F8F8",
  };

  // We also need to store the MIME type temporarily to construct the full data URI
  let imageMimeType = null;

  for (const part of parts) {
    if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
      // Store both the raw base64 data AND its MIME type
      themeData.image_base64 = part.inlineData.data; // Raw base64 string initially
      imageMimeType = part.inlineData.mimeType;
    } else if (part.text) {
      try {
        const match = part.text.match(/\{[\s\S]*?\}/);
        if (match) {
          const json = JSON.parse(match[0]);
          themeData.font = json.font || themeData.font;
          themeData.primaryColor = json.primaryColor || themeData.primaryColor;
          themeData.secondaryColor =
            json.secondaryColor || themeData.secondaryColor;
          themeData.backgroundColor =
            json.backgroundColor || themeData.backgroundColor;

          // If the JSON itself contains an image_base64 (and we haven't found inlineData yet),
          // prioritize inlineData if available, otherwise use JSON's base64.
          // Note: If imageMimeType is also not set, you might need a default like 'image/png'
          if (json.image_base64 && !themeData.image_base64) {
            themeData.image_base64 = json.image_base64;
            // Assuming image/png if it's coming from JSON and not inlineData
            imageMimeType = imageMimeType || "image/png";
          }
        } else {
          console.warn(
            "No JSON block found in text part for theme:",
            part.text
          );
        }
      } catch (e) {
        console.warn(
          "Failed to parse JSON part of theme metadata.",
          e,
          "Text content:",
          part.text
        );
      }
    }
  }

  // --- CRITICAL CHANGE HERE ---
  // After iterating through all parts and collecting the raw base64 and MIME type,
  // construct the full data URI *before* returning.
  if (themeData.image_base64 && imageMimeType) {
    themeData.image_base64 = `data:${imageMimeType};base64,${themeData.image_base64}`;
  } else {
    throw new Error(
      "No complete image data (base64 and MIME type) found in the model's response for the theme."
    );
  }
  // --- END CRITICAL CHANGE ---

  return {
    image_base64: themeData.image_base64, // Now this will be the full data URI
    font: themeData.font,
    primaryColor: themeData.primaryColor,
    secondaryColor: themeData.secondaryColor,
    backgroundColor: themeData.backgroundColor,
  };
}

async function generateMultipleThemes(promptText, count = 3) {
  const themePromises = Array.from({ length: count }, (_, i) =>
    generateSingleTheme(`${promptText} variant ${i + 1}`)
      .then((theme) => (theme?.image_base64 ? theme : null))
      .catch((err) => {
        console.warn(`Theme ${i + 1} failed:`, err.message);
        return null;
      })
  );

  const allResults = await Promise.all(themePromises);

  return allResults.filter(Boolean);
}

module.exports = {
  generateThemeImage: generateSingleTheme,
  generateMultipleThemes,
};
