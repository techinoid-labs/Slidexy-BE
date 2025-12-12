const redditService = require("../services/redditService");
const User = require("../models/User");
const Presentation = require("../models/Presentation");
const axios = require("axios");
const crypto = require("crypto");

/**
 * Reddit Controller
 * Handles Reddit OAuth flow and posting presentations to subreddits
 * 
 * Flow:
 * 1. User clicks "Connect Reddit"
 * 2. Frontend calls /auth to get authorization URL
 * 3. User authorizes on Reddit
 * 4. Reddit redirects to /callback with code
 * 5. Backend exchanges code for tokens and saves to user
 * 6. User can now share slides to subreddits
 */

/**
 * Initiate Reddit OAuth flow
 * Generates authorization URL for user to authenticate with Reddit
 * 
 * @route GET /api/reddit/auth
 */
exports.initiateAuth = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in user record temporarily (expires in 10 minutes)
    await User.findByIdAndUpdate(userId, {
      redditOAuthState: state,
      redditOAuthStateExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    const authUrl = redditService.getAuthorizationUrl(state);

    res.json({
      success: true,
      authUrl,
      message: "Redirect user to this URL to authenticate with Reddit",
    });
  } catch (error) {
    console.error("Reddit auth initiation error:", error);
    res.status(500).json({
      error: "Failed to initiate Reddit authentication",
      detail: error.message,
    });
  }
};

/**
 * Handle Reddit OAuth callback
 * Exchanges authorization code for access token and saves to user
 * 
 * @route GET /api/reddit/callback
 */
exports.handleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth error
    if (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/reddit/callback?success=false&error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.status(400).json({ error: "Authorization code not provided" });
    }

    if (!state) {
      return res.status(400).json({ error: "State parameter missing" });
    }

    // Find user by state to verify and prevent CSRF
    const user = await User.findOne({
      redditOAuthState: state,
      redditOAuthStateExpiry: { $gt: new Date() },
    });

    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/reddit/callback?success=false&error=${encodeURIComponent("Invalid or expired state parameter")}`
      );
    }

    // Exchange code for access token
    const tokenData = await redditService.getAccessToken(code);

    // Get Reddit user identity
    const identity = await redditService.getUserIdentity(tokenData.accessToken);

    // Save Reddit credentials to user
    user.redditAccessToken = tokenData.accessToken;
    user.redditRefreshToken = tokenData.refreshToken;
    user.redditTokenExpiry = new Date(Date.now() + tokenData.expiresIn * 1000);
    user.redditProfile = {
      id: identity.redditId,
      username: identity.username,
      iconImg: identity.iconImg,
      linkKarma: identity.linkKarma,
      commentKarma: identity.commentKarma,
    };
    user.redditConnected = true;

    // Clear OAuth state
    user.redditOAuthState = undefined;
    user.redditOAuthStateExpiry = undefined;

    await user.save();

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/reddit/callback?success=true`);
  } catch (error) {
    console.error("Reddit callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/reddit/callback?success=false&error=${encodeURIComponent(error.message)}`
    );
  }
};

/**
 * Get Reddit connection status
 * Returns whether user has connected Reddit and token validity
 * 
 * @route GET /api/reddit/status
 */
exports.getConnectionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "redditConnected redditProfile redditTokenExpiry"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isConnected = user.redditConnected || false;
    const isTokenValid =
      isConnected && user.redditTokenExpiry && user.redditTokenExpiry > new Date();

    res.json({
      connected: isConnected,
      tokenValid: isTokenValid,
      profile: isConnected ? user.redditProfile : null,
      tokenExpiry: user.redditTokenExpiry,
    });
  } catch (error) {
    console.error("Reddit status check error:", error);
    res.status(500).json({
      error: "Failed to check Reddit connection status",
      detail: error.message,
    });
  }
};

/**
 * Disconnect Reddit account
 * Removes Reddit credentials from user account
 * 
 * @route DELETE /api/reddit/disconnect
 */
