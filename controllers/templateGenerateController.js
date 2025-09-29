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

const generatePptTemplateHandler = async (req, res) => {
  try {
    const { topic, slideCount = 5, meta = {}, userData } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    // if (!userData?.admin) {
    //   let user = null;
    //   if (userData?._id) {
    //     user = await User.findById(userData._id);

    //     if (!user) {
    //       return res.status(404).json({ error: "User not found" });
    //     }

    //     // Run trial/plan check
    //     const { allowed, message } = await checkTrialLimits(user);
    //     if (!allowed) {
    //       return res.status(403).json({ error: message });
    //     }
    //   }
    // }

    // Step 0: If logged in, enforce plan/trial/subscription limits
    if (!userData?.admin) {
      let user = null;
      if (userData?._id) {
        user = await User.findById(userData._id);
        if (!user) {
          return res.status(404).json({
            error: "USER_NOT_FOUND",
          });
        }

        const now = new Date();
        let planCheckResult;

        // 1. Check for active subscription
        const subscription = await Subscription.findOne({
          user: user._id,
          status: "active",
        })
          .populate("plan")
          .sort({ createdAt: -1 });

        if (subscription && subscription.status === "active") {
          // Paid user
          planCheckResult = await checkPaidLimits(user, subscription);
        } else if (user.trialEnd && now <= user.trialEnd) {
          // Trial user
          planCheckResult = await checkTrialLimits(user);
        } else {
          // No plan/trial
          return res.status(403).json({
            error: "NO_PLAN_OR_TRIAL",
          });
        }

        const { allowed, message, code, type } = planCheckResult;
        if (!allowed) {
          return res.status(403).json({
            error: code || "LIMIT_REACHED",
          });
        }

        req.planResponseType = type; // keep consistent with generateSlidesHandler
      }
    }

    const planResponseType = req.planResponseType;

    // Step 1: Get titles
    const titles = await getTitlesService(topic, slideCount, meta);

    // Step 2 + 3: Get bullets and images in parallel
    const [bulletsPerSlide, imagesPerSlide] = await Promise.all([
      getBulletsService(topic, titles, meta),
      getImagesService(topic, titles, meta, planResponseType),
    ]);

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

    // Step 5: Normalize
    const normalizedSlides = await bridgeTemplate(slides, topic, meta);

    // Step 6: Store in DB via mongoose
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
};

module.exports = { generatePptTemplateHandler };
