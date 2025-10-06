const { validationResult } = require("express-validator");
const { fetchWebsiteText } = require("../services/fetchWebsiteText");
const {
  fetchYouTubeTranscript,
} = require("../services/fetchYouTubeTranscript");
const { generateSlideText } = require("../services/generateSlideText");
const { generateImage } = require("../services/generateImage");
const { fetchYouTubeMeta } = require("../services/fetchYouTubeMeta");
const { v4: uuidv4 } = require("uuid");
const Presentation = require("../models/Presentation");
const crypto = require("crypto");
const User = require("../models/User");
const { checkTrialLimits } = require("../utils/checkTrialLimits");
const { checkPaidLimits } = require("../utils/checkPaidLimits");
const Subscription = require("../models/Subscription");
const planConfig = require("../utils/plansConfig");

// --- Helper: YouTube video ID extractor ---
function extractYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    let videoId = null;

    if (parsedUrl.hostname.includes("youtu.be")) {
      videoId = parsedUrl.pathname.slice(1);
    } else if (parsedUrl.pathname.startsWith("/shorts/")) {
      videoId = parsedUrl.pathname.split("/")[2];
    } else if (parsedUrl.pathname.startsWith("/embed/")) {
      videoId = parsedUrl.pathname.split("/")[2];
    } else {
      videoId = parsedUrl.searchParams.get("v");
    }

    if (videoId) {
      videoId = videoId.split("&")[0].split("?")[0];
    }
    if (!videoId) throw new Error("Invalid YouTube URL");

    return videoId;
  } catch (err) {
    throw new Error("Invalid YouTube URL format: " + url);
  }
}

