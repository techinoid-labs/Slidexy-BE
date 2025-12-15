const axios = require("axios");
const FormData = require("form-data");

/**
 * LinkedIn Service
 * Handles OAuth authentication and content sharing with LinkedIn API v2
 */

class LinkedInService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    this.baseURL = "https://api.linkedin.com/v2";
  }

  /**
   * Generate LinkedIn OAuth authorization URL
   * @param {string} state - Random state string for CSRF protection
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state) {
    const scope = encodeURIComponent("openid profile email w_member_social");
    console.log('[LinkedInService] getAuthorizationUrl - clientId:', this.clientId, 'redirectUri:', this.redirectUri);
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}&scope=${scope}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from LinkedIn callback
   * @returns {Promise<Object>} Token data with access_token, expires_in
   */
  async getAccessToken(code) {
    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        null,
        {
          params: {
            grant_type: "authorization_code",
            code: code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        refreshToken: response.data.refresh_token,
        scope: response.data.scope,
      };
    } catch (error) {
      console.error("LinkedIn token exchange error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error_description || "Failed to exchange code for token"
      );
    }
  }

  /**
   * Get LinkedIn user profile information
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        linkedinId: response.data.sub,
        name: response.data.name,
        email: response.data.email,
        picture: response.data.picture,
      };
    } catch (error) {
      console.error("LinkedIn profile fetch error:", error.response?.data || error.message);
      throw new Error("Failed to fetch LinkedIn profile");
    }
  }

  /**
   * Upload image to LinkedIn for sharing
   * @param {string} accessToken - LinkedIn access token
   * @param {string} personUrn - LinkedIn person URN
   * @param {Buffer} imageBuffer - Image file buffer
   * @returns {Promise<string>} Uploaded asset URN
   */
  async uploadImage(accessToken, personUrn, imageBuffer) {
    try {
      // Step 1: Register upload
      const registerResponse = await axios.post(
        `${this.baseURL}/assets?action=registerUpload`,
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: personUrn,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload image binary
      await axios.put(uploadUrl, imageBuffer, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
        },
      });

      return asset;
    } catch (error) {
      console.error("LinkedIn image upload error:", error.response?.data || error.message);
      throw new Error("Failed to upload image to LinkedIn");
    }
  }

  /**
   * Share a post with image on LinkedIn
   * @param {string} accessToken - LinkedIn access token
   * @param {string} personUrn - LinkedIn person URN (urn:li:person:XXXXX)
   * @param {string} text - Post text content
   * @param {Buffer} imageBuffer - Image file buffer
   * @returns {Promise<Object>} Share response data
   */
  async sharePost(accessToken, personUrn, text, imageBuffer) {
    try {
      // Upload image first
      const assetUrn = await this.uploadImage(accessToken, personUrn, imageBuffer);

      // Create post with image
      const shareResponse = await axios.post(
        `${this.baseURL}/ugcPosts`,
        {
          author: personUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: text,
              },
              shareMediaCategory: "IMAGE",
              media: [
                {
                  status: "READY",
                  description: {
                    text: "Presentation created with Neuro Engine",
                  },
                  media: assetUrn,
                  title: {
                    text: "Presentation Slide",
                  },
                },
              ],
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      return {
        success: true,
        postId: shareResponse.data.id,
        shareUrl: `https://www.linkedin.com/feed/update/${shareResponse.data.id}`,
      };
    } catch (error) {
      console.error("LinkedIn share post error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Failed to share post on LinkedIn"
      );
    }
  }

  /**
   * Get LinkedIn person URN from access token
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<string>} Person URN
   */
  async getPersonUrn(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Convert sub (like "abc123") to proper URN format
      return `urn:li:person:${response.data.sub}`;
    } catch (error) {
      console.error("LinkedIn URN fetch error:", error.response?.data || error.message);
      throw new Error("Failed to get LinkedIn person URN");
    }
  }

  /**
   * Verify if access token is still valid
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async verifyAccessToken(accessToken) {
    try {
      await axios.get(`${this.baseURL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new LinkedInService();
