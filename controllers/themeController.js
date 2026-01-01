const { generateMultipleThemes } = require("../services/generateThemeImage");

async function generateThemeImageHandler(req, res) {
  const { prompt, count = 2 } = req.body;

  try {
    const themes = await generateMultipleThemes(prompt, count);
    res.json({ themes });
  } catch (err) {
    console.error("Theme image generation failed:", err.message);
    res.status(500).json({ error: "Failed to generate theme images." });
  }
}

module.exports = {
  generateThemeImageHandler,
};