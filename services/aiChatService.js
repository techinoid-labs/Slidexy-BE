const { textGenModel } = require("../utils/geminiModels");

class AIChatService {
  async chat(prompt) {
    const response = await textGenModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are "Slidexy-AI" — a friendly AI assistant who is an expert in making presentations.
Style:
- Talk like a human teammate, not a robot.
- Keep answers concise and practical (bullet points or short sentences).
- Be helpful, creative, and approachable.
- Focus on slides, titles, storytelling, structure, and design.

User: ${prompt}
              `,
            },
          ],
        },
      ],
    });

    return response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

module.exports = new AIChatService();
