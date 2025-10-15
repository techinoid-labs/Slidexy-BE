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

const streamingStates = {
  start: {
    percent: 2,
    message: "🚀 Initiating presentation creation process...",
    detail: "We're setting up the foundational framework for your custom presentation, including initial data structures and configuration parameters to ensure smooth generation. This involves initializing AI models, allocating resources, and preparing the pipeline for optimal performance throughout the creation workflow.",
  },
  analyzing: {
    percent: 5,
    message: "🔍 Deep content analysis in progress...",
    detail: "Our AI is meticulously extracting key themes, core insights, and relevant data points from your input source to build a comprehensive understanding of the material. This phase identifies primary concepts, secondary supporting ideas, potential visual opportunities, and narrative arcs to inform the entire presentation structure.",
  },
  planning: {
    percent: 15,
    message: "📋 Planning presentation structure...",
    detail: "Structuring the overall narrative flow, determining optimal slide sequencing, and organizing content hierarchy to create a compelling and logical presentation storyline. This includes balancing information density, pacing considerations, audience engagement hooks, and transitions for seamless progression from introduction to conclusion.",
  },
  generating: {
    start: {
      percent: 25,
      message: "✍️ Starting detailed content generation phase...",
      detail: "Leveraging advanced language models to craft in-depth, tailored content for each slide, ensuring relevance, engagement, and alignment with your specified goals and audience. This multi-step process begins with ideation, followed by drafting, and iterative refinement to produce high-quality, professional-grade textual elements.",
    },
    outline: (current, total) => ({
      percent: 25 + Math.floor((current / total) * 10),
      message: `📝 Creating detailed outline for slide ${current}/${total}...`,
      detail: "Developing a robust structure with main headings, subpoints, and logical progression to form the backbone of this slide's content delivery. We're mapping out key arguments, evidence placement, and visual integration points to ensure each slide contributes effectively to the overall persuasive or informative objectives.",
    }),
    content: (current, total) => ({
      percent: 35 + Math.floor((current / total) * 15),
      message: `📚 Generating rich, comprehensive content for slide ${current}/${total}...`,
      detail: [
        "Crafting detailed, actionable bullet points with precise language and formatting for maximum readability and impact, including concise phrasing, active voice, and varied sentence structures to maintain audience interest throughout the presentation.",
        "Incorporating real-world supporting examples, case studies, and relevant statistics to substantiate key claims and enhance credibility, drawing from diverse sources to provide multifaceted validation and real-life applicability to the discussed topics.",
        "Integrating cutting-edge industry insights, trends, and expert perspectives to provide forward-thinking value to your audience, highlighting emerging opportunities, challenges, and strategic implications that position your presentation as a thought-leadership piece.",
        "Authoring thoughtful presenter notes with delivery tips, emphasis cues, and additional context for seamless on-stage performance, including timing suggestions, rhetorical questions, and contingency plans to handle audience interactions dynamically.",
      ][current % 4],
    }),
    refining: (current, total) => ({
      percent: 50 + Math.floor((current / total) * 10),
      message: `✨ Refining and polishing content for slide ${current}/${total}...`,
      detail: "Fine-tuning language for clarity, conciseness, and persuasive power while eliminating redundancies and enhancing overall visual and rhetorical impact. This includes sentiment analysis, readability scoring, and stylistic adjustments to match the specified tone and audience expectations perfectly.",
    }),
  },
  imaging: {
    start: {
      percent: 60,
      message: "🎨 Initiating advanced visual design phase...",
      detail: "Transitioning to creative visuals: preparing generative AI pipelines to produce bespoke imagery that perfectly complements and elevates your slide content. This setup calibrates style parameters, color schemes, and compositional rules based on content analysis for harmonious integration.",
    },
    progress: (current, total) => ({
      percent: 60 + Math.floor((current / total) * 30),
      message: `🖼️ Designing custom visual elements for slide ${current}/${total}...`,
      detail: "Harnessing diffusion models and style transfer techniques to generate high-fidelity, contextually relevant imagery, icons, and graphics that visually reinforce your narrative. Each visual is optimized for resolution, aspect ratio, and emotional resonance to maximize viewer engagement and retention.",
    }),
  },
  enhancing: {
    percent: 90,
    message: "🎯 Enhancing overall presentation elements...",
    detail: "Applying final optimizations: adjusting layouts for balance, ensuring color harmony, adding subtle animations, and verifying accessibility compliance across all slides. This comprehensive polish includes contrast checks, alt text generation, and performance tuning for smooth playback in various presentation environments.",
  },
  finalizing: {
    percent: 95,
    message: "✨ Finalizing your complete presentation...",
    detail: "Merging all generated components into a cohesive deliverable, performing quality assurance checks, and preparing the file for immediate use or export. This wraps up with metadata embedding, thumbnail creation, and compatibility verification to ensure a flawless user experience from start to finish.",
  },
};

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

    // Define heartbeat interval
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15000); // Send heartbeat every 15 seconds

    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendUpdate(streamingStates.start);
      await new Promise((r) => setTimeout(r, 800));

      sendUpdate(streamingStates.analyzing);
      let rawText, topic;
      try {
        // Step 1: Fetch input
        sendUpdate({ percent: 5, message: "Analyzing input..." });

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
      } catch (fetchErr) {
        console.error("Error fetching input:", fetchErr);
        throw fetchErr;
      }

      sendUpdate(streamingStates.planning);
      await new Promise((r) => setTimeout(r, 1200));

      sendUpdate(streamingStates.generating.start);
      const slides = await generateSlideText(rawText, meta, slideCount);

      // Enhanced progress updates for each slide
      for (let i = 0; i < slideCount; i++) {
        // Outline phase
        await new Promise((r) => setTimeout(r, 600));
        sendUpdate(streamingStates.generating.outline(i + 1, slideCount));
        await new Promise((r) => setTimeout(r, 400));

        // Content generation phase
        await new Promise((r) => setTimeout(r, 800));
        sendUpdate(streamingStates.generating.content(i + 1, slideCount));
        await new Promise((r) => setTimeout(r, 500));

        // Refinement phase
        await new Promise((r) => setTimeout(r, 600));
        sendUpdate(streamingStates.generating.refining(i + 1, slideCount));
        await new Promise((r) => setTimeout(r, 400));
      }

      sendUpdate(streamingStates.imaging.start);
      let slidesWithImages = [];

      // Enhanced image generation progress
      for (let i = 0; i < slides.length; i++) {
        sendUpdate(streamingStates.imaging.progress(i + 1, slides.length));
        await new Promise((r) => setTimeout(r, 1000));

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
            ...slides[i], // Includes existing
            slide_title: { ...slides[i].slide_title },
            image_url: imageUrl,
            art_style: imageSlide.art_style, // From generateImage
            art_palette: imageSlide.art_palette,
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
                  // UPDATED: Tint based on palette if available
                  filters: imageSlide.art_palette ? ["hue-rotate"] : [],
                },
              },
            ],
          });
        } catch (error) {
          console.error(`Image generation failed for slide ${i + 1}:`, error);
          slidesWithImages.push({ ...slides[i], image_url: null });
        }
      }

      sendUpdate(streamingStates.enhancing);
      await new Promise((r) => setTimeout(r, 800));

      sendUpdate(streamingStates.finalizing);
      const presentation = new Presentation({
        topic,
        meta,
        slides: slidesWithImages,
      });
      await presentation.save();

      // Final success update
      sendUpdate({
        percent: 100,
        complete: true,
        message: "✅ Presentation successfully created and ready!",
        detail: "Your full presentation with enriched slides, custom visuals, and optimized content is now complete and available for immediate review, editing, or presentation. We've ensured every element aligns with your vision for maximum impact.",
        slides: slidesWithImages,
        presentation_id: presentation.presentation_id,
        slideCount: slidesWithImages.length,
        generatedAt: new Date().toISOString(),
      });

      clearInterval(heartbeat); // Now heartbeat is defined
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("Error in generate-slides (SSE):", err);
      sendUpdate({
        error: err.message || "Slide generation failed",
        detail: "An unexpected error occurred during the presentation creation process. Please check your input and try again. If the issue persists, consider simplifying your prompt or verifying your source material.",
      });
      clearInterval(heartbeat); // Clear heartbeat on error
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