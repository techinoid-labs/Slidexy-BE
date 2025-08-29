// const crypto = require("crypto");
// const { templateJSONService } = require("../services/templateJSONService");
// const {
//   generateTemplateImageService,
// } = require("../services/generateTemplateImageService");
// const { bridgeTemplate } = require("../services/templateBridgeServices");
// const { generateMultipleThemes } = require("../services/generateThemeImage");

// const generatePptTemplateHandler = async (req, res) => {
//   try {
//     const { topic, slideCount = 3, meta = {} } = req.body;

//     if (!topic) {
//       return res.status(400).json({ error: "Topic is required" });
//     }

//     // Step 1: Generate themes to ensure consistency
//     // const themes = await generateMultipleThemes(topic, 2);
//     // if (!themes || themes.length === 0) {
//     //   return res.status(500).json({ error: "Failed to generate themes" });
//     // }
//     // Select the first theme for consistency
//     // const selectedTheme = themes[0];

//     // Step 2: Pass theme to templateJSONService for consistent slide generation
//     const slidesArray = await templateJSONService(topic, meta, slideCount);

//     if (!Array.isArray(slidesArray)) {
//       return res.status(500).json({ error: "Invalid template format from AI" });
//     }

//     // Step 3: Normalize slides
//     const normalizedSlides = await bridgeTemplate(slidesArray, topic, meta);

//     // Step 4: Generate images for backgrounds and elements, passing the theme
//     for (const slide of normalizedSlides) {
//       if (slide.image_url) {
//         const aiBgBase64 = await generateTemplateImageService(
//           crypto.randomUUID(),
//           { slide, element: null }
//         );
//         slide.image_url = aiBgBase64;
//       }

//       for (const el of slide.elements || []) {
//         if (el.element_type === "image") {
//           const aiImageBase64 = await generateTemplateImageService(
//             crypto.randomUUID(),
//             { slide, element: el }
//           );

//           el.properties.imageSrc = aiImageBase64;
//         }
//       }
//     }

//     // Step 5: Build final response structure
//     const presentation = {
//       slides: normalizedSlides.map((slide) => ({
//         slide_id: slide.slide_id || crypto.randomUUID(),
//         slide_title: slide.slide_title,
//         image_url: slide.image_url || "",
//         elements: (slide.elements || []).map((el) => {
//           const base = {
//             element_id: crypto.randomUUID(),
//             element_type: el.element_type,
//             konva_component: el.konva_component,
//             role: el.role,
//           };

//           if (["text", "bullet_point", "title"].includes(el.element_type)) {
//             return {
//               ...base,
//               text: el.text || "Text here",
//               properties: {
//                 zIndex: el.properties?.zIndex ?? 200,
//                 fontSize: el.properties?.fontSize || 16,
//                 fontFamily: el.properties?.fontFamily || "Arial",
//                 fill: el.properties?.fill || "#000000",
//                 fontStyle: el.properties?.fontStyle,
//                 fontWeight: el.properties?.fontWeight,
//                 x: el.properties?.x || 0,
//                 y: el.properties?.y || 0,
//                 width: el.properties?.width || 200,
//                 height: el.properties?.height,
//                 align: el.properties?.align || "left",
//               },
//             };
//           }

//           if (el.element_type === "shape") {
//             return {
//               ...base,
//               properties: {
//                 ...el.properties,
//                 fill: el.properties?.fill || "#000000",
//               },
//             };
//           }

//           if (el.element_type === "image") {
//             return {
//               ...base,
//               properties: {
//                 zIndex: el.properties?.zIndex ?? 1,
//                 imageSrc: el.properties?.imageSrc || "",
//                 x: el.properties?.x || 0,
//                 y: el.properties?.y || 0,
//                 width: el.properties?.width || 100,
//                 height: el.properties?.height || 100,
//                 rounded: el.properties?.rounded || 10,
//               },
//             };
//           }

//           return base;
//         }),
//       })),
//     };

//     return res.json(presentation);
//   } catch (err) {
//     console.error("Error generating PPT template:", err.message);
//     return res.status(500).json({ error: err.message });
//   }
// };

// module.exports = { generatePptTemplateHandler };

// controllers/templateGenerateController.js
const { getTitlesService } = require("../services/unit-services/getTitlesService");
const { getBulletsService } = require("../services/unit-services/getBulletsService");
const { getImagesService } = require("../services/unit-services/getImagesService");
const { bridgeTemplate } = require("../services/templateBridgeServices");
const { MongoClient } = require("mongodb");
const Presentation = require("../models/Presentation");
const crypto = require("crypto");

const generatePptTemplateHandler = async (req, res) => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("test");
  try {
    const { topic, slideCount = 5, meta = {} } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    // Step 1: Get titles
    const titles = await getTitlesService(topic, slideCount, meta);

    // Step 2: Get bullets (as arrays of KonvaComponents)
    const bulletsPerSlide = await getBulletsService(topic, titles, meta);

    // Step 3: Get images (backgrounds, captions, element images as KonvaComponents)
    const imagesPerSlide = await getImagesService(topic, titles, meta, db);

    // Step 4: Combine into Slide array
    const slides = titles.map((title, index) => {
      const titleComponent = {
        konva_component: "Konva.Text",
        element_type: "title",
        text: title,
        properties: {
          fontSize: 36,
          fontFamily: "Montserrat, sans-serif",
          fill: "#1F2937",
          x: 40,
          y: 40,
          width: 880,
          height: 80,
          align: "center",
          zIndex: 9999,
        },
      };

      const elements = [
        ...bulletsPerSlide[index], // Bullets
        ...imagesPerSlide[index].elementImages, // Image elements
        {
          konva_component: "Konva.Rect",
          element_type: "shape",
          properties: {
            x: 40,
            y: 140,
            width: 880,
            height: 360,
            fill: "#E5E7EB",
            opacity: 0.7,
            cornerRadius: 15,
            zIndex: 100,
          },
        },
      ];

      return {
        slide_id: `slide-${crypto.randomUUID()}`,
        slide_title: titleComponent, // Keep as KonvaComponent
        elements, // Ensure titleComponent is not duplicated here
        image_url: imagesPerSlide[index].image_url,
        image_caption: imagesPerSlide[index].image_caption,
        titleBlock: { elements: [titleComponent], width: 960, height: 100 },
        textBlock: { elements: bulletsPerSlide[index], width: 400, height: 300 },
        imageBlock: { elements: imagesPerSlide[index].elementImages, width: 500, height: 400 },
      };
    });

    // Step 5: Normalize (using bridgeTemplate)
    const normalizedSlides = await bridgeTemplate(slides, topic, meta);

    // Step 6: Store in DB
    const presentation = new Presentation({
      topic,
      meta,
      slides: normalizedSlides,
    });
    await presentation.save();

    // Return the presentation
    return res.json({ presentation_id: presentation.presentation_id, slides: presentation.slides });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { generatePptTemplateHandler };