const { validationResult } = require("express-validator");
const {
  generateCustomSuggestions,
} = require("../services/customSuggestions");

/**
 * POST /custom-suggestions
 * Body: { title: string, bullets: string[], customPrompt: string }
 */
async function customSuggestionsHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, bullets, customPrompt } = req.body;

  try {
    const suggestions = await generateCustomSuggestions({
      title,
      bullets,
      customPrompt,
    });
    return res.json({ suggestions });
  } catch (err) {
    console.error("Error in customSuggestionsHandler:", err);
    return res
      .status(500)
      .json({ error: err.message || "Custom suggestion generation failed." });
  }
}

module.exports = customSuggestionsHandler;
