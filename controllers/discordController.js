const discordService = require("../services/discordService");
const User = require("../models/User");
const Presentation = require("../models/Presentation");
const axios = require("axios");

/**
 * Discord Controller
 * Handles Discord Bot integration for sharing presentations to Discord channels
 * 
 * Flow:
 * 1. User creates Discord bot at https://discord.com/developers/applications
 * 2. User invites bot to their Discord server
 * 3. User enables Developer Mode in Discord and copies channel ID
 * 4. Frontend calls /connect with channelId
 * 5. Backend verifies channelId and stores in user profile
 * 6. User can now share slides to Discord channel
 * 
 * How to get Channel ID:
 * 1. Enable Developer Mode: User Settings → Advanced → Developer Mode
 * 2. Right-click on channel → Copy ID
 */

/**
 * Get bot information
 * Returns Discord bot details for verification
 * 
 * @route GET /api/discord/bot-info
 */
exports.getBotInfo = async (req, res) => {
  try {
    const botInfo = await discordService.verifyBotToken();
    
    res.json({
      success: true,
      bot: botInfo.botInfo,
      message: "Discord bot is configured and ready",
    });
  } catch (error) {
    console.error("Discord bot info error:", error);
    res.status(500).json({
      error: "Failed to get Discord bot information",
      message: "Bot token may not be configured or is invalid",
      detail: error.message,
    });
  }
};

/**
 * Connect Discord channel
 * Verifies channel ID and saves to user profile
 * 
 * @route POST /api/discord/connect
 * @body { channelId: string }
 */
exports.connectDiscord = async (req, res) => {
  try {
    const userId = req.userId;
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ 
        error: "Channel ID is required",
        message: "Please provide your Discord channel ID. Enable Developer Mode in Discord, then right-click the channel and select 'Copy ID'."
      });
    }

    // Verify bot token is configured
    try {
      await discordService.verifyBotToken();
    } catch (error) {
      return res.status(500).json({
        error: "Bot token not configured",
        message: "Discord bot is not properly configured on the server",
        detail: error.message,
      });
    }

    // Verify channel ID is valid and bot has access
    const isValidChannel = await discordService.verifyChannelId(channelId);
    if (!isValidChannel) {
      return res.status(400).json({
        error: "Invalid channel ID",
        message: "Could not verify the provided channel ID. Please ensure:\n1. The bot is invited to your Discord server\n2. The bot has access to the channel\n3. The channel ID is correct",
      });
    }

    // Get channel information
    const channelInfo = await discordService.getChannel(channelId);

    // Check if it's a text channel
    if (channelInfo.type !== 0) {
      return res.status(400).json({
        error: "Invalid channel type",
        message: "Please select a text channel. Voice channels and other types are not supported.",
      });
    }

    // Get guild (server) information
    let guildInfo = null;
    try {
      guildInfo = await discordService.getGuild(channelInfo.guildId);
    } catch (error) {
      // Guild info is optional, continue without it
      console.warn("Could not fetch guild info:", error.message);
    }

    // Update user with Discord information
    const user = await User.findByIdAndUpdate(
      userId,
      {
        discordConnected: true,
        discordChannelId: channelId,
        discordProfile: {
          channelId: channelInfo.id,
          channelName: channelInfo.name,
          guildId: channelInfo.guildId,
          guildName: guildInfo?.name || "Unknown Server",
        },
        discordConnectedAt: new Date(),
      },
      { new: true }
    );

    // Send test message to confirm connection
    try {
      await discordService.sendTestMessage(channelId);
    } catch (error) {
      console.error("Failed to send test message:", error);
      // Don't fail the connection if test message fails
    }

    res.json({
      success: true,
      message: "Discord channel connected successfully",
      channel: {
        id: channelInfo.id,
        name: channelInfo.name,
        guildName: guildInfo?.name || "Unknown Server",
      },
    });
  } catch (error) {
    console.error("Discord connection error:", error);
    res.status(500).json({
      error: "Failed to connect Discord channel",
      detail: error.message,
    });
  }
};

