const fetch = require("node-fetch");

const API_KEY = process.env.GLM_API_KEY;
const URL = "https://api.z.ai/api/paas/v4/images/generations";

const systemPrompt = `You are generating a modern Western-style infographic layout.Use only English for Text

Design requirements:
- Western corporate infographic aesthetic
- English editorial magazine layout style
- Silicon Valley presentation design
- Apple / Google material design influence
- Clean minimalist UI shapes

CRITICAL:
- Do not generate real words in any language except English
- Use abstract icons instead of labels
- No Asian typography styles
- No Chinese or East Asian visual motifs
- Use neutral Western iconography only

The result should look like a premium English business infographic,
but with text replaced by visual placeholders.
`;

async function generateImage(prompt, viewMode = "square") {
  if (!prompt) throw new Error("Prompt is required for image generation.");

  let size = "1280x1280";
  if (viewMode === "landscape") {
    size = "1280x736"; // Multiple of 32 (1280/32=40, 736/32=23)
  } else if (viewMode === "portrait") {
    size = "736x1280"; // Multiple of 32
  }

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "glm-image",
        prompt: `${systemPrompt}\n${prompt}`, 
        size: size
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Z.AI API error: ${res.status} - ${text}`);
    }

    const json = await res.json();
    const imageUrl = json.data?.[0]?.url;

    if (!imageUrl) throw new Error("No image URL returned from Z.AI.");
    return imageUrl;
  } catch (error) {
    console.error("Error in generateImage:", error.message);
    throw error;
  }
}

module.exports = { generateImage };