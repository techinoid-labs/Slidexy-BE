const { validationResult } = require("express-validator");
const { fetchWebsiteText } = require("../services/fetchWebsiteText");
const {
  fetchYouTubeTranscript,
} = require("../services/fetchYouTubeTranscript");
const { generateSlideText } = require("../services/generateSlideText");
const { generateImage } = require("../services/generateImage");
const {
  generateInfographicFromText,
} = require("../services/generateInfographic"); // ✅ NEW

async function generateSlidesHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const {
    source,
    inputUrl,
    textContent,
    inputWebsiteUrl,
    isInfographicMode, // ✅ 1. Extract from body
  } = req.body;

  // ✅ 2. Coerce string "true"/"false" to boolean
  const useInfographic =
    isInfographicMode === true || isInfographicMode === "true";

  let rawText = "";

  try {
    if (source === "youtube") {
      rawText = await fetchYouTubeTranscript(inputUrl);
    } else if (source === "website") {
      rawText = await fetchWebsiteText(inputWebsiteUrl);
    } else {
      rawText = textContent;
    }

    let slides = [];

    // ✅ 3. Use checkbox value instead of keyword match
    slides = await generateSlideText(rawText, useInfographic);

    // ✅ Generate images for each slide
    const slidesWithImages = await Promise.all(
      slides.map(async (slide, index) => {
        try {
          return await generateImage(slide, index);
        } catch (err) {
          console.error(
            `Image generation failed for slide ${index + 1}:`,
            err.message
          );
          return {
            ...slide,
            image_url: null,
            image_caption: "",
          };
        }
      })
    );

    res.json({ slides: slidesWithImages });
  } catch (err) {
    console.error("Error in generate-slides:", err);
    res.status(500).json({ error: err.message || "Slide generation failed." });
  }
}


module.exports = { generateSlidesHandler };
