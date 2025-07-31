const {
  generatePosterTemplateImage,
} = require("../services/infographicService");

async function getPosterTemplate(req, res) {
  try {
    const { topic } = req.body || {}; // Use req.query if using GET instead

    if (!topic) {
      return res.status(400).json({
        message: "Missing 'topic' in request body.",
      });
    }

    const imageData = await generatePosterTemplateImage(topic);

    res.status(200).json({
      message: "Poster template image generated successfully.",
      imageUrl: imageData,
    });
  } catch (error) {
    console.error("❌ Error in getPosterTemplate:", error);

    res.status(500).json({
      message: "Failed to generate poster template image.",
      error: error.message,
    });
  }
}

module.exports = {
  getPosterTemplate,
};
