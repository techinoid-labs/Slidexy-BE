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

  const { source, inputUrl, textContent, inputWebsiteUrl } = req.body;
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

    // ✅ Check for infographic keywords
    if (rawText.toLowerCase().includes("infographic")) {
      const result = await generateInfographicFromText(rawText);
      slides = result.slides;
    } else {
      slides = await generateSlideText(rawText);
    }

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
