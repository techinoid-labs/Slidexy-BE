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

  return `You are an expert simple slide creator like notebook llm.

TASK: Analyze this user request and generate TWO outputs:
FIRSTLY MAKE SURE THERE IS NO OVERLAPPING OF TEXTS, IMAGES AND EMOJIS. EVERYTHING MUST BE CLEARLY VISIBLE.
1. Structured JSON (for data storage and reuse).
2. HTML snippet (to render the infographic with beautiful CSS styling in style="..." format) keep minimum data.
3- Make sure the width is 1200px and height is 600px (2:1 ratio).
5- Use relevant emojis and svgs to enhance the design inside the infographics.
6- Make sure there are not empty spaces in the generated infographics HTML.
7- Please ensure that you follow the color scheme provided in the JSON below.
8- Please do not use infographic HTML with oklch colors that can cause potential errors.

USER REQUEST:
"${userPrompt}"

CURRENT COLOR SCHEME TO USE:
${schemeData}

${colorSchemeFormat}
RULES:
- Return ONLY a JSON object with exactly two top-level keys: "json" and "html".
- Do NOT include explanations, markdown, or code fences.
- Follow the width and height requirements strictly. ${infographicWidth}px width and ${infographicHeight}px height.
- The "json" key must contain structured data as per the JSON SCHEMA below.
- The "html" key must contain a string of valid HTML using ONLY inline style="..." attributes and SVG for charts.
- HTML must NOT include <html>, <head>, <body>, or external CSS/JS references.
- For Timeline type, use flexbox/grid for layout. Add arrows, dots, or icons to indicate time progression and it should look like a timeline graph.
- For charts, use SVG elements (<rect>, <polyline>, <path>, <circle>) to render data visually. Scale values proportionally (e.g., max height=300 for bars). Add tooltips via title attributes and hover effects with CSS :hover.
- Create STUNNING, PROFESSIONAL designs with:
  * Modern gradients, glassmorphism (backdrop-filter: blur()), shadows, and depth.
  * CSS animations (@keyframes) and transitions for smooth effects (e.g., bars growing on load).
  * Interactive hovers (scale/transform) using inline onmouseover/onmouseout or CSS :hover.
  * Responsive: max-width: 100%; viewBox for SVG.
  * UNIQUE elements: Add legends, axis labels, grid lines, data labels, and subtle patterns.

JSON SCHEMA:
{
  "title": "Main headline",
  "subtitle": "Supporting description" (Compulsory) , should be detailed and relevant,
  "type": "process | comparison | radial | timeline | chart",
  "subtype": "If type=chart, required: bar | line | pie | scatter | area" ,
  "data": {
    // For chart: { labels: string[], datasets: [{ name: string, values: number[], color?: string }] }
    // For others: existing structure
  },
  "meta": { "generated_at": "2025-09-09T12:00:00Z", "source": "AI Generated", "colorScheme": "schemeName" }
}

OUTPUT FORMAT:
{
  "json": { ... },
  "html": "<div>STUNNING UNIQUE HTML HERE</div>"
}`;
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
