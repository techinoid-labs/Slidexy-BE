const linkedinService = require("../services/linkedinService");
const User = require("../models/User");
const Presentation = require("../models/Presentation");
const axios = require("axios");
const crypto = require("crypto");

/**
 * LinkedIn Controller
 * Handles OAuth flow and sharing presentations to LinkedIn
 */

/**
 * Initiate LinkedIn OAuth flow
 * Generates authorization URL for user to authenticate with LinkedIn
 */
exports.initiateAuth = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in user record temporarily
    await User.findByIdAndUpdate(userId, {
      linkedinOAuthState: state,
      linkedinOAuthStateExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    const authUrl = linkedinService.getAuthorizationUrl(state);

    res.json({
      success: true,
      authUrl,
      message: "Redirect user to this URL to authenticate with LinkedIn",
    });
  } catch (error) {
    console.error("LinkedIn auth initiation error:", error);
    res.status(500).json({
      error: "Failed to initiate LinkedIn authentication",
      detail: error.message,
    });
  }
};

/**
 * Handle LinkedIn OAuth callback
 * Exchanges authorization code for access token and saves to user
 */
exports.handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Authorization code not provided" });
    }

    if (!state) {
      return res.status(400).json({ error: "State parameter missing" });
    }

    // Find user by state to verify and prevent CSRF
    const user = await User.findOne({
      linkedinOAuthState: state,
      linkedinOAuthStateExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired state parameter",
        detail: "OAuth session may have expired. Please try again.",
      });
    }

    // Exchange code for access token
    const tokenData = await linkedinService.getAccessToken(code);

    // Get LinkedIn profile information
    const profile = await linkedinService.getUserProfile(tokenData.accessToken);

    // Save LinkedIn credentials to user
    user.linkedinAccessToken = tokenData.accessToken;
    user.linkedinTokenExpiry = new Date(Date.now() + tokenData.expiresIn * 1000);
    user.linkedinRefreshToken = tokenData.refreshToken;
    user.linkedinProfile = {
      id: profile.linkedinId,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    };
    user.linkedinConnected = true;

    // Clear OAuth state
    user.linkedinOAuthState = undefined;
    user.linkedinOAuthStateExpiry = undefined;

    await user.save();

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/linkedin/callback?success=true`);
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/linkedin/callback?success=false&error=${encodeURIComponent(error.message)}`
    );
  }
};

/**
 * Check LinkedIn connection status
 * Returns whether user has connected LinkedIn and token validity
 */
exports.getConnectionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "linkedinConnected linkedinProfile linkedinTokenExpiry"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isConnected = user.linkedinConnected || false;
    const isTokenValid =
      isConnected && user.linkedinTokenExpiry && user.linkedinTokenExpiry > new Date();

    res.json({
      connected: isConnected,
      tokenValid: isTokenValid,
      profile: isConnected ? user.linkedinProfile : null,
      tokenExpiry: user.linkedinTokenExpiry,
    });
  } catch (error) {
    console.error("LinkedIn status check error:", error);
    res.status(500).json({
      error: "Failed to check LinkedIn connection status",
      detail: error.message,
    });
  }
};

/**
 * Disconnect LinkedIn account
 * Removes LinkedIn credentials from user account
 */
exports.disconnectAccount = async (req, res) => {
  try {
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      $unset: {
        linkedinAccessToken: 1,
        linkedinRefreshToken: 1,
        linkedinTokenExpiry: 1,
        linkedinProfile: 1,
      },
      linkedinConnected: false,
    });

    res.json({
      success: true,
      message: "LinkedIn account disconnected successfully",
    });
  } catch (error) {
    console.error("LinkedIn disconnect error:", error);
    res.status(500).json({
      error: "Failed to disconnect LinkedIn account",
      detail: error.message,
    });
  }
};

/**
 * Share presentation slide to LinkedIn
 * Posts image and text to user's LinkedIn feed
 */
