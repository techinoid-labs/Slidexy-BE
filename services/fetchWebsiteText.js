const puppeteer = require("puppeteer");

async function fetchWebsiteText(url) {
  const browser = await puppeteer.launch({
    headless: "new", // modern headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Go to the page and wait until network is mostly idle
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000, // 60s timeout
  });

  // Get the fully rendered page content
  const html = await page.content();

  // Extract full visible text (like user sees on screen)
  const text = await page.evaluate(() => document.body.innerText);

  await browser.close();

  // Combine raw HTML + extracted text
  let combined = `RAW_HTML:\n${html}\n\nVISIBLE_TEXT:\n${text}`;

  // Safety cutoff (Gemini/GPT token limits)
  if (combined.length > 8000) {
    combined = combined.slice(0, 8000);
  }

  return combined;
}

module.exports = { fetchWebsiteText };
