// // controllers/templateGenerateController.js
// const {
//   getTitlesService,
// } = require("../services/unit-services/getTitlesService");
// const {
//   getBulletsService,
// } = require("../services/unit-services/getBulletsService");
// const {
//   getImagesService,
// } = require("../services/unit-services/getImagesService");
// const { bridgeTemplate } = require("../services/templateBridgeServices");
// const Presentation = require("../models/Presentation");
// const crypto = require("crypto");

// const generatePptTemplateHandler = async (req, res) => {
//   try {
//     const { topic, slideCount = 5, meta = {}, userData } = req.body;
//     if (!topic) return res.status(400).json({ error: "Topic is required" });

//     // Step 1: Get titles
//     const titles = await getTitlesService(topic, slideCount, meta);

//     // Step 2 + 3: Get bullets and images in parallel
//     const [bulletsPerSlide, imagesPerSlide] = await Promise.all([
//       getBulletsService(topic, titles, meta),
//       getImagesService(topic, titles, meta),
//     ]);

//     // Step 4: Combine into Slide array
//     const slides = titles.map((title, index) => {
//       const titleComponent = {
//         konva_component: "Konva.Text",
//         element_type: "title",
//         text: title,
//         properties: {
//           fontSize: 36,
//           fontFamily: "Montserrat, sans-serif",
//           fill: "#1F2937",
//           x: 40,
//           y: 40,
//           width: 880,
//           height: 80,
//           align: "center",
//           zIndex: 9999,
//         },
//       };

//       const elements = [
//         ...bulletsPerSlide[index],
//         ...imagesPerSlide[index].elementImages,
//         {
//           konva_component: "Konva.Rect",
//           element_type: "shape",
//           properties: {
//             x: 40,
//             y: 140,
//             width: 880,
//             height: 360,
//             fill: "#E5E7EB",
//             opacity: 0.7,
//             cornerRadius: 15,
//             zIndex: 100,
//           },
//         },
//       ];

//       return {
//         slide_id: `slide-${crypto.randomUUID()}`,
//         slide_title: titleComponent,
//         elements,
//         image_url: imagesPerSlide[index].image_url,
//         image_caption: imagesPerSlide[index].image_caption,
//         titleBlock: { elements: [titleComponent], width: 960, height: 100 },
//         textBlock: {
//           elements: bulletsPerSlide[index],
//           width: 400,
//           height: 300,
//         },
//         imageBlock: {
//           elements: imagesPerSlide[index].elementImages,
//           width: 500,
//           height: 400,
//         },
//       };
//     });

//     // Step 5: Normalize
//     const normalizedSlides = await bridgeTemplate(slides, topic, meta);

//     // Step 6: Store in DB via mongoose
//     const presentation = new Presentation({
//       topic,
//       meta,
//       slides: normalizedSlides,
//     });
//     await presentation.save();

//     return res.json({
//       presentation_id: presentation.presentation_id,
//       slides: presentation.slides,
//     });
//   } catch (err) {
//     console.error("Error in generatePptTemplateHandler:", err);
//     return res.status(500).json({ error: err.message });
//   }
// };

// module.exports = { generatePptTemplateHandler };

// controllers/templateGenerateController.js
// controllers/templateGenerateController.js
const {
  getTitlesService,
} = require("../services/unit-services/getTitlesService");
const {
  getBulletsService,
} = require("../services/unit-services/getBulletsService");
const {
  getImagesService,
} = require("../services/unit-services/getImagesService");
const { bridgeTemplate } = require("../services/templateBridgeServices");
const Presentation = require("../models/Presentation");
const crypto = require("crypto");
const { checkTrialLimits } = require("../utils/checkTrialLimits");
const { checkPaidLimits } = require("../utils/checkPaidLimits");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { v4: uuidv4 } = require("uuid");

const streamingStates = {
  start: {
    percent: 0,
    message: "🚀 Initiating template generation...",
    detail: "Setting up the template creation pipeline, validating inputs, and preparing AI services for structured content and visual generation.",
  },
  titles: {
    percent: 20,
    message: "📋 Generating slide titles and structure...",
    detail: "Using AI to create compelling, hierarchical titles that outline your presentation's narrative flow and key messaging points.",
  },
  bullets: {
    percent: 40,
    message: "📝 Crafting detailed bullet points...",
    detail: "Developing concise, impactful content bullets for each slide, tailored to your topic, audience, and specified tone for maximum engagement.",
  },
  images: {
    percent: 60,
    message: "🖼️ Generating custom template visuals...",
    detail: "Producing thematic images and graphics that align with your content, ensuring visual consistency and professional polish across all slides.",
  },
  combining: {
    percent: 80,
    message: "🔗 Combining elements into slides...",
    detail: "Integrating titles, bullets, and images into cohesive slide layouts, with proper spacing, alignment, and design harmony.",
  },
  normalizing: {
    percent: 90,
    message: "✨ Normalizing and optimizing layout...",
    detail: "Applying final refinements via the bridge service to ensure cross-platform compatibility, accessibility, and responsive design elements.",
  },
  finalizing: {
    percent: 95,
    message: "💾 Saving your template presentation...",
    detail: "Storing the complete template in the database and preparing metadata for seamless editing and export.",
  },
};