exports.disconnectReddit = async (req, res) => {
  try {
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      $unset: {
        redditAccessToken: 1,
        redditRefreshToken: 1,
        redditTokenExpiry: 1,
        redditProfile: 1,
      },
      redditConnected: false,
    });

    res.json({
      success: true,
      message: "Reddit account disconnected successfully",
    });
  } catch (error) {
    console.error("Reddit disconnect error:", error);
    res.status(500).json({
      error: "Failed to disconnect Reddit account",
      detail: error.message,
    });
  }
};

/**
 * Share presentation slide to Reddit
 * Posts image and title to specified subreddit
 * 
 * @route POST /api/reddit/share
 * @body { presentationId: string, slideIndex: number, subreddit: string, title: string }
 */
exports.shareToReddit = async (req, res) => {
  try {
    const userId = req.userId;
    const { presentationId, slideIndex, subreddit, title } = req.body;

    // Validate inputs
    if (!presentationId) {
      return res.status(400).json({ error: "Presentation ID is required" });
    }

    if (slideIndex === undefined || slideIndex === null) {
      return res.status(400).json({ error: "Slide index is required" });
    }

    if (!subreddit) {
      return res.status(400).json({ error: "Subreddit is required" });
    }

    if (!title) {
      return res.status(400).json({ error: "Post title is required" });
    }

    // Get user with Reddit credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.redditConnected || !user.redditAccessToken) {
      return res.status(400).json({
        error: "Reddit account not connected",
        message: "Please connect your Reddit account first",
      });
    }

    // Check if token is expired, refresh if needed
    if (user.redditTokenExpiry && user.redditTokenExpiry < new Date()) {
      try {
        const newTokenData = await redditService.refreshAccessToken(user.redditRefreshToken);
        user.redditAccessToken = newTokenData.accessToken;
        user.redditTokenExpiry = new Date(Date.now() + newTokenData.expiresIn * 1000);
        await user.save();
      } catch (error) {
        return res.status(401).json({
          error: "Reddit token expired and refresh failed",
          message: "Please reconnect your Reddit account",
        });
      }
    }

    // Get presentation
    const presentation = await Presentation.findOne({ presentation_id: presentationId });
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

    // Submit post to Reddit
    const shareResult = await redditService.submitImagePost(
      user.redditAccessToken,
      subreddit,
      title,
      imageBuffer
    );

    res.json({
      success: true,
      message: "Successfully shared to Reddit",
      postId: shareResult.postId,
      postUrl: shareResult.postUrl,
    });
  } catch (error) {
    console.error("Reddit share error:", error);
    res.status(500).json({
      error: "Failed to share to Reddit",
      detail: error.message,
    });
  }
};

/**
 * Share text post to Reddit
 * Posts text content to specified subreddit
 * 
 * @route POST /api/reddit/share-text
 * @body { subreddit: string, title: string, text: string }
 */
exports.shareTextPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { subreddit, title, text } = req.body;

    // Validate inputs
    if (!subreddit) {
      return res.status(400).json({ error: "Subreddit is required" });
    }

    if (!title) {
      return res.status(400).json({ error: "Post title is required" });
    }

    if (!text) {
      return res.status(400).json({ error: "Post text is required" });
    }

    // Get user with Reddit credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.redditConnected || !user.redditAccessToken) {
      return res.status(400).json({
        error: "Reddit account not connected",
        message: "Please connect your Reddit account first",
      });
    }

    // Check if token is expired, refresh if needed
    if (user.redditTokenExpiry && user.redditTokenExpiry < new Date()) {
      try {
        const newTokenData = await redditService.refreshAccessToken(user.redditRefreshToken);
        user.redditAccessToken = newTokenData.accessToken;
        user.redditTokenExpiry = new Date(Date.now() + newTokenData.expiresIn * 1000);
        await user.save();
      } catch (error) {
        return res.status(401).json({
          error: "Reddit token expired and refresh failed",
          message: "Please reconnect your Reddit account",
        });
      }
    }

    // Submit text post to Reddit
    const shareResult = await redditService.submitTextPost(
      user.redditAccessToken,
      subreddit,
      title,
      text
    );

    res.json({
      success: true,
      message: "Successfully posted to Reddit",
      postId: shareResult.postId,
      postUrl: shareResult.postUrl,
    });
  } catch (error) {
    console.error("Reddit text post error:", error);
    res.status(500).json({
      error: "Failed to post to Reddit",
      detail: error.message,
    });
  }
};

