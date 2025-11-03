const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");
const fs = require("fs");
const path = require("path");

const ALLOWED_CARD_TYPES = [
  "pill",
  "diamond",
  "parallelogram",
  "glass-card",
  "chat-bubble",
  "ribbon",
  "trapezoid",
  "pentagon",
  "double-layered-card",
  "semi-ellipse",
  "circle",
  "rectangle",
];

const createSystemPrompt = (userPrompt) => {
  const infographicHeight = 600;
  const infographicWidth = 1200;

  return `You are an expert visual slide designer and educator.  
Your task is to create a **16:9 HTML slide** that visually and conceptually explains the following topic:.

TASK: Create TWO outputs:
1️⃣ Structured JSON (for data storage and reuse)
2️⃣ HTML snippet (a static 16:9 presentation slide with inline CSS only)

Goal:
Create a visually balanced static layout that **teaches or summarizes** the idea.
Every slide must include **structured explanation blocks**, **visual grouping**, and a **clear conceptual flow**.


### 🧱 LAYOUT RULES:
- Title: Always include a clear main title summarizing the concept.
- Subtext or explanation: Include 1–2 concise sentences explaining it like a teacher would.
- Visual areas:** Use shapes, colored blocks, or diagram elements to represent relationships or parts.
  Examples:
  - Arrows for flow or cause-effect
  - Ellipses / circles for categories
  - Boxes for steps or properties
  - Lines for connections
- Maintain **logical left-to-right or top-to-bottom flow**.
- Avoid empty whitespace — each region of the slide should serve a purpose.
- Use **consistent color scheme** (white background, indigo/emerald/amber accents).
- Background grid is optional but must be subtle.

💡 REQUIREMENTS:
- STRICTLY STATIC — no animations, transitions.
- Use proper steps to explain what you are doing like a teacher explaining it.
- ONLY use relative units so that the result fits gracely on all 16:9 screens.
- Don't use any kind of image links or anything
- LAYOUT:
  * Title area at the top (centered, large font).
  * Subtitle or key info line below it.
  * Content area divided cleanly into 2–3 short blocks (Idea / Code / Complexity).
  * Keep everything readable and evenly spaced.
  * 
- Fonts: clean sans-serif (like Inter, Helvetica, or system default).
- Avoid clutter, decoration, or overlapping content.
- Use emojis only to visually assist (not decorate).
- No extra margins above or below the slide — design should fill the frame.
- NO visual style that looks like a YouTube thumbnail, poster, or infographic.
- only use one or two colors in foreground whose have clear contrast with the background defined ahead.
- Indigo → #4f46e5,Emerald → #10b981,Amber → #f59e0b for drawing lines or borders but not everytime
Example: <div style="flex:1;display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            padding:1rem;background:#f5f5f5;
            border:0.25rem solid #4f46e5;
            border-radius:1rem;
            box-sizing:border-box;">
  <div style="width:60%;height:5vh;
              background:#4f46e5;
              margin-bottom:0.5rem;
              border-radius:0.25rem;"></div>
  <span style="font-family:monospace;
               font-size:0.875rem;
               color:#333;">Information Label</span>
</div>

- Use only light bacground.
Background Example:
<style>
  .grid {
    aspect-ratio: 16 / 9;      /* maintains 16:9 ratio */
    background-color: #fefefe;
    background-image: linear-gradient(#eee 1px, transparent 1px),
                      linear-gradient(90deg, #eee 1px, transparent 1px);
    background-size: 20px 20px;
  }
</style>

USE The appropriate card if not the quoted slide from the following list:
${ALLOWED_CARD_TYPES.join(',')}.

USER REQUEST:
"${userPrompt}"

📘 RULES:
- Output exactly two keys: "json" and "html".
- No explanations, markdown, or code fences.
- HTML must have only inline styles, starting from <div> (no <html>/<head>/<body>).
- Content must fit neatly within 1280×720.
- Use consistent type hierarchy:
  * Code: monospace 14px, background #f5f5f5 or light-tinted box
- Every block should have balanced padding (around 20–30px).
- No outer whitespace around the main container.

 NEGATIVE PROMPT (STRICTLY FORBIDDEN BEHAVIORS):
  Do NOT create any element that causes scrollbars or overflow in any direction.
  Do NOT use overflow: scroll, overflow-y: auto, or overflow-x: auto anywhere.
  Do NOT use content taller or wider than the fixed aspect ratio container.
  Do NOT position elements absolutely outside the main frame or viewport.
  Do NOT use fixed heights in px that may cause clipping or overflow.
  Do NOT use nested scroll areas, carousels, or long lists.
  Do NOT allow text or icons to extend beyond the visible bounds of the container.
  Do NOT break the aspect ratio (must always fit inside 16:9).
  Do NOT include large paragraphs that cannot fit within container height.
  Do NOT stack too many cards vertically—resize or summarize instead.
  Do NOT use sticky or fixed-position headers.
  Do NOT include overflow: visible unless it’s part of a subtle shadow or glow.
  Do NOT animate or translate elements beyond the visible bounds.
  Do NOT create layouts requiring scrolling to reveal hidden content.
  DO NOT OVERLAY TEXTs on one another.

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

async function getVidGenImgService(prompt) {
  let retries = 3;

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