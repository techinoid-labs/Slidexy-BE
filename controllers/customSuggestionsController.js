const { generateCustomSuggestions } = require("../services/customSuggestions");

async function customSuggestionsHandler(req, res) {
  const { title, bullets, customPrompt } = req.body;

  try {
    const suggestions = await generateCustomSuggestions({
      title,
      bullets,
      customPrompt,
    });
    return res.json({ suggestions });
  } catch (err) {
    console.error("Custom suggestions failed:", err.message);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
}

module.exports = customSuggestionsHandler;
