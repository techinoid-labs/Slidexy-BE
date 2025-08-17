const crypto = require("crypto");
const { templateJSONService } = require("../services/templateJSONService");
const {
  generateTemplateImageService,
} = require("../services/generateTemplateImageService"); // new service

const generatePptTemplateHandler = async (req, res) => {
  try {
    const { topic, slideCount = 3, meta = {} } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Step 1: Generate slide JSON from AI
    const slidesArray = await templateJSONService(topic, meta, slideCount);

    if (!Array.isArray(slidesArray)) {
      return res.status(500).json({ error: "Invalid template format from AI" });
    }

    // 2. Generate images for only `image` elements
    for (const slide of slidesArray) {
      for (const el of slide.elements || []) {
        if (el.element_type === "image") {
          // Build a richer prompt from the whole slide
          const promptParts = [
            `Topic: ${topic}`,
            slide.slide_title?.text ? `Title: ${slide.slide_title.text}` : "",
          ].filter(Boolean);

          const prompt = promptParts.join(" | ");

          // Pass full slide + element so service can use more context if needed
          const aiImageBase64 = await generateTemplateImageService(
            prompt,
            crypto.randomUUID(),
            { slide, element: el }
          );

          // Replace imageSrc with the base64 image string
          el.properties.imageSrc = aiImageBase64;
        }
      }
    }

    // Step 3: Map into your final presentation structure
    const presentation = {
      slides: slidesArray.map((slide) => ({
        slide_id: slide.slide_id || crypto.randomUUID(),
        slide_title: {
          text: slide.slide_title?.text || "",
          properties: {
            zIndex: slide.slide_title?.properties?.zIndex ?? 200,
            fontSize: slide.slide_title?.properties?.fontSize || 24,
            width: slide.slide_title?.properties?.width || 600,
            height: slide.slide_title?.properties?.height || 50,
            fontFamily: slide.slide_title?.properties?.fontFamily || "Arial",
            fill: slide.slide_title?.properties?.fill || "#000000",
            fontWeight: slide.slide_title?.properties?.fontWeight || "normal",
            x: slide.slide_title?.properties?.x || 0,
            y: slide.slide_title?.properties?.y || 0,
            align: slide.slide_title?.properties?.align || "left",
          },
        },
        elements: (slide.elements || []).map((el) => {
          const base = {
            element_id: crypto.randomUUID(),
            element_type: el.element_type,
            konva_component: el.konva_component,
          };

          if (
            el.element_type === "text" ||
            el.element_type === "bullet_point"
          ) {
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
              properties: {
                zIndex: el.properties?.zIndex ?? 50,
                rotation: el.properties?.rotation,
                x: el.properties?.x,
                y: el.properties?.y,
                width: el.properties?.width,
                height: el.properties?.height,
                fill: el.properties?.fill,
                stroke: el.properties?.stroke,
                strokeWidth: el.properties?.strokeWidth,
                radius: el.properties?.radius,
                radiusX: el.properties?.radiusX,
                radiusY: el.properties?.radiusY,
                sides: el.properties?.sides,
                points: el.properties?.points,
                numPoints: el.properties?.numPoints,
                innerRadius: el.properties?.innerRadius,
                outerRadius: el.properties?.outerRadius,
                opacity: el.properties?.opacity,
                cornerRadius: el.properties?.cornerRadius,
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
              },
            };
          }

          return base;
        }),
        image_url: slide.image_url || "",
      })),
    };

    return res.json(presentation);
  } catch (err) {
    console.error("Error generating PPT template:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { generatePptTemplateHandler };
