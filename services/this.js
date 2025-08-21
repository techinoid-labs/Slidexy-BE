const { textGenModel } = require("../utils/geminiModels");
const JSON5 = require("json5");
const layouts = require("./layouts"); // Assuming your layouts file is in the same directory

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

  const prompt = `You are an expert presentation template designer for the year 2025, creating **pixel-perfect, fully detailed templates** with modern design aesthetics inspired by platforms like Gamma.ai, Pitch, and SlidesGo. The templates must be visually appealing, minimal, and design-driven, avoiding outdated styles from the 2000s or 2010s.

Canvas size: **960×540 px** (equivalent to PowerPoint size 10" × 5.625").

You will output ONLY a **valid JSON array** of exactly ${slideCount || 5} slides, with each slide based on one of the predefined layouts provided below. Each slide must adhere to the structure and rules outlined, ensuring variety and modern aesthetics.

### PREDEFINED LAYOUTS
The following layouts are available for selection. You **MUST** choose one of these layouts for each slide, ensuring no two consecutive slides use the same layout unless absolutely necessary for thematic consistency. Customize the elements within the chosen layout to match the modern 2025 aesthetic and the provided content.

${layoutsString}

### VARIATION & DESIGN RULES (MANDATORY)
- **Layout Selection**: For each slide, select one layout from the predefined \`layouts\` object (e.g., title_slide, content_image, comparison, etc.). Ensure variety by avoiding consecutive repetition of the same layout. The first slide should use the \`title_slide\` layout, customized to be simpler and elegant, acting as a cover.
- **Customization**: Adapt the elements within the chosen layout by:
  - Setting modern, theme-matching colors (e.g., #4A90E2, #F5A623, #FF6B6B, #2ECC71, #FFFFFF, #333333).
  - Using professional fonts (e.g., Poppins, Roboto, Inter, Montserrat) that align with the 2025 aesthetic.
  - Adding placeholder images from placehold.co for \`imageSrc\` properties (e.g., https://placehold.co/widthxheight).
  - Ensuring text content (e.g., titles, bullet points) is relevant to the input content: """${rawText}""".
  - Adjusting element properties (e.g., fill, stroke, opacity, cornerRadius) to enhance visual appeal while maintaining the layout's structure.
- **Modern 2025 Aesthetics**:
  - Use flat but bold colors, subtle gradients, minimal shadows, and clean typography.
  - Ensure high contrast and readability.
  - Avoid clutter, outdated clipart, or overly complex designs.
- **Multi-Column Layouts**: At least 3 slides must feature multi-column layouts (e.g., comparison, content_image, team_intro, image_gallery), with columns represented by \`Konva.Rect\` shapes behind text, varying between 2–5 columns, arranged horizontally or vertically.
- **First Slide**: The first slide must use the \`title_slide\` layout, customized with a bold title, optional accent shape, and a background image (via \`image_url\`) or solid color shape.

### ABSOLUTE RULES (NO OMISSIONS)
1. **Every Slide**:
   - Must have:
     - \`slide_id\`: Unique identifier (e.g., "slide-1", "slide-2").
     - \`slide_title\`: A short title relevant to the slide's topic, derived from the input content, also used as the display text in the \`element_type: "title"\` element.
     - \`image_url\`: A placehold.co URL for a full-canvas background image (960×540) or \`"\"\` if using a shape-based background.
     - \`elements\`: An array containing all elements from the chosen layout, customized with modern properties.
   - Titles (\`element_type: "title"\`) must have the highest \`zIndex\` (e.g., 5 or higher), above all shapes and images.
   - Only one of \`image_url\` (full-canvas background) or a full-canvas shape can be used per slide, not both.

2. **Every Element**:
   - Must include:
     - \`element_type\`: As defined in the chosen layout (e.g., title, text, bullet_point, image, shape).
     - \`konva_component\`: Corresponding Konva component (e.g., \`Konva.Text\`, \`Konva.Image\`, \`Konva.Rect\`, \`Konva.Ellipse\`, \`Konva.Line\`, etc.).
     - \`properties\`: Complete visual and positioning details in pixels, including:
       - Position: \`x\`, \`y\`
       - Size: \`width\`, \`height\`, \`radius\`, \`radiusX\`, \`radiusY\`, \`innerRadius\`, \`outerRadius\`, \`sides\`, \`points\` (as applicable)
       - Colors: \`fill\`, \`stroke\` (if applicable)
       - \`strokeWidth\` (if applicable)
       - Font details (for text-related elements): \`fontSize\`, \`fontFamily\`, \`fontStyle\`, \`fontWeight\`, \`align\`
       - \`zIndex\`: Incremental, starting from 1, with text-related elements (title, text, bullet_point) having higher zIndex than shapes and images.
       - \`imageSrc\`: For \`element_type: "image"\`, use placehold.co URLs (e.g., https://placehold.co/400x250).
       - \`opacity\`: For shapes and images, between 0.3–0.7 for overlays to ensure background visibility.
       - \`cornerRadius\`: For \`Konva.Rect\` and images, use 10–20 px for rounded corners.
     - Text-related elements (\`title\`, \`text\`, \`bullet_point\`) must include a \`text\` property with placeholder content derived from the input or layout role.
   - Shapes must not span the full canvas if \`image_url\` is used and must have lower \`zIndex\` than text elements.
   - Shapes must have different but theme-matching colors unless required for consistency.

3. **Image Rules**:
   - Every slide must include at least one \`element_type: "image"\` in \`elements\`, but these images must not span the full canvas (max 80% of 960×540).
   - Use placehold.co for \`imageSrc\` in \`elements\` (e.g., https://placehold.co/400x250).
   - \`image_url\` is reserved for full-canvas background images (optional, 960×540).
   - Images in \`elements\` can have \`cornerRadius\` (10–20 px) for rounded corners.
   - Multiple images are allowed if specified in the layout (e.g., image_gallery, team_intro).

4. **Shapes and Columns**:
   - Use shapes (\`Konva.Rect\`, \`Konva.Ellipse\`, \`Konva.Line\`, etc.) as defined in the chosen layout.
   - Shapes must include all required properties (e.g., \`x\`, \`y\`, \`width\`, \`height\`, \`fill\`, \`opacity\`, \`zIndex\`, \`cornerRadius\` for Rect).
   - Overlay shapes on background images must be smaller than the canvas (max 90% width/height) and have \`opacity\` between 0.3–0.7.
   - Use shapes to create column layouts where specified (e.g., comparison, content_image), with 20–40 px padding from text and spacing between columns.
   - Supported shape types:
     - Rect: \`x\`, \`y\`, \`width\`, \`height\`, \`fill\`, \`cornerRadius\`, \`opacity\`, \`zIndex\`
     - Ellipse: \`x\`, \`y\`, \`radiusX\`, \`radiusY\`, \`fill\`, \`opacity\`, \`zIndex\`
     - Line: \`points\`, \`stroke\`, \`strokeWidth\`, \`fill\`, \`opacity\`, \`zIndex\`
     - Star: \`x\`, \`y\`, \`numPoints\`, \`innerRadius\`, \`outerRadius\`, \`fill\`, \`opacity\`, \`zIndex\`
     - RegularPolygon: \`x\`, \`y\`, \`sides\`, \`radius\`, \`fill\`, \`opacity\`, \`zIndex\`

5. **Design Consistency**:
   - Maintain 20–40 px margins from slide edges.
   - Alternate between light and dark background themes across slides.
   - Ensure title font sizes are at least 1.5× larger than body text (e.g., 32–40 px for titles, 20–24 px for body).
   - Use a consistent but varied color palette per slide, matching the theme of the input content (e.g., #4A90E2, #F5A623, #FF6B6B, #2ECC71).
   - Use professional fonts (Poppins, Roboto, Inter, Montserrat).
   - Text elements should have longer placeholder text where needed to fill columns or shapes, ensuring balanced visuals.
   - Center text within shapes or columns, resizing shapes if text only fills ~30% of the space.

6. **Output Rules**:
   - Return ONLY a valid JSON array, with no markdown, prose, or comments.
   - Every property must have a value (no null, no missing).
   - Keys must match exactly, case-sensitive.
   - Example slide structure:
     [
       {
         "slide_id": "slide-1",
         "slide_title": "Introduction",
         "image_url": "https://placehold.co/960x540",
         "elements": [
           {
             "element_type": "title",
             "text": "Introduction",
             "konva_component": "Konva.Text",
             "properties": {
               "fontSize": 36,
               "fontFamily": "Poppins",
               "fontWeight": "bold",
               "fill": "#FFFFFF",
               "x": 100,
               "y": 200,
               "width": 760,
               "height": 100,
               "align": "center",
               "zIndex": 5
             }
           },
           {
             "element_type": "text",
             "text": "Welcome to the Future of AI",
             "konva_component": "Konva.Text",
             "properties": {
               "fontSize": 24,
               "fontFamily": "Inter",
               "fill": "#FFFFFF",
               "x": 100,
               "y": 320,
               "width": 760,
               "height": 60,
               "align": "center",
               "zIndex": 4
             }
           },
           {
             "element_type": "image",
             "konva_component": "Konva.Image",
             "properties": {
               "imageSrc": "https://placehold.co/960x540",
               "x": 0,
               "y": 0,
               "width": 960,
               "height": 540,
               "cornerRadius": 0,
               "opacity": 0.8,
               "zIndex": 1
             }
           }
         ]
       }
     ]

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