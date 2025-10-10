const { textGenModel } = require("../../utils/geminiModels");
const { COLOR_SCHEMES } = require("../../constants");
const JSON5 = require("json5");
const fs = require("fs");
const path = require("path");


// Function to get random color scheme
const getRandomColorScheme = () => {
  const schemes = Object.keys(COLOR_SCHEMES);
  const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];
  return COLOR_SCHEMES[randomScheme];
};

const createSystemPrompt = (userPrompt) => {
  const infographicHeight = 600;
  const infographicWidth = 1200;
  const colorScheme = getRandomColorScheme();
  const schemeData = JSON.stringify(colorScheme, null, 2);

    // Explicit color scheme format description + example (warmPeach-like)
  const colorSchemeFormat = `
COLOR SCHEME FORMAT (fields and usage):
{
  "primary": "<main background gradient or primary color - use for large backgrounds>",
  "secondary": "<secondary gradient - use for cards or section backgrounds>",
  "background": "<solid background color fallback>",
  "accent": "<accent color for icons/buttons/badges>",
  "text": "<default body text color>",
  "heading": "<heading text color (darker than body)>",
  "body": "<secondary/paragraph text color>",
  "accentText": "<text color to use on accent backgrounds>",
  "glass": "<rgba for glassmorphism overlays>",
  "shadow": "<rgba for shadows>",
  "theme": "<string tag like 'warm'|'cool' etc.>"
}

EXAMPLE (warmPeach):
{
  "primary": "linear-gradient(135deg, #FFDAB9 0%, #FFBFA3 100%)",
  "secondary": "linear-gradient(135deg, #FFE5CC 0%, #FFCCAA 100%)",
  "background": "#FFDAB9",
  "accent": "#FF8C61",
  "text": "#3B2E2A",
  "heading": "#3B1F14",
  "body": "#4B3629",
  "accentText": "#FFFFFF",
  "glass": "rgba(255,255,255,0.2)",
  "shadow": "rgba(0,0,0,0.1)",
  "theme": "warm"
}
`;

  return `You are a professional slide creator like Notebook LLM, specialized in clean, minimal, static presentation slides (16:9 ratio).

TASK: Create TWO outputs:
1️⃣ Structured JSON (for data storage and reuse)
2️⃣ HTML snippet (a static 16:9 presentation slide with inline CSS only)

💡 REQUIREMENTS:
- STRICTLY STATIC — no animations, transitions, gradients with motion, or shadows that look 3D.
- DIMENSIONS: width = 1280px, height = 720px (16:9 ratio).
- LAYOUT:
  * Title area at the top (centered, large font).
  * Subtitle or key info line below it.
  * Content area divided cleanly into 2–3 short blocks (Idea / Code / Complexity).
  * Keep everything readable and evenly spaced.
- Use only solid or subtle gradient backgrounds.
- Fonts: clean sans-serif (like Inter, Helvetica, or system default).
- Color scheme: use from ${schemeData}.
- Avoid clutter, decoration, or overlapping content.
- Use emojis only to visually assist (not decorate).
- No extra margins above or below the slide — design should fill the frame.
- NO visual style that looks like a YouTube thumbnail, poster, or infographic.

USER REQUEST:
"${userPrompt}"

📘 RULES:
- Output exactly two keys: "json" and "html".
- No explanations, markdown, or code fences.
- HTML must have only inline styles, starting from <div> (no <html>/<head>/<body>).
- Content must fit neatly within 1280×720.
- Use consistent type hierarchy:
  * Title: 44px–48px bold
  * Subtitle: 26px–30px
  * Section heading: 22px
  * Body: 16–18px
  * Code: monospace 14px, background #f5f5f5 or light-tinted box
- Every block should have balanced padding (around 20–30px).
- No outer whitespace around the main container.

🎨 JSON SCHEMA:
{
  "title": "Main headline",
  "subtitle": "Short supporting explanation",
  "type": "process | comparison | timeline | chart | concept",
  "data": {},
  "meta": { "generated_at": "2025-10-08T00:00:00Z", "source": "AI Generated", "colorScheme": "schemeName" }
}

📤 OUTPUT FORMAT:
{
  "json": { ... },
  "html": "<div>STATIC CLEAN SLIDE HERE</div>"
}
`;
};

async function getVidGenImgService(prompt, options = {}) {
  const { retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries} - Generating infographic for: "${prompt.substring(0, 50)}..."`);

      // Create the system prompt
      const systemPrompt = createSystemPrompt(prompt);

      // Generate content using your custom wrapper
      const result = await textGenModel.generateContent(systemPrompt);

      let responseText = "";
      try {
        const response = result?.response ?? result;
        if (!response) {
          console.warn("No response object returned by textGenModel.generateContent. Full result:", JSON.stringify(result, null, 2));
        } else if (typeof response === "string") {
          responseText = response;
        } else if (typeof response.text === "function") {
          const maybe = response.text();
          responseText = maybe instanceof Promise ? await maybe : maybe;
        } else if (typeof response === "object" && response.data) {
          if (typeof response.data === "string") {
            responseText = response.data;
          } else if (Array.isArray(response.data?.choices) && response.data.choices[0]?.message?.content) {
            responseText = response.data.choices[0].message.content;
          } else {
            responseText = JSON.stringify(response.data);
          }
        } else {
          responseText = JSON.stringify(response);
        }
      } catch (extractErr) {
        console.error("Error extracting text from model response:", extractErr);
        responseText = "";
      }

      responseText = (responseText || "").toString().trim();
      if (!responseText) {
        console.warn("⚠️ Empty responseText received from model. Full result:", JSON.stringify(result, null, 2));
        throw new Error("Empty response from model");
      }

      responseText = responseText.replace(/```(json)?/g, "").replace(/^```|```$/g, "").trim();

      console.log(`Response received (${responseText.length} characters)`);

      let parsed;
      try {
        parsed = JSON5.parse(responseText);
        if (typeof parsed === "string") parsed = JSON5.parse(parsed);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError.message);
        console.error("Raw response preview:", responseText.substring(0, 200) + "...");
        throw new Error(`Invalid JSON response from model: ${parseError.message}`);
      }

      if (!parsed || typeof parsed !== "object") throw new Error("Response is not a valid object");
      if (!parsed.json || !parsed.html) throw new Error("Response missing required 'json' or 'html' keys");
      if (!parsed.json.title || !parsed.json.subtitle || !parsed.json.type) {
        throw new Error("Invalid JSON structure - missing required fields");
      }

      const html = parsed.html;
      if (!html.includes("1200px") || !html.includes("600px")) {
        console.warn("HTML may not have correct dimensions");
      }

      console.log("Infographic generated successfully!");
      console.log(`Type: ${parsed.json.type}, Title: "${parsed.json.title}"`);

      try {
  const outDir = path.join(__dirname, "../../output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, `infographic-${Date.now()}.html`);
  fs.writeFileSync(outPath, parsed.html, "utf-8");
  console.log(`✅ Infographic HTML saved to: ${outPath}`);
} catch (fileErr) {
  console.error("Failed to save infographic HTML:", fileErr.message);
}

      return {
        data: parsed.json,
        html: parsed.html,
        meta: {
          generatedAt: new Date().toISOString(),
          attempt,
          prompt
        }
      };

    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        console.error("All attempts exhausted");
        throw new Error(`Failed to generate infographic after ${retries} attempts: ${error.message}`);
      }
      const delay = attempt * 1500 + Math.random() * 1000;
      console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = { getVidGenImgService };