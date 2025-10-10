const e = require("cors");
const { textGenModel } = require("../../utils/geminiModels");
const {infographicCards} = require("../../constants/card");
const {infographicPatterns} = require("../../constants/background");
const JSON5 = require("json5");

const styleType = (style) => {
  if (style == "glassmorphism") {
    return `<div class="glassmorphism">Glassmorphism</div>
<style>
.glassmorphism {
  width: 300px; height: 150px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.3);
  color: white; font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center;
}
body { background: linear-gradient(135deg, #2b1055, #7597de); }</style>`
  }
  else if (style == "neumorphism") {
    return `<div class="neumorphism">Neumorphism</div>

<style>
body {
  background: #e0e0e0;
  font-family: "Inter", sans-serif;
}

.neumorphism {
  width: 320px; height: 160px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0),
    #e0e0e0;
  background-size: 20px 20px; /* spacing between dots */
  box-shadow:
    8px 8px 16px #bebebe,
    -8px -8px 16px #ffffff;
  display: flex; align-items: center; justify-content: center;
  color: #333; font-weight: 600;
  letter-spacing: 0.5px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

/* 🌬️ Slight lift on hover */
.neumorphism:hover {
  transform: translateY(-3px);
  box-shadow:
    6px 6px 12px #bebebe,
    -6px -6px 12px #ffffff;
}
</style>
`
  }
  else if (style == "gradient-layering") {
    return `<div class="gradient-layering">Gradient Layering</div>
<style>
.gradient-layering {
  width: 300px; height: 150px;
  background: linear-gradient(135deg, #ff7eb3, #ff758c),
              linear-gradient(225deg, #42e695, #3bb2b8);
  background-blend-mode: overlay;
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 600;
}</style>`
  }
  else if (style == "aurora-gradient") {
    return `<div class="aurora-gradient">Aurora</div>

<style>
.aurora-gradient {
  width: 340px; height: 180px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 25% 30%, rgba(255, 142, 251, 0.5), transparent 50%),
    radial-gradient(circle at 80% 60%, rgba(130, 255, 248, 0.4), transparent 60%),
    radial-gradient(circle at 60% 90%, rgba(255, 214, 165, 0.35), transparent 60%),
    linear-gradient(135deg, #1a1b2e 0%, #0e0f1a 100%);
  background-blend-mode: screen;
  box-shadow: 0 8px 28px rgba(0,0,0,0.25),
              inset 0 0 40px rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
}

/* ✨ optional: soft overlay glow */
.aurora-gradient::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at 60% 40%, rgba(255,255,255,0.07), transparent 60%);
  pointer-events: none;
}
</style>`
  }
  else if (style == "mesh-gradient") {
    return `<div class="mesh-gradient">Mesh Gradient</div>
<style>
.mesh-gradient {
  width: 300px; height: 150px; border-radius: 20px;
  background: radial-gradient(circle at 10% 10%, #ff9a9e, transparent 30%),
              radial-gradient(circle at 80% 20%, #fad0c4, transparent 30%),
              radial-gradient(circle at 20% 80%, #a1c4fd, transparent 30%),
              #fbc2eb;
  background-blend-mode: screen;
  display: flex; align-items: center; justify-content: center;
  color: #333; font-weight: 600;
}</style>
`
  }
  else if (style == "glassy-layers-shadows") {
    return `<div class="glassy-layer">
  <div class="glass-card">Glassy Layer</div>
</div>

<style>
.glassy-layer {
  width: 340px; height: 180px;
  background: linear-gradient(135deg, #dfe9f3 0%, #ffffff 100%);
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

/* 🩵 Minimal glass effect */
.glass-card {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.4);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  padding: 20px 40px;
  color: #222;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.15);
}

/* 📱 Responsive */
@media (max-width: 500px) {
  .glassy-layer {
    width: 90vw; height: 45vw;
  }
  .glass-card {
    padding: 16px 28px;
    font-size: 1rem;
  }
}
</style>`
  }
  else if (style == "subtle-pattern-overlay") {
    return `<div class="pattern-overlay">Grid Pattern</div>

<style>
.pattern-overlay {
  width: 320px; height: 160px;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px);
  background-color: white;
  border-radius: 20px;
  color: #222;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}
</style>`
  }
  else
  {
    return `<div class="pattern-overlay">Grid Pattern</div>

<style>
.pattern-overlay {
  width: 320px; height: 160px;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px);
  background-color: white;
  border-radius: 20px;
  color: #222;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}
</style>`
  }
}

