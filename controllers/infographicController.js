// controllers/dynamicInfographicController.js (assuming this is the file)
const { validationResult } = require("express-validator");
const {
  getDynamicInfographicService,
} = require("../services/unit-services/getDynamicInfographicService");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { checkTrialLimits } = require("../utils/checkTrialLimits");
const { checkPaidLimits } = require("../utils/checkPaidLimits");
const crypto = require("crypto");

const streamingStates = {
  start: {
    percent: 5,
    message: "🚀 Initiating infographic creation...",
    detail: "Setting up the generation pipeline, analyzing your prompt, and preparing AI models for content extraction and visual synthesis.",
  },
  analyzing: {
    percent: 20,
    message: "🔍 Analyzing prompt and structuring content...",
    detail: "Extracting key themes, organizing information hierarchy, and planning layout elements to ensure clarity and visual appeal in your infographic.",
  },
  generatingText: {
    percent: 40,
    message: "📝 Generating text layout and hierarchy...",
    detail: "Crafting concise, impactful headings, subheadings, and data points optimized for readability and persuasive flow within the infographic format.",
  },
  generatingImage: {
    percent: 70,
    message: "🎨 Creating custom visual design...",
    detail: "Leveraging generative AI to produce a cohesive, high-resolution image that integrates your content seamlessly with artistic elements and color harmony.",
  },
  finalizing: {
    percent: 95,
    message: "✨ Finalizing and optimizing...",
    detail: "Applying final polishes for resolution, accessibility, and export readiness to deliver a professional-grade infographic ready for sharing.",
  },
};

async function getPosterTemplate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { prompt: topic, viewMode: orientation, useReferences, userData } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic/prompt is required" });
  }

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
      await new Promise((r) => setTimeout(r, 800));

      await sendUpdate(streamingStates.analyzing);
      await new Promise((r) => setTimeout(r, 1000));

      await sendUpdate(streamingStates.generatingText);
      await new Promise((r) => setTimeout(r, 1200));

      // Actual generation
      const { imageUrl, textLayout } = await getDynamicInfographicService(topic, orientation);

      await sendUpdate(streamingStates.generatingImage);
      await new Promise((r) => setTimeout(r, 1500));

      await sendUpdate(streamingStates.finalizing);
      await new Promise((r) => setTimeout(r, 500));

      // Final response
      await sendUpdate({
        percent: 100,
        complete: true,
        message: "✅ Infographic successfully created!",
        detail: "Your dynamic infographic with integrated text and visuals is ready for viewing and download.",
        infographic: {
          _id: crypto.randomUUID(),
          imageUrl,
          textLayout,
        },
        generatedAt: new Date().toISOString(),
      });

      clearInterval(heartbeat);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("Error in infographic generation (SSE):", err);
      await sendUpdate({
        error: err.message || "Infographic generation failed",
        detail: "An error occurred. Please verify your prompt and try again.",
      });
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    // Non-streaming fallback
    try {
      const { imageUrl, textLayout } = await generatePosterTemplateWithContent(topic, orientation, useReferences);

      res.status(200).json({
        message: "Infographic generated successfully.",
        infographic: {
          _id: crypto.randomUUID(),
          imageUrl,
          textLayout,
        },
      });
    } catch (error) {
      console.error("Infographic generation failed:", error);
      res.status(500).json({
        message: "Infographic generation failed.",
        error: error.message,
      });
    }
  }
}

module.exports = { getPosterTemplate };