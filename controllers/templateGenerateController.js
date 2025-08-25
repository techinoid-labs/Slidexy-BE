const crypto = require("crypto");
const { templateJSONService } = require("../services/templateJSONService");
const { generateTemplateImageService } = require("../services/generateTemplateImageService");
const { bridgeTemplate } = require("../services/templateBridgeServices");
const { generateMultipleThemes } = require("../services/generateThemeImage");

const generatePptTemplateHandler = async (req, res) => {
  try {
    const { topic, slideCount = 3, meta = {} } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Step 1: Generate themes to ensure consistency
    const themes = await generateMultipleThemes(topic, 2);
    if (!themes || themes.length === 0) {
      return res.status(500).json({ error: "Failed to generate themes" });
    }
    // Select the first theme for consistency
    const selectedTheme = themes[0];

    // Step 2: Pass theme to templateJSONService for consistent slide generation
    const slidesArray = await templateJSONService(topic, { ...meta, theme: selectedTheme }, slideCount);
    if (!Array.isArray(slidesArray)) {
      return res.status(500).json({ error: "Invalid template format from AI" });
    }

    // Step 3: Normalize slides
    const normalizedSlides = await bridgeTemplate(slidesArray, topic, meta);

    // Step 4: Generate images for backgrounds and elements, passing the theme
    for (const slide of normalizedSlides) {
      if (slide.image_url) {
        const bgPrompt = `Background image for slide on topic "${topic}"`;
        const aiBgBase64 = await generateTemplateImageService(
          bgPrompt,
          crypto.randomUUID(),
          { slide, element: null, theme: selectedTheme }
        );
        slide.image_url = aiBgBase64;
      }

      for (const el of slide.elements || []) {
        if (el.element_type === "image") {
          const titleEl = slide.elements.find((e) => e.role === "title");
          const promptParts = [
            `Topic: ${topic}`,
            titleEl?.text ? `Title: ${titleEl.text}` : "",
          ].filter(Boolean);

          const prompt = promptParts.join(" | ");

          const aiImageBase64 = await generateTemplateImageService(
            prompt,
            crypto.randomUUID(),
            { slide, element: el, theme: selectedTheme }
          );

          el.properties.imageSrc = aiImageBase64;
        }
      }
    }

    // Step 5: Build final response structure
    const presentation = {
      theme: {
        font: selectedTheme.font,
        primaryColor: selectedTheme.primaryColor,
        secondaryColor: selectedTheme.secondaryColor,
        backgroundColor: selectedTheme.backgroundColor,
        textColor: selectedTheme.textColor,
      },
      slides: normalizedSlides.map((slide) => ({
        slide_id: slide.slide_id || crypto.randomUUID(),
        slide_title: slide.slide_title,
        image_url: slide.image_url || "",
        elements: (slide.elements || []).map((el) => {
          const base = {
            element_id: crypto.randomUUID(),
            element_type: el.element_type,
            konva_component: el.konva_component,
            role: el.role,
          };

          if (["text", "bullet_point", "title"].includes(el.element_type)) {
            return {
              ...base,
              text: el.text || "Text here",
              properties: {
                zIndex: el.properties?.zIndex ?? 200,
                fontSize: el.properties?.fontSize || 16,
                fontFamily: el.properties?.fontFamily || selectedTheme.font || "Arial",
                fill: el.properties?.fill || selectedTheme.textColor || "#000000",
                fontStyle: el.properties?.fontStyle,
                fontWeight: el.properties?.fontWeight,
                x: el.properties?.x || 0,
                y: el.properties?.y || 0,
                width: el.properties?.width || 200,
                height: el.properties?.height,
                align: el.properties?.align || "left",
              },
            };
          }

          if (el.element_type === "shape") {
            return {
              ...base,
              properties: {
                ...el.properties,
                fill: el.properties?.fill || selectedTheme.secondaryColor || "#000000",
              },
            };
          }

          if (el.element_type === "image") {
            return {
              ...base,
              properties: {
                zIndex: el.properties?.zIndex ?? 1,
                imageSrc: el.properties?.imageSrc || "",
                x: el.properties?.x || 0,
                y: el.properties?.y || 0,
                width: el.properties?.width || 100,
                height: el.properties?.height || 100,
                rounded: el.properties?.rounded || 10,
              },
            };
          }

          return base;
        }),
      })),
    };

    return res.json(presentation);
  } catch (err) {
    console.error("Error generating PPT template:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { generatePptTemplateHandler };