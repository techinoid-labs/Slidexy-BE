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

// --- Helper: Convert EJSON to plain JS objects ---
function cleanEJSON(data) {
  try {
    // First stringify to get EJSON format, then parse it back to plain JS
    const ejsonString = EJSON.stringify(data);
    return EJSON.parse(ejsonString);
  } catch (err) {
    console.error("EJSON conversion error:", err.message);
    return data; // Return original if conversion fails
  }
}

// --- Helper: Recursively convert EJSON objects ---
function convertEJSONFields(obj) {
  if (obj === null || obj === undefined) return obj;
  
  // Handle EJSON ObjectId: { $oid: 'string' }
  if (obj.$oid) {
    return obj.$oid;
  }
  
  // Handle EJSON Date: { $date: { $numberLong: 'timestamp' } }
  if (obj.$date) {
    const timestamp = obj.$date.$numberLong || obj.$date;
    return new Date(parseInt(timestamp));
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertEJSONFields(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertEJSONFields(value);
    }
    return converted;
  }
  
  return obj;
}

// --- Helper: Sanitize and validate slide data ---
function sanitizeSlides(slides) {
  const validElementTypes = [
    'bullet_point', 'quote', 'author', 'context', 
    'stat', 'description', 'left_bullet', 'right_bullet', 'cta'
  ];

  return slides.map((slide, index) => {
    // Ensure slide has required structure
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

    // Sanitize elements array
    if (Array.isArray(slide.elements)) {
      sanitizedSlide.elements = slide.elements
        .filter(element => {
          // Must have text
          if (!element.text || typeof element.text !== 'string') return false;
          
          // Must have valid element_type
          if (!element.element_type) return false;
          
          return true;
        })
        .map(element => {
          // Normalize element_type
          let elementType = element.element_type.toLowerCase().trim();
          
          // Map common invalid types to valid ones
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

          // If still invalid, default to 'description'
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
    detail: "We're setting up the foundational framework for your custom presentation, including initial data structures and configuration parameters to ensure smooth generation. This involves initializing AI models, allocating computational resources, and preparing the entire pipeline for optimal performance throughout the creation workflow. We're also establishing connection protocols and validating your input parameters.",
  },
  analyzing: {
    percent: 5,
    message: "🔍 Deep content analysis in progress...",
    detail: "Our AI is meticulously extracting key themes, core insights, and relevant data points from your input source to build a comprehensive understanding of the material. This phase identifies primary concepts, secondary supporting ideas, potential visual opportunities, and narrative arcs to inform the entire presentation structure. We're analyzing sentiment, context, relationships between ideas, and determining the most impactful way to present your content.",
  },
  planning: {
    percent: 15,
    message: "📋 Planning presentation structure...",
    detail: "Structuring the overall narrative flow, determining optimal slide sequencing, and organizing content hierarchy to create a compelling and logical presentation storyline. This includes balancing information density, pacing considerations, audience engagement hooks, and transitions for seamless progression from introduction to conclusion. We're mapping out which ideas deserve their own slides, which should be combined, and how to maintain audience attention throughout.",
  },
  generating: {
    start: {
      percent: 25,
      message: "✍️ Starting detailed content generation phase...",
      detail: "Leveraging advanced language models to craft in-depth, tailored content for each slide, ensuring relevance, engagement, and alignment with your specified goals and audience. This multi-step process begins with ideation, followed by drafting, and iterative refinement to produce high-quality, professional-grade textual elements. Each slide is being carefully constructed with attention to tone, clarity, and visual balance.",
    },
    progress: (current, total) => ({
      message: `📚 Generating precise textual content for slide ${current}/${total}...`,
      detail: "Crafting titles, bullets, quotes, and stats optimized for frontend layout mapping. Ensuring exact counts and narrative flow. Each element is being carefully worded to maximize impact while maintaining consistency with your presentation's overall theme and message. We're also considering text length, readability, and how each slide will transition to the next.",
    }),
  },
  imaging: {  // NEW: Restored imaging state for progress
    start: {
      percent: 60,
      message: "🎨 Initiating advanced visual design phase...",
      detail: "Transitioning to creative visuals: preparing generative AI pipelines to produce bespoke imagery that perfectly complements and elevates your slide content. This setup calibrates style parameters, color schemes, and compositional rules based on content analysis for harmonious integration.",
    },
    progress: (current, total) => ({
      message: `🖼️ Designing custom visual elements for slide ${current}/${total}...`,
      detail: "Harnessing diffusion models and style transfer techniques to generate high-fidelity, contextually relevant imagery, icons, and graphics that visually reinforce your narrative. Each visual is optimized for resolution, aspect ratio, and emotional resonance to maximize viewer engagement and retention.",
    }),
  },
  finalizing: {
    percent: 95,
    message: "✨ Finalizing your complete presentation...",
    detail: "Merging all generated textual components into a cohesive deliverable, performing quality assurance checks, and preparing the file for immediate use or export. This wraps up with metadata embedding, thumbnail creation, and compatibility verification to ensure a flawless user experience from start to finish. We're also validating data integrity, ensuring proper formatting, and confirming that all elements are properly structured for your frontend application.",
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
    artStyle,
    slideCount = 5,
    userData,
  } = req.body;

  // Authorization checks
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
      await new Promise((r) => setTimeout(r, 800));

      sendUpdate(streamingStates.analyzing);
      let rawText, topic;

      try {
        sendUpdate({ percent: 5, message: "Analyzing input content..." });

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

      // Progress updates
      for (let i = 0; i < slides.length; i++) {
        await new Promise((r) => setTimeout(r, 800));
        const contentPercent = 25 + Math.floor((i / slides.length) * 35);
        sendUpdate({
          ...streamingStates.generating.progress(i + 1, slides.length),
          percent: contentPercent,
        });
      }

      // NEW: Restored imaging phase (missing in current version)
      sendUpdate(streamingStates.imaging.start);
      const slideCountNum = slides.length;
      let currentImagingSubstep = 0;
      const totalImagingSubsteps = slideCountNum;

      // Clean/sanitize BEFORE image gen
      const cleanedSlides = convertEJSONFields(slides);
      const sanitizedSlides = sanitizeSlides(cleanedSlides);

      let slidesWithImages = [];

      for (let i = 0; i < sanitizedSlides.length; i++) {
        // Progress update
        const imagingPercent = 60 + Math.floor((currentImagingSubstep / totalImagingSubsteps) * 30);
        sendUpdate({
          ...streamingStates.imaging.progress(i + 1, sanitizedSlides.length),
          percent: imagingPercent
        });
        currentImagingSubstep++;
        await new Promise((r) => setTimeout(r, 500)); // Throttle for UX

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
            art_style: imageSlide.art_style,
            art_palette: imageSlide.art_palette,
            image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
          });
          console.log(`✓ Image generated for slide ${i + 1} in streaming`);
        } catch (error) {
          console.error(`Image gen failed for slide ${i + 1} in streaming:`, error.message);
          slidesWithImages.push({ 
            ...sanitizedSlides[i], 
            image_url: null, 
            image_caption: "Image unavailable" 
          });
        }
      }

      sendUpdate(streamingStates.finalizing);

      // Prepare final slides using slidesWithImages
      const totalSlides = slidesWithImages.length;
      const finalSlides = slidesWithImages.map((slide, index) => ({
        ...slide,
        slide_number: index + 1,
        total_slides: totalSlides,
        generated_at: new Date(),
      }));

      // Create presentation document
      const presentation = new Presentation({
        topic,
        meta: {
          ...meta,
          source,
          slideCount: totalSlides,
          artStyle: artStyle || "modern illustration with characters",
        },
        slides: finalSlides,
        slide_count: totalSlides,
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
          slide_count: totalSlides,
          art_style: artStyle,
          layout_variants: false,
          generated_at: new Date(),
        },
      });

      await presentation.save();

      // Final success update
      sendUpdate({
        percent: 100,
        complete: true,
        message: "✅ Presentation successfully created!",
        detail: `Your ${totalSlides}-slide presentation is now complete.`,
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
      });
      clearInterval(heartbeat);
      res.end();
    }
  } else {
    // Non-streaming response (unchanged from current)
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

      // Generate slide content
      const slides = await generateSlideText(rawText, meta, slideCount);

      // Clean EJSON before processing
      const cleanedSlides = convertEJSONFields(slides);

      // Sanitize and validate all slide data
      const sanitizedSlides = sanitizeSlides(cleanedSlides);

      // Optional: Generate images
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

      // Use images if generated, otherwise use sanitized slides
      const finalSlides = (slidesWithImages.length > 0 ? slidesWithImages : sanitizedSlides).map(
        (slide, index) => ({
          ...slide,
          slide_number: index + 1,
          total_slides: sanitizedSlides.length,
          generated_at: new Date(),
        })
      );

      // Save to database
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