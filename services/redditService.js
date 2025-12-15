const axios = require("axios");
const crypto = require("crypto");

/**
 * Reddit Service
 * Handles Reddit OAuth 2.0 authentication and content posting
 * 
 * Reddit API Documentation: https://www.reddit.com/dev/api
 * OAuth Documentation: https://github.com/reddit-archive/reddit/wiki/OAuth2
 * 
 * Setup Requirements:
 * 1. Create Reddit app at https://www.reddit.com/prefs/apps
 * 2. Choose "web app" type
 * 3. Set redirect URI: http://localhost:5000/api/reddit/callback
 * 4. Get client ID and client secret
 * 5. Add to .env file
 */

class RedditService {
  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.redirectUri = process.env.REDDIT_REDIRECT_URI;
    this.userAgent = process.env.REDDIT_USER_AGENT || "NeuroEngine/1.0.0";
    
    if (!this.clientId || !this.clientSecret) {
      console.warn("⚠️ Reddit credentials not configured in environment");
    }
    
    this.baseURL = "https://oauth.reddit.com";
    this.authURL = "https://www.reddit.com/api/v1";
  }

  /**
   * Generate Reddit OAuth authorization URL
   * @param {string} state - Random state string for CSRF protection
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state) {
    const scope = "identity submit read";
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      state: state,
      redirect_uri: this.redirectUri,
      duration: "permanent", // Get refresh token
      scope: scope,
    });
    
    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Reddit callback
   * @returns {Promise<Object>} Token data with access_token, refresh_token, expires_in
   */
  async getAccessToken(code) {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
      
      const response = await axios.post(
        `${this.authURL}/access_token`,
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": this.userAgent,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
      };
    } catch (error) {
      console.error("Reddit token exchange error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error_description || 
        error.response?.data?.message ||
        "Failed to exchange code for token"
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Reddit refresh token
   * @returns {Promise<Object>} New token data
   */
  async refreshAccessToken(refreshToken) {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
      
      const response = await axios.post(
        `${this.authURL}/access_token`,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        {
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": this.userAgent,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
      };
    } catch (error) {
      console.error("Reddit token refresh error:", error.response?.data || error.message);
      throw new Error("Failed to refresh Reddit access token");
    }
  }

  /**
   * Get Reddit user identity
   * @param {string} accessToken - Reddit access token
   * @returns {Promise<Object>} User identity data
   */
  async getUserIdentity(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/me`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": this.userAgent,
        },
      });

      return {
        redditId: response.data.id,
        username: response.data.name,
        iconImg: response.data.icon_img,
        linkKarma: response.data.link_karma,
        commentKarma: response.data.comment_karma,
        created: response.data.created,
      };
    } catch (error) {
      console.error("Reddit user identity error:", error.response?.data || error.message);
      throw new Error("Failed to fetch Reddit user identity");
    }
  }

  /**
   * Upload image to Reddit
   * @param {string} accessToken - Reddit access token
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Image filename
   * @returns {Promise<Object>} Upload result with asset URL
   */
  async uploadImage(accessToken, imageBuffer, filename = "slide.png") {
    try {
      // Step 1: Request upload lease
      const leaseResponse = await axios.post(
        `${this.baseURL}/api/media/asset.json`,
        {
          filepath: filename,
          mimetype: "image/png",
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": this.userAgent,
            "Content-Type": "application/json",
          },
        }
      );

      const uploadLease = leaseResponse.data.args;
      const assetId = leaseResponse.data.asset.asset_id;
      const websocketUrl = leaseResponse.data.asset.websocket_url;

      // Step 2: Upload image to S3
      const formData = new FormData();
      for (const [key, value] of Object.entries(uploadLease.fields)) {
        formData.append(key, value);
      }
      formData.append("file", imageBuffer, {
        filename: filename,
        contentType: "image/png",
      });

      await axios.post(uploadLease.action, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Return asset information
      return {
        assetId: assetId,
        websocketUrl: websocketUrl,
      };
    } catch (error) {
      console.error("Reddit image upload error:", error.response?.data || error.message);
      throw new Error("Failed to upload image to Reddit");
    }
  }

  /**
   * Submit image post to a subreddit
   * @param {string} accessToken - Reddit access token
   * @param {string} subreddit - Subreddit name (without r/)
   * @param {string} title - Post title
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Image filename
   * @returns {Promise<Object>} Post submission result
   */
  async submitImagePost(accessToken, subreddit, title, imageBuffer, filename = "slide.png") {
    try {
      // Upload image first
      const uploadResult = await this.uploadImage(accessToken, imageBuffer, filename);

      // Submit post with uploaded image
      const response = await axios.post(
        `${this.baseURL}/api/submit`,
        {
          sr: subreddit,
          kind: "image",
          title: title,
          url: uploadResult.assetId,
          resubmit: true,
          sendreplies: true,
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": this.userAgent,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
        const errorMsg = response.data.json.errors[0][1];
        throw new Error(errorMsg);
      }

      return {
        success: true,
        postId: response.data.json.data.id,
        postName: response.data.json.data.name,
        postUrl: response.data.json.data.url,
      };
    } catch (error) {
      console.error("Reddit post submission error:", error.response?.data || error.message);
      throw new Error(
        error.message || "Failed to submit post to Reddit"
      );
    }
  }

  /**
   * Submit text post to a subreddit
   * @param {string} accessToken - Reddit access token
   * @param {string} subreddit - Subreddit name (without r/)
   * @param {string} title - Post title
   * @param {string} text - Post text content (markdown supported)
   * @returns {Promise<Object>} Post submission result
   */
  async submitTextPost(accessToken, subreddit, title, text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/submit`,
        {
          sr: subreddit,
          kind: "self",
          title: title,
          text: text,
          resubmit: true,
          sendreplies: true,
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": this.userAgent,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
        const errorMsg = response.data.json.errors[0][1];
        throw new Error(errorMsg);
      }

      return {
        success: true,
        postId: response.data.json.data.id,
        postName: response.data.json.data.name,
        postUrl: response.data.json.data.url,
      };
    } catch (error) {
      console.error("Reddit text post submission error:", error.response?.data || error.message);
      throw new Error(
        error.message || "Failed to submit text post to Reddit"
      );
    }
  }

  /**
   * Submit gallery post to a subreddit (multiple images)
   * @param {string} accessToken - Reddit access token
   * @param {string} subreddit - Subreddit name (without r/)
   * @param {string} title - Post title
   * @param {Array<Buffer>} imageBuffers - Array of image buffers
   * @returns {Promise<Object>} Post submission result
   */
  async submitGalleryPost(accessToken, subreddit, title, imageBuffers) {
    try {
      // Upload all images
      const uploadPromises = imageBuffers.map((buffer, index) => 
        this.uploadImage(accessToken, buffer, `slide_${index + 1}.png`)
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Format items for gallery
      const items = uploadResults.map(result => ({
        media_id: result.assetId,
        caption: "",
      }));

      // Submit gallery post
      const response = await axios.post(
        `${this.baseURL}/api/submit_gallery_post.json`,
        {
          sr: subreddit,
          title: title,
          items: items,
          resubmit: true,
          sendreplies: true,
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": this.userAgent,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
        const errorMsg = response.data.json.errors[0][1];
        throw new Error(errorMsg);
      }

      return {
        success: true,
        postId: response.data.json.data.id,
        postName: response.data.json.data.name,
        postUrl: response.data.json.data.url,
      };
    } catch (error) {
      console.error("Reddit gallery post error:", error.response?.data || error.message);
      throw new Error(
        error.message || "Failed to submit gallery post to Reddit"
      );
    }
  }

  /**
   * Get information about a subreddit
   * @param {string} accessToken - Reddit access token
   * @param {string} subreddit - Subreddit name (without r/)
   * @returns {Promise<Object>} Subreddit information
   */
  async getSubredditInfo(accessToken, subreddit) {
    try {
      const response = await axios.get(
        `${this.baseURL}/r/${subreddit}/about.json`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": this.userAgent,
          },
        }
      );

      return {
        name: response.data.data.display_name,
        title: response.data.data.title,
        subscribers: response.data.data.subscribers,
        description: response.data.data.public_description,
        over18: response.data.data.over18,
        allowImages: response.data.data.allow_images,
        allowGalleries: response.data.data.allow_galleries,
      };
    } catch (error) {
      console.error("Reddit subreddit info error:", error.response?.data || error.message);
      throw new Error("Failed to get subreddit information");
    }
  }

  /**
   * Verify if access token is still valid
   * @param {string} accessToken - Reddit access token
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async verifyAccessToken(accessToken) {
    try {
      await axios.get(`${this.baseURL}/api/v1/me`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": this.userAgent,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new RedditService();
