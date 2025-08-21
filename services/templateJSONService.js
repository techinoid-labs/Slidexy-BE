const { textGenModel } = require("../utils/geminiModels");
const JSON5 = require("json5");
const layouts = require("../utils/layoutLibrary");

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

  // Convert layouts object to a string for inclusion in the prompt
  const layoutsString = JSON.stringify(layouts, null, 2);

   const prompt = `You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates** so you will absolutely not generate some old style design of a presentaion template form 10-20 years goo like form 2006 it should be very modern and design driver with update date year 2025 standards, it should be something Users would find very appealing.
 
Canvas size: **960×540 px** (ppt size should be "10" × "5.625" or scaled widthxheight 960/10 × 540/5.625)
 
You will output ONLY a **valid JSON array** of exactly ${
    slideCount || 5
  } slides in the EXACT structure provided below.
 
 
 
### VARIATION & DESIGN RULES (MANDATORY)
 
You must generate slides with **modern 2025 presentation design aesthetics** (inspired by platforms like Gamma, Pitch, and SlidesGo). Every slide layout should feel fresh, minimal, and design-driven — never old-fashioned.
 
### PREDEFINED LAYOUTS
The following layouts are available for selection. You **MUST** pick from these exact layouts (by key name) when designing slides:

${layoutsString}

Rules:
- Choose layouts randomly, ensuring **no two consecutive slides** use the same layout unless absolutely necessary for thematic consistency.
- Ensure a **variety of layout types** across the deck (not only image-heavy or text-heavy).
- Customize each layout’s elements to match a **modern 2025 aesthetic**.
- Backgrounds must be **clean** (solid colors, gradients, or images without embedded text).


- Randomly choose a different **layout style** for each slide. Do not repeat the exact same layout consecutively. You can choose it from "${layouts}"  
- Allowed layout variations include (but are not limited to):
  1. Full-bleed background image (no embedded text inside the image) + overlay text elements + optional semi-transparent shapes.
  2. Split-column layout (image on left/right, text on the other side).
  3. Multi-image grid (2–4 small images with text and shapes).
  4. Circular or polygonal image masks (ellipse, star, hexagon, etc.).
  5. Split-screen (half background image, half solid-color shape block).
  6. Two horizontal images OR one image + one solid rect background with clearly placed text.
  7. Title-only or minimal intro slide (image + shapes + clean text placement).
  8. Half-and-half background: one half image, the other half shape with theme-matching color.
  9. Text placed inside card-style shapes (rounded rects) with proper centering.
  10. Column Cards should not span the whole height of the Canvas
  11. Use a landscape split-screen layout on a slide with either side having an image and the other side having a shape as a rect having a background with the columns should be in the shape as backgroun side.
  12. Don't add polygons or stars unless absolutely necessary
  13. The first slide may have just a Text title with accompanying normal text element on either left or right side with just a background image
 
#### Shape & Column Variations
- Randomize number of columns (3–5) where relevant.  
- Use **contrasting but harmonious colors** (bold, funky accents like red, blue, green, purple — but always theme-matching).  
- Vary orientation (horizontal / vertical).  
- Vary shape types: Rect, Ellipse, Star, RegularPolygon, Line, etc.  
- Cards (rounded Rects) and dividers (Lines) should be used where helpful to organize content.
 
#### Placement Rules
- Always respect **zIndex order**:
  - Text on top of shapes  
  - Shapes above images  
  - Unless intentionally reversed for aesthetic effect.  
- Title text should vary in position: top-left, top-right, center, bottom-left, bottom-right.  
- Image placement should vary: background, side column, small accent, masked, or split-screen.  
 
#### First Slide Guidelines
- The first slide should be **simpler and elegant**, acting as a cover.  
- Possible variations:
  - Clean background image with a bold title + optional accent shape.  
  - Split-screen (title on one side, image/visual on the other).  
  - Title with one or two accent shapes and minimal graphics.  
  - Title text inside a centered card (rounded rect).  
 
#### Aesthetic & Modern Style
- Use **modern 2025 design trends**:
  - Flat but bold colors, gradients, subtle shadows, minimalism.  
  - High contrast but clean readability.  
  - No clutter, no 2000s-style clipart.  
- Shapes should never look empty:  
  - If text only fills ~30% of a shape, either resize shape proportionally OR add supporting graphic elements.  
  - If no graphic is needed, center text both horizontally and vertically inside the shape.  
 
#### Strict Rules
- Never embed text inside generated images.  
- Never leave shapes oversized compared to the content inside.  
- Always balance color palettes and composition for a modern look.  
- Every slide must look like part of the same theme but with varied layouts.  
 
 
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
  ---
 
  ### OUTPUT RULES
  ⚠️ Output ONLY a valid JSON array. No markdown, no prose, no comments.
  ⚠️ Every property must have a value (no null, no missing).
  ⚠️ Keys must match exactly, case-sensitive.
  ⚠️ No explanations, comments, or extra text outside the JSON.
 
  ---
 
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
            "opacity":0.5,
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
      "element_type": "shape",
      "konva_component": "Konva.Circle",
      "properties": { "x": 100, "y": 300, "radius": 60, "fill": "#FFAAAA", "opacity": 0.7, "zIndex": 1 }
    },
    {
      "element_type": "shape",
      "konva_component": "Konva.Line",
      "properties": { "points": [20,400, 200,500], "stroke": "#222", "strokeWidth": 3, "opacity": 0.8, "zIndex": 3 }
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
            Similarly other shapes for Konva_component types mentioned in the prompt or more text or image data
      ]
    }
 
 
 
 
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