/**
 * Get Discord connection status
 * Returns whether user has connected Discord and channel details
 * 
 * @route GET /api/discord/status
 */
exports.getConnectionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "discordConnected discordChannelId discordProfile discordConnectedAt"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isConnected = user.discordConnected || false;

    res.json({
      connected: isConnected,
      channelId: user.discordChannelId || null,
      profile: isConnected ? user.discordProfile : null,
      connectedAt: user.discordConnectedAt || null,
    });
  } catch (error) {
    console.error("Discord status check error:", error);
    res.status(500).json({
      error: "Failed to check Discord connection status",
      detail: error.message,
    });
  }
};

/**
 * Disconnect Discord channel
 * Removes Discord connection from user account
 * 
 * @route DELETE /api/discord/disconnect
 */
exports.disconnectDiscord = async (req, res) => {
  try {
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      $unset: {
        discordChannelId: 1,
        discordProfile: 1,
        discordConnectedAt: 1,
      },
      discordConnected: false,
    });

    res.json({
      success: true,
      message: "Discord channel disconnected successfully",
    });
  } catch (error) {
    console.error("Discord disconnect error:", error);
    res.status(500).json({
      error: "Failed to disconnect Discord channel",
      detail: error.message,
    });
  }
};

/**
 * Share presentation slide to Discord
 * Posts image to Discord channel with optional message
 * 
 * @route POST /api/discord/share
 * @body { presentationId: string, slideIndex: number, message?: string }
 */
exports.shareToDiscord = async (req, res) => {
  try {
    const userId = req.userId;
    const { presentationId, slideIndex, message } = req.body;

    // Validate inputs
    if (!presentationId) {
      return res.status(400).json({ 
        error: "Presentation ID is required",
        message: "Please provide a valid presentation ID"
      });
    }

    if (slideIndex === undefined || slideIndex === null) {
      return res.status(400).json({ 
        error: "Slide index is required",
        message: "Please specify which slide to share"
      });
    }

    // Get user with Discord credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.discordConnected || !user.discordChannelId) {
      return res.status(400).json({
        error: "Discord channel not connected",
        message: "Please connect your Discord channel first",
      });
    }

    // Verify channel is still accessible
    const isValidChannel = await discordService.verifyChannelId(user.discordChannelId);
    if (!isValidChannel) {
      return res.status(400).json({
        error: "Discord channel no longer accessible",
        message: "The connected channel is no longer accessible. Please reconnect.",
      });
    }

    // Get presentation
    const presentation = await Presentation.findOne({ presentation_id: presentationId });
    if (!presentation) {
      return res.status(404).json({ 
        error: "Presentation not found",
        message: "Could not find the specified presentation"
      });
    }

    // Get specific slide
    const slide = presentation.slides[slideIndex];
    if (!slide) {
      return res.status(404).json({ 
        error: "Slide not found",
        message: `Slide ${slideIndex} does not exist in this presentation`
      });
    }

    // Check if slide has image
    if (!slide.image_url) {
      return res.status(400).json({
        error: "Slide has no image",
        message: "Cannot share slide without an image",
      });
    }

    // Share slide to Discord
    const embedOptions = {
      title: slide.title || `Slide ${slideIndex + 1}`,
      description: message || slide.description || "",
      color: 0x5865f2, // Discord blurple
    };

    const shareResult = await discordService.shareSlide(
      user.discordChannelId,
      slide.image_url,
      "",
      embedOptions
    );

    res.json({
      success: true,
      message: "Successfully shared to Discord",
      messageId: shareResult.messageId,
      channelId: shareResult.channelId,
      channelName: user.discordProfile?.channelName,
    });
  } catch (error) {
    console.error("Discord share error:", error);
    res.status(500).json({
      error: "Failed to share to Discord",
      detail: error.message,
    });
  }
};

