const { textGenModel } = require("../utils/geminiModels");
const JSON5 = require("json5"); // ✅ tolerant JSON parser

async function templateJSONService(rawText, meta = {}, slideCount = 5) {
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
  const prompt = `You are an expert presentation template designer (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates**.

Canvas size: **960×540 px** (ppt size should be "10" × "5.625" or scaled widthxheight 960/10 × 540/5.625)

You will output ONLY a **valid JSON array** of exactly ${
    slideCount || 5
  } slides in the EXACT structure provided below.

### ABSOLUTE RULES (NO OMISSIONS)
1.  **Every slide** must have:
    - A \`slide_id\` (unique)
    - A \`slide_title\` object (with text and full Konva "properties")
    - An \`elements\` array containing **all** objects necessary for a visually complete, modern, design-rich template.
    - An \`imageSrc\` (use a placehold.co URL)
    - Title (slide_title) and its properties zIndex must be the highest even higher than any image or shape

2.  **Every element** must:
    - Include \`element_type\`, \`konva_component\`, and **full** \`properties\` in **pixels**.
    - Contain **all relevant visual & positioning details**:
      - Position (x, y)
      - Size (width, height, radius, innerRadius, outerRadius, radiusX, radiusY, sides, points)
      - Colors (fill, stroke if applicable)
      - Stroke width (strokeWidth if applicable)
      - Font details (fontSize, fontFamily, fontStyle, fontWeight, align)
      - zIndex
      - imageSrc if image
      - Shapes should always have lower zIndex than that of text, bullet_text
      - image should always have the lowest zIndex if it is used as a background 960x540 and same for shapes if they are used as background
      - Both Image or shape must never be used as background only one of them per slide
      - Every shape must not be the same color always use different but theme matching color palette for shapes

3.  **Image Rules (MANDATORY)**:
    - Every slide **must** contain at least one \`image\` element.
    - Images can be used for a full-canvas background. For these, the \`properties\` should be: \`{ x: 0, y: 0, width: 960, height: 540, zIndex: 0 }\`.
    - Use this specific URL for all images: \`/images/create-presentation/new-slide-img.png\`.
    - Images must have **accurate, proportional dimensions** in properties.

4.  **Shapes and Columns (Konva only) NO EXCEPTIONS ON MISSING PROPERTIES**:
- You MUST NOT use a full-canvas shape if a full-canvas image background is already present.
+ Only use shapes for overlays that are partial and intentionally placed (e.g., column backgrounds, title bars, highlight boxes).
+ Overlay shapes MUST NOT block the full image — they should leave some portion of the image visible.
    - Rect → rect {x,y,w,h,fill}
    - Circle/Ellipse → ellipse {x,y,w,h,fill}
    - Star → star {x,y,w,h,fill}
    - RegularPolygon → polygon {x,y,w,h,fill}
    - Line/Arrow → line {x,y,w,h,fill,stroke,strokeWidth}
    - Arc/Wedge → pie {x,y,w,h,fill}
    - You MUST use shapes to create visual layouts, such as vertical or horizontal columns for grouping related text and images, mirroring a professional design. The model should vary these layouts for each slide.
    - Properties per type:
      - Rect: x,y,width,height,fill,zIndex,opacity (optional for overlays)
      - Circle: x,y,radius,fill,zIndex
      - Ellipse: x,y,radiusX,radiusY,fill,zIndex
      - Star: x,y,numPoints,innerRadius,outerRadius,fill,zIndex
      - RegularPolygon: x,y,sides,radius,fill,zIndex
      - Line/Arrow: points[],stroke,fill,strokeWidth,zIndex
      - Arc/Wedge: x,y,radius,angle,fill,zIndex

5.  **Design Consistency**:
    - Clean, modern, and professional aesthetic.
    - Use rounded corners for all shapes (cornerRadius: 10–20 px).
    - Maintain a consistent 20–40 px margin from slide edges.
    - Alternate between light and dark background themes across slides.
    - Ensure font sizes for headings are at least 1.5× larger than body text.
    - Use a consistent color palette, which may change per slide for visual interest.
    - Professional fonts or any other that fit the theme of design and aesthetics.
    - Some text elements should contain longer placeholder text to fill their designated column or text box, creating a balanced visual.

6.  No missing fields — fontFamily must be present in base properties.
7.  Use images from placehold.co if not using the provided one.
8.  \`element_type: "text"\` or \`"bullet_point"\` should always have a text property.
9.  All defined properties for corresponding shapes should be present in the structure NO EXCEPTIONS.
10. Ensure that the theme, text/font color, and family match the topic.
11. You can create other shapes that are compatible with pptx like fat arrows with text inside etc.
12. Always keep text above other shapes and images (zIndex for text should be higher).
13. Z-indices should be incremental starting from 1 with small gaps.
14. At least 3 of the slides must feature multi-column layouts, with each column represented by a shape element (Rect) behind its text.
+ The number of columns per slide must vary between 2 and 5.
+ Columns may be arranged horizontally or vertically (stacked).
+ Shapes must have padding (20–40 px) from their inner text and spacing (20–40 px) between columns.
+ Any overlay shapes on image backgrounds must:
+ - Be smaller than the full slide dimensions (max 90% width or height).
+ - Have an opacity between 0.3 and 0.7 to keep the image visible.
+ - Be placed strategically.

### VARIATION RULES (MANDATORY)
- Randomly choose a different layout for each slide. Examples:
  1. Full background image with overlay text and semi-transparent shapes.
  2. Image in a left or right column with text in the other column.
  3. Multiple small images arranged in a grid with titles and shapes.
  4. Circular or polygonal image masks.
  5. Split-screen layouts with image on one side and solid color shape on the other.
- Randomly vary:
  - Number of columns (2–5)
  - Column orientation (horizontal / vertical)
  - Shape types (Rect, Ellipse, Star, RegularPolygon, etc.)
  - Color palette (theme-matching but different per slide)
  - Title position (top-left, top-right, center, bottom-left, bottom-right)
  - Image placement (background, side column, small accent)
- Ensure that at least one slide has **no full image background**, only partial images with shapes.
- Avoid repeating the exact same layout style in consecutive slides.
- Always respect zIndex so that text is above shapes, and shapes are above images, unless intentionally reversed for effect.
 6. In some slides we can have two horizontal images or one image and one shape (rect) as a background which appropriate and clearly visible placing of the text
 7. First slide may be only a title and a few elements or shapes for aesthetic and an image with a relavent theme design where these is no overlapping element
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
      }  
    },  
    "elements": [  
      {  
        "element_type": "image",  
        "konva_component": "Konva.Image",  
        "properties": {  
          "imageSrc": "/images/create-presentation/new-slide-img.png",  
          "x": 0,  
          "y": 0,  
          "width": 960,  
          "height": 540,  
          "zIndex": 1
        }
      },
      {  
        "element_type": "text",  
        "text": "Column 1 Title",  
        "konva_component": "Konva.Text",  
        "properties": {  
          "fontSize": 20,  
          "fontFamily": "Inter",  
          "fill": "#FFFFFF",  
          "fontWeight": "bold",  
          "x": 50,  
          "y": 100,  
          "width": 400,  
          "align": "center",  
          "zIndex": 3  
        }
      },
      {  
        "element_type": "shape",  
        "konva_component": "Konva.Rect",  
        "properties": {  
          "x": 20,  
          "y": 90,  
          "width": 440,  
          "height": 400,  
          "fill": "#000000",  
          "opacity": 0.5,  
          "zIndex": 2  
        }
      }  
    ],  
  }  
]  


- IMPORTANT: Return only a valid JSON object no exctra works before or after the object etc

${metaPrompt}

Content:  
"""${rawText}"""  

`;

  console.log("Prompt:", prompt);

  const result = await textGenModel.generateContent(prompt);
  const raw = result.response.text();

  // Remove code fences & trim
  let cleaned = raw.replace(/```json|```/g, "").trim();

  // Slice strictly between first [ and last ]
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) {
    console.error("No JSON array detected in model response:", cleaned);
    throw new Error("No JSON array found in model response");
  }

  let jsonString = cleaned.slice(start, end + 1);

  // Parse with JSON5 for robust handling
  try {
    const parsed = JSON5.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error("Failed to parse JSON output. Raw content:", cleaned);
    throw new Error(
      "Failed to parse model response as valid JSON after cleanup."
    );
  }
}

module.exports = { templateJSONService };
