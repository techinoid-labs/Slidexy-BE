const { YoutubeTranscript } = require("youtube-transcript");
const { ytLimiter } = require("../utils/limiter");

async function fetchYouTubeTranscript(url) {
  try {
    const vid = new URL(url).searchParams.get("v");
    if (!vid) {
      throw new Error("Invalid YouTube URL: Could not extract video ID.");
    }

    const parts = await ytLimiter.schedule(() =>
      YoutubeTranscript.fetchTranscript(vid)
    );
    const transcript = parts.map((p) => p.text).join(" ");

    if (!transcript || transcript.trim().length === 0) {
      throw new Error(
        "Transcript not available for this YouTube video. It might be private, have captions disabled, or be too new."
      );
    }

    return transcript;
  } catch (error) {
    console.error(`Error fetching YouTube transcript from ${url}:`, error);
    throw new Error(`Could not fetch YouTube transcript: ${error.message}`);
  }
}

module.exports = { fetchYouTubeTranscript };
