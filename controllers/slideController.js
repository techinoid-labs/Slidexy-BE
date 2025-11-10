const { EJSON } = require("bson");
const { validationResult } = require("express-validator");
const { fetchWebsiteText } = require("../services/fetchWebsiteText");
const { fetchYouTubeTranscript } = require("../services/fetchYouTubeTranscript");
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

function cleanEJSON(data) {
  try {
    const ejsonString = EJSON.stringify(data);
    return EJSON.parse(ejsonString);
  } catch (err) {
    console.error("EJSON conversion error:", err.message);
    return data;
  }
}

function convertEJSONFields(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (obj.$oid) {
    return obj.$oid;
  }
  
  if (obj.$date) {
    const timestamp = obj.$date.$numberLong || obj.$date;
    return new Date(parseInt(timestamp));
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertEJSONFields(item));
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertEJSONFields(value);
    }
    return converted;
  }
  
  return obj;
}

function sanitizeSlides(slides) {
  const validElementTypes = [
    'bullet_point', 'quote', 'author', 'context', 
    'stat', 'description', 'left_bullet', 'right_bullet', 'cta'
  ];

  return slides.map((slide, index) => {
    const sanitizedSlide = {
      slide_id: slide.slide_id || `slide-${crypto.randomUUID()}`,
      layout_type: slide.layout_type || 'content-right-image',
      content_type: slide.content_type || 'general',
      visual_suggestion: slide.visual_suggestion || '',
      knowledge: slide.knowledge || {},
      art_style: slide.art_style || 'modern illustration with characters',
      art_palette: Array.isArray(slide.art_palette) ? slide.art_palette : ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff'],
      slide_title: slide.slide_title || { text: `Slide ${index + 1}` },
      subtitle: slide.subtitle || { text: '' },
      elements: [],
      image_url: slide.image_url || null,
      image_caption: slide.image_caption || '',
      image_placeholder: slide.image_placeholder || { x: 520, y: 40, width: 400, height: 460 },
      content_metadata: slide.content_metadata || { bullet_count: 0, has_quote: false, has_data: false },
      slide_number: slide.slide_number || index + 1,
      total_slides: slide.total_slides || slides.length,
      created_at: slide.created_at || new Date(),
      updated_at: slide.updated_at || new Date()
    };

    if (Array.isArray(slide.elements)) {
      sanitizedSlide.elements = slide.elements
        .filter(element => {
          if (!element.text || typeof element.text !== 'string') return false;
          if (!element.element_type) return false;
          return true;
        })
        .map(element => {
          let elementType = element.element_type.toLowerCase().trim();
          
          const typeMapping = {
            'text': 'description',
            'paragraph': 'description',
            'body': 'description',
            'bullet': 'bullet_point',
            'list_item': 'bullet_point',
            'citation': 'author',
            'source': 'author',
            'statistic': 'stat',
            'number': 'stat',
            'call_to_action': 'cta',
            'button': 'cta'
          };

          if (typeMapping[elementType]) {
            elementType = typeMapping[elementType];
          }

          if (!validElementTypes.includes(elementType)) {
            console.warn(`Invalid element_type "${element.element_type}" found in slide ${index + 1}, defaulting to "description"`);
            elementType = 'description';
          }

          return {
            id: element.id || crypto.randomUUID(),
            element_id: element.element_id || `element-${crypto.randomUUID()}`,
            element_type: elementType,
            text: element.text.trim()
          };
        });
    }

    return sanitizedSlide;
  });
}

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
    detail: "We're setting up the foundational framework for your custom presentation, including initial data structures and configuration parameters to ensure smooth generation.",
  },
  analyzing: {
    percent: 5,
    message: "🔍 Deep content analysis in progress...",
    detail: "Our AI is meticulously extracting key themes, core insights, and relevant data points from your input source to build a comprehensive understanding of the material.",
  },
  planning: {
    percent: 15,
    message: "📋 Planning presentation structure...",
    detail: "Structuring the overall narrative flow, determining optimal slide sequencing, and organizing content hierarchy to create a compelling presentation storyline.",
  },
  generating: {
    start: {
      percent: 20,
      message: "✍️ Starting detailed content generation phase...",
      detail: "Leveraging advanced language models to craft in-depth, tailored content for each slide, ensuring relevance, engagement, and alignment with your specified goals.",
    },
    progress: (current, total) => ({
      message: `📚 Generating textual content for slide ${current}/${total}...`,
      detail: "Crafting titles, bullets, quotes, and stats optimized for layout. Each element is carefully worded to maximize impact while maintaining consistency.",
    }),
  },
  imaging: {
    start: {
      percent: 50,
      message: "🎨 Initiating advanced visual design phase...",
      detail: "Transitioning to creative visuals: preparing generative AI pipelines to produce bespoke imagery that perfectly complements your slide content.",
    },
    progress: (current, total) => ({
      message: `🖼️ Designing custom visual for slide ${current}/${total}...`,
      detail: "Generating high-fidelity, contextually relevant imagery that visually reinforces your narrative and maximizes viewer engagement.",
    }),
  },
  finalizing: {
    percent: 95,
    message: "✨ Finalizing your complete presentation...",
    detail: "Performing quality assurance checks and preparing the presentation for immediate use. Validating data integrity and confirming proper formatting.",
  },
};

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
    artStyle,
    slideCount = 5,
    userData,
  } = req.body;

  if (!userData?.admin || !userData) {
    let user = null;
    if (userData?._id) {
      user = await User.findById(userData._id);
      if (!user) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
      }

      const now = new Date();
      let planCheckResult;

      const subscription = await Subscription.findOne({ user: user._id })
        .populate("plan")
        .sort({ createdAt: -1 });

      if (subscription?.status === "active") {
        planCheckResult = await checkPaidLimits(user, subscription);
      } else if (!subscription && user.trialEnd && now <= user.trialEnd) {
        planCheckResult = await checkTrialLimits(user);
      } else {
        return res.status(403).json({ error: "NO_PLAN_OR_TRIAL" });
      }

      const { allowed, message, code, type } = planCheckResult;
      if (!allowed) {
        return res.status(403).json({ error: code || "LIMIT_REACHED" });
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

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15000);

    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendUpdate(streamingStates.start);
      await new Promise((r) => setTimeout(r, 500));

      sendUpdate(streamingStates.analyzing);
      let rawText, topic;

      try {
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
        
        sendUpdate({ 
          percent: 10, 
          message: "✅ Input analysis complete",
          detail: "Successfully extracted and processed content from your source. Ready to begin content generation."
        });
      } catch (fetchErr) {
        console.error("Error fetching input:", fetchErr);
        throw fetchErr;
      }

      sendUpdate(streamingStates.planning);
      await new Promise((r) => setTimeout(r, 800));

      sendUpdate({
        percent: 20,
        message: streamingStates.generating.start.message,
        detail: streamingStates.generating.start.detail
      });
      
      const slides = await generateSlideText(rawText, meta, slideCount);

      const totalSlides = slides.length;
      for (let i = 0; i < totalSlides; i++) {
        const contentPercent = 20 + Math.floor(((i + 1) / totalSlides) * 30);
        const progressUpdate = streamingStates.generating.progress(i + 1, totalSlides);
        sendUpdate({
          percent: contentPercent,
          message: progressUpdate.message,
          detail: progressUpdate.detail
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      const cleanedSlides = convertEJSONFields(slides);
      const sanitizedSlides = sanitizeSlides(cleanedSlides);

      sendUpdate({
        percent: 50,
        message: streamingStates.imaging.start.message,
        detail: streamingStates.imaging.start.detail
      });
      await new Promise((r) => setTimeout(r, 500));

      let slidesWithImages = [];

      // 🔥 LINEAR PROGRESS SIMULATION HACK
      const totalImagingProgress = 40; // 50% to 90%
      const progressPerSlide = totalImagingProgress / sanitizedSlides.length;
      const minTimePerSlide = 2000; // Minimum 2 seconds per slide for smooth UX

      for (let i = 0; i < sanitizedSlides.length; i++) {
        const slideStartPercent = 50 + Math.floor(i * progressPerSlide);
        const slideEndPercent = 50 + Math.floor((i + 1) * progressPerSlide);
        
        const progressUpdate = streamingStates.imaging.progress(i + 1, sanitizedSlides.length);
        sendUpdate({
          percent: slideStartPercent,
          message: progressUpdate.message,
          detail: progressUpdate.detail
        });

        const imageStartTime = Date.now();
        let imageSlideResult;
        
        try {
          imageSlideResult = await generateImage(
            sanitizedSlides[i],
            i,
            rawText,
            planResponseType,
            artStyle
          );
          slidesWithImages.push({
            ...sanitizedSlides[i],
            image_url: imageSlideResult.image_url,
            image_caption: imageSlideResult.image_caption,
            art_style: imageSlideResult.art_style,
            art_palette: imageSlideResult.art_palette,
            image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
          });
          console.log(`✓ Image generated for slide ${i + 1}`);
        } catch (error) {
          console.error(`Image gen failed for slide ${i + 1}:`, error.message);
          slidesWithImages.push({ 
            ...sanitizedSlides[i], 
            image_url: null, 
            image_caption: "Image unavailable" 
          });
        }

        const imageElapsedTime = Date.now() - imageStartTime;
        
        // 🎯 SIMULATION: If image completed quickly, simulate gradual progress
        if (imageElapsedTime < minTimePerSlide) {
          const remainingTime = minTimePerSlide - imageElapsedTime;
          const steps = 5;
          const stepDelay = remainingTime / steps;
          const progressStep = (slideEndPercent - slideStartPercent) / steps;
          
          for (let step = 1; step <= steps; step++) {
            await new Promise((r) => setTimeout(r, stepDelay));
            const intermediatePercent = Math.floor(slideStartPercent + (progressStep * step));
            
            sendUpdate({
              percent: Math.min(intermediatePercent, slideEndPercent),
              message: progressUpdate.message,
              detail: progressUpdate.detail
            });
          }
        }

        sendUpdate({
          percent: slideEndPercent,
          message: progressUpdate.message,
          detail: progressUpdate.detail
        });
      }

      sendUpdate(streamingStates.finalizing);
      await new Promise((r) => setTimeout(r, 500));

      const totalSlidesCount = slidesWithImages.length;
      const finalSlides = slidesWithImages.map((slide, index) => ({
        ...slide,
        slide_number: index + 1,
        total_slides: totalSlidesCount,
        generated_at: new Date(),
      }));

      const presentation = new Presentation({
        topic,
        meta: {
          ...meta,
          source,
          slideCount: totalSlidesCount,
          artStyle: artStyle || "modern illustration with characters",
        },
        slides: finalSlides,
        slide_count: totalSlidesCount,
        template_used: "text-only-system",
        art_style: artStyle || "modern illustration with characters",
        art_palette: finalSlides[0]?.art_palette || [
          "#6c5ce7",
          "#00b894",
          "#fdcb6e",
          "#e17055",
          "#74b9ff",
        ],
        generation_metadata: {
          content_source: source,
          slide_count: totalSlidesCount,
          art_style: artStyle,
          layout_variants: false,
          generated_at: new Date(),
        },
      });

      await presentation.save();

      sendUpdate({
        percent: 100,
        complete: true,
        message: "✅ Presentation successfully created!",
        detail: `Your ${totalSlidesCount}-slide presentation is now complete and ready to use.`,
        slides: finalSlides,
        presentation_id: presentation.presentation_id,
        slideCount: finalSlides.length,
        generatedAt: new Date().toISOString(),
      });

      clearInterval(heartbeat);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("Error in generate-slides (SSE):", err);
      sendUpdate({
        error: err.message || "Slide generation failed",
        detail: "An unexpected error occurred. Please try again.",
        percent: 0
      });
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    // Non-streaming response
    try {
      let rawText, topic;

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

      const slides = await generateSlideText(rawText, meta, slideCount);
      const cleanedSlides = convertEJSONFields(slides);
      const sanitizedSlides = sanitizeSlides(cleanedSlides);

      let slidesWithImages = [];
      for (let i = 0; i < sanitizedSlides.length; i++) {
        try {
          const imageSlide = await generateImage(
            sanitizedSlides[i],
            i,
            rawText,
            planResponseType,
            artStyle
          );
          slidesWithImages.push({
            ...sanitizedSlides[i],
            image_url: imageSlide.image_url,
            image_caption: imageSlide.image_caption,
            image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
          });
        } catch (error) {
          console.error(`Image generation failed for slide ${i + 1}:`, error);
          slidesWithImages.push({ ...sanitizedSlides[i], image_url: null });
        }
      }

      const finalSlides = (slidesWithImages.length > 0 ? slidesWithImages : sanitizedSlides).map(
        (slide, index) => ({
          ...slide,
          slide_number: index + 1,
          total_slides: sanitizedSlides.length,
          generated_at: new Date(),
        })
      );

      const presentation = new Presentation({
        topic,
        meta: {
          ...meta,
          source,
          slideCount: finalSlides.length,
          artStyle: artStyle || "modern illustration with characters",
        },
        slides: finalSlides,
        slide_count: finalSlides.length,
        template_used: "text-only-system",
        art_style: artStyle || "modern illustration with characters",
        art_palette: finalSlides[0]?.art_palette || [
          "#6c5ce7",
          "#00b894",
          "#fdcb6e",
          "#e17055",
          "#74b9ff",
        ],
        generation_metadata: {
          content_source: source,
          slide_count: finalSlides.length,
          art_style: artStyle,
          layout_variants: false,
          generated_at: new Date(),
        },
      });

      await presentation.save();

      return res.json({
        presentation_id: presentation.presentation_id,
        slides: presentation.slides,
        slideCount: presentation.slides.length,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error in generate-slides:", err);
      res.status(500).json({
        error: err.message || "Slide generation failed.",
        detail: "Please check your input and try again.",
      });
    }
  }
}

module.exports = { generateSlidesHandler };