exports.shareToLinkedIn = async (req, res) => {
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

    // Get user with LinkedIn credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.linkedinConnected || !user.linkedinAccessToken) {
      return res.status(400).json({
        error: "LinkedIn account not connected",
        message: "Please connect your LinkedIn account first",
      });
    }

    // Check if token is expired
    if (user.linkedinTokenExpiry && user.linkedinTokenExpiry < new Date()) {
      return res.status(401).json({
        error: "LinkedIn token expired",
        message: "Please reconnect your LinkedIn account",
      });
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

    // Prepare post message
    const postText =
      message ||
      `${slide.slide_title?.text || "Check out this presentation slide!"}\n\n${
        slide.subtitle?.text || ""
      }\n\nCreated with Neuro Engine 🚀`;

    // Get person URN
    const personUrn = await linkedinService.getPersonUrn(user.linkedinAccessToken);

    // Share to LinkedIn
    const shareResult = await linkedinService.sharePost(
      user.linkedinAccessToken,
      personUrn,
      postText,
      imageBuffer
    );

    res.json({
      success: true,
      message: "Successfully shared to LinkedIn",
      postId: shareResult.postId,
      shareUrl: shareResult.shareUrl,
    });
  } catch (error) {
    console.error("LinkedIn share error:", error);
    res.status(500).json({
      error: "Failed to share to LinkedIn",
      detail: error.message,
    });
  }
};

/**
 * Share custom content to LinkedIn
 * Allows sharing with custom text and external image URL
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

    // Get user with LinkedIn credentials
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.linkedinConnected || !user.linkedinAccessToken) {
      return res.status(400).json({
        error: "LinkedIn account not connected",
        message: "Please connect your LinkedIn account first",
      });
    }

    // Check if token is expired
    if (user.linkedinTokenExpiry && user.linkedinTokenExpiry < new Date()) {
      return res.status(401).json({
        error: "LinkedIn token expired",
        message: "Please reconnect your LinkedIn account",
      });
    }

    // Download image from URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Get person URN
    const personUrn = await linkedinService.getPersonUrn(user.linkedinAccessToken);

    // Share to LinkedIn
    const shareResult = await linkedinService.sharePost(
      user.linkedinAccessToken,
      personUrn,
      message,
      imageBuffer
    );

    res.json({
      success: true,
      message: "Successfully shared to LinkedIn",
      postId: shareResult.postId,
      shareUrl: shareResult.shareUrl,
    });
  } catch (error) {
    console.error("LinkedIn custom share error:", error);
    res.status(500).json({
      error: "Failed to share to LinkedIn",
      detail: error.message,
    });
  }
};

/**
 * Share a whole deck to LinkedIn as a document carousel.
 *
 * The PDF arrives from the browser rather than being rendered here: the
 * editor already produces a pixel-accurate PDF of exactly what the user is
 * looking at, and re-rendering server-side would be a second implementation
 * that can disagree with the first.
 *
 * Expects multipart/form-data with a `file` part (the PDF) plus `message`
 * and optional `title`.
 */
exports.shareDeckAsDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { message, title } = req.body;
    const file = req.file;

    if (!file || !file.buffer?.length) {
      return res.status(400).json({ error: "A PDF file is required" });
    }
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "The file must be a PDF" });
    }
    // LinkedIn rejects documents over 100MB and anything past 300 pages.
    if (file.buffer.length > 100 * 1024 * 1024) {
      return res.status(413).json({ error: "The PDF is larger than LinkedIn's 100MB limit" });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Post text is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.linkedinConnected || !user.linkedinAccessToken) {
      return res.status(400).json({ error: "LinkedIn account not connected" });
    }
    if (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) < new Date()) {
      return res.status(401).json({ error: "LinkedIn token expired. Please reconnect." });
    }

    const personUrn = await linkedinService.getPersonUrn(user.linkedinAccessToken);
    const shareResult = await linkedinService.shareDocumentPost(
      user.linkedinAccessToken,
      personUrn,
      String(message).trim(),
      file.buffer,
      title || "Presentation"
    );

    return res.json({
      success: true,
      message: "Deck shared to LinkedIn",
      postId: shareResult.postId,
    });
  } catch (error) {
    console.error("LinkedIn document share error:", error);
    return res.status(500).json({
      error: "Failed to share the deck to LinkedIn",
      detail: error.message,
    });
  }
};
