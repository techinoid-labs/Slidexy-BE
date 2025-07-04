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
- Return:
  1. A clean, aesthetic background image and make sure there is no characters or text in the image.
  2. Suggested font family (e.g., Inter, Roboto).
  3. A primary hex color (e.g., #333).
  4. A secondary hex color.
  5. A background hex color.
  6. Background should not be too dark and light as font by default will be dark
Format:
{
  "image_base64": "base64 image string",
  "font": "FontName",
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "backgroundColor": "#xxxxxx"
}`;

  const result = await imageGenModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
    safetySettings,
  });

  const parts = result.response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content returned by model.");

  let themeData = {
    image_url: null,
    font: "Inter",
    primaryColor: "#333",
    secondaryColor: "#555",
    backgroundColor: "#f4f4f4",
  };

  for (const part of parts) {
    if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
      themeData.image_url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    } else if (part.text) {
      try {
        const match = part.text.match(/\{[\s\S]*?\}/); // Extract JSON block
        if (match) {
          const json = JSON.parse(match[0]);
          themeData = {
            ...themeData,
            font: json.font || themeData.font,
            primaryColor: json.primaryColor || themeData.primaryColor,
            secondaryColor: json.secondaryColor || themeData.secondaryColor,
            backgroundColor: json.backgroundColor || themeData.backgroundColor,
          };

          // ✅ Handle image from image_base64 inside JSON
          if (json.image_base64) {
            themeData.image_url = `data:image/png;base64,${json.image_base64}`;
          }
        } else {
          console.warn("No JSON block found in text part:", part.text);
        }
      } catch (e) {
        console.warn(
          "Failed to parse JSON part of theme metadata.",
          e,
          part.text
        );
      }
    }
  }

  if (!themeData.image_url) {
    throw new Error("No image found in response.");
  }

  return themeData;
}

// async function generateMultipleThemes(promptText, count = 3) {
//   const results = [];

//   for (let i = 0; i < count; i++) {
//     try {
//       const theme = await generateSingleTheme(`${promptText} variant ${i + 1}`);

//       // ✅ Ensure image_url is not empty/null/undefined
//       if (theme.image_url) {
//         console.log("Valid Theme:", theme.image_url);
//         results.push(theme);
//       } else {
//         console.warn("Skipped theme due to missing image_url.");
//       }
//     } catch (error) {
//       console.warn(`Theme ${i + 1} failed:`, error.message);
//     }
//   }

//   return results;
// }

async function generateMultipleThemes(promptText, count = 3) {
  const themePromises = Array.from({ length: count }, (_, i) =>
    generateSingleTheme(`${promptText} variant ${i + 1}`)
      .then((theme) => (theme?.image_url ? theme : null))
      .catch((err) => {
        console.warn(`Theme ${i + 1} failed:`, err.message);
        return null;
      })
  );

  const allResults = await Promise.all(themePromises);

  // Filter out nulls (failed or missing image_url)
  return allResults.filter(Boolean);
}



module.exports = {
  generateThemeImage: generateSingleTheme,
  generateMultipleThemes,
};
