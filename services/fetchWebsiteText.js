const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");

// Apply stealth plugin to avoid detection
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function fetchWebsiteText(url, options = {}) {
  const {
    timeout = 120000, // Reduced from 180s to 120s
    waitTime = 2000,  // Reduced from 5s to 2s
    retries = 3,
    useProxy = false,
    proxyUrl = null
  } = options;

  let browser = null;
  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;
      console.log(`🔄 Attempt ${attempt}/${retries} to fetch: ${url}`);

      // Enhanced browser launch configuration
      const launchOptions = {
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-blink-features=AutomationControlled",
          "--disable-client-side-phishing-detection",
          "--disable-popup-blocking",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--window-size=1920,1080",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        ],
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--enable-automation"],
      };

      if (useProxy && proxyUrl) {
        launchOptions.args.push(`--proxy-server=${proxyUrl}`);
      }

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0"
      });

      // Block ALL non-essential resources for MAXIMUM speed
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const resourceType = req.resourceType();
        // Only allow document and script, block everything else
        const blockedTypes = ["stylesheet", "image", "font", "media", "websocket", "manifest", "other"];
        const blockedDomains = [
          "google-analytics.com",
          "googletagmanager.com",
          "facebook.com",
          "doubleclick.net",
          "analytics.google.com",
          "ads",
          "advertising",
          "tracking"
        ];

        if (blockedTypes.includes(resourceType)) {
          req.abort();
        } else if (blockedDomains.some(domain => req.url().includes(domain))) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log("🌐 Navigating to URL...");
      
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded", // Faster than networkidle
          timeout: timeout,
        });
      } catch (navError) {
        console.warn("⚠️ Primary navigation failed, trying alternative...");
        await page.goto(url, {
          waitUntil: "load",
          timeout: timeout,
        });
      }

      // Quick check for anti-bot challenges
      const pageContent = await page.content();
      const challenges = [
        /just a moment/i,
        /checking your browser/i,
        /cloudflare/i,
        /ray id/i,
        /ddos protection/i,
        /access denied/i,
        /captcha/i
      ];

      const hasChallengePattern = challenges.some(pattern => pattern.test(pageContent));
      
      if (hasChallengePattern) {
        console.warn("🛡️ Anti-bot challenge detected, waiting...");
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Quick scroll
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.reload({ waitUntil: "domcontentloaded", timeout: timeout });
      }

      // Minimal human simulation
      await page.mouse.move(100, 100);
      
      // Reduced wait time
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Extract ONLY text data from DOM (no stylesheets, no aesthetics)
      const extractedData = await page.evaluate(() => {
        // Remove unwanted elements
        const selectorsToRemove = [
          "script",
          "style",
          "noscript",
          "iframe",
          "nav",
          "footer",
          "header",
          ".advertisement",
          ".ad",
          ".ads",
          ".cookie-banner",
          ".cookie-notice",
          ".popup",
          ".modal",
          '[class*="cookie"]',
          '[id*="cookie"]',
          '[class*="gdpr"]',
          '[id*="consent"]',
          '[class*="sidebar"]',
          '[class*="comment"]'
        ];
        
        selectorsToRemove.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        });

        const cleanText = (text) =>
          text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

        // Metadata
        const title = document.title || "";
        const metaDescription =
          document.querySelector('meta[name="description"]')?.content || "";

        // Headings - prioritize main content
        const headings = [];
        ["h1", "h2", "h3"].forEach((tag) => {
          document.querySelectorAll(tag).forEach((el) => {
            const text = cleanText(el.innerText);
            if (text && text.length > 3) {
              headings.push({ level: tag, text });
            }
          });
        });

        // Main content paragraphs - focus on meaningful content
        const paragraphs = [];
        const contentSelectors = [
          'article p',
          'main p',
          '[role="main"] p',
          '.content p',
          '.post-content p',
          '.article-content p',
          'p' // fallback
        ];

        let foundContent = false;
        for (const selector of contentSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((el) => {
              const text = cleanText(el.innerText);
              if (
                text &&
                text.length > 30 && // Longer minimum for quality
                !text.match(/^(cookie|accept|decline|privacy|subscribe|sign up|log in)/i)
              ) {
                paragraphs.push(text);
                foundContent = true;
              }
            });
            if (foundContent && paragraphs.length > 5) break;
          }
        }

        // Also grab list items if they contain substantial content
        document.querySelectorAll('article li, main li, .content li').forEach((el) => {
          const text = cleanText(el.innerText);
          if (text && text.length > 30) {
            paragraphs.push(text);
          }
        });

        // Full page text as backup
        const fullText = cleanText(document.body.innerText);

        return {
          metadata: {
            title,
            description: metaDescription,
            url: window.location.href,
          },
          headings: headings.slice(0, 50), // Limit headings
          paragraphs: [...new Set(paragraphs)].slice(0, 200), // Deduplicate and limit
          fullText: fullText.slice(0, 150000), // Increased limit for full text
        };
      });

      await browser.close();
      browser = null;

      // Classify website type
      const websiteType = classifyWebsiteType(extractedData);

      // Format output - TEXT ONLY
      let formatted = `WEBSITE: ${extractedData.metadata.url}\n`;
      formatted += `TITLE: ${extractedData.metadata.title}\n`;
      formatted += `DESCRIPTION: ${extractedData.metadata.description}\n`;
      formatted += `TYPE: ${websiteType}\n\n`;
      
      formatted += `=== MAIN HEADINGS ===\n`;
      extractedData.headings.forEach((h) => {
        formatted += `${h.level.toUpperCase()}: ${h.text}\n`;
      });
      
      formatted += `\n=== CONTENT ===\n`;
      extractedData.paragraphs.forEach((p) => {
        formatted += `${p}\n\n`;
      });

      // Fallback to full text if paragraphs are insufficient
      if (extractedData.paragraphs.length < 5 && extractedData.fullText.length > 500) {
        formatted += `\n=== ADDITIONAL CONTENT ===\n`;
        formatted += extractedData.fullText;
      }

      if (formatted.length > 500000) {
        formatted = formatted.slice(0, 500000) + "\n\n[Content truncated due to length]";
      }

      console.log(`✅ Successfully scraped website (${formatted.length} chars)`);

      return {
        formatted,
        raw: extractedData,
        stats: {
          headings: extractedData.headings.length,
          paragraphs: extractedData.paragraphs.length,
          totalChars: formatted.length,
        },
        websiteType,
      };

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Error closing browser:", closeError.message);
        }
        browser = null;
      }

      if (attempt >= retries) {
        throw new Error(`Failed to fetch website after ${retries} attempts: ${error.message}`);
      }

      // Exponential backoff with reduced wait times
      const waitTime = Math.min(3000 * Math.pow(2, attempt - 1), 20000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

function classifyWebsiteType(data) {
  const text = (data.fullText || "").toLowerCase();
  const { url } = data.metadata;

  if (url.match(/news|article|blog|medium|cnn|bbc/i)) return "news";
  if (url.match(/product|shop|store|item|price/i)) return "ecommerce";
  if (url.match(/wiki|encyclopedia|definition|info/i)) return "reference";
  if (url.match(/tutorial|how-to|guide|learn/i)) return "tutorial";
  if (url.match(/forum|thread|discussion|topic/i)) return "forum";
  if (url.match(/youtube|video|soundcloud|media/i)) return "media";
  if (url.match(/company|agency|portfolio|services/i)) return "portfolio";
  if (url.match(/listing|directory|jobs|realestate|property/i)) return "directory";
  return "generic";
}

module.exports = { fetchWebsiteText };