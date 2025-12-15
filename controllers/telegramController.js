const telegramService = require("../services/telegramService");
const User = require("../models/User");
const Presentation = require("../models/Presentation");
const axios = require("axios");

/**
 * Telegram Controller
 * Handles Telegram Bot integration for sharing presentations
 * 
 * Flow:
 * 1. User gets bot token from @BotFather
 * 2. User starts bot conversation to get chat ID
 * 3. Frontend calls /connect with chatId
 * 4. Backend verifies chatId and stores in user profile
 * 5. User can now share slides to Telegram
 */

/**
 * Connect Telegram account
 * Verifies chat ID and saves to user profile
 * 
 * @route POST /api/telegram/connect
 * @body { chatId: string|number }
 */
exports.connectTelegram = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ 
        error: "Chat ID is required",
        message: "Please provide your Telegram chat ID"
      });
    }

    // Verify bot token is configured
    try {
      await telegramService.verifyBotToken();
    } catch (error) {
      return res.status(500).json({
        error: "Bot token not configured",
        message: "Telegram bot is not properly configured on the server",
        detail: error.message,
      });
    }

    // Verify chat ID is valid
    const isValidChat = await telegramService.verifyChatId(chatId);
    if (!isValidChat) {
      return res.status(400).json({
        error: "Invalid chat ID",
        message: "Could not verify the provided chat ID. Please ensure you've started a conversation with the bot.",
      });
    }

    // Get chat information
    const chatInfo = await telegramService.getChat(chatId);

    // Update user with Telegram information
    const user = await User.findByIdAndUpdate(
      userId,
      {
        telegramConnected: true,
        telegramChatId: chatId,
        telegramProfile: {
          chatId: chatInfo.chatId,
          username: chatInfo.username,
          firstName: chatInfo.firstName,
          lastName: chatInfo.lastName,
        },
        telegramConnectedAt: new Date(),
      },
      { new: true }
    );

    // Send test message to confirm connection
    try {
      await telegramService.sendTestMessage(chatId);
    } catch (error) {
      console.warn("Failed to send test message:", error.message);
      // Don't fail the connection if test message fails
    }

    res.json({
      success: true,
      message: "Telegram connected successfully",
      profile: user.telegramProfile,
    });
  } catch (error) {
    console.error("Telegram connection error:", error);
    res.status(500).json({
      error: "Failed to connect Telegram",
      detail: error.message,
    });
  }
};

/**
 * Get Telegram connection status
 * Returns whether user has connected Telegram
 * 
 * @route GET /api/telegram/status
 */
exports.getConnectionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "telegramConnected telegramProfile telegramConnectedAt"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isConnected = user.telegramConnected || false;

    res.json({
      connected: isConnected,
      profile: isConnected ? user.telegramProfile : null,
      connectedAt: user.telegramConnectedAt,
    });
  } catch (error) {
    console.error("Telegram status check error:", error);
    res.status(500).json({
      error: "Failed to check Telegram connection status",
      detail: error.message,
    });
  }
};

/**
 * Disconnect Telegram account
 * Removes Telegram credentials from user account
 * 
 * @route DELETE /api/telegram/disconnect
 */
exports.disconnectTelegram = async (req, res) => {
  try {
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      $unset: {
        telegramChatId: 1,
        telegramProfile: 1,
        telegramConnectedAt: 1,
      },
      telegramConnected: false,
    });

    res.json({
      success: true,
      message: "Telegram account disconnected successfully",
    });
  } catch (error) {
    console.error("Telegram disconnect error:", error);
    res.status(500).json({
      error: "Failed to disconnect Telegram account",
      detail: error.message,
    });
  }
};

/**
 * Share presentation slide to Telegram
 * Posts slide image and text to user's Telegram chat
 * 
 * @route POST /api/telegram/share
 * @body { presentationId: string, slideIndex: number, message?: string }
 */
