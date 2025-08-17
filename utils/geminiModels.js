const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.API_KEY || "AIzaSyD6ayhVWq88wSS2UyLT4i_biEOhFnVZzF4"
);

const textGenModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const imageGenModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-preview-image-generation",
});

module.exports = { textGenModel, imageGenModel };
