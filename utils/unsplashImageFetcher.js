// utils/unsplashImageFetcher.js
const axios = require("axios");

/**
 * Fetches a relevant image from Unsplash based on query.
 * If nothing is found, returns null so we can fallback further.
 */
async function fetchUnsplashImage(query) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) throw new Error("Missing UNSPLASH_ACCESS_KEY in .env");

    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 1,
        orientation: "landscape",
        content_filter: "high",
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    const results = response.data.results;
    if (results && results.length > 0) {
      const image = results[0];
      return {
        url: image.urls?.regular || image.urls?.full,
        alt_description: image.alt_description || query,
        photographer: image.user?.name || "Unsplash Photographer",
        photographer_link: image.user?.links?.html,
      };
    }
    return null;
  } catch (err) {
    console.error("Unsplash fallback failed:", err.message);
    return null;
  }
}

module.exports = { fetchUnsplashImage };
