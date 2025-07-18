const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches YouTube video metadata by scraping Open Graph, meta tags, and JSON-LD.
 * @param {string} videoId - The YouTube video ID (e.g., uxjhN_Donfw)
 * @returns {Promise<{title: string, description: string, thumbnail: string, publishDate: string, channelName: string, channelUrl: string, viewCount: string, duration: string, tags: string[]}>}
 */
async function fetchYouTubeMeta(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Open Graph & meta tags
    const title = $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const tags = keywords ? keywords.split(',').map(t => t.trim()) : [];
    let publishDate = $('meta[itemprop="datePublished"]').attr('content') || '';

    // JSON-LD block
    let channelName = '';
    let channelUrl = '';
    let viewCount = '';
    let duration = '';
    const ldJson = $('script[type="application/ld+json"]').html();
    if (ldJson) {
      try {
        const json = JSON.parse(ldJson);
        if (json) {
          if (json.author && json.author.name) channelName = json.author.name;
          if (json.author && json.author.url) channelUrl = json.author.url;
          if (json.uploadDate) publishDate = publishDate || json.uploadDate;
          if (json.interactionCount) viewCount = json.interactionCount;
          if (json.duration) duration = json.duration;
          if (json.keywords && Array.isArray(json.keywords)) tags.push(...json.keywords);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return {
      title,
      description,
      thumbnail,
      publishDate,
      channelName,
      channelUrl,
      viewCount,
      duration,
      tags: Array.from(new Set(tags)).filter(Boolean),
    };
  } catch (error) {
    throw new Error('Could not fetch YouTube metadata: ' + error.message);
  }
}

module.exports = { fetchYouTubeMeta }; 