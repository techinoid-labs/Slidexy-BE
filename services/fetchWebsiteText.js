const cheerio = require("cheerio");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function fetchWebsiteText(url) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const text = $("p, h1, h2, h3, li")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 0)
    .join(" ");

  return text.slice(0, 8000);
}

module.exports = { fetchWebsiteText };
