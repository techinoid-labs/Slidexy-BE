const aiChatService = require("../services/aiChatService");

class AIChatController {
  async chat(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await aiChatService.chat(prompt);
      return res.json({ response: result });
    } catch (error) {
      console.error("AI Chat Error:", error);
      return res.status(500).json({ error: "Something went wrong." });
    }
  }
}

module.exports = new AIChatController();
