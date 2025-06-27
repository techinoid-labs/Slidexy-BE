const { validationResult } = require("express-validator");
const { fetchWebsiteText } = require("../services/fetchWebsiteText");
const {
  fetchYouTubeTranscript,
} = require("../services/fetchYouTubeTranscript");
const { generateSlideText } = require("../services/generateSlideText");
const { generateImage } = require("../services/generateImage");

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

    const slides = await generateSlideText(rawText);
    // const slidesWithImages = await Promise.all(
    //   slides.map((slide, index) => generateImage(slide, index))
    // );

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
