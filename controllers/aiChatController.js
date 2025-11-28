const aiChatService = require("../services/aiChatService");
const Chat = require("../models/Chat");

class AIChatController {

  async chat(req, res) {
    try {
      const { message, user } = req.body;
      console.log("Received message:", message);
      console.log("Current User:", user ? user : "guest");

      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      // 🔹 Get AI response
      const result = await aiChatService.chat(message);

      // 🔹 Only store chat if user is logged in
      if (user && user.email) {
        const chatEntry = {
          userEmail: user.email,
          messages: [
            { sender: "user", text: message },
            { sender: "bot", text: result },
          ],
        };

        await Chat.create(chatEntry);
      } else {
        console.log("Guest user detected — skipping chat storage.");
      }

      // 🔹 Return AI response
      return res.json({ response: result });
    } catch (error) {
      console.error("AI Chat Error:", error);
      return res.status(500).json({ error: "Something went wrong." });
    }
  }

  async getChatHistory(req, res) {
    try {
      const { email } = req.params;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const chats = await Chat.find({ userEmail: email })
        .sort({ createdAt: -1 })
        .limit(10);

      const allMessages = chats.flatMap((chat) => chat.messages);

      return res.json({ messages: allMessages });
    } catch (error) {
      console.error("Chat history error:", error);
      res.status(500).json({ error: "Failed to load chat history" });
    }
  }

  async validateTopic(req, res) {
    try {
      const { topic } = req.body;

      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ valid: "no" });
      }

      // Define strict validator prompt
      const prompt = `
You are a STRICT validation engine.
Determine if the following text is a meaningful topic for a slide deck.

Rules:
- Only reply with "yes" or "no".
- No explanations.
- "yes" = meaningful educational or business topic.
- "no" = too short, greeting, slang, joke, meaningless, or unclear text.

Topic: "${topic}"
Return only "yes" or "no".
    `.trim();

      // Call your AI service
      const aiResult = await aiChatService.chat(prompt);

      const cleaned = aiResult.trim().toLowerCase();

      // Force valid yes/no
      const valid = cleaned === "yes" ? "yes"
        : cleaned === "no" ? "no"
          : "no";

      return res.json({ valid });

    } catch (error) {
      console.error("Topic Validation Error:", error);
      return res.status(500).json({ valid: "no" });
    }
  }
}

module.exports = new AIChatController();
