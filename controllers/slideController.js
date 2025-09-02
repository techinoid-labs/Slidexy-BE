// const { validationResult } = require("express-validator");
// const { fetchWebsiteText } = require("../services/fetchWebsiteText");
// const {
//   fetchYouTubeTranscript,
// } = require("../services/fetchYouTubeTranscript");
// const { generateSlideText } = require("../services/generateSlideText");
// const { generateImage } = require("../services/generateImage");
// const { fetchYouTubeMeta } = require("../services/fetchYouTubeMeta");
// const { v4: uuidv4 } = require("uuid");

// function extractYouTubeVideoId(url) {
//   try {
//     const parsedUrl = new URL(url);
//     let videoId = null;

//     if (parsedUrl.hostname.includes("youtu.be")) {
//       videoId = parsedUrl.pathname.slice(1);
//     } else if (parsedUrl.pathname.startsWith("/shorts/")) {
//       videoId = parsedUrl.pathname.split("/")[2];
//     } else if (parsedUrl.pathname.startsWith("/embed/")) {
//       videoId = parsedUrl.pathname.split("/")[2];
//     } else {
//       videoId = parsedUrl.searchParams.get("v");
//     }

//     // remove extra query params if still attached
//     if (videoId) {
//       videoId = videoId.split("&")[0].split("?")[0];
//     }

//     if (!videoId) throw new Error("Invalid YouTube URL");

//     return videoId;
//   } catch (err) {
//     throw new Error("Invalid YouTube URL format: " + url);
//   }
// }

// async function generateSlidesHandler(req, res) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty())
//     return res.status(400).json({ errors: errors.array() });

//   const {
//     source,
//     inputUrl,
//     textContent,
//     inputWebsiteUrl,
//     meta = {},
//     slideCount = 3,
//   } = req.body;

//   let rawText = "";

//   try {
//     if (source === "youtube") {
//       const urlObj = new URL(inputUrl);
//       // const videoId = urlObj.searchParams.get("v") || inputUrl.split("/").pop();
//       const videoId = extractYouTubeVideoId(inputUrl);
//       let transcript = null;
//       try {
//         transcript = await fetchYouTubeTranscript(inputUrl);
//       } catch (err) {
//         // Transcript not available, will fall back to metadata
//       }
//       if (transcript && transcript.trim().length > 0) {
//         rawText = transcript;
//       } else {
//         const metaData = await fetchYouTubeMeta(videoId);
//         rawText = `Title: ${metaData.title}\nDescription: ${
//           metaData.description
//         }\nThumbnail: ${metaData.thumbnail}\nPublish Date: ${
//           metaData.publishDate
//         }\nChannel: ${metaData.channelName}\nChannel URL: ${
//           metaData.channelUrl
//         }\nView Count: ${metaData.viewCount}\nDuration: ${
//           metaData.duration
//         }\nTags: ${metaData.tags.join(", ")}`;
//       }
//     } else if (source === "website") {
//       rawText = await fetchWebsiteText(inputWebsiteUrl);
//     } else {
//       rawText = textContent;
//     }

//     let slides = [];

//     slides = await generateSlideText(rawText, meta, slideCount);

//     const slidesWithImages = await Promise.all(
//       slides.map(async (slide, index) => {
//         try {
//           const imageSlide = await generateImage(slide, index);
//           const imageUrl = imageSlide.image_url;

//           // Remove text elements (e.g., title or paragraph)
//           const elementsWithoutText = slide.elements.filter(
//             (el) => el.element_type !== "text"
//           );

//           const elementsWithOnlyImage = [
//             ...elementsWithoutText,
//             {
//               element_type: "image",
//               konva_component: "Konva.Image",
//               element_id: uuidv4(),
//               properties: {
//                 imageSrc: imageUrl,
//                 x: 440,
//                 y: 15,
//                 width: 500,
//                 height: 400,
//               },
//             },
//           ];

//           return {
//             ...slide,
//             slide_title: {
//               ...slide.slide_title,
//               text: slide.slide_title?.text,
//             },
//             image_url: imageUrl,
//             elements: elementsWithOnlyImage,
//           };
//         } catch (err) {
//           console.error(
//             `Image generation failed for slide ${index + 1}:`,
//             err.message
//           );
//           return {
//             ...slide,
//             image_url: null,
//             elements: slide.elements,
//           };
//         }
//       })
//     );

//     // const slidesWithElementIds = slidesWithImages.map((slide) => {
//     //   const elementsWithIds = slide.elements.map((el) => ({
//     //     ...el,
//     //     element_id: el.element_id || uuidv4(),
//     //   }));

//     //   return {
//     //     ...slide,
//     //     elements: elementsWithIds,
//     //   };
//     // });

//     const imgSlides = slidesWithImages;

//     res.json({ slides: slidesWithImages });
//     // res.json({ slides: slidesWithElementIds });
//   } catch (err) {
//     console.error("Error in generate-slides:", err);
//     res.status(500).json({ error: err.message || "Slide generation failed." });
//   }
// }

