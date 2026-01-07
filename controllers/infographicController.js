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
  start: { percent: 5, message: "🚀 Initiating infographic creation...", detail: "Preparing AI models..." },
  analyzing: { percent: 20, message: "🔍 Analyzing prompt...", detail: "Structuring content..." },
  generatingText: { percent: 40, message: "📝 Generating text...", detail: "Creating headings and data points..." },
  generatingImage: { percent: 70, message: "🎨 Creating visuals...", detail: "Generating high-resolution images..." },
  finalizing: { percent: 95, message: "✨ Finalizing...", detail: "Optimizing infographic for export..." },
};

async function getPosterTemplate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const topic = req.body.textContent || req.body.prompt;
  const orientation = req.body.viewMode || "landscape";

  if (!topic) return res.status(400).json({ error: "Topic/prompt is required" });

  let uploadedFile = req.file;
  if (uploadedFile) {
    console.log("Received file:", uploadedFile.originalname);
  }

  let userData = null;
  if (req.body.userData) {
    try { userData = JSON.parse(req.body.userData); } 
    catch { console.warn("Invalid userData JSON"); }
  }

  // --- User plan/trial checks ---
  if (!userData?.admin && userData?._id) {
    const user = await User.findById(userData._id);
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const now = new Date();
    const subscription = await Subscription.findOne({ user: user._id }).populate("plan").sort({ createdAt: -1 });
    let planCheckResult;
    if (subscription?.status === "active") planCheckResult = await checkPaidLimits(user, subscription);
    else if (!subscription && user.trialEnd && now <= user.trialEnd) planCheckResult = await checkTrialLimits(user);
    else return res.status(403).json({ error: "NO_PLAN_OR_TRIAL" });

    if (!planCheckResult.allowed) return res.status(403).json({ error: planCheckResult.code || "LIMIT_REACHED" });
    req.planResponseType = planCheckResult.type;
  }

  const wantsStreaming = req.headers["accept"] === "text/event-stream";
  if (wantsStreaming) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15000);

    const sendUpdate = (data) => new Promise((resolve, reject) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`, 'utf8', (err) => err ? reject(err) : resolve(true));
    });

    try {
      await sendUpdate({ percent: 5, message: "🚀 Starting infographic..." });
      const { imageUrl, textLayout, metadata } = await getDynamicInfographicService(topic, orientation, uploadedFile?.buffer, uploadedFile?.mimetype);
      await sendUpdate({ percent: 100, complete: true, message: "✅ Infographic ready!", infographic: { _id: crypto.randomUUID(), imageUrl, textLayout, metadata }, generatedAt: new Date().toISOString() });
      clearInterval(heartbeat);
      res.write("data: [DONE]\n\n"); res.end();
    } catch (err) {
      console.error("SSE error:", err);
      await sendUpdate({ error: err.message || "Infographic generation failed" });
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    try {
      const { imageUrl, textLayout, metadata } = await getDynamicInfographicService(topic, orientation, uploadedFile?.buffer, uploadedFile?.mimetype);
      res.status(200).json({ message: "Infographic generated successfully.", infographic: { _id: crypto.randomUUID(), imageUrl, textLayout, metadata } });
    } catch (error) {
      console.error("Generation failed:", error);
      res.status(500).json({ message: "Infographic generation failed.", error: error.message });
    }
  }
}


module.exports = { getPosterTemplate };