// --- Main controller ---
async function generateSlidesHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const {
    source,
    inputUrl,
    textContent,
    inputWebsiteUrl,
    meta = {},
    slideCount = 3,
    userData,
  } = req.body;

  if (!userData?.admin || !userData) {
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

      // 1. Check subscription status directly
      const subscription = await Subscription.findOne({
        user: user._id,
        // status: "active",
      })
        .populate("plan")
        .sort({ createdAt: -1 });

      if (subscription?.status === "active") {
        // Paid user
        planCheckResult = await checkPaidLimits(user, subscription);
      } else if (!subscription && user.trialEnd && now <= user.trialEnd) {
        // Trial user
        planCheckResult = await checkTrialLimits(user);
      } else {
        // Neither paid nor trial
        return res.status(403).json({ error: "NO_PLAN_OR_TRIAL" });
      }
      const { allowed, message, code, type } = planCheckResult;
      if (!allowed) {
        return res.status(403).json({
          error: code || "LIMIT_REACHED",
        });
      }

      req.planResponseType = type;
    }
  }

  const planResponseType = req.planResponseType;
  const wantsStreaming = req.headers["accept"] === "text/event-stream";

  if (wantsStreaming) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendUpdate({ percent: 2, message: "Starting..." });

    const heartbeat = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 5000);

    try {
      // Step 1: Fetch input
      sendUpdate({ percent: 5, message: "Analyzing input..." });

      let rawText;
      if (source === "youtube") {
        const videoId = extractYouTubeVideoId(inputUrl);
        try {
          rawText = await fetchYouTubeTranscript(inputUrl);
        } catch {
          const metaData = await fetchYouTubeMeta(videoId);
          rawText = metaData.description || metaData.title;
        }
      } else if (source === "website") {
        rawText = await fetchWebsiteText(inputWebsiteUrl);
      } else {
        rawText = textContent;
      }
      let topic;
      if (source === "youtube") {
        const videoId = extractYouTubeVideoId(inputUrl);
        try {
          rawText = await fetchYouTubeTranscript(inputUrl);
          const metaData = await fetchYouTubeMeta(videoId);
          topic = metaData.title || "YouTube Presentation";
        } catch {
          const metaData = await fetchYouTubeMeta(videoId);
          rawText = metaData.description || metaData.title;
          topic = metaData.title || "YouTube Presentation";
        }
      } else if (source === "website") {
        rawText = await fetchWebsiteText(inputWebsiteUrl);
        topic = inputWebsiteUrl || "Website Presentation";
      } else {
        rawText = textContent;
        topic = textContent?.slice(0, 50) || "Untitled Presentation";
      }
      sendUpdate({ percent: 20, message: "Input analysis complete." });

      // Step 2: Generate slide text (simulate increments)
      sendUpdate({ percent: 25, message: "Generating text..." });

      const slides = await generateSlideText(rawText, meta, slideCount);

      // simulate incremental updates while processing text
      for (let p = 26; p <= 50; p += 4) {
        await new Promise((r) => setTimeout(r, 200));
        sendUpdate({ percent: p, message: "Working on text..." });
      }

      sendUpdate({ percent: 55, message: "Text generation done." });

      // Step 3: Generate images
      let slidesWithImages = [];
      for (let i = 0; i < slides.length; i++) {
        const basePercent = 60;
        const progressRange = 35; // 60 → 95 during images
        const progressStep = Math.floor((i / slides.length) * progressRange);

        sendUpdate({
          percent: basePercent + progressStep,
          message: `Generating image ${i + 1}/${slides.length}...`,
        });

        try {
          // const imageSlide = await generateImage(
          //   slides[i],
          //   i,
          //   planResponseType
          // );
          const imageSlide = await generateImage(
            slides[i],
            i,
            rawText,
            planResponseType
          );
          const imageUrl = imageSlide.image_url;

          const elementsWithoutText = slides[i].elements.filter(
            (el) => el.element_type !== "text"
          );

          slidesWithImages.push({
            ...slides[i],
            slide_title: { ...slides[i].slide_title },
            image_url: imageUrl,
            elements: [
              ...elementsWithoutText,
              {
                element_type: "image",
                konva_component: "Konva.Image",
                element_id: uuidv4(),
                properties: {
                  imageSrc: imageUrl,
                  x: 440,
                  y: 15,
                  width: 500,
                  height: 400,
                },
              },
            ],
          });
        } catch {
          slidesWithImages.push({ ...slides[i], image_url: null });
        }
      }

      // Final
      // Step 4: Save to Mongo
      const presentation = new Presentation({
        topic,
        meta,
        slides: slidesWithImages,
      });
      await presentation.save();

      // Step 5: Send final update with presentation_id
      sendUpdate({
        percent: 100,
        complete: true,
        slides: slidesWithImages,
        presentation_id: presentation.presentation_id,
      });

      res.write("data: [DONE]\n\n");
      clearInterval(heartbeat);
      res.end();
    } catch (err) {
      console.error("Error in generate-slides (SSE):", err);
      sendUpdate({ error: err.message || "Slide generation failed." });
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    try {
      let rawText;
      let topic;

      if (source === "youtube") {
        const videoId = extractYouTubeVideoId(inputUrl);
        try {
          rawText = await fetchYouTubeTranscript(inputUrl);
          const metaData = await fetchYouTubeMeta(videoId);
          topic = metaData.title || "YouTube Presentation";
        } catch {
          const metaData = await fetchYouTubeMeta(videoId);
          rawText = metaData.description || metaData.title;
          topic = metaData.title || "YouTube Presentation";
        }
      } else if (source === "website") {
        rawText = await fetchWebsiteText(inputWebsiteUrl);
        topic = inputWebsiteUrl || "Website Presentation";
      } else {
        rawText = textContent;
        topic = textContent?.slice(0, 50) || "Untitled Presentation"; // first few chars as title
      }

      const slides = await generateSlideText(rawText, meta, slideCount);

      let slidesWithImages = [];
      for (let i = 0; i < slides.length; i++) {
        try {
          const imageSlide = await generateImage(slides[i], i, rawText);
          const imageUrl = imageSlide.image_url;
          slidesWithImages.push({ ...slides[i], image_url: imageUrl });
        } catch {
          slidesWithImages.push({ ...slides[i], image_url: null });
        }
      }

      const presentation = new Presentation({
        topic,
        meta,
        slides: slidesWithImages,
      });
      await presentation.save();

      // Step 5: Respond with id + slides
      return res.json({
        presentation_id: presentation.presentation_id,
        slides: presentation.slides,
      });
    } catch (err) {
      console.error("Error in generate-slides:", err);
      res
        .status(500)
        .json({ error: err.message || "Slide generation failed." });
    }
  }
}

module.exports = { generateSlidesHandler };