// module.exports = { generateSlidesHandler };
const { validationResult } = require("express-validator");
const { fetchWebsiteText } = require("../services/fetchWebsiteText");
const {
  fetchYouTubeTranscript,
} = require("../services/fetchYouTubeTranscript");
const { generateSlideText } = require("../services/generateSlideText");
const { generateImage } = require("../services/generateImage");
const { fetchYouTubeMeta } = require("../services/fetchYouTubeMeta");
const { v4: uuidv4 } = require("uuid");

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

// --- Helper: smooth drifting progress (only used in SSE mode) ---
function driftProgress(sendUpdate, start, end, message) {
  let current = start;
  const tick = () => {
    if (current < end - 1) {
      current += Math.random() * 2;
      current = Math.min(current, end - 1);
      sendUpdate({ percent: Math.round(current), message });
      setTimeout(tick, 200 + Math.random() * 400);
    }
  };
  tick();
  return () => {
    current = end;
    sendUpdate({ percent: end, message: message + " done" });
  };
}

// --- Shared business logic (no response writing here) ---
async function buildSlides({
  source,
  inputUrl,
  textContent,
  inputWebsiteUrl,
  meta,
  slideCount,
}) {
  let rawText = "";

  // Step 1: Fetch input text
  if (source === "youtube") {
    const videoId = extractYouTubeVideoId(inputUrl);
    let transcript = null;
    try {
      transcript = await fetchYouTubeTranscript(inputUrl);
    } catch (err) {
      // fallback if no transcript
    }
    if (transcript && transcript.trim().length > 0) {
      rawText = transcript;
    } else {
      const metaData = await fetchYouTubeMeta(videoId);
      rawText = `Title: ${metaData.title}\nDescription: ${
        metaData.description
      }\nThumbnail: ${metaData.thumbnail}\nPublish Date: ${
        metaData.publishDate
      }\nChannel: ${metaData.channelName}\nChannel URL: ${
        metaData.channelUrl
      }\nView Count: ${metaData.viewCount}\nDuration: ${
        metaData.duration
      }\nTags: ${metaData.tags.join(", ")}`;
    }
  } else if (source === "website") {
    rawText = await fetchWebsiteText(inputWebsiteUrl);
  } else {
    rawText = textContent;
  }

  // Step 2: Generate slide text
  const slides = await generateSlideText(rawText, meta, slideCount);

  // Step 3: Generate images
  const slidesWithImages = [];
  for (let i = 0; i < slides.length; i++) {
    try {
      const imageSlide = await generateImage(slides[i], i);
      const imageUrl = imageSlide.image_url;

      const elementsWithoutText = slides[i].elements.filter(
        (el) => el.element_type !== "text"
      );

      slidesWithImages.push({
        ...slides[i],
        slide_title: {
          ...slides[i].slide_title,
          text: slides[i].slide_title?.text,
        },
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
    } catch (err) {
      console.error(`Image generation failed for slide ${i + 1}:`, err.message);
      slidesWithImages.push({
        ...slides[i],
        image_url: null,
        elements: slides[i].elements,
      });
    }
  }

  return slidesWithImages;
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
  } = req.body;

  const wantsStreaming = req.headers["accept"] === "text/event-stream";

  if (wantsStreaming) {
    // --- Streaming SSE mode ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendUpdate({ percent: 5, message: "Fetching input content..." });

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

      sendUpdate({ percent: 20, message: "Input content ready" });

      const stopTextDrift = driftProgress(
        sendUpdate,
        40,
        60,
        "Generating slide text..."
      );
      const slides = await generateSlideText(rawText, meta, slideCount);
      stopTextDrift();

      let slidesWithImages = [];
      for (let i = 0; i < slides.length; i++) {
        const stopImgDrift = driftProgress(
          sendUpdate,
          60 + Math.floor((i / slides.length) * 30),
          60 + Math.floor(((i + 1) / slides.length) * 30),
          `Generating image for slide ${i + 1}/${slides.length}...`
        );

        try {
          const imageSlide = await generateImage(slides[i], i);
          const imageUrl = imageSlide.image_url;

          slidesWithImages.push({ ...slides[i], image_url: imageUrl });
        } catch {
          slidesWithImages.push({ ...slides[i], image_url: null });
        }

        stopImgDrift();
      }

      sendUpdate({ percent: 100, complete: true, slides: slidesWithImages });
      res.end();
    } catch (err) {
      console.error("Error in generate-slides (SSE):", err);
      sendUpdate({ error: err.message || "Slide generation failed." });
      res.end();
    }
  } else {
    // --- Legacy JSON mode ---
    try {
      const slidesWithImages = await buildSlides({
        source,
        inputUrl,
        textContent,
        inputWebsiteUrl,
        meta,
        slideCount,
      });

      res.json({ slides: slidesWithImages });
    } catch (err) {
      console.error("Error in generate-slides (JSON):", err);
      res
        .status(500)
        .json({ error: err.message || "Slide generation failed." });
    }
  }
}

module.exports = { generateSlidesHandler };