const generatePptTemplateHandler = async (req, res) => {
  const { topic, slideCount = 5, meta = {}, userData } = req.body;

  if (!topic) return res.status(400).json({ error: "Topic is required" });

  // User limits check
  if (!userData?.admin && userData?._id) {
    const user = await User.findById(userData._id);
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const now = new Date();
    const subscription = await Subscription.findOne({
      user: user._id,
    }).populate("plan").sort({ createdAt: -1 });

    let planCheckResult;
    if (subscription?.status === "active") {
      planCheckResult = await checkPaidLimits(user, subscription);
    } else if (!subscription && user.trialEnd && now <= user.trialEnd) {
      planCheckResult = await checkTrialLimits(user);
    } else {
      return res.status(403).json({ error: "NO_PLAN_OR_TRIAL" });
    }

    const { allowed, code, type } = planCheckResult;
    if (!allowed) {
      return res.status(403).json({ error: code || "LIMIT_REACHED" });
    }

    req.planResponseType = type;
  }

  const planResponseType = req.planResponseType;
  const wantsStreaming = req.headers["accept"] === "text/event-stream";

  if (wantsStreaming) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15000);

    // FIXED: Make sendUpdate async, await write callback for flush
    const sendUpdate = async (data) => {
      return new Promise((resolve, reject) => {
        const chunk = `data: ${JSON.stringify(data)}\n\n`;
        const wrote = res.write(chunk, 'utf8', (err) => {
          if (err) reject(err);
          else resolve(true);
        });
        if (!wrote) {
          // Buffer full (rare); handle backpressure if needed
          reject(new Error('Response buffer full'));
        }
      });
    };

    try {
      await sendUpdate(streamingStates.start);
      await new Promise((r) => setTimeout(r, 500));

      // Step 1: Get titles with update
      await sendUpdate(streamingStates.titles);
      const titles = await getTitlesService(topic, slideCount, meta);
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Get bullets with update (REMOVED interval; single update before heavy await)
      await sendUpdate(streamingStates.bullets);  // Will hold at 40% during await
      const bulletsPerSlide = await getBulletsService(topic, titles, meta);
      await new Promise((r) => setTimeout(r, 500));

      // Step 3: Get images with update
      await sendUpdate(streamingStates.images);
      const imagesPerSlide = await getImagesService(topic, titles, meta, planResponseType);
      await new Promise((r) => setTimeout(r, 1000));

      // Step 4: Combine with update
      await sendUpdate(streamingStates.combining);
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
          ...bulletsPerSlide[index],
          ...imagesPerSlide[index].elementImages,
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
          slide_id: `slide-${uuidv4()}`,
          slide_title: titleComponent,
          elements,
          image_url: imagesPerSlide[index].image_url,
          image_caption: imagesPerSlide[index].image_caption,
          titleBlock: { elements: [titleComponent], width: 960, height: 100 },
          textBlock: {
            elements: bulletsPerSlide[index],
            width: 400,
            height: 300,
          },
          imageBlock: {
            elements: imagesPerSlide[index].elementImages,
            width: 500,
            height: 400,
          },
        };
      });
      await new Promise((r) => setTimeout(r, 600));

      // Step 5: Normalize with update
      await sendUpdate(streamingStates.normalizing);
      const normalizedSlides = await bridgeTemplate(slides, topic, meta);
      await new Promise((r) => setTimeout(r, 500));

      // Step 6: Save with update
      await sendUpdate(streamingStates.finalizing);
      const presentation = new Presentation({
        topic,
        meta,
        slides: normalizedSlides,
      });
      await presentation.save();
      await new Promise((r) => setTimeout(r, 300));

      // Final success
      await sendUpdate({
        percent: 100,
        complete: true,
        message: "✅ Template presentation successfully generated!",
        detail: "Your customizable PPT template with structured slides and visuals is ready for editing and presentation.",
        presentation_id: presentation.presentation_id,
        slides: normalizedSlides,
        slideCount: normalizedSlides.length,
        generatedAt: new Date().toISOString(),
      });

      clearInterval(heartbeat);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("Error in template generation (SSE):", err);
      await sendUpdate({
        error: err.message || "Template generation failed",
        detail: "An unexpected error occurred. Please check your topic and try again.",
      });
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    // Non-streaming (original logic)
    try {
      const titles = await getTitlesService(topic, slideCount, meta);

      const [bulletsPerSlide, imagesPerSlide] = await Promise.all([
        getBulletsService(topic, titles, meta),
        getImagesService(topic, titles, meta, planResponseType),
      ]);

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
          ...bulletsPerSlide[index],
          ...imagesPerSlide[index].elementImages,
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
          slide_title: titleComponent,
          elements,
          image_url: imagesPerSlide[index].image_url,
          image_caption: imagesPerSlide[index].image_caption,
          titleBlock: { elements: [titleComponent], width: 960, height: 100 },
          textBlock: {
            elements: bulletsPerSlide[index],
            width: 400,
            height: 300,
          },
          imageBlock: {
            elements: imagesPerSlide[index].elementImages,
            width: 500,
            height: 400,
          },
        };
      });

      const normalizedSlides = await bridgeTemplate(slides, topic, meta);

      const presentation = new Presentation({
        topic,
        meta,
        slides: normalizedSlides,
      });
      await presentation.save();

      return res.json({
        presentation_id: presentation.presentation_id,
        slides: presentation.slides,
      });
    } catch (err) {
      console.error("Error in generatePptTemplateHandler:", err);
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = { generatePptTemplateHandler };