const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true, // ✅ required now (since no guests)
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["user", "bot"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);