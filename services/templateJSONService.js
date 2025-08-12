const { textGenModel } = require("../utils/geminiModels");

async function templateJSONService(rawText, meta = {}, slideCount = 3) {
  function formatMetaPrompt(meta = {}) {
    const lines = [];
    if (meta.goal) lines.push(`- Goal: ${meta.goal}`);
    if (meta.tone) lines.push(`- Tone: ${meta.tone}`);
    if (meta.audience) lines.push(`- Audience: ${meta.audience}`);
    return lines.length > 0
      ? `\n📌 CONTEXTUAL PREFERENCES:\n${lines.join("\n")}\n`
      : "";
  }

  const metaPrompt = formatMetaPrompt(meta);
  //   const prompt = `
  // You are an expert presentation template designer (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates**.

  // Canvas size: **960×540 px** (13.33" × 7.5" @ 72dpi).
  // 1 inch = 72 pixels.

  // You will output ONLY a **valid JSON array** of exactly ${
  //     slideCount || 5
  //   } slides in the EXACT structure provided below.

  // ### ABSOLUTE RULES (NO OMISSIONS)
  // 1. **Every slide** must have:
  //    - A \`slide_id\` (unique)
  //    - A \`slide_title\` object (with text, full Konva "properties", and matching PPTXGenJS "pptx_options")
  //    - An \`elements\` array containing **all** objects necessary for a visually complete, modern, design-rich template.
  //    - An \`image_url\` (base64 placeholder if no actual image)
  // 2. **Every element** must:
  //    - Include \`element_type\`, \`konva_component\`, and **full** \`properties\` in **pixels**.
  //    - Include **matching** \`pptx_options\` in **inches**, strictly following PPTXGenJS syntax.
  //    - Contain **all relevant visual & positioning details**:
  //      - Position (x, y)
  //      - Size (width, height)
  //      - Colors (fill, stroke if applicable)
  //      - Font details (fontSize, fontFamily, fontStyle, fontWeight, align)
  //      - zIndex
  //      - imageSrc if image
  // 3. **Image Rules (MANDATORY)**:
  //    - Every slide **must** contain at least one \`image\` element with \`element_type\` = "image".
  //    - \`imageSrc\` must be a valid base64 placeholder (or actual base64 if provided externally).
  //    - Images must have **accurate, proportional dimensions** in both \`properties\` (px) and \`pptx_options\` (inches).
  //    - Place images in **visually balanced positions** relative to text and shapes.
  //    - No stretching, distortion, or unrealistic scaling.
  //    - Maintain **modern, professional quality** — think Unsplash/Pexels style compositions.
  // 4. **Shapes**:
  //    - Use diverse Konva shapes (Rect, Circle, Ellipse, Star, RegularPolygon, Line, Arrow, Arc, Wedge, etc.).
  //    - Always provide creative layout elements that give a **modern, design-driven feel**.
  //    - Each shape must have a matching PPTXGenJS \`shape\` mapping.
  // 5. **Design Consistency**:
  //    - Use clean, modern styles.
  //    - Professional fonts only (Roboto, Inter, Open Sans).
  //    - Use consistent color codes (hex without # in pptx_options).
  // 6. **Mapping Rules**:
  //    - Rect → rect
  //    - Circle/Ellipse → ellipse
  //    - Star → star
  //    - RegularPolygon → polygon
  //    - Line/Arrow → line
  //    - Arc/Wedge → pie
  // 7. **Pixel to inch conversion**: divide by 72 exactly for pptx_options.
  // 8. **No missing fields** — if a property exists in \`properties\` it MUST exist with corresponding converted value in \`pptx_options\`.
  // 9. No explanations, no commentary, only the JSON array.

  // ### OUTPUT STRUCTURE (MANDATORY):
  // [
  //   {
  //     "slide_id": "slide-UNIQUE_ID",
  //     "slide_title": {
  //       "text": "Slide Title",
  //       "properties": {
  //         "fontSize": 24,
  //         "width": 80,
  //         "height": 60,
  //         "fontFamily": "Roboto",
  //         "fill": "#444",
  //         "fontWeight": "bold",
  //         "x": 20,
  //         "y": 25
  //       },
  //       "pptx_options": { "x": 0.28, "y": 0.35, "fontSize": 24, "color": "444444" }
  //     },
  //     "elements": [
  //       {
  //         "element_type": "bullet_point",
  //         "text": "Some text here",
  //         "konva_component": "Konva.Text",
  //         "properties": {
  //           "fontSize": 18,
  //           "fontWeight": "",
  //           "fontFamily": "Roboto",
  //           "width": 80,
  //           "height": 60,
  //           "fill": "#444",
  //           "fontStyle": "",
  //           "zIndex": 1,
  //           "x": 30,
  //           "y": 119
  //         },
  //         "pptx_options": { "x": 0.42, "y": 1.65, "w": 1.11, "h": 0.83, "fontSize": 18, "color": "444444" }
  //       },
  //       {
  //         "text": "Title Text",
  //         "konva_component": "Konva.Text",
  //         "element_type": "text",
  //         "element_id": "6f9c15a1-88c3-4d0a-a8b3-5bd2cad70cf8",
  //         "properties": {
  //           "fontSize": 32,
  //           "fontFamily": "Inter",
  //           "fill": "#222",
  //           "fontStyle": "normal",
  //           "fontWeight": "700",
  //           "x": 323.20001220703125,
  //           "y": 178.39990234375,
  //           "width": 500,
  //           "align": "left",
  //           "zIndex": 5
  //         },
  //         "pptx_options": { "x": 0.42, "y": 1.65, "w": 4, "h": 0.5, "fontSize": 18, "color": "444444" }
  //       },
  //       {
  //         "element_type": "shape",
  //         "konva_component": "Konva.Rect",
  //         "properties": {
  //           "x": 120,
  //           "y": 150,
  //           "width": 80,
  //           "height": 60,
  //           "fill": "#3498db",
  //           "zIndex": 4
  //         },
  //         "pptx_options": { "shape": "rect", "x": 1.67, "y": 2.08, "w": 1.11, "h": 0.83, "fill": "3498db" }
  //       }
  //      {
  //         "element_type": "image",
  //         "konva_component": "Konva.Image",
  //         "properties": {
  //           "imageSrc": "base64",
  //           "x": 560,
  //           "y": 110,
  //           "width": 380,
  //           "height": 320,
  //           "zIndex": 6
  //         },
  //         "pptx_options": { "x": 7.78, "y": 1.53, "w": 5.28, "h": 4.44 }
  //       },
  //     ],
  //     "image_url": "img base64"
  //   }
  // ]

  // ${metaPrompt}

  // Content:
  // """${rawText}"""
  // `;

  const prompt = `You are an expert presentation template designer (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates**.

Canvas size: **960×540 px** (13.33" × 7.5" @ 72dpi).  
1 inch = 72 pixels.

You will output ONLY a **valid JSON array** of exactly ${
    slideCount || 5
  } slides in the EXACT structure provided below.

### ABSOLUTE RULES (NO OMISSIONS)
1. **Every slide** must have:
   - A \`slide_id\` (unique)
   - A \`slide_title\` object (with text, full Konva "properties", and matching PPTXGenJS "pptx_options")
   - An \`elements\` array containing **all** objects necessary for a visually complete, modern, design-rich template.
   - An \`image_url\` (base64 placeholder if no actual image)

2. **Every element** must:
   - Include \`element_type\`, \`konva_component\`, and **full** \`properties\` in **pixels**.
   - Include **matching** \`pptx_options\` in **inches**, strictly following PPTXGenJS syntax.
   - Contain **all relevant visual & positioning details**:
     - Position (x, y)
     - Size (width, height, radius, innerRadius, outerRadius, radiusX, radiusY, sides, points)
     - Colors (fill, stroke if applicable)
     - Stroke width (strokeWidth if applicable)
     - Font details (fontSize, fontFamily, fontStyle, fontWeight, align)
     - zIndex
     - imageSrc if image

3. **Image Rules (MANDATORY)**:
   - Every slide **must** contain at least one \`image\` element.
   - \`imageSrc\` must be a valid base64 placeholder (or actual base64 if provided externally).
   - Images must have **accurate, proportional dimensions** in both \`properties\` (px) and \`pptx_options\` (inches).

4. **Shapes (Konva → PPTXGenJS)**:
   - Rect → rect {x,y,w,h,fill}
   - Circle/Ellipse → ellipse {x,y,w,h,fill}
   - Star → star {x,y,w,h,fill}
   - RegularPolygon → polygon {x,y,w,h,fill}
   - Line/Arrow → line {x,y,w,h,fill,stroke,strokeWidth}
   - Arc/Wedge → pie {x,y,w,h,fill}
   - Properties per type:
     - Rect: x,y,width,height,fill,zIndex
     - Circle: x,y,radius,fill,zIndex
     - Ellipse: x,y,radiusX,radiusY,fill,zIndex
     - Star: x,y,numPoints,innerRadius,outerRadius,fill,zIndex
     - RegularPolygon: x,y,sides,radius,fill,zIndex
     - Line/Arrow: points[],stroke,fill,strokeWidth,zIndex
     - Arc/Wedge: x,y,radius,angle,fill,zIndex
     
   **For each shape**, include a matching \`pptx_options\`:
   - Rect → \`shape: "rect"\`
   - Circle/Ellipse → \`shape: "ellipse"\`
   - Star → \`shape: "star"\`
   - RegularPolygon → \`shape: "polygon"\`
   - Line/Arrow → \`shape: "line"\`
   - Arc/Wedge → \`shape: "pie"\`

   All dimensional values in \`pptx_options\` must be converted from px to inches by dividing by 72.

5. **Design Consistency**:
   - Clean, modern styles.
   - Professional fonts (Roboto, Inter, Open Sans).
   - Hex colors without "#" in \`pptx_options\`.

6. **No missing fields** — if a property exists in \`properties\` it MUST exist with a corresponding converted value in \`pptx_options\`.

[  
  {  
    "slide_id": "slide-UNIQUE_ID",  
    "slide_title": {  
      "text": "Slide Title",  
      "properties": {  
        "fontSize": 24,  
        "width": 80,  
        "height": 60,  
        "fontFamily": "Roboto",  
        "fill": "#444",  
        "fontWeight": "bold",  
        "x": 20,  
        "y": 25  
      },  
      "pptx_options": { "x": 0.28, "y": 0.35, "fontSize": 24, "color": "444444" }  
    },  
    "elements": [  
      {  
        "element_type": "bullet_point",  
        "text": "Some text here",  
        "konva_component": "Konva.Text",  
        "properties": {  
          "fontSize": 18,  
          "fontWeight": "",  
          "fontFamily": "Roboto",  
          "width": 80,  
          "height": 60,  
          "fill": "#444",  
          "fontStyle": "",  
          "zIndex": 1,  
          "x": 30,  
          "y": 119  
        },  
        "pptx_options": { "x": 0.42, "y": 1.65, "w": 1.11, "h": 0.83, "fontSize": 18, "color": "444444" }  
      },  
      {  
        "text": "Title Text",  
        "konva_component": "Konva.Text",  
        "element_type": "text",  
        "element_id": "6f9c15a1-88c3-4d0a-a8b3-5bd2cad70cf8",  
        "properties": {  
          "fontSize": 32,  
          "fontFamily": "Inter",  
          "fill": "#222",  
          "fontStyle": "normal",  
          "fontWeight": "700",  
          "x": 323.20001220703125,  
          "y": 178.39990234375,  
          "width": 500,  
          "align": "left",  
          "zIndex": 5  
        },  
        "pptx_options": { "x": 0.42, "y": 1.65, "w": 4, "h": 0.5, "fontSize": 18, "color": "444444" }  
      },    
      {  
        "element_type": "shape",  
        "konva_component": "Konva.Rect",  
        "properties": {  
          "x": 120,  
          "y": 150,  
          "width": 80,  
          "height": 60,  
          "fill": "#3498db",  
          "zIndex": 4  
        },  
        "pptx_options": { "shape": "rect", "x": 1.67, "y": 2.08, "w": 1.11, "h": 0.83, "fill": "3498db" }  
      }
     {  
        "element_type": "image",  
        "konva_component": "Konva.Image",  
        "properties": {  
          "imageSrc": "base64",  
          "x": 560,  
          "y": 110,  
          "width": 380,  
          "height": 320,  
          "zIndex": 6 
        },  
        "pptx_options": { "x": 7.78, "y": 1.53, "w": 5.28, "h": 4.44 }  
      },
    ],  
    "image_url": "img base64"  
  }  
]  

${metaPrompt}

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

module.exports = { templateJSONService };
