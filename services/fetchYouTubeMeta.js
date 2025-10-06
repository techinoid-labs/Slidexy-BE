const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Fetches YouTube video metadata by scraping Open Graph, meta tags, and JSON-LD.
 * @param {string} videoId - The YouTube video ID (e.g., uxjhN_Donfw)
 * @returns {Promise<{title: string, description: string, thumbnail: string, publishDate: string, channelName: string, channelUrl: string, viewCount: string, duration: string, tags: string[]}>}
 */
// async function fetchYouTubeMeta(videoId) {
//   try {
//     const url = `https://www.youtube.com/watch?v=${videoId}`;
//     const { data: html } = await axios.get(url);
//     const $ = cheerio.load(html);

//     // Open Graph & meta tags
//     const title = $('meta[property="og:title"]').attr("content") || "";
//     const description =
//       $('meta[property="og:description"]').attr("content") || "";
//     const thumbnail = $('meta[property="og:image"]').attr("content") || "";
//     const keywords = $('meta[name="keywords"]').attr("content") || "";
//     const tags = keywords ? keywords.split(",").map((t) => t.trim()) : [];
//     let publishDate = $('meta[itemprop="datePublished"]').attr("content") || "";

//     // JSON-LD block
//     let channelName = "";
//     let channelUrl = "";
//     let viewCount = "";
//     let duration = "";
//     const ldJson = $('script[type="application/ld+json"]').html();
//     if (ldJson) {
//       try {
//         const json = JSON.parse(ldJson);
//         if (json) {
//           if (json.author && json.author.name) channelName = json.author.name;
//           if (json.author && json.author.url) channelUrl = json.author.url;
//           if (json.uploadDate) publishDate = publishDate || json.uploadDate;
//           if (json.interactionCount) viewCount = json.interactionCount;
//           if (json.duration) duration = json.duration;
//           if (json.keywords && Array.isArray(json.keywords))
//             tags.push(...json.keywords);
//         }
//       } catch (e) {
//         // Ignore JSON parse errors
//       }
//     }

//     return {
//       title,
//       description,
//       thumbnail,
//       publishDate,
//       channelName,
//       channelUrl,
//       viewCount,
//       duration,
//       tags: Array.from(new Set(tags)).filter(Boolean),
//     };
//   } catch (error) {
//     throw new Error("Could not fetch YouTube metadata: " + error.message);
//   }
// }


async function fetchYouTubeMeta(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
    });
    const $ = cheerio.load(html);

    // Initialize metadata object
    let metadata = {
      videoId,
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      thumbnail: $('meta[property="og:image"]').attr('content') || '',
      publishDate: $('meta[itemprop="datePublished"]').attr('content') || '',
      channelName: '',
      channelId: '',
      channelUrl: '',
      viewCount: null,
      likeCount: null,
      duration: null,
      tags: [],
      category: '',
      subscriberCount: null,
      isLive: false,
      isEmbeddable: false,
      captionsAvailable: false,
    };

    // Extract ytInitialData or ytInitialPlayerResponse
    let ytInitialData = null;
    let ytInitialPlayerResponse = null;

    $('script').each((_, el) => {
      const scriptText = $(el).html();
      if (scriptText && scriptText.includes('ytInitialData')) {
        try {
          const jsonMatch = scriptText.match(/ytInitialData\s*=\s*({.*?});/s);
          if (jsonMatch && jsonMatch[1]) {
            ytInitialData = JSON.parse(jsonMatch[1]);
          }
        } catch {}
      }
      if (scriptText && scriptText.includes('ytInitialPlayerResponse')) {
        try {
          const jsonMatch = scriptText.match(/ytInitialPlayerResponse\s*=\s*({.*?});/s);
          if (jsonMatch && jsonMatch[1]) {
            ytInitialPlayerResponse = JSON.parse(jsonMatch[1]);
          }
        } catch {}
      }
    });

    // Extract metadata from ytInitialPlayerResponse
    if (ytInitialPlayerResponse && ytInitialPlayerResponse.videoDetails) {
      const videoDetails = ytInitialPlayerResponse.videoDetails;
      metadata.title = metadata.title || videoDetails.title || '';
      metadata.description = metadata.description || videoDetails.shortDescription || '';
      metadata.viewCount = parseInt(videoDetails.viewCount) || null;
      metadata.channelName = videoDetails.author || '';
      metadata.channelId = videoDetails.channelId || '';
      metadata.channelUrl = `https://www.youtube.com/channel/${videoDetails.channelId}` || '';
      metadata.tags = videoDetails.keywords ? Array.from(new Set(videoDetails.keywords)) : metadata.tags;
      metadata.duration = videoDetails.lengthSeconds ? parseInt(videoDetails.lengthSeconds) : null;
      metadata.isLive = videoDetails.isLiveContent || false;
      metadata.isEmbeddable = videoDetails.allowRatings || false;
    }

    // Extract additional metadata from ytInitialData
    if (ytInitialData) {
      // Like count
      const likeButton = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents
        ?.find(content => content.videoPrimaryInfoRenderer)
        ?.videoPrimaryInfoRenderer?.videoActions?.menuRenderer?.topLevelButtons
        ?.find(button => button.toggleButtonRenderer?.defaultIcon?.iconType === 'LIKE');
      metadata.likeCount = likeButton?.toggleButtonRenderer?.defaultText?.accessibility?.accessibilityData?.label
        ?.replace(/[^0-9]/g, '') || null;
      metadata.likeCount = metadata.likeCount ? parseInt(metadata.likeCount) : null;

      // Category
      const categoryInfo = ytInitialData.metadata?.videoMetadataRenderer?.category;
      metadata.category = categoryInfo || '';

      // Subscriber count
      const channelMetadata = ytInitialData.header?.c4TabbedHeaderRenderer;
      metadata.subscriberCount = channelMetadata?.subscriberCountText?.simpleText
        ?.replace(/[^0-9KMB]/g, '') || null;
      if (metadata.subscriberCount) {
        // Convert K/M/B to numbers (e.g., 1.2K -> 1200, 1M -> 1000000)
        const multiplier = metadata.subscriberCount.includes('K') ? 1000 :
                          metadata.subscriberCount.includes('M') ? 1000000 :
                          metadata.subscriberCount.includes('B') ? 1000000000 : 1;
        metadata.subscriberCount = parseFloat(metadata.subscriberCount.replace(/[KMB]/g, '')) * multiplier;
      }

      // Captions availability
      metadata.captionsAvailable = !!ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length;
    }

    // Fallback for tags and keywords
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    if (keywords) {
      metadata.tags = Array.from(new Set([...metadata.tags, ...keywords.split(',').map(t => t.trim())])).filter(Boolean);
    }

    // Clean up publishDate
    if (metadata.publishDate) {
      metadata.publishDate = new Date(metadata.publishDate).toISOString();
    }

    // Remove duplicates and empty tags
    metadata.tags = Array.from(new Set(metadata.tags)).filter(Boolean);

    return metadata;
  } catch (error) {
    throw new Error(`Could not fetch YouTube metadata: ${error.message}`);
  }
}

module.exports = { fetchYouTubeMeta };
