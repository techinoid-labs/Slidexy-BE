// utils/imageFallback.js
const { fetchUnsplashImage } = require("./unsplashImageFetcher");

/**
 * Attempts to find a relevant fallback image.
 * Priority: Unsplash → placeholder.
 *
 * @param {Object} options
 * @param {string} options.query - The image search query.
 * @param {number} options.index - The slide index (for placeholder text).
 * @param {Object} [options.slide] - Optional slide data to enrich response.
 */
async function getFallbackImage({ query, index = 0, slide = {} }) {
  try {
    console.log(`🔄 Trying Unsplash fallback with query: "${query}"`);
    const unsplashResult = await fetchUnsplashImage(query);

    if (unsplashResult && unsplashResult.url) {
      console.log(`✅ Unsplash fallback succeeded for slide ${index}`);
      return {
        ...slide,
        image_url: unsplashResult.url,
        image_caption: `Image from Unsplash by ${unsplashResult.photographer}`,
        photographer_link: unsplashResult.photographer_link,
        fallback_used: "unsplash",
      };
    }

    console.warn(`⚠️ Unsplash returned no result, using placeholder.`);
    return {
      ...slide,
      image_url: `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${
        index + 1
      }`,
      image_caption: "Placeholder image (no image available)",
      fallback_used: "placeholder",
    };
  } catch (err) {
    console.error("Unsplash fallback error:", err.message);
    return {
      ...slide,
      image_url: `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${
        index + 1
      }`,
      image_caption: "Placeholder image (all sources failed)",
      fallback_used: "placeholder",
    };
  }
}

module.exports = { getFallbackImage };
