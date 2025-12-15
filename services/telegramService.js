const axios = require("axios");
const FormData = require("form-data");

/**
 * Telegram Service
 * Handles Telegram Bot API integration for sharing content
 * 
 * Telegram Bot API Documentation: https://core.telegram.org/bots/api
 * 
 * Setup Requirements:
 * 1. Create bot via @BotFather on Telegram
 * 2. Get bot token from BotFather
 * 3. User starts bot to get chat ID
 * 4. Store bot token in .env and chat ID in user profile
 */

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!this.botToken) {
      console.warn("⚠️ TELEGRAM_BOT_TOKEN not configured in environment");
    }
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Verify bot token is valid by getting bot info
   * @returns {Promise<Object>} Bot information
   */
  async verifyBotToken() {
    try {
      const response = await axios.get(`${this.baseURL}/getMe`);
      if (!response.data.ok) {
        throw new Error("Invalid bot token");
      }
      return {
        valid: true,
        botInfo: response.data.result,
      };
    } catch (error) {
      console.error("Telegram bot verification error:", error.response?.data || error.message);
      throw new Error("Failed to verify Telegram bot token");
    }
  }

  /**
   * Get updates from Telegram (for retrieving user chat IDs)
   * This is used during the connection flow to find user's chat ID
   * @param {number} offset - Offset for getting new updates
   * @returns {Promise<Array>} Array of updates
   */
  async getUpdates(offset = 0) {
    try {
      const response = await axios.get(`${this.baseURL}/getUpdates`, {
        params: {
          offset: offset,
          timeout: 30,
        },
      });
      
      if (!response.data.ok) {
        throw new Error("Failed to get updates");
      }

      return response.data.result;
    } catch (error) {
      console.error("Telegram getUpdates error:", error.response?.data || error.message);
      throw new Error("Failed to fetch Telegram updates");
    }
  }

  /**
   * Send text message to a Telegram chat
   * @param {string|number} chatId - Telegram chat ID
   * @param {string} text - Message text (supports Markdown)
   * @param {Object} options - Additional options (parse_mode, reply_markup, etc.)
   * @returns {Promise<Object>} Message send result
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: options.parse_mode || "Markdown",
        ...options,
      });

      if (!response.data.ok) {
        throw new Error(response.data.description || "Failed to send message");
      }

      return {
        success: true,
        messageId: response.data.result.message_id,
        chatId: response.data.result.chat.id,
      };
    } catch (error) {
      console.error("Telegram sendMessage error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.description || "Failed to send message to Telegram"
      );
    }
  }

  /**
   * Send photo to a Telegram chat
   * @param {string|number} chatId - Telegram chat ID
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} caption - Image caption (supports Markdown)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Photo send result
   */
  async sendPhoto(chatId, imageBuffer, caption = "", options = {}) {
    try {
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("photo", imageBuffer, {
        filename: "slide.png",
        contentType: "image/png",
      });
      
      if (caption) {
        formData.append("caption", caption);
        formData.append("parse_mode", options.parse_mode || "Markdown");
      }

      const response = await axios.post(`${this.baseURL}/sendPhoto`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (!response.data.ok) {
        throw new Error(response.data.description || "Failed to send photo");
      }

      return {
        success: true,
        messageId: response.data.result.message_id,
        chatId: response.data.result.chat.id,
        fileId: response.data.result.photo[0].file_id,
      };
    } catch (error) {
      console.error("Telegram sendPhoto error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.description || "Failed to send photo to Telegram"
      );
    }
  }

  /**
   * Send document to a Telegram chat
   * @param {string|number} chatId - Telegram chat ID
   * @param {Buffer} documentBuffer - Document file buffer
   * @param {string} filename - Document filename
   * @param {string} caption - Document caption
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Document send result
   */
  async sendDocument(chatId, documentBuffer, filename, caption = "", options = {}) {
    try {
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("document", documentBuffer, {
        filename: filename,
        contentType: "application/octet-stream",
      });
      
      if (caption) {
        formData.append("caption", caption);
        formData.append("parse_mode", options.parse_mode || "Markdown");
      }

      const response = await axios.post(`${this.baseURL}/sendDocument`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (!response.data.ok) {
        throw new Error(response.data.description || "Failed to send document");
      }

      return {
        success: true,
        messageId: response.data.result.message_id,
        chatId: response.data.result.chat.id,
        fileId: response.data.result.document.file_id,
      };
    } catch (error) {
      console.error("Telegram sendDocument error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.description || "Failed to send document to Telegram"
      );
    }
  }

  /**
   * Get chat information
   * @param {string|number} chatId - Telegram chat ID
   * @returns {Promise<Object>} Chat information
   */
  async getChat(chatId) {
    try {
      const response = await axios.get(`${this.baseURL}/getChat`, {
        params: {
          chat_id: chatId,
        },
      });

      if (!response.data.ok) {
        throw new Error(response.data.description || "Failed to get chat info");
      }

      return {
        chatId: response.data.result.id,
        type: response.data.result.type,
        username: response.data.result.username,
        firstName: response.data.result.first_name,
        lastName: response.data.result.last_name,
        bio: response.data.result.bio,
      };
    } catch (error) {
      console.error("Telegram getChat error:", error.response?.data || error.message);
      throw new Error("Failed to get Telegram chat information");
    }
  }

  /**
   * Verify that a chat ID is valid and accessible
   * @param {string|number} chatId - Telegram chat ID to verify
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async verifyChatId(chatId) {
    try {
      await this.getChat(chatId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Share presentation slide with image and text to Telegram
   * @param {string|number} chatId - Telegram chat ID
   * @param {Buffer} imageBuffer - Slide image buffer
   * @param {string} slideTitle - Slide title
   * @param {string} slideText - Slide text content
   * @param {string} customMessage - Optional custom message from user
   * @returns {Promise<Object>} Share result
   */
  async shareSlide(chatId, imageBuffer, slideTitle, slideText, customMessage = "") {
    try {
      // Build caption with slide information
      let caption = "";
      
      if (customMessage) {
        caption += `${customMessage}\n\n`;
      }
      
      caption += `*${slideTitle}*\n\n`;
      
      if (slideText) {
        // Limit text length to avoid Telegram's caption limit (1024 chars)
        const truncatedText = slideText.length > 500 
          ? slideText.substring(0, 497) + "..." 
          : slideText;
        caption += `${truncatedText}\n\n`;
      }
      
      caption += `_Created with Slidexy 🚀`;

      // Send photo with caption
      const result = await this.sendPhoto(chatId, imageBuffer, caption);

      return {
        success: true,
        messageId: result.messageId,
        chatId: result.chatId,
      };
    } catch (error) {
      console.error("Telegram shareSlide error:", error);
      throw error;
    }
  }

  /**
   * Send a test message to verify connection
   * @param {string|number} chatId - Telegram chat ID
   * @returns {Promise<Object>} Test message result
   */
  async sendTestMessage(chatId) {
    try {
      const message = `✅ * Connected!*\n\nYour Telegram account is now connected to Slidexy.\n\nYou can now share your presentation slides directly to this chat! 🚀`;
      
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error("Telegram sendTestMessage error:", error);
      throw error;
    }
  }
}

module.exports = new TelegramService();
