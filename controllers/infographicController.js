const {
  generatePosterTemplateWithContent,
} = require("../services/infographicService");

async function getPosterTemplate(req, res) {
  try {
    const { topic, paragraphs } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Missing 'topic'." });
    }

    const { imageUrl, textLayout } = await generatePosterTemplateWithContent(
      topic,
      paragraphs
    );

    res.status(200).json({
      message: "Poster generated successfully.",
      imageUrl,
      textLayout,
    });
  } catch (error) {
    console.error("Poster generation failed:", error);
    res.status(500).json({
      message: "Poster generation failed.",
      error: error.message,
    });
  }
}

module.exports = {
  getPosterTemplate,
};
