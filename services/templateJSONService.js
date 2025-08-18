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
  const prompt = `You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates** so you will absolutely not generate some old style design of a presentaion template form 10-20 years goo like form 2006 it should be very modern and design driver with update date year 2025 standards, it should be something Users would find very appealing.

Canvas size: **960×540 px** (ppt size should be "10" × "5.625" or scaled widthxheight 960/10 × 540/5.625)

You will output ONLY a **valid JSON array** of exactly ${
    slideCount || 5
  } slides in the EXACT structure provided below.

### ABSOLUTE RULES (NO OMISSIONS)
1.  **Every slide** must have:
+    - A \`slide_id\` (unique)
+    - A \`slide_title\` which will be used to just identitfy the topic of that slide whcih will also be used as the display text in the element with element_type title
+    - An \`elements\` array containing **all** objects necessary for a visually complete, modern, design-rich template.
+    - An \`imageSrc\` (use a placehold.co URL)
+    - Title (in element_type title) and its properties zIndex must be the highest even higher than any image or shape
+    - An \`image_url\` property:  
+        - Element Type image in the elements array should not be used as background, only full width backgrounds should be added to image_url  
+        - If no background image is used, set this to an empty string \`""\`.  
+    - An \`elements\` array containing **all elements** (including the \`slide_title\` as an element with \`element_type: "text"\`).  
+    - Titles (\`element_type: "title"\`) must have the highest \`zIndex\`, above all shapes and images.

2.  **Every element** must:
    - Include \`element_type\`, \`konva_component\`, and **full** \`properties\` in **pixels**.
    - Contain **all relevant visual & positioning details**:
      - Position (x, y)
      - Size (width, height, radius, innerRadius, outerRadius, radiusX, radiusY, sides, points)
      - Colors (fill, stroke if applicable)
      - Stroke width (strokeWidth if applicable)
      - Text related elements must contain Font details (fontSize, fontFamily, fontStyle, fontWeight, align)
      - zIndex
      - imageSrc if image
      - Shapes should always have lower zIndex than that of text, bullet_text or title or any text related elements
      - Both Image or shape must never be used as background only one of them per slide
      - Every shape must not be the same color unless needed in some cases otherwise always use different but theme matching color palette for shapes

3.  **Image Rules (MANDATORY)**:
       - Every slide **must** contain at least one \`image\` element inside \`elements\`, BUT these images are **for display only** (e.g., side column, grid, accent images). 
       -  For image_url juse this: cc
    - Only the top-level \`image_url\` property may be a full-canvas background.  
        - \`element_type: "image"\` inside \`elements\` **must never** span the full canvas (960×540). Their \`width\` or \`height\` must always be **less than 80%** of the canvas dimensions as they would only be used to render relavent image absed on the main topic of the slides and current slide the image is being generated in 
   - Use (placehold.co) for all \`elements.image\`.  
    - Images inside \`elements\` must have accurate, proportional dimensions and must not overlap all other content.  
 - There can be more than one image element if needed to illustrate or add more feel to the slide.
 - Allow images to be rounded as well not fully cornered and have a numeric cornerRadius

4.  **Shapes and Columns (Konva only) NO EXCEPTIONS ON MISSING PROPERTIES**:
- You MUST NOT use a full-canvas shape if a full-canvas image background is already present.
- Each shape must always have an opacity property and opacity should not be done is the fill property with color
+ Only use shapes for overlays that are partial and intentionally placed (e.g., column backgrounds, title bars, highlight boxes).
+ Overlay shapes MUST NOT block the full image — they should leave some portion of the image visible.
    - Rect → rect {x,y,w,h,fill,cornerRadius, opacity}
    - Circle/Ellipse → ellipse {x,y,w,h,fill,opacity}
    - Star → star {x,y,w,h,fill,opacity}
    - RegularPolygon → polygon {x,y,w,h,fill,opacity}
    - Line/Arrow → line {x,y,w,h,fill,stroke,strokeWidth,opacity}
    - Arc/Wedge → pie {x,y,w,h,fill,opacity}
    - You MUST use shapes to create visual layouts, such as vertical or horizontal columns for grouping related text and images, mirroring a professional design. The model should vary these layouts for each slide.
    - Properties per type:
      - Rect: x,y,width,height,fill,zIndex,opacity
      - Circle: x,y,radius,fill,zIndex
      - Ellipse: x,y,radiusX,radiusY,fill,zIndex
      - Star: x,y,numPoints,innerRadius,outerRadius,fill,zIndex
      - RegularPolygon: x,y,sides,radius,fill,zIndex
      - Line/Arrow: points[],stroke,fill,strokeWidth,zIndex
      - Arc/Wedge: x,y,radius,angle,fill,zIndex

5.  **Design Consistency**:
    - Use rounded corners for all shapes (cornerRadius: 10–20 px).
    - Maintain a consistent 20–40 px margin from slide edges.
    - Alternate between light and dark background themes across slides.
    - Ensure font sizes for headings are at least 1.5× larger than body text.
    - Use a consistent color palette, which may change per slide for visual interest.
    - Professional fonts or any other that fit the theme of design and aesthetics.
    - Some text elements should contain longer placeholder text to fill their designated column or text box, creating a balanced visual.

6.  No missing fields — fontFamily must be present in base properties.
7.  Use images from placehold.co if not using the provided one.
8.  \`element_type: "text"\` or \`"bullet_point"\` or even \`title\` should always have a text property.
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
- Randomly choose a different layout for each slide, altough they do not have to be strictly as the example, you can be creative as well. Examples:
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
 8: A possible design related layout could be with the background image being half width or height to the Canvas and the other half being a shape or anything matching the color of the theme or presentaion topic or slide
 9 Never leave empty places inside of shapes where there are text added,for example, in some cases the text inside a shape will only fill around 30% of the shape's (Rect in most cases) width or height in that case either reduce the shape's height or width based on text content or add some other graphic etc.
 10. The very first slide can also be just a background image with releveant graphics with even a picture of the relevant topic and a title or text on either side of the slide
 
[
  {
    "slide_id": "slide-UNIQUE_ID",
    "slide_title":"Main topic about the slide"
    "image_url": "placehold.co",
    "elements": [
      {
        "element_type": "title",
        "text": "Slide Title",
        "konva_component": "Konva.Text",
        "properties": {
          "fontSize": 24,
          "width": 400,
          "height": 60,
          "fontFamily": "Roboto",
          "fill": "#444",
          "fontWeight": "bold",
          "x": 20,
          "y": 25,
          "zIndex": 5
        }
      },
      {
        "element_type": "image",
        "konva_component": "Konva.Image",
        "properties": {
          "imageSrc": "placehold.co",
          "x": 0,
          "y": 0,
          "width": 960,
          "height": 540,
          "zIndex": 1
          "rounded":10
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
      }
    ]
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
