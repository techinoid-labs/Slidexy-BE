const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const axios = require("axios");
const cheerio = require("cheerio");

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

/**
 * Strategy 1: Simple HTTP request with Cheerio (fastest, works for most sites)
 */
async function fetchWithCheerio(url) {
  console.log("📄 Strategy 1: Trying simple HTTP fetch with Cheerio...");
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, footer, header').remove();
    $('.advertisement, .ad, .ads, .cookie-banner, .cookie-notice, .popup, .modal').remove();
    $('[class*="cookie"], [id*="cookie"], [class*="gdpr"]').remove();
    
    const cleanText = (text) => text.replace(/\s+/g, ' ').trim();
    
    // Extract metadata
    const title = $('title').text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || 
                    $('meta[name="twitter:image"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') || '';
    
    // Extract headings
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length > 3) {
        headings.push({ 
          level: el.name, 
          text: text.slice(0, 200) 
        });
      }
    });
    
    // Extract paragraphs with priority selectors
    const paragraphs = [];
    const contentSelectors = [
      'article p', 'main p', '[role="main"] p', 
      '.content p', '.post-content p', '.article-content p',
      '.product-description p', '.description p', 'p'
    ];
    
    for (const selector of contentSelectors) {
      $(selector).each((i, el) => {
        const text = cleanText($(el).text());
        if (text && text.length > 30 && !text.match(/^(cookie|accept|decline|privacy|subscribe|sign up|log in)/i)) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length > 20) break;
    }
    
    // Extract list items
    $('article li, main li, .content li, ul li, ol li').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length > 20 && text.length < 500) {
        paragraphs.push(text);
      }
    });
    
    // Get full body text as fallback
    const fullText = cleanText($('body').text()).slice(0, 150000);
    
    const extractedData = {
      metadata: {
        title: title || ogTitle,
        description: metaDescription,
        keywords: metaKeywords,
        image: ogImage,
        siteName: siteName,
        author: author,
        url: url,
      },
      headings: headings.slice(0, 50),
      paragraphs: [...new Set(paragraphs)].slice(0, 200),
      fullText: fullText,
    };
    
    const totalContent = extractedData.paragraphs.join(" ") + extractedData.fullText;
    
    if (totalContent.length > 200) {
      console.log(`✅ Cheerio extraction successful (${totalContent.length} chars)`);
      return extractedData;
    }
    
    throw new Error("Insufficient content with Cheerio");
    
  } catch (error) {
    console.warn(`⚠️ Cheerio method failed: ${error.message}`);
    throw error;
  }
}

/**
 * Strategy 2: Puppeteer with full JavaScript rendering (most comprehensive)
 */
