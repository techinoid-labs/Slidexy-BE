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

class ProgressTracker {
  constructor() {
    this.current = 0;
  }

  update(percent) {
    if (typeof percent !== "number" || Number.isNaN(percent)) {
      return this.current;
    }
    this.current = Math.max(this.current, Math.min(100, Math.round(percent)));
    return this.current;
  }

  get() {
    return this.current;
  }
}

function mapProgress(min, max, ratio) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return min + Math.floor(clamped * (max - min));
}

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
      quote: slide.quote,
      author: slide.author,
      context: slide.context,
      slide_number: slide.slide_number || index + 1,
      total_slides: slide.total_slides || slides.length,
      created_at: slide.created_at || new Date(),
      updated_at: slide.updated_at || new Date()
    };

    if (Array.isArray(slide.elements)) {
      if (slide.layout_type === 'quote-slide') {
        console.log(`[Sanitize] Slide ${index + 1} (${slide.layout_type}): Processing ${slide.elements.length} raw elements`);
        // Log individual elements to see what's wrong
        slide.elements.forEach((el, i) => {
          console.log(`  - Element ${i + 1}: type=${el.element_type}, textLength=${el.text ? el.text.length : 'N/A'}`);
        });
      }

      sanitizedSlide.elements = slide.elements
        .filter(element => {
          if (!element.text || typeof element.text !== 'string') {
            console.warn(`[Sanitize] Dropping element in slide ${index + 1} (${slide.layout_type}) due to invalid text:`, element);
            return false;
          }
          if (!element.element_type) {
            console.warn(`[Sanitize] Dropping element in slide ${index + 1} (${slide.layout_type}) due to missing type:`, element);
            return false;
          }
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
            'author_name': 'author',
            'statistic': 'stat',
            'number': 'stat',
            'call_to_action': 'cta',
            'button': 'cta'
          };

          if (typeMapping[elementType]) {
            elementType = typeMapping[elementType];
          }

          if (!validElementTypes.includes(elementType)) {
            console.warn(`[Sanitize] Invalid element_type "${element.element_type}" in slide ${index + 1}, defaulting to "description"`);
            elementType = 'description';
          }

          return {
            id: element.id || crypto.randomUUID(),
            element_id: element.element_id || `element-${crypto.randomUUID()}`,
            element_type: elementType,
            text: element.text.trim()
          };
        });

      if (slide.layout_type === 'quote-slide') {
        console.log(`[Sanitize] Slide ${index + 1} finalized elements from array: ${sanitizedSlide.elements.length}`);
      }
    }

    // SELF-HEALING: If quote slide has no elements, try to recover from top-level fields or content_metadata
    if (slide.layout_type === 'quote-slide' && (!sanitizedSlide.elements || sanitizedSlide.elements.length === 0)) {
      const qText = slide.quote || (slide.content_metadata && slide.content_metadata.quote);
      const aText = slide.author || (slide.content_metadata && slide.content_metadata.author);
      const cText = slide.context || (slide.content_metadata && slide.content_metadata.context);

      console.log(`[EMERGENCY-SANITY] Self-healing Slide ${index + 1}: quote=${!!qText}, author=${!!aText}`);

      if (qText) {
        sanitizedSlide.elements.push({
          id: crypto.randomUUID(),
          element_id: `element-${crypto.randomUUID()}`,
          element_type: 'quote',
          text: String(qText).trim()
        });
      }
      if (aText) {
        sanitizedSlide.elements.push({
          id: crypto.randomUUID(),
          element_id: `element-${crypto.randomUUID()}`,
          element_type: 'author',
          text: String(aText).trim()
        });
      }
      if (cText) {
        sanitizedSlide.elements.push({
          id: crypto.randomUUID(),
          element_id: `element-${crypto.randomUUID()}`,
          element_type: 'context',
          text: String(cText).trim()
        });
      }
      console.log(`[EMERGENCY-SANITY] Slide ${index + 1} reconstructed elements: ${sanitizedSlide.elements.length}`);
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
    message: "🚀 Starting presentation creation...",
    detail: "Initializing the generation pipeline for your custom presentation.",
  },
  fetchingWebsite: {
    percent: 8,
    message: "🌐 Fetching website content...",
    detail: "Extracting text and structure from the provided URL.",
  },
  analyzing: {
    percent: 15,
    message: "🔍 Analyzing content...",
    detail: "Processing key topics and important information from the source.",
  },
  planning: {
    percent: 20,
    message: "📋 Planning slide structure...",
    detail: "Designing the presentation flow and layout strategy.",
  },
  generating: {
    start: {
      percent: 25,
      message: "✍️ Generating slide content...",
      detail: "Creating tailored titles, bullet points, and supporting text.",
    },
    progress: (current, total) => ({
      message: `📚 Creating slide ${current}/${total}...`,
      detail: "Crafting content that fits the layout and maintains narrative flow.",
    }),
  },
  imaging: {
    start: {
      percent: 60,
      message: "🎨 Generating visuals...",
      detail: "Creating presentation-ready imagery for your slides.",
    },
    progress: (current, total) => ({
      message: `🖼️ Designing visual ${current}/${total}...`,
      detail: "Generating contextually relevant imagery for each slide.",
    }),
    pexels: (current, total) => ({
      message: `🔍 Finding image ${current}/${total} from Pexels...`,
      detail: "Searching for high-quality stock imagery.",
    }),
    fetchingFallback: (current, total) => ({
      message: `📥 Fetching image ${current}/${total}...`,
      detail: "Retrieving professional stock photography.",
    }),
    uploading: (current, total) => ({
      message: `⬆️ Uploading image ${current}/${total}...`,
      detail: "Optimizing and storing images for your presentation.",
    }),
  },
  finalizing: {
    percent: 95,
    message: "✨ Finalizing presentation...",
    detail: "Completing final quality checks and preparing for delivery.",
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

  const planResponseType = req.planResponseType || "full";
  const wantsStreaming = req.headers["accept"] === "text/event-stream";

  if (wantsStreaming) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15000);

    const progressTracker = new ProgressTracker();
    const sendUpdate = (data = {}) => {
      const payload = { ...data };
      if (payload.percent !== undefined) {
        payload.percent = progressTracker.update(payload.percent);
      }
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    const sendProgress = (percent, message, detail) =>
      sendUpdate({ percent, message, detail });

    try {
      sendProgress(
        streamingStates.start.percent,
        streamingStates.start.message,
        streamingStates.start.detail
      );

      let rawText, topic;

      try {
        if (source === "youtube") {
          sendProgress(10, "📺 Fetching YouTube content...", "Extracting transcript and metadata.");
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
          sendProgress(
            streamingStates.fetchingWebsite.percent,
            streamingStates.fetchingWebsite.message,
            streamingStates.fetchingWebsite.detail
          );

          const websiteData = await fetchWebsiteText(inputWebsiteUrl, {
            timeout: 120000,
            waitTime: 2000
          });

          rawText = websiteData.formatted;
          topic = websiteData.raw.metadata.title || inputWebsiteUrl || "Website Presentation";

          sendProgress(
            12,
            `✅ Website content extracted (${websiteData.stats.totalChars} chars)`,
            `Found ${websiteData.stats.headings} headings and ${websiteData.stats.paragraphs} content blocks.`
          );
        } else {
          rawText = textContent;
          topic = textContent?.slice(0, 50) || "Untitled Presentation";
        }

        sendProgress(
          streamingStates.analyzing.percent,
          streamingStates.analyzing.message,
          streamingStates.analyzing.detail
        );
      } catch (fetchErr) {
        console.error("Error fetching input:", fetchErr);
        throw fetchErr;
      }

      sendProgress(
        streamingStates.planning.percent,
        streamingStates.planning.message,
        streamingStates.planning.detail
      );

      sendProgress(
        streamingStates.generating.start.percent,
        streamingStates.generating.start.message,
        streamingStates.generating.start.detail
      );

      let lastTextPercent = streamingStates.generating.start.percent;
      const textProgressCallback = (current, total) => {
        if (!total) return;
        const normalized = Math.max(0, Math.min(total, current));
        const percent = mapProgress(
          streamingStates.generating.start.percent,
          55,
          normalized / total
        );
        if (percent <= lastTextPercent) return;
        lastTextPercent = percent;
        const progressMessage = streamingStates.generating.progress(
          Math.min(normalized, total),
          total
        );
        sendProgress(percent, progressMessage.message, progressMessage.detail);
      };

      const slides = await generateSlideText(
        rawText,
        meta,
        slideCount,
        textProgressCallback
      );

      sendProgress(
        57,
        "🧹 Structuring slide content...",
        "Validating and formatting generated content."
      );

      const cleanedSlides = convertEJSONFields(slides);
      const sanitizedSlides = sanitizeSlides(cleanedSlides);

      sendProgress(
        streamingStates.imaging.start.percent,
        streamingStates.imaging.start.message,
        streamingStates.imaging.start.detail
      );

      let slidesWithImages = [];

      if (sanitizedSlides.length === 0) {
        slidesWithImages = [];
      } else if (planResponseType === "predefined") {
        // For predefined/trial mode, use Pexels images instead of placeholders
        sendProgress(
          65,
          "🔍 Fetching stock imagery...",
          "Finding professional images from Pexels."
        );

        const maxConcurrent = 3;
        const results = new Array(sanitizedSlides.length);
        let nextIndex = 0;
        let completedImages = 0;

        const runWorker = async () => {
          while (true) {
            const currentIndex = nextIndex++;
            if (currentIndex >= sanitizedSlides.length) break;
            const slide = sanitizedSlides[currentIndex];
            const slideNumber = currentIndex + 1;

            const progressMsg = streamingStates.imaging.pexels(
              slideNumber,
              sanitizedSlides.length
            );
            sendUpdate({
              message: progressMsg.message,
              detail: progressMsg.detail,
            });

            try {
              const imageResult = await generateImage(
                slide,
                currentIndex,
                rawText,
                "predefined", // Force Pexels mode
                artStyle,
                null,
                null,
                null
              );

              results[currentIndex] = {
                ...slide,
                image_url: imageResult.image_url || `https://placehold.co/1920x1080/6c5ce7/ffffff?text=Slide+${slideNumber}&font=roboto`,
                image_caption: imageResult.image_caption || "Placeholder image",
                photographer: imageResult.photographer,
                pexels_url: imageResult.pexels_url,
                fallback_used: imageResult.fallback_used || "pexels",
                art_style: imageResult.art_style || slide.art_style,
                art_palette: imageResult.art_palette || slide.art_palette,
              };
            } catch (error) {
              console.error(`Pexels fetch failed for slide ${slideNumber}:`, error);
              results[currentIndex] = {
                ...slide,
                image_url: `https://placehold.co/1920x1080/6c5ce7/ffffff?text=Slide+${slideNumber}&font=roboto`,
                image_caption: "Placeholder image",
                fallback_used: "placeholder",
              };
            } finally {
              completedImages += 1;
              const percent = mapProgress(65, 90, completedImages / sanitizedSlides.length);
              sendProgress(
                percent,
                `✅ Image ${completedImages}/${sanitizedSlides.length} ready`,
                "Stock imagery retrieved and optimized."
              );
            }
          }
        };

        const workerCount = Math.min(maxConcurrent, sanitizedSlides.length);
        await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
        slidesWithImages = results;

      } else {
        // For paid plans - use Pexels as we don't have AI generation yet
        const maxConcurrent = 4;
        const slideCountTotal = sanitizedSlides.length;
        const results = new Array(slideCountTotal);
        let nextIndex = 0;
        let completedImages = 0;

        const imageProgressRangeStart = streamingStates.imaging.start.percent;
        const imageProgressRangeEnd = 90;

        // Create progress callback for generateImage
        const createImageProgressCallback = (slideNum, total) => {
          return (current, totalSteps, stage) => {
            const stageMessages = {
              'fetching-fallback': streamingStates.imaging.fetchingFallback(slideNum, total),
              'uploading': streamingStates.imaging.uploading(slideNum, total),
            };

            const msg = stageMessages[stage] || streamingStates.imaging.progress(slideNum, total);
            sendUpdate({
              message: msg.message,
              detail: msg.detail,
            });
          };
        };

        const runWorker = async () => {
          while (true) {
            const currentIndex = nextIndex++;
            if (currentIndex >= slideCountTotal) break;
            const slide = sanitizedSlides[currentIndex];
            const slideNumber = currentIndex + 1;

            const inProgressMessage = streamingStates.imaging.progress(
              slideNumber,
              slideCountTotal
            );
            sendUpdate({
              message: inProgressMessage.message,
              detail: inProgressMessage.detail,
            });

            try {
              const imageResult = await generateImage(
                slide,
                currentIndex,
                rawText,
                planResponseType,
                artStyle,
                createImageProgressCallback(slideNumber, slideCountTotal),
                slideNumber,
                slideCountTotal
              );

              results[currentIndex] = {
                ...slide,
                image_url: imageResult.image_url || null,
                image_caption: imageResult.image_caption || "Image unavailable",
                photographer: imageResult.photographer,
                pexels_url: imageResult.pexels_url,
                fallback_used: imageResult.fallback_used,
                art_style: imageResult.art_style || slide.art_style,
                art_palette: imageResult.art_palette || slide.art_palette,
                image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
              };
            } catch (error) {
              console.error(
                `Image generation failed for slide ${slideNumber}:`,
                error.message
              );
              results[currentIndex] = {
                ...slide,
                image_url: `https://placehold.co/1920x1080/6c5ce7/ffffff?text=Slide+${slideNumber}&font=roboto`,
                image_caption: "Image unavailable",
                fallback_used: "placeholder",
              };
            } finally {
              completedImages += 1;
              const percent = mapProgress(
                imageProgressRangeStart,
                imageProgressRangeEnd,
                completedImages / slideCountTotal
              );
              sendProgress(
                percent,
                `🖼️ Visual ${completedImages}/${slideCountTotal} ready`,
                "Visual assets prepared and linked."
              );
            }
          }
        };

        const workerCount = Math.min(maxConcurrent, sanitizedSlides.length);
        await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
        slidesWithImages = results;
      }

      const totalSlidesCount = slidesWithImages.length;
      const finalSlides = slidesWithImages.map((slide, index) => ({
        ...slide,
        slide_number: index + 1,
        total_slides: totalSlidesCount,
        generated_at: new Date(),
      }));

      sendProgress(
        98,
        "💾 Saving presentation...",
        "Persisting your presentation data."
      );

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

      // DEEP VALIDATION & FORCE HEAL
      presentation.slides.forEach((s, i) => {
        if (s.layout_type === 'quote-slide' && (!s.elements || s.elements.length === 0)) {
          console.log(`[FORCE-HEAL-STREAMING] Recovering elements for Slide ${i + 1}`);
          const qText = s.quote || (s.content_metadata && s.content_metadata.quote);
          const aText = s.author || (s.content_metadata && s.content_metadata.author);
          const cText = s.context || (s.content_metadata && s.content_metadata.context);

          if (qText) {
            s.elements.push({
              id: crypto.randomUUID(),
              element_id: `element-${crypto.randomUUID()}`,
              element_type: 'quote',
              text: String(qText).trim()
            });
          }
          if (aText) {
            s.elements.push({
              id: crypto.randomUUID(),
              element_id: `element-${crypto.randomUUID()}`,
              element_type: 'author',
              text: String(aText).trim()
            });
          }
          if (cText) {
            s.elements.push({
              id: crypto.randomUUID(),
              element_id: `element-${crypto.randomUUID()}`,
              element_type: 'context',
              text: String(cText).trim()
            });
          }
        }
      });

      await presentation.save();

      sendUpdate({
        percent: 100,
        complete: true,
        message: "✅ Presentation complete!",
        detail: `Your ${totalSlidesCount}-slide presentation is ready.`,
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
        const websiteData = await fetchWebsiteText(inputWebsiteUrl);
        rawText = websiteData.formatted;
        topic = websiteData.raw.metadata.title || inputWebsiteUrl || "Website Presentation";
      } else {
        rawText = textContent;
        topic = textContent?.slice(0, 50) || "Untitled Presentation";
      }

      const slides = await generateSlideText(rawText, meta, slideCount);
      const cleanedSlides = convertEJSONFields(slides);
      const sanitizedSlides = sanitizeSlides(cleanedSlides);

      let slidesWithImages = [];

      if (sanitizedSlides.length === 0) {
        slidesWithImages = [];
      } else {
        // Use Pexels for all plans (since AI generation is not available)
        const results = new Array(sanitizedSlides.length);
        const maxConcurrent = 4;
        let nextIndex = 0;

        const runWorker = async () => {
          while (true) {
            const currentIndex = nextIndex++;
            if (currentIndex >= sanitizedSlides.length) break;
            const slide = sanitizedSlides[currentIndex];
            try {
              const imageSlide = await generateImage(
                slide,
                currentIndex,
                rawText,
                planResponseType,
                artStyle,
                null,
                null,
                null
              );
              results[currentIndex] = {
                ...slide,
                image_url: imageSlide.image_url || `https://placehold.co/1920x1080/6c5ce7/ffffff?text=Slide+${currentIndex + 1}&font=roboto`,
                image_caption: imageSlide.image_caption || "Image unavailable",
                photographer: imageSlide.photographer,
                pexels_url: imageSlide.pexels_url,
                fallback_used: imageSlide.fallback_used,
                art_style: imageSlide.art_style || slide.art_style,
                art_palette: imageSlide.art_palette || slide.art_palette,
                image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
              };
            } catch (error) {
              console.error(
                `Image generation failed for slide ${currentIndex + 1}:`,
                error
              );
              results[currentIndex] = {
                ...slide,
                image_url: `https://placehold.co/1920x1080/6c5ce7/ffffff?text=Slide+${currentIndex + 1}&font=roboto`,
                image_caption: "Image unavailable",
                fallback_used: "placeholder"
              };
            }
          }
        };

        const workerCount = Math.min(maxConcurrent, sanitizedSlides.length);
        await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
        slidesWithImages = results;
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

      // DEEP VALIDATION & FORCE HEAL
      presentation.slides.forEach((s, i) => {
        if (s.layout_type === 'quote-slide' && (!s.elements || s.elements.length === 0)) {
          console.log(`[FORCE-HEAL-NON-STREAMING] Recovering elements for Slide ${i + 1}`);
          const qText = s.quote || (s.content_metadata && s.content_metadata.quote);
          const aText = s.author || (s.content_metadata && s.content_metadata.author);
          const cText = s.context || (s.content_metadata && s.content_metadata.context);

          if (qText) {
            s.elements.push({
              id: crypto.randomUUID(),
              element_id: `element-${crypto.randomUUID()}`,
              element_type: 'quote',
              text: String(qText).trim()
            });
          }
          if (aText) {
            s.elements.push({
              id: crypto.randomUUID(),
              element_id: `element-${crypto.randomUUID()}`,
              element_type: 'author',
              text: String(aText).trim()
            });
          }
          if (cText) {
            s.elements.push({
              id: crypto.randomUUID(),
              element_id: `element-${crypto.randomUUID()}`,
              element_type: 'context',
              text: String(cText).trim()
            });
          }
        }
      });

      await presentation.save();

      console.log(`[DB] Final presentation check: total slides = ${presentation.slides.length}`);
      presentation.slides.forEach((s, i) => {
        if (s.layout_type === 'quote-slide') {
          console.log(`[DB] Slide ${i + 1} (${s.layout_type}) elements count: ${s.elements.length}`);
        }
      });

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