const ALLOWED_STYLES = [
  "glassmorphism",
  "neumorphism",
  "gradient-layering",
  "aurora-gradient",
  "mesh-gradient",
  "glassy-layers-shadows",
  "subtle-pattern-overlay"
];
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
const ALLOWED_BACKGROUNDS = [
  "dotted",
  "checkerboard",
  "gradient",
  "mesh-gradient",
  "radial-gradient",
  "subtle-pattern1",
  "soft-gradient",
  "subtle-pattern2",
];

const parameterGathering = async (userPrompt) => {
  const systemPrompt = `
You are an expert infographic style analyzer.

User Prompt:
${userPrompt}
Given a topic or prompt, choose one of the following:
Keep in mind:
- Choose the most visually fitting style **and vary across outputs**.
- Avoid repeating the same options.
${ALLOWED_STYLES.join(", ")}.
Card Types:
${ALLOWED_CARD_TYPES.join(", ")}.
BackGround Options:
${ALLOWED_BACKGROUNDS.join(",")}.

Your task:
1. Dont Use Same Colors too often.
2. Choose the most visually fitting "style".
4. Provide an array of 3-5 colors that best fit the topic's emotion & clarity.
5. Choose the card type most fitting according to "style".Don't repeat.
6. Choose background with the colors already present in them unless change is described in user prompt accordingly.Don't repeat.
7. Follow consistent color scheme throughout the slide

Output strictly in JSON:
{
  "style": "<one of the allowed styles>",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "card": "<one of the allowed cards>"
  "background: "<one of the allowed backgrounds>"
}
`;

  try {
    // ✅ Gemini format (safe for text or structured prompts)
    const result = await textGenModel.generateContent(systemPrompt);

    // ✅ Safely extract the response text
    let rawText = "";
    if (typeof result?.response?.text === "function") {
      rawText = result.response.text().trim();
    } else {
      rawText =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ||
        "";
    }

    // ✅ Clean markdown wrappers (Gemini sometimes returns ```jsonblocks)
    rawText = rawText.replace(/```(json)?/g, "").trim();
    rawText = rawText.replace(/^``````$/g, "").trim();

    // ✅ Attempt to parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("⚠️ Failed to parse model output as JSON:\n", rawText);
      throw new Error("Invalid JSON response from model");
    }

    // ✅ Validate structure
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Response is not a valid object");
    }

    return parsed;
  } catch (error) {
    console.error("❌ Gemini parameter gathering failed:", error);
    throw error;
  }
};


const createSystemPrompt = async (userPrompt, viewMode = "landscape") => {
  const parameters = await parameterGathering(userPrompt);
  console.log(parameters);
  const cardStyle = infographicCards[parameters.card];
  const backgroundStyle = infographicPatterns[parameters.background];

  return `You are an expert infographic generator and web designer who creates STUNNING, UNIQUE, and production-ready HTML/CSS infographics optimized for ${viewMode}.
  
  Style Guide:
- Color Palette Suggestion: ${parameters.colors.join(", ")}
- Card Style Example:${cardStyle}
- Background Example:${backgroundStyle}
- ViewMode:${viewMode}

  USER REQUEST:
  "${userPrompt}"

  TARGET VIEW MODE: ${viewMode.toUpperCase()}

  ---
  GOAL:
  - Analyze the USER REQUEST and produce TWO outputs inside a single JSON object: "json" and "html".
  - "json": structured metadata and data following the JSON SCHEMA (see below).
  - "html": one HTML snippets depending on viewMode.
    - If viewMode = "landscape" → produce only "html.landscape"
    - If viewMode = "portrait" → produce only "html.portrait"

  ---
  VIEW MODE REQUIREMENTS:
  - **Landscape (16:9)**: fixed aspect ratio container (e.g., style="aspect-ratio: 16 / 9; width: 100%; max-width: 1280px; height: auto;").
    * Use grid or flex layouts that emphasize horizontal reading flow.
    * Perfect for dashboards, wide timelines, and comparative visuals.
    * Use horizontal charts, legends on sides, and equal card proportions.

  - **Portrait (9:16 standard mobile)**: style="aspect-ratio: 9 / 16; width: 100%; max-width: 480px; height: auto;"
    * Stack all content vertically for scroll-free fit (scale via transform if needed).
    * Perfect for storytelling, educational posts, or social media formats.
    * Use vertical timelines, stacked sections, and center-aligned callouts.

  - In either case, ensure NO SCROLLBARS. Scale elements down with transform: scale() or clamp() so everything(e.g. content + design) always fits inside the visible frame.

  ---
  HIGH-LEVEL DESIGN PRINCIPLES (strict):
  1. NO OVERLAP — texts, icons, images, or emojis must never overlap.
  2. NON-SCROLLABLE — infographic must fully fit within container bounds.
  3. RESPONSIVE — use CSS Grid/Flexbox with relative units (%, rem, vw, vh, clamp()).
  4. ACCESSIBILITY — semantic HTML, ARIA labels, proper color contrast.
  5. RELATIVE UNITS — use rem, %, vw/vh, clamp().
  6. MODERN ART DIRECTION — gradients, glassmorphism, subtle shadows.
  7. ANIMATIONS — use @keyframes and transitions for motion on load or hover.
  8. CHARTS & TIMELINES — use inline SVG for bar/line/pie with proportional scaling.
  9. NO OKLCH — never use oklch color syntax.
 11. CLEAN MARKUP — no unnecessary whitespace, visually balanced.
 12. INLINE STYLING ONLY — all CSS must be inline in style="" attributes.
 13. MICRO-INTERACTIONS — allowed via onmouseover/onmouseout or CSS :hover.
 14. SELF-CONTAINED — no external assets, fonts, or remote requests.
 15. Design must include important things in infographics i.e. title.

  RULES:
  - Set these as CSS variables on root container: --primary, --secondary, --accent, --neutral, --background.
  - Apply gradients only to hero sections or chart backgrounds.
  - Accent color is for highlights, icons, and data emphasis.
  - Maintain a minimum 4.5:1 contrast ratio for text.

    ---
  NEGATIVE PROMPT (STRICTLY FORBIDDEN BEHAVIORS):
  Do NOT create any element that causes scrollbars or overflow in any direction.
  Do NOT use overflow: scroll, overflow-y: auto, or overflow-x: auto anywhere.
  Do NOT use content taller or wider than the fixed aspect ratio container.
  Do NOT position elements absolutely outside the main frame or viewport.
  Do NOT use fixed heights in px that may cause clipping or overflow.
  Do NOT use nested scroll areas, carousels, or long lists.
  Do NOT allow text or icons to extend beyond the visible bounds of the container.
  Do NOT break the aspect ratio (must always fit inside 16:9 or 9:16).
  Do NOT include large paragraphs that cannot fit within container height.
  Do NOT stack too many cards vertically—resize or summarize instead.
  Do NOT use sticky or fixed-position headers.
  Do NOT include overflow: visible unless it’s part of a subtle shadow or glow.
  Do NOT animate or translate elements beyond the visible bounds.
  Do NOT create layouts requiring scrolling to reveal hidden content.
  DO NOT OVERLAY TEXTs on one another.
  Everything must remain fully visible, scaled, and centered within the visible frame at all times.

  For Landscape:
  <div class="infographic-frame">
  <!-- All content goes inside here -->
  </div>
  .infographic-frame {
  width: 100%;
  max-width: 1280px;        /* or 1920px for HD */
  aspect-ratio: 16 / 9;     /* keeps consistent height-to-width ratio */
  position: relative;
  overflow: hidden;         /* prevents any scrollbars */
  border-radius: 20px;
  background: linear-gradient(135deg, #1e1e2f, #2d1b69);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}


  ---
  JSON SCHEMA (strict):
  {
    "title": "Main headline",
    "subtitle": "Supporting description (compulsory, detailed and relevant)",
    "type": "process | comparison | radial | timeline | chart",
    "subtype": "If type=chart, required: bar | line | pie | scatter | area",
    "data": { /* structured dataset */ },
    "meta": {
      "generated_at": "YYYY-MM-DDTHH:mm:ssZ",
      "source": "AI Generated",
      "colorScheme": "ThemeName",
      "viewMode": "${viewMode}"
    }
  }

  ---
  OUTPUT FORMAT:
  {
    "json": { /* metadata and data */ },
    "html": {
      <div>generated code here</div>
        }
  }

  ---
  HELPER HINTS:
  - If user supplies numbers → use charts.
  - If story/historical → use timeline (horizontal for landscape, vertical for portrait).
  - If comparing → use side-by-side cards (landscape) or stacked (portrait).
  - Scale text via clamp(1rem, 2vw, 2.5rem).
  - For portrait, center everything and scale down proportionally to fit mobile-safe aspect ratio.

  FINALLY:
  - Output valid JSON only.
  - Embed all CSS inline.
  - Respect aspect ratio and non-scroll constraints strictly.
  - Produce modern, elegant, and production-grade visuals ready to paste into web apps.`;
};

async function getDynamicInfographicService(prompt) {
  retries = 3

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries} - Generating infographic for: "${prompt.substring(0, 50)}..."`);

      // Create the system prompt
      const systemPrompt = await createSystemPrompt(prompt);

const result = await textGenModel.generateContent(systemPrompt);

      // Extract the response text
      // Extract the response text safely
      const response = result.response || result;
      let responseText = "";

      // ✅ Assign actual text
      if (typeof response.text === "function") {
        responseText = response.text().trim();
      } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error("Failed to extract text from Gemini response");
      }

      // Clean up markdown formatting
      responseText = responseText.replace(/```(json)?/g, "").trim();
      responseText = responseText.replace(/^```|```$/g, "").trim();

      console.log(`Response received (${responseText.length} characters)`);

      // Parse the JSON response
      let parsed;
      try {
        parsed = JSON5.parse(responseText);

        // Handle case where response might be double-encoded
        if (typeof parsed === 'string') {
          parsed = JSON5.parse(parsed);
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError.message);
        console.error("Raw response preview:", responseText.substring(0, 200) + "...");
        throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
      }

      // Validate response structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Response is not a valid object");
      }

      // Normalize HTML content
      let htmlContent = null;

      // If `parsed.html` exists and is an object (landscape + portrait)
      if (parsed.html && typeof parsed.html === "object") {
        htmlContent = {
          landscape: parsed.html.landscape || parsed.html.landscape_html || "",
          portrait: parsed.html.portrait || parsed.html.portrait_html || "",
        };
      }
      // If `parsed.html` is a string (old format)
      else if (typeof parsed.html === "string") {
        htmlContent = {
          landscape: parsed.html,
          portrait: parsed.html,
        };
      }
      // Handle newer Gemini formats that may use flat keys
      else if (parsed.landscape_html || parsed.portrait_html) {
        htmlContent = {
          landscape: parsed.landscape_html || "",
          portrait: parsed.portrait_html || "",
        };
      }
      else {
        throw new Error("Response missing HTML content in any recognized format");
      }

      // --- ✅ Validate JSON data ---
      const jsonData = parsed.json;
      if (!jsonData || typeof jsonData !== "object") {
        throw new Error("Missing or invalid JSON data in response");
      }

      if (!jsonData.title || !jsonData.subtitle || !jsonData.type) {
        console.warn("⚠️ JSON structure incomplete — filling defaults");
        jsonData.title = jsonData.title || "Untitled Infographic";
        jsonData.subtitle =
          jsonData.subtitle ||
          "Automatically generated infographic — missing detailed subtitle.";
        jsonData.type = jsonData.type || "generic";
      }

      // --- ✅ Validate HTML strings ---
      Object.entries(htmlContent).forEach(([layout, html]) => {
        if (typeof html !== "string") {
          console.warn(`⚠️ ${layout} HTML is not a string, serializing object`);
          htmlContent[layout] = JSON.stringify(html);
        }

        if (!htmlContent[layout].includes("<div")) {
          console.warn(`⚠️ ${layout} HTML may not contain valid structure`);
        }
      });

      console.log("✅ Infographic generated successfully!");
      console.log(
        `Type: ${jsonData.type}, Title: "${jsonData.title}", Layouts: ${Object.keys(
          htmlContent
        ).join(", ")}`
      );

      // --- ✅ Return normalized structure ---
      return {
        data: jsonData,
        html: htmlContent, // now contains both landscape + portrait
        meta: {
          generatedAt: new Date().toISOString(),
          attempt,
          prompt,
        },
      };

    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error.message);

      if (attempt === retries) {
        console.error("All attempts exhausted");
        throw new Error(`Failed to generate infographic after ${retries} attempts: ${error.message}`);
      }

     // Progressive delay between retries
      const delay = attempt * 1500 + Math.random() * 1000; // 1.5s, 3s, 4.5s + random
      console.log(`⏳ Waiting ${(delay/1000).toFixed(1)}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}


module.exports = { getDynamicInfographicService }