/**
 * Share custom content to Discord
 * Shares custom image URL with message to Discord channel
 * 
 * @route POST /api/discord/share-custom
 * @body { imageUrl: string, message: string }
 */
exports.shareCustomContent = async (req, res) => {
  try {
    const userId = req.userId;
    const { imageUrl, message } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        error: "Image URL is required",
        message: "Please provide an image URL to share"
      });
    }

    // Get user with Discord credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.discordConnected || !user.discordChannelId) {
      return res.status(400).json({
        error: "Discord channel not connected",
        message: "Please connect your Discord channel first",
      });
    }

    // Share to Discord
    const embedOptions = {
      title: "Custom Content",
      description: message || "",
      color: 0x5865f2,
    };

    const shareResult = await discordService.shareSlide(
      user.discordChannelId,
      imageUrl,
      "",
      embedOptions
    );

    res.json({
      success: true,
      message: "Successfully shared to Discord",
      messageId: shareResult.messageId,
    });
  } catch (error) {
    console.error("Discord custom share error:", error);
    res.status(500).json({
      error: "Failed to share to Discord",
      detail: error.message,
    });
  }
};

/**
 * Send text message to Discord
 * Sends a text-only message to Discord channel
 * 
 * @route POST /api/discord/send-message
 * @body { message: string }
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: "Message is required",
        message: "Please provide a message to send"
      });
    }

    // Get user with Discord credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.discordConnected || !user.discordChannelId) {
      return res.status(400).json({
        error: "Discord channel not connected",
        message: "Please connect your Discord channel first",
      });
    }

    // Send message to Discord
    const result = await discordService.sendMessage(user.discordChannelId, message);

    res.json({
      success: true,
      message: "Message sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Discord send message error:", error);
    res.status(500).json({
      error: "Failed to send message to Discord",
      detail: error.message,
    });
  }
};

/**
 * Share multiple slides to Discord
 * Shares multiple slides from a presentation to Discord channel
 * 
 * @route POST /api/discord/share-multiple
 * @body { presentationId: string, slideIndices: array, message?: string }
 */
exports.shareMultipleSlides = async (req, res) => {
  try {
    const userId = req.userId;
    const { presentationId, slideIndices, message } = req.body;

    // Validate inputs
    if (!presentationId) {
      return res.status(400).json({ 
        error: "Presentation ID is required",
        message: "Please provide a valid presentation ID"
      });
    }

    if (!slideIndices || !Array.isArray(slideIndices) || slideIndices.length === 0) {
      return res.status(400).json({ 
        error: "Slide indices are required",
        message: "Please provide an array of slide indices to share"
      });
    }

    // Get user with Discord credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.discordConnected || !user.discordChannelId) {
      return res.status(400).json({
        error: "Discord channel not connected",
        message: "Please connect your Discord channel first",
      });
    }

    // Get presentation
    const presentation = await Presentation.findOne({ presentation_id: presentationId });
    if (!presentation) {
      return res.status(404).json({ 
        error: "Presentation not found",
        message: "Could not find the specified presentation"
      });
    }

    // Collect slide image URLs
    const imageUrls = [];
    for (const index of slideIndices) {
      const slide = presentation.slides[index];
      if (!slide || !slide.image_url) {
        return res.status(400).json({
          error: `Slide ${index} not found or has no image`,
          message: `Cannot share slide ${index} - it doesn't exist or has no image`
        });
      }
      imageUrls.push(slide.image_url);
    }

    // Share multiple slides to Discord
    const results = await discordService.shareMultipleSlides(
      user.discordChannelId,
      imageUrls,
      message || `Sharing ${slideIndices.length} slides from presentation`
    );

    res.json({
      success: true,
      message: `Successfully shared ${results.length} slides to Discord`,
      slideCount: results.length,
      channelId: user.discordChannelId,
      channelName: user.discordProfile?.channelName,
    });
  } catch (error) {
    console.error("Discord share multiple error:", error);
    res.status(500).json({
      error: "Failed to share slides to Discord",
      detail: error.message,
    });
  }
};
