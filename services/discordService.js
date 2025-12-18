const axios = require("axios");
const FormData = require("form-data");

/**
 * Discord Service
 * Handles Discord Bot API integration for sharing content to Discord channels
 * 
 * Discord Bot API Documentation: https://discord.com/developers/docs/intro
 * 
 * Setup Requirements:
 * 1. Create Discord application at https://discord.com/developers/applications
 * 2. Create bot user and get bot token
 * 3. Enable necessary bot permissions (Send Messages, Attach Files, Embed Links)
 * 4. Generate OAuth2 URL to invite bot to server
 * 5. Get channel ID from Discord (Right-click channel → Copy ID, requires Developer Mode)
 * 6. Store bot token in .env
 * 
 * Bot Permissions Required:
 * - Send Messages (0x0000000000000800)
 * - Attach Files (0x0000000000008000)
 * - Embed Links (0x0000000000004000)
 * - Read Message History (0x0000000000010000)
 * 
 * Rate Limits:
 * - 50 requests per second per bot
 * - 5 requests per second per channel
 */

class DiscordService {
  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN;
    if (!this.botToken) {
      console.warn("⚠️ DISCORD_BOT_TOKEN not configured in environment");
    }
    this.baseURL = "https://discord.com/api/v10";
  }

  /**
   * Verify bot token is valid by getting bot user info
   * @returns {Promise<Object>} Bot information
   */
  async verifyBotToken() {
    try {
      const response = await axios.get(`${this.baseURL}/users/@me`, {
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      });

      return {
        valid: true,
        botInfo: {
          id: response.data.id,
          username: response.data.username,
          discriminator: response.data.discriminator,
          avatar: response.data.avatar,
          bot: response.data.bot,
        },
      };
    } catch (error) {
      console.error("Discord bot verification error:", error.response?.data || error.message);
      throw new Error("Failed to verify Discord bot token");
    }
  }

  /**
   * Get channel information
   * Verifies bot has access to the channel
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<Object>} Channel information
   */
  async getChannel(channelId) {
    try {
      const response = await axios.get(`${this.baseURL}/channels/${channelId}`, {
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        type: response.data.type, // 0: text, 2: voice, 4: category, etc.
        guildId: response.data.guild_id,
        position: response.data.position,
        nsfw: response.data.nsfw || false,
      };
    } catch (error) {
      console.error("Discord get channel error:", error.response?.data || error.message);
      if (error.response?.status === 404) {
        throw new Error("Channel not found or bot doesn't have access");
      }
      if (error.response?.status === 403) {
        throw new Error("Bot doesn't have permission to view this channel");
      }
      throw new Error("Failed to fetch Discord channel information");
    }
  }

  /**
   * Verify channel ID is valid and bot has access
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<boolean>} True if valid and accessible
   */
  async verifyChannelId(channelId) {
    try {
      await this.getChannel(channelId);
      return true;
    } catch (error) {
      console.error("Discord channel verification error:", error.message);
      return false;
    }
  }

  /**
   * Send text message to a Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {string} content - Message content (supports Discord markdown)
   * @param {Object} options - Additional options (embeds, components, etc.)
   * @returns {Promise<Object>} Message send result
   */
  async sendMessage(channelId, content, options = {}) {
    try {
      const payload = {
        content: content,
        ...options,
      };

      const response = await axios.post(
        `${this.baseURL}/channels/${channelId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.id,
        channelId: response.data.channel_id,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      console.error("Discord send message error:", error.response?.data || error.message);
      if (error.response?.status === 403) {
        throw new Error("Bot doesn't have permission to send messages in this channel");
      }
      if (error.response?.status === 404) {
        throw new Error("Channel not found");
      }
      throw new Error("Failed to send message to Discord");
    }
  }

  /**
   * Send message with file attachment to Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {Buffer} fileBuffer - File buffer to send
   * @param {string} filename - Name of the file
   * @param {string} content - Message content (optional)
   * @param {Object} options - Additional options (embeds, etc.)
   * @returns {Promise<Object>} Message send result
   */
  async sendFile(channelId, fileBuffer, filename, content = "", options = {}) {
    try {
      const formData = new FormData();

      // Add file
      formData.append("files[0]", fileBuffer, {
        filename: filename,
        contentType: "image/png",
      });

      // Add payload JSON
      const payload = {
        content: content,
        ...options,
      };
      formData.append("payload_json", JSON.stringify(payload));

      const response = await axios.post(
        `${this.baseURL}/channels/${channelId}/messages`,
        formData,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        success: true,
        messageId: response.data.id,
        channelId: response.data.channel_id,
        timestamp: response.data.timestamp,
        attachments: response.data.attachments,
      };
    } catch (error) {
      console.error("Discord send file error:", error.response?.data || error.message);
      if (error.response?.status === 403) {
        throw new Error("Bot doesn't have permission to send files in this channel");
      }
      if (error.response?.status === 413) {
        throw new Error("File too large (Discord limit is 25MB for bots)");
      }
      throw new Error("Failed to send file to Discord");
    }
  }

  /**
   * Send message with embed (rich content)
   * @param {string} channelId - Discord channel ID
   * @param {Object} embed - Embed object following Discord embed structure
   * @param {string} content - Optional message content
   * @returns {Promise<Object>} Message send result
   */
  async sendEmbed(channelId, embed, content = "") {
    try {
      return await this.sendMessage(channelId, content, { embeds: [embed] });
    } catch (error) {
      console.error("Discord send embed error:", error.message);
      throw error;
    }
  }

  /**
   * Send presentation slide to Discord channel
   * Downloads slide image and sends to channel with optional message
   * @param {string} channelId - Discord channel ID
   * @param {string} imageUrl - URL of the slide image
   * @param {string} message - Message to send with the image
   * @param {Object} embedOptions - Optional embed customization
   * @returns {Promise<Object>} Message send result
   */
  async shareSlide(channelId, imageUrl, message = "", embedOptions = {}) {
    try {
      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      const imageBuffer = Buffer.from(imageResponse.data);

      // Create embed with image
      const embed = {
        title: embedOptions.title || "Presentation Slide",
        description: embedOptions.description || message,
        color: embedOptions.color || 0x5865f2, // Discord blurple color
        image: {
          url: "attachment://slide.png",
        },
        timestamp: new Date().toISOString(),
        footer: embedOptions.footer || {
          text: "Shared from Neuro Engine",
        },
      };

      // Send with file attachment
      return await this.sendFile(channelId, imageBuffer, "slide.png", "", { embeds: [embed] });
    } catch (error) {
      console.error("Discord share slide error:", error.message);
      throw new Error("Failed to share slide to Discord");
    }
  }

  /**
   * Send multiple slides to Discord channel
   * Sends slides one by one with a small delay to avoid rate limits
   * @param {string} channelId - Discord channel ID
   * @param {Array<string>} imageUrls - Array of slide image URLs
   * @param {string} message - Message to send with the slides
   * @returns {Promise<Array>} Array of message send results
   */
  async shareMultipleSlides(channelId, imageUrls, message = "") {
    try {
      const results = [];

      // Send initial message
      if (message) {
        await this.sendMessage(channelId, message);
        // Small delay after first message
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Send slides
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        const result = await this.shareSlide(channelId, imageUrl, "", {
          title: `Slide ${i + 1} of ${imageUrls.length}`,
          color: 0x5865f2,
        });

        results.push(result);

        // Small delay between slides to avoid rate limits (5 per channel per second)
        if (i < imageUrls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      return results;
    } catch (error) {
      console.error("Discord share multiple slides error:", error.message);
      throw new Error("Failed to share multiple slides to Discord");
    }
  }

  /**
   * Send test message to verify connection
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<Object>} Message send result
   */
  async sendTestMessage(channelId) {
    try {
      const embed = {
        title: "✅ Discord Connected Successfully!",
        description: "Your Slidexy account is now connected to this Discord channel.",
        color: 0x57f287, // Green color
        fields: [
          {
            name: "What's Next?",
            value: "You can now share your presentation slides directly to this channel!",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Slidexy • Powered by AI",
        },
      };

      return await this.sendEmbed(channelId, embed);
    } catch (error) {
      console.error("Discord test message error:", error.message);
      throw error;
    }
  }

  /**
   * Get guild (server) information
   * @param {string} guildId - Discord guild/server ID
   * @returns {Promise<Object>} Guild information
   */
  async getGuild(guildId) {
    try {
      const response = await axios.get(`${this.baseURL}/guilds/${guildId}`, {
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        icon: response.data.icon,
        ownerId: response.data.owner_id,
        memberCount: response.data.approximate_member_count,
      };
    } catch (error) {
      console.error("Discord get guild error:", error.response?.data || error.message);
      throw new Error("Failed to fetch Discord guild information");
    }
  }

  /**
   * Generate OAuth URL for bot invitation
   * This helps users add the bot to their Discord server
   * @param {string} clientId - Discord application client ID
   * @param {Array<string>} permissions - Array of permission flags
   * @returns {string} Bot invitation URL
   */
  generateBotInviteUrl(clientId, permissions = ["2048", "32768", "16384"]) {
    // Default permissions: Send Messages (2048), Attach Files (32768), Embed Links (16384)
    const permissionsValue = permissions.join("");
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissionsValue}&scope=bot`;
  }
}

module.exports = new DiscordService();