async function fetchWithPuppeteer(url, options = {}) {
  const { timeout = 120000, waitTime = 2000, retries = 2 } = options;
  
  console.log("🤖 Strategy 2: Trying Puppeteer with full JS rendering...");
  
  let browser = null;
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      attempt++;
      console.log(`   Attempt ${attempt}/${retries}`);
      
      const launchOptions = {
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--window-size=1920,1080",
        ],
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--enable-automation"],
      };

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0"
      });

      // Block heavy resources for speed
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const resourceType = req.resourceType();
        const blockedTypes = ["stylesheet", "image", "font", "media", "websocket", "manifest"];
        const blockedDomains = [
          "google-analytics.com", "googletagmanager.com",
          "facebook.com", "doubleclick.net", "analytics.google.com"
        ];

        if (blockedTypes.includes(resourceType)) {
          req.abort();
        } else if (blockedDomains.some(domain => req.url().includes(domain))) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log("   Navigating to URL...");
      
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: timeout,
        });
      } catch (navError) {
        console.warn("   Primary navigation failed, trying load...");
        await page.goto(url, {
          waitUntil: "load",
          timeout: timeout,
        });
      }

      // Wait for body
      await page.waitForSelector("body", { timeout: 10000 }).catch(() => {
        console.warn("   Body not found immediately");
      });

      // Check for anti-bot challenges
      const pageContent = await page.content();
      const challenges = [
        /just a moment/i, /checking your browser/i, /cloudflare/i,
        /ray id/i, /ddos protection/i, /access denied/i, /captcha/i,
        /please wait/i, /loading/i, /verifying you are human/i
      ];

      const hasChallengePattern = challenges.some(pattern => pattern.test(pageContent));
      
      if (hasChallengePattern) {
        console.warn("   🛡️ Anti-bot challenge detected, applying countermeasures...");
        
        // Extended wait for challenge resolution
        await new Promise(resolve => setTimeout(resolve, 12000));
        
        // Simulate human scrolling behavior
        try {
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 4);
          });
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
          });
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          await page.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (scrollError) {
          console.warn("   Scroll simulation failed");
        }
        
        // Try reloading after challenge
        try {
          await page.reload({ waitUntil: "domcontentloaded", timeout: timeout });
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (reloadError) {
          console.warn("   Reload failed, continuing");
        }
      }

      // Human behavior simulation
      await page.mouse.move(100, 100).catch(() => {});
      await page.mouse.move(250, 350).catch(() => {});
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Wait for body to have meaningful content
      await page.waitForFunction(
        () => document.body && document.body.innerText && document.body.innerText.length > 100,
        { timeout: 15000 }
      ).catch(() => {
        console.warn("   Body content not fully loaded");
      });

      // Extract content with comprehensive error handling
      const extractedData = await page.evaluate(() => {
        try {
          if (!document.body) {
            return {
              metadata: { title: document.title || "", description: "", url: window.location.href },
              headings: [],
              paragraphs: [],
              fullText: "Error: Document body not available",
            };
          }

          const cleanText = (text) => text?.replace(/\s+/g, ' ').trim() || "";
          
          // Remove unwanted elements
          const selectorsToRemove = [
            'script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'header',
            '.advertisement', '.ad', '.ads', '.cookie-banner', '.cookie-notice',
            '.popup', '.modal', '[class*="cookie"]', '[id*="cookie"]',
            '[class*="gdpr"]', '[id*="consent"]', '[class*="sidebar"]'
          ];
          
          selectorsToRemove.forEach(selector => {
            try {
              document.querySelectorAll(selector).forEach(el => el.remove());
            } catch (e) {}
          });

          // Metadata extraction
          const title = document.title || "";
          const metaDescription = document.querySelector('meta[name="description"]')?.content || "";
          const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || "";
          const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
          const ogImage = document.querySelector('meta[property="og:image"]')?.content || "";
          const siteName = document.querySelector('meta[property="og:site_name"]')?.content || "";
          const author = document.querySelector('meta[name="author"]')?.content || "";
          
          // Headings extraction
          const headings = [];
          try {
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
              document.querySelectorAll(tag).forEach(el => {
                if (el && el.innerText) {
                  const text = cleanText(el.innerText);
                  if (text && text.length > 3) {
                    headings.push({ level: tag, text: text.slice(0, 200) });
                  }
                }
              });
            });
          } catch (e) {}

          // Paragraphs extraction with priority
          const paragraphs = [];
          const contentSelectors = [
            'article p', 'main p', '[role="main"] p',
            '.content p', '.post-content p', '.article-content p',
            '.product-description p', '.description p', 'p'
          ];

          let foundContent = false;
          for (const selector of contentSelectors) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                elements.forEach(el => {
                  if (el && el.innerText) {
                    const text = cleanText(el.innerText);
                    if (text && text.length > 30 && !text.match(/^(cookie|accept|decline|privacy|subscribe)/i)) {
                      paragraphs.push(text);
                      foundContent = true;
                    }
                  }
                });
                if (foundContent && paragraphs.length > 10) break;
              }
            } catch (e) {}
          }

          // List items extraction
          try {
            ['article li', 'main li', '.content li', 'ul li', 'ol li'].forEach(selector => {
              document.querySelectorAll(selector).forEach(el => {
                if (el && el.innerText) {
                  const text = cleanText(el.innerText);
                  if (text && text.length > 20 && text.length < 500) {
                    paragraphs.push(text);
                  }
                }
              });
            });
          } catch (e) {}

          // Full text extraction with fallbacks
          let fullText = "";
          try {
            if (document.body.innerText) {
              fullText = cleanText(document.body.innerText);
            } else if (document.body.textContent) {
              fullText = cleanText(document.body.textContent);
            }
          } catch (e) {
            fullText = "Error extracting page content";
          }

          return {
            metadata: {
              title: title || ogTitle,
              description: metaDescription,
              keywords: metaKeywords,
              image: ogImage,
              siteName: siteName,
              author: author,
              url: window.location.href,
            },
            headings: headings.slice(0, 50),
            paragraphs: [...new Set(paragraphs)].slice(0, 200),
            fullText: fullText.slice(0, 150000),
          };
        } catch (error) {
          return {
            metadata: { title: document.title || "", description: "", url: window.location.href },
            headings: [],
            paragraphs: [],
            fullText: "Error: " + error.message,
          };
        }
      });

      await browser.close();
      browser = null;
      
      const totalContent = extractedData.paragraphs.join(" ") + extractedData.fullText;
      
      if (totalContent.length > 200) {
        console.log(`✅ Puppeteer extraction successful (${totalContent.length} chars)`);
        return extractedData;
      }
      
      throw new Error("Insufficient content extracted");
      
    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
        browser = null;
      }
      
      console.warn(`   Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt >= retries) {
        throw error;
      }
      
      const waitTime = Math.min(3000 * Math.pow(2, attempt - 1), 10000);
      console.log(`   Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Strategy 3: Meta-only fallback (always works, minimal but reliable)
 */
async function fetchMetaOnly(url) {
  console.log("🏷️ Strategy 3: Meta-tags only extraction (fallback)...");
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // Extract all available meta tags
    const title = $('title').text() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') || 
                  'Untitled Website';
                  
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content') || 
                       'No description available';
                       
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || '';
    
    const siteName = $('meta[property="og:site_name"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') || '';
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    
    // Try to extract any visible text from the HTML (without scripts/styles)
    $('script, style, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);
    
    // Extract any headings that might be in the HTML
    const headings = [];
    $('h1, h2, h3').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 3) {
        headings.push({ level: el.name, text: text.slice(0, 200) });
      }
    });
    
    // Create comprehensive content from all available data
    const combinedContent = [
      `Website: ${title}`,
      `Description: ${description}`,
      keywords ? `Keywords: ${keywords}` : '',
      siteName ? `Site Name: ${siteName}` : '',
      author ? `Author: ${author}` : '',
      ogType ? `Type: ${ogType}` : '',
      bodyText ? `Content Preview: ${bodyText}` : '',
    ].filter(Boolean).join('\n\n');
    
    console.log(`✅ Meta-only extraction successful (${combinedContent.length} chars)`);
    
    return {
      metadata: {
        title,
        description,
        keywords,
        image,
        siteName,
        author,
        url,
      },
      headings: headings.length > 0 ? headings : [{ level: 'h1', text: title }],
      paragraphs: [description, bodyText].filter(Boolean),
      fullText: combinedContent,
    };
    
  } catch (error) {
    console.error(`❌ Meta-only extraction failed: ${error.message}`);
    
    // Absolute last resort: return URL-based minimal content
    return {
      metadata: {
        title: url,
        description: `Content from ${url}`,
        url,
      },
      headings: [{ level: 'h1', text: url }],
      paragraphs: [`Website: ${url}`],
      fullText: `Website URL: ${url}\n\nNote: Unable to extract detailed content due to access restrictions. The website may be protected by anti-bot systems or require authentication.`,
    };
  }
}

