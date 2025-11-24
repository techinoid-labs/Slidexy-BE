const e = require("cors");
const { textGenModel } = require("../../utils/geminiModels");
const  infographicCards  = require("../../constants/card");
const  infographicPatterns  = require("../../constants/background");
const JSON5 = require("json5");

const ALLOWED_STYLES = [
  "glassmorphism",
  "neumorphism",
  "gradient-layering",
  "aurora-gradient",
  "mesh-gradient",
  "glassy-layers-shadows",
  "subtle-pattern-overlay",
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

const VIEW_MODES = {
  landscape: {
    aspectRatio: "16:9",
    style:
      "aspect-ratio: 16 / 9; width: 100%; max-width: 1280px; height: auto;",
    layoutGuidelines: [
      "Use grid or flex layouts that emphasize horizontal reading flow.",
      "Perfect for dashboards, wide timelines, and comparative visuals.",
      "Use horizontal charts, legends on sides, and equal card proportions.",
      ` For Landscape:
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
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}
 `,
    ],
  },
  portrait:{
  aspectRatio: "9:16",
  style: "aspect-ratio: 9 / 16; width: 100%; max-width: 480px;",
  layoutGuidelines: [
    "Use an auto-scaling wrapper to ensure all content fits inside 9:16 without cropping or scrolling.",
    "Outer frame keeps fixed ratio; inner content scales down dynamically using transform.",
    "dont increate too much content which can cause the imae to cut of in the frame",
    `<!-- Portrait Infographic Frame -->
<div class="infographic-frame-portrait">
  <div class="infographic-content">
    <!-- All infographic content goes here -->
  </div>
</div>

<style>
.infographic-frame-portrait {
  width: 100%;
  max-width: 720px;
  aspect-ratio: 9 / 16;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
  background: white;
}
.infographic-content {
  transform-origin: top center;
  transition: transform 0.2s ease;
}
</style>

<script>
const frame = document.querySelector('.infographic-frame-portrait');
const content = frame.querySelector('.infographic-content');
function resizeContent() {
  const frameHeight = frame.clientHeight;
  const contentHeight = content.scrollHeight;
  if (contentHeight > frameHeight) {
    const scale = frameHeight / contentHeight;
    content.style.transform = 'scale(' + scale + ')';
  } else {
    content.style.transform = 'scale(1)';
  }
}
window.addEventListener('resize', resizeContent);
window.addEventListener('load', resizeContent);
</script>
`
  ]
},
};

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
  NOTE: dont send anything excet for this json
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

    // ✅ Clean markdown wrappers
    rawText = rawText.replace(/```(json)?/g, "").trim();
    rawText = rawText.replace(/^``````$/g, "").trim();

    // ✅ Extract only the JSON portion between curly braces
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("⚠️ No JSON block found in model output:\n", rawText);
      throw new Error("Model did not return JSON structure");
    }

    const jsonText = jsonMatch[0];

    // ✅ Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("⚠️ Failed to parse model output as JSON:\n", jsonText);
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

const createSystemPrompt = async (userPrompt, viewMode) => {
  const parameters = await parameterGathering(userPrompt);
  console.log(parameters);
  const cardStyle = infographicCards[parameters.card];
  const backgroundStyle = infographicPatterns[parameters.background];
  const mode = VIEW_MODES[viewMode];
  const layoutDetails = mode.layoutGuidelines.map((g) => `• ${g}`).join("\n  ");

  return `You are an expert infographic generator and web designer who creates STUNNING, UNIQUE, and production-ready HTML/CSS infographics optimized for ${viewMode}.
  
  Style Guide:
- Color Palette Suggestion: ${parameters.colors.join(", ")}
- Card Style Example:${cardStyle}
- Background Example:${backgroundStyle}
- ViewMode:${viewMode}
- Container Style: ${mode.style}

View Mode Layout Guidelines:
  ${layoutDetails}
Note: Must use color Palette provided and layout details are only suggesion dont use them too strictly

  ---
  GOAL:
  - Analyze the USER REQUEST and produce TWO outputs inside a single JSON object: "json" and "html".
  - "json": structured metadata and data following the JSON SCHEMA (see below).
  - "html": the resulted html code as string.

  - In either case, ensure NO SCROLLBARS. Scale elements down with transform: scale() or clamp() so everything(e.g. content + design) always fits inside the visible frame.
  - Use relative units(dont use px) so the view is same in different devices

  USER REQUEST:
 "${userPrompt}"

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
    "html": <div>generated code here</div>
  }
  Note: Strictly follow this output format

  ---
  HELPER HINTS:
  - If user supplies numbers → use charts.
  - If story/historical → use timeline (horizontal for landscape, vertical for portrait).
  - If comparing → use side-by-side cards (landscape) or stacked (portrait).
  - Scale text via clamp(1rem, 2vw, 2.5rem).
  - For portrait, center everything and scale down proportionally to fit mobile-safe aspect ratio.

  FINALLY:
  - Output valid JSON only Strictly.
  - Embed all CSS inline.
  - Respect aspect ratio and non-scroll constraints strictly.
  - Produce modern, elegant, and production-grade visuals ready to paste into web apps.`;
};

async function getDynamicInfographicService(prompt, viewMode) {
  retries = 3;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `Attempt ${attempt}/${retries} - Generating infographic for: "${prompt.substring(
          0,
          50
        )}..."`
      );

      // Create the system prompt
      const systemPrompt = await createSystemPrompt(prompt, viewMode);

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
        // --- ✅ Extract JSON block even if model adds natural language ---
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("❌ No JSON object found in model output");
          console.error(
            "Raw text preview:",
            responseText.substring(0, 200) + "..."
          );
          throw new Error("Model did not return valid JSON structure");
        }

        let jsonSegment = jsonMatch[0].trim();

        try {
          parsed = JSON5.parse(jsonSegment);

          // Handle double-encoded responses
          if (typeof parsed === "string") {
            parsed = JSON5.parse(parsed);
          }
        } catch (parseError) {
          console.error("❌ JSON parsing failed:", parseError.message);
          console.error(
            "Extracted JSON preview:",
            jsonSegment.substring(0, 200) + "..."
          );
          throw new Error(
            `Invalid JSON response from Gemini: ${parseError.message}`
          );
        }

        // Handle case where response might be double-encoded
        if (typeof parsed === "string") {
          parsed = JSON5.parse(parsed);
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError.message);
        console.error(
          "Raw response preview:",
          responseText.substring(0, 200) + "..."
        );
        throw new Error(
          `Invalid JSON response from Gemini: ${parseError.message}`
        );
      }

      // Validate response structure
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Response is not a valid object");
      }

      // Normalize HTML content
      let htmlContent = null;

      if (typeof parsed.html === "string") {
        htmlContent = parsed.html;
      } else {
        throw new Error(
          "Response missing HTML content in any recognized format"
        );
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
        `Type: ${jsonData.type}, Title: "${
          jsonData.title
        }", Layouts: ${Object.keys(htmlContent).join(", ")}`
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
        throw new Error(
          `Failed to generate infographic after ${retries} attempts: ${error.message}`
        );
      }

      // Progressive delay between retries
      const delay = attempt * 1500 + Math.random() * 1000; // 1.5s, 3s, 4.5s + random
      console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { getDynamicInfographicService };
