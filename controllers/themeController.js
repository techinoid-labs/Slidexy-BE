const { validationResult } = require("express-validator");
const { generateMultipleThemes } = require("../services/generateThemeImage");

async function generateThemeImageHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { prompt, count = 2 } = req.body;

  try {
    const themes = await generateMultipleThemes(prompt, count);
    res.json({ themes });
  } catch (err) {
    console.error("Theme image generation failed:", err.message);
    res.status(500).json({
      error: "Failed to generate theme images. " + err.message,
    });
  }
}

module.exports = { generateThemeImageHandler };