/**
 * Main function with cascading fallback strategies
 * Tries all 3 approaches in order: Cheerio -> Puppeteer -> Meta-only
 */
async function fetchWebsiteText(url, options = {}) {
  console.log(`\n🎯 Starting multi-strategy extraction for: ${url}`);
  
  const strategies = [
    { 
      name: "Cheerio (Fast HTTP)", 
      fn: () => fetchWithCheerio(url),
      minContentLength: 200
    },
    { 
      name: "Puppeteer (Full JS)", 
      fn: () => fetchWithPuppeteer(url, options),
      minContentLength: 200
    },
    { 
      name: "Meta-Only (Fallback)", 
      fn: () => fetchMetaOnly(url),
      minContentLength: 50 // Lower threshold for meta-only
    },
  ];

  let lastError = null;
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const isLastStrategy = i === strategies.length - 1;
    
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      const extractedData = await strategy.fn();
      
      // Validate content quality
      const totalContent = extractedData.paragraphs.join(" ") + extractedData.fullText;
      
      if (totalContent.length < strategy.minContentLength && !isLastStrategy) {
        throw new Error(`Insufficient content (${totalContent.length} chars)`);
      }
      
      // Classify website type
      const websiteType = classifyWebsiteType(extractedData);
      
      // Format output
      let formatted = `WEBSITE: ${extractedData.metadata.url}\n`;
      formatted += `TITLE: ${extractedData.metadata.title}\n`;
      formatted += `DESCRIPTION: ${extractedData.metadata.description}\n`;
      
      if (extractedData.metadata.keywords) {
        formatted += `KEYWORDS: ${extractedData.metadata.keywords}\n`;
      }
      if (extractedData.metadata.siteName) {
        formatted += `SITE NAME: ${extractedData.metadata.siteName}\n`;
      }
      if (extractedData.metadata.author) {
        formatted += `AUTHOR: ${extractedData.metadata.author}\n`;
      }
      
      formatted += `TYPE: ${websiteType}\n`;
      formatted += `EXTRACTION METHOD: ${strategy.name}\n\n`;
      
      formatted += `=== MAIN HEADINGS ===\n`;
      extractedData.headings.forEach((h) => {
        formatted += `${h.level.toUpperCase()}: ${h.text}\n`;
      });
      
      formatted += `\n=== CONTENT ===\n`;
      extractedData.paragraphs.forEach((p) => {
        formatted += `${p}\n\n`;
      });

      // Add full text if paragraphs are limited
      if (extractedData.paragraphs.length < 3 && extractedData.fullText.length > 500) {
        formatted += `\n=== ADDITIONAL CONTENT ===\n`;
        formatted += extractedData.fullText;
      }

      if (formatted.length > 500000) {
        formatted = formatted.slice(0, 500000) + "\n\n[Content truncated due to length]";
      }

      console.log(`\n✅ SUCCESS! Extracted ${formatted.length} chars using ${strategy.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      return {
        formatted,
        raw: extractedData,
        stats: {
          headings: extractedData.headings.length,
          paragraphs: extractedData.paragraphs.length,
          totalChars: formatted.length,
          method: strategy.name,
        },
        websiteType,
      };
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ ${strategy.name} failed: ${error.message}`);
      
      // If this is the last strategy and it still returned some data, use it anyway
      if (isLastStrategy) {
        console.log(`\n⚠️ Using last resort content despite errors...`);
        // The meta-only strategy should have returned something, so this shouldn't happen
        // But if it does, we've already handled it in fetchMetaOnly
      }
      
      // Continue to next strategy
      continue;
    }
  }

  // This should never happen since meta-only is a guaranteed fallback
  throw new Error(
    `All extraction strategies failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

function classifyWebsiteType(data) {
  const text = (data.fullText || "").toLowerCase();
  const title = (data.metadata.title || "").toLowerCase();
  const { url } = data.metadata;

  if (url.match(/news|article|blog|medium|cnn|bbc|techcrunch/i) || 
      title.match(/news|blog|article/i)) return "news";
      
  if (url.match(/product|shop|store|cart|buy|myherocards|ecommerce|shopify/i) || 
      text.match(/add to cart|buy now|price|checkout/i)) return "ecommerce";
      
  if (url.match(/wiki|encyclopedia|definition|info|docs/i)) return "reference";
  
  if (url.match(/tutorial|how-to|guide|learn|course/i) || 
      title.match(/tutorial|guide|how to/i)) return "tutorial";
      
  if (url.match(/forum|thread|discussion|topic|reddit/i)) return "forum";
  
  if (url.match(/youtube|video|soundcloud|media|vimeo/i)) return "media";
  
  if (url.match(/company|agency|portfolio|services|about/i)) return "portfolio";
  
  if (url.match(/listing|directory|jobs|realestate|property/i)) return "directory";
  
  return "generic";
}

module.exports = { fetchWebsiteText };