/**
 * Share multiple slides as gallery to Reddit
 * Posts multiple images as a gallery to specified subreddit
 * 
 * @route POST /api/reddit/share-gallery
 * @body { presentationId: string, slideIndices: array, subreddit: string, title: string }
 */
exports.shareGalleryPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { presentationId, slideIndices, subreddit, title } = req.body;

    // Validate inputs
    if (!presentationId) {
      return res.status(400).json({ error: "Presentation ID is required" });
    }

    if (!slideIndices || !Array.isArray(slideIndices) || slideIndices.length === 0) {
      return res.status(400).json({ error: "Slide indices array is required" });
    }

    if (!subreddit) {
      return res.status(400).json({ error: "Subreddit is required" });
    }

    if (!title) {
      return res.status(400).json({ error: "Post title is required" });
    }

    // Get user with Reddit credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.redditConnected || !user.redditAccessToken) {
      return res.status(400).json({
        error: "Reddit account not connected",
        message: "Please connect your Reddit account first",
      });
    }

    // Check if token is expired, refresh if needed
    if (user.redditTokenExpiry && user.redditTokenExpiry < new Date()) {
      try {
        const newTokenData = await redditService.refreshAccessToken(user.redditRefreshToken);
        user.redditAccessToken = newTokenData.accessToken;
        user.redditTokenExpiry = new Date(Date.now() + newTokenData.expiresIn * 1000);
        await user.save();
      } catch (error) {
        return res.status(401).json({
          error: "Reddit token expired and refresh failed",
          message: "Please reconnect your Reddit account",
        });
      }
    }

    // Get presentation
    const presentation = await Presentation.findOne({ presentation_id: presentationId });
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    // Download all slide images
    const imageBuffers = [];
    for (const index of slideIndices) {
      const slide = presentation.slides[index];
      if (!slide || !slide.image_url) {
        return res.status(400).json({
          error: `Slide at index ${index} not found or has no image`,
        });
      }

      const imageResponse = await axios.get(slide.image_url, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      imageBuffers.push(Buffer.from(imageResponse.data));
    }

    // Submit gallery post to Reddit
    const shareResult = await redditService.submitGalleryPost(
      user.redditAccessToken,
      subreddit,
      title,
      imageBuffers
    );

    res.json({
      success: true,
      message: "Successfully shared gallery to Reddit",
      postId: shareResult.postId,
      postUrl: shareResult.postUrl,
      slideCount: imageBuffers.length,
    });
  } catch (error) {
    console.error("Reddit gallery post error:", error);
    res.status(500).json({
      error: "Failed to share gallery to Reddit",
      detail: error.message,
    });
  }
};

/**
 * Get subreddit information
 * Returns information about a specific subreddit
 * 
 * @route GET /api/reddit/subreddit/:name
 */
exports.getSubredditInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({ error: "Subreddit name is required" });
    }

    // Get user with Reddit credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.redditConnected || !user.redditAccessToken) {
      return res.status(400).json({
        error: "Reddit account not connected",
        message: "Please connect your Reddit account first",
      });
    }

    // Get subreddit info
    const subredditInfo = await redditService.getSubredditInfo(
      user.redditAccessToken,
      name
    );

    res.json({
      success: true,
      subreddit: subredditInfo,
    });
  } catch (error) {
    console.error("Reddit subreddit info error:", error);
    res.status(500).json({
      error: "Failed to get subreddit information",
      detail: error.message,
    });
  }
};