exports.shareToTelegram = async (req, res) => {
  try {
    const userId = req.userId;
    const { presentationId, slideIndex, message } = req.body;

    // Validate inputs
    if (!presentationId) {
      return res.status(400).json({ error: "Presentation ID is required" });
    }

    if (slideIndex === undefined || slideIndex === null) {
      return res.status(400).json({ error: "Slide index is required" });
    }

    // Get user with Telegram credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.telegramConnected || !user.telegramChatId) {
      return res.status(400).json({
        error: "Telegram account not connected",
        message: "Please connect your Telegram account first",
      });
    }

    // Get presentation
    const presentation = await Presentation.findOne({ 
      presentation_id: presentationId 
    });
    
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    // Get specific slide
    const slide = presentation.slides[slideIndex];
    if (!slide) {
      return res.status(404).json({ error: "Slide not found" });
    }

    // Check if slide has image
    if (!slide.image_url) {
      return res.status(400).json({
        error: "Slide has no image",
        message: "Cannot share slide without an image",
      });
    }

    // Download image from URL
    const imageResponse = await axios.get(slide.image_url, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Prepare slide text content
    let slideText = "";
    if (slide.subtitle?.text) {
      slideText += slide.subtitle.text + "\n\n";
    }
    if (slide.elements && slide.elements.length > 0) {
      slideText += slide.elements
        .map(el => `• ${el.text}`)
        .join("\n");
    }

    // Share to Telegram
    const shareResult = await telegramService.shareSlide(
      user.telegramChatId,
      imageBuffer,
      slide.slide_title?.text || "Presentation Slide",
      slideText,
      message || ""
    );

    res.json({
      success: true,
      message: "Successfully shared to Telegram",
      messageId: shareResult.messageId,
      chatId: shareResult.chatId,
    });
  } catch (error) {
    console.error("Telegram share error:", error);
    res.status(500).json({
      error: "Failed to share to Telegram",
      detail: error.message,
    });
  }
};

/**
 * Share custom content to Telegram
 * Allows sharing with custom text and external image URL
 * 
 * @route POST /api/telegram/share-custom
 * @body { imageUrl: string, message: string }
 */
exports.shareCustomContent = async (req, res) => {
  try {
    const userId = req.userId;
    const { imageUrl, message } = req.body;

    // Validate inputs
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get user with Telegram credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.telegramConnected || !user.telegramChatId) {
      return res.status(400).json({
        error: "Telegram account not connected",
        message: "Please connect your Telegram account first",
      });
    }

    // Download image from URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Add Slidexy branding to message
    const formattedMessage = `${message}\n\n_Created with Slidexy 🚀`;

    // Send to Telegram
    const shareResult = await telegramService.sendPhoto(
      user.telegramChatId,
      imageBuffer,
      formattedMessage
    );

    res.json({
      success: true,
      message: "Successfully shared to Telegram",
      messageId: shareResult.messageId,
      chatId: shareResult.chatId,
    });
  } catch (error) {
    console.error("Telegram custom share error:", error);
    res.status(500).json({
      error: "Failed to share to Telegram",
      detail: error.message,
    });
  }
};

/**
 * Send text message to Telegram
 * Sends a simple text message without image
 * 
 * @route POST /api/telegram/send-message
 * @body { message: string }
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get user with Telegram credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.telegramConnected || !user.telegramChatId) {
      return res.status(400).json({
        error: "Telegram account not connected",
        message: "Please connect your Telegram account first",
      });
    }

    // Send message
    const result = await telegramService.sendMessage(
      user.telegramChatId,
      message
    );

    res.json({
      success: true,
      message: "Message sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Telegram send message error:", error);
    res.status(500).json({
      error: "Failed to send message to Telegram",
      detail: error.message,
    });
  }
};

/**
 * Get bot information
 * Returns information about the configured Telegram bot
 * 
 * @route GET /api/telegram/bot-info
 */
exports.getBotInfo = async (req, res) => {
  try {
    const botInfo = await telegramService.verifyBotToken();
    
    res.json({
      success: true,
      bot: {
        id: botInfo.botInfo.id,
        username: botInfo.botInfo.username,
        firstName: botInfo.botInfo.first_name,
        canJoinGroups: botInfo.botInfo.can_join_groups,
        canReadAllGroupMessages: botInfo.botInfo.can_read_all_group_messages,
      },
      botLink: `https://t.me/${botInfo.botInfo.username}`,
    });
  } catch (error) {
    console.error("Telegram bot info error:", error);
    res.status(500).json({
      error: "Failed to get bot information",
      detail: error.message,
    });
  }
};
