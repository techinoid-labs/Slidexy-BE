const crypto = require("crypto");
const { templateJSONService } = require("../services/templateJSONService");
const { generateTemplateImageService } = require("../services/generateTemplateImageService");
const { bridgeTemplate } = require("../services/templateBridgeServices");

const generatePptTemplateHandler = async (req, res) => {
  try {
    const { topic, slideCount = 3, meta = {} } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Step 1: Raw template from Gemini (or initial service)
    const slidesArray = await templateJSONService(topic, meta, slideCount);
    if (!Array.isArray(slidesArray)) {
      return res.status(500).json({ error: "Invalid template format from AI" });
    }

  
    const normalizedSlides = await bridgeTemplate(slidesArray, topic, meta);

    // Step 3: Generate images for backgrounds and elements
    for (const slide of normalizedSlides) {
      if (slide.image_url) {
        const bgPrompt = `Background image for slide on topic "${topic}"`;
        const aiBgBase64 = await generateTemplateImageService(
          bgPrompt,
          crypto.randomUUID(),
          { slide, element: null }
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
            { slide, element: el }
          );

          el.properties.imageSrc = aiImageBase64;
        }
      }
    }

    // Step 4: Build final response structure
    const presentation = {
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
                fontFamily: el.properties?.fontFamily || "Arial",
                fill: el.properties?.fill || "#000000",
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
              properties: { ...el.properties },
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
                rounded: el.properties?.rounded || 1,
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
