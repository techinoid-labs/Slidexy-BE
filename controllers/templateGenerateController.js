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

const TemplatePresentation = require("../models/TemplatePresentation");

const { checkTrialLimits } = require("../utils/checkTrialLimits");
const { checkPaidLimits } = require("../utils/checkPaidLimits");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { v4: uuidv4 } = require("uuid");

const streamingStates = {
  start: { percent: 0, message: "Starting...", detail: "Initializing template generation" },
  titles: { percent: 20, message: "Generating titles...", detail: "Creating slide structure" },
  bullets: { percent: 40, message: "Writing content...", detail: "Crafting bullet points" },
  images: { percent: 60, message: "Creating visuals...", detail: "Generating images" },
  combining: { percent: 80, message: "Building slides...", detail: "Assembling layout" },
  normalizing: { percent: 90, message: "Finalizing...", detail: "Optimizing for editor" },
  finalizing: { percent: 95, message: "Saving...", detail: "Storing template" },
};

const generatePptTemplateHandler = async (req, res) => {
  const { topic, slideCount = 5, meta = {}, userData } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  // === LIMITS CHECK ===
  if (!userData?.admin && userData?._id) {
    const user = await User.findById(userData._id);
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const now = new Date();
    const subscription = await Subscription.findOne({ user: user._id })
      .populate("plan")
      .sort({ createdAt: -1 });

    let planCheckResult;
    if (subscription?.status === "active") {
      planCheckResult = await checkPaidLimits(user, subscription);
    } else if (!subscription && user.trialEnd && now <= user.trialEnd) {
      planCheckResult = await checkTrialLimits(user);
    } else {
      return res.status(403).json({ error: "NO_PLAN_OR_TRIAL" });
    }

    const { allowed, code, type } = planCheckResult;
    if (!allowed) return res.status(403).json({ error: code || "LIMIT_REACHED" });
    req.planResponseType = type;
  }

  const planResponseType = req.planResponseType;
  const wantsStreaming = req.headers["accept"] === "text/event-stream";

  if (wantsStreaming) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15000);

    // Backpressure-safe SSE writer without hard rejection
    const sendUpdate = (data) => {
      const chunk = `data: ${JSON.stringify(data)}\n\n`;
      const ok = res.write(chunk);
      if (!ok) {
        // wait for drain but do not throw
        return new Promise((resolve) => {
          res.once("drain", resolve);
          // safety: auto-resolve after 30s in case client disconnects silently
          setTimeout(resolve, 30000);
        });
      }
      return Promise.resolve();
    };

    try {
      await sendUpdate(streamingStates.start);
      await sendUpdate(streamingStates.titles);
      const titles = await getTitlesService(topic, slideCount, meta);

      await sendUpdate(streamingStates.bullets);
      const bulletsPerSlide = await getBulletsService(topic, titles, meta);

      await sendUpdate(streamingStates.images);
      let imagesPerSlide = [];
      try {
        imagesPerSlide = await getImagesService(topic, titles, meta, planResponseType);
      } catch (e) {
        console.warn("Images service failed, using placeholders:", e?.message || e);
        imagesPerSlide = titles.map((_, i) => ({
          image_url: `https://placehold.co/960x540/eeeeee/777777?text=Slide+${i + 1}`,
          image_caption: "Placeholder image",
          elementImages: [],
        }));
      }

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

        const shapeComponent = {
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
        };

        // sanitize image elements to avoid invalid base64 uploads
        const imageElements = (imagesPerSlide[index]?.elementImages || [])
          .map(img => {
            const sanitized = { ...img, element_type: "image", konva_component: img.konva_component || "Konva.Image" };
            const url = sanitized.image_url || sanitized.url;
            const b64 = sanitized.base64 || sanitized.image_base64 || "";
            const looksLikeData = typeof b64 === "string" && b64.startsWith("data:image/");
            if (!url && !looksLikeData) {
              sanitized.image_url = `https://placehold.co/800x450/eeeeee/888888?text=Image`;
              delete sanitized.base64;
              delete sanitized.image_base64;
            }
            return sanitized;
          });

        const bulletElements = (bulletsPerSlide[index] || []).map(b => ({
          ...b,
          element_type: b.element_type || "bullet_point",
          konva_component: b.konva_component || "Konva.Text",
        }));

        const elements = [titleComponent, ...bulletElements, ...imageElements, shapeComponent];

        return {
          slide_id: `slide-${uuidv4()}`,
          slide_title: {
            text: title,
            konva_component: "Konva.Text",
            element_type: "title",  // ←←← FIXED: added element_type
            properties: titleComponent.properties,
          },
          elements,
          image_url: imagesPerSlide[index]?.image_url || `https://placehold.co/960x540/eeeeee/777777?text=Slide+${index + 1}`,
          image_caption: imagesPerSlide[index]?.image_caption || "",
          titleBlock: { elements: [titleComponent], width: 960, height: 100 },
          textBlock: { elements: bulletElements, width: 400, height: 300 },
          imageBlock: { elements: imageElements, width: 500, height: 400 },
          slide_number: index + 1,
          total_slides: titles.length,
        };
      });

      await sendUpdate(streamingStates.normalizing);
      const normalizedSlides = await bridgeTemplate(slides, topic, meta);

      await sendUpdate(streamingStates.finalizing);
      const templatePresentation = new TemplatePresentation({
        topic,
        meta,
        slides: normalizedSlides,
        slide_count: normalizedSlides.length,
        user: userData?._id || null,
      });
      await templatePresentation.save();

      // ←←← ONLY SEND METADATA, NOT FULL SLIDES!
      await sendUpdate({
        percent: 100,
        complete: true,
        message: "Template ready!",
        detail: "Your template has been generated successfully.",
        // compatibility keys for FE expecting presentation_id
        presentation_id: templatePresentation.template_id,
        template_id: templatePresentation.template_id,
        slides: normalizedSlides,
        slideCount: normalizedSlides.length,
        generatedAt: new Date().toISOString(),
      });

      clearInterval(heartbeat);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("SSE Error:", err);
      try {
        await sendUpdate({
          error: "Generation failed",
          detail: err.message || "Unknown error",
        });
      } catch { }
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    // Non-streaming (same fixes)
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
          titleComponent,
          ...(bulletsPerSlide[index] || []).map(b => ({
            ...b,
            element_type: b.element_type || "bullet_point",
            konva_component: b.konva_component || "Konva.Text",
          })),
          ...(imagesPerSlide[index]?.elementImages || []).map(img => ({
            ...img,
            element_type: "image",
            konva_component: img.konva_component || "Konva.Image",
          })),
          {
            konva_component: "Konva.Rect",
            element_type: "shape",
            properties: {
              x: 40, y: 140, width: 880, height: 360,
              fill: "#E5E7EB", opacity: 0.7, cornerRadius: 15, zIndex: 100,
            },
          },
        ];

        return {
          slide_id: `slide-${uuidv4()}`,
          slide_title: {
            text: title,
            konva_component: "Konva.Text",
            element_type: "title",  // ←←← FIXED
            properties: titleComponent.properties,
          },
          elements,
          image_url: imagesPerSlide[index]?.image_url || null,
          image_caption: imagesPerSlide[index]?.image_caption || "",
          titleBlock: { elements: [titleComponent], width: 960, height: 100 },
          textBlock: { elements: bulletsPerSlide[index] || [], width: 400, height: 300 },
          imageBlock: { elements: imagesPerSlide[index]?.elementImages || [], width: 500, height: 400 },
          slide_number: index + 1,
          total_slides: titles.length,
        };
      });

      const normalizedSlides = await bridgeTemplate(slides, topic, meta);

      const templatePresentation = new TemplatePresentation({
        topic, meta, slides: normalizedSlides,
        slide_count: normalizedSlides.length,
        user: userData?._id || null,
      });
      await templatePresentation.save();

      return res.json({
        presentation_id: templatePresentation.template_id,
        template_id: templatePresentation.template_id,
        slides: templatePresentation.slides,
        slide_count: templatePresentation.slide_count,
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = { generatePptTemplateHandler };