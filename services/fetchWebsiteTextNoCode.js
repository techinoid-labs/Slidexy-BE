const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function fetchWebsiteText(url) {
  const browser = await puppeteer.launch({
    headless: true,
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
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();

  // ✅ Block unnecessary resources (faster scraping)
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    if (["font", "media"].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // ✅ Visit website
  console.log(`🌍 Navigating to ${url}...`);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  console.log("✅ Page loaded (domcontentloaded).");

  const pageText = await page.content();
  if (/Just a moment|checking your connection/i.test(pageText)) {
    console.warn("⚠️ Cloudflare challenge detected — waiting extra time...");
    await new Promise((r) => setTimeout(r, 8000));
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await page.mouse.move(100, 100);



  // Wait a bit for lazy-loaded content
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ✅ Extract data from DOM
  const extractedData = await page.evaluate(() => {
    const selectorsToRemove = [
      "script",
      "style",
      "noscript",
      "iframe",
      "nav",
      "footer",
      "header",
      ".advertisement",
      ".cookie-banner",
      ".popup",
      ".modal",
    ];
    selectorsToRemove.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.remove());
    });

    const cleanText = (text) =>
      text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

    // ✅ Metadata
    const title = document.title || "";
    const metaDescription =
      document.querySelector('meta[name="description"]')?.content || "";

    // ✅ Meta image extraction
    const metaImage =
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('meta[name="twitter:image"]')?.content ||
      document.querySelector("link[rel='image_src']")?.href ||
      "";

    // ✅ Headings
    const headings = [];
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
      document.querySelectorAll(tag).forEach((el) => {
        const text = cleanText(el.innerText);
        if (text) headings.push({ level: tag, text });
      });
    });

    const images = [];
    document.querySelectorAll("img").forEach((img) => {
      const src = img.src || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
      const alt = img.alt || "";
      const width = img.width || img.naturalWidth || null;
      const height = img.height || img.naturalHeight || null;

      // Filter out tracking pixels, icons, and very small images
      if (src &&
        !src.startsWith("data:image/svg") &&
        !src.includes("pixel") &&
        !src.includes("tracking") &&
        (width === null || width > 50) &&
        (height === null || height > 50)) {
        images.push({
          src: src,
          alt: cleanText(alt),
          width: width,
          height: height,
          title: img.title || ""
        });
      }
    });

    // ✅ Paragraphs and content blocks
    const paragraphs = [];
    document
      .querySelectorAll("p, li, td, th, div[class*='content'], article")
      .forEach((el) => {
        const text = cleanText(el.innerText);
        if (
          text &&
          text.length > 20 &&
          !text.match(/^(cookie|accept|decline|privacy)/i)
        ) {
          paragraphs.push(text);
        }
      });

    // ✅ Links
    const links = [];
    document.querySelectorAll("a[href]").forEach((link) => {
      const text = cleanText(link.innerText);
      const href = link.href;
      if (text && href && !href.startsWith("javascript:")) {
        links.push({ text, url: href });
      }
    });

    // ✅ Tables
    const tables = [];
    document.querySelectorAll("table").forEach((table, idx) => {
      const rows = [];
      table.querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("th, td")).map((cell) =>
          cleanText(cell.innerText)
        );
        if (cells.some((c) => c)) rows.push(cells);
      });
      if (rows.length > 0) {
        tables.push({ tableIndex: idx + 1, rows });
      }
    });

    // ✅ Full page text
    const fullText = cleanText(document.body.innerText);

    return {
      metadata: {
        title,
        description: metaDescription,
        image: metaImage,
        url: window.location.href,
      },
      headings,
      images: images.slice(0, 100),
      paragraphs: [...new Set(paragraphs)],
      tables,
      links: links.slice(0, 50),
      fullText: fullText.slice(0, 100000),
    };
  });
  const stylesheetData = await page.evaluate(() => {
    const stylesheets = [];

    // External stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      stylesheets.push({
        type: 'external',
        href: link.href,
        media: link.media || 'all'
      });
    });

    // Inline style tags
    const inlineStyles = [];
    document.querySelectorAll('style').forEach((style, idx) => {
      const content = style.textContent;
      if (content && content.trim().length > 0) {
        inlineStyles.push({
          index: idx,
          content: content.slice(0, 10000) // Limit inline style size
        });
      }
    });

    return {
      external: stylesheets,
      inline: inlineStyles
    };
  });

  // ✅ Extract computed color scheme and aesthetic properties
  const aestheticData = await page.evaluate(() => {
    const colors = new Set();
    const fonts = new Set();
    const borderRadii = new Set();
    const shadows = new Set();

    // Helper to check if color is valid
    const isValidColor = (color) => {
      return color &&
        color !== 'rgba(0, 0, 0, 0)' &&
        color !== 'transparent' &&
        !color.includes('inherit');
    };

    // Helper to convert rgb/rgba to hex
    const rgbToHex = (color) => {
      if (!color || color === 'transparent') return null;

      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return color;

      const hex = '#' + rgb.slice(0, 3).map(x => {
        const h = parseInt(x).toString(16);
        return h.length === 1 ? '0' + h : h;
      }).join('');

      return hex;
    };

    // Sample important elements
    const importantSelectors = [
      'body',
      'header',
      'nav',
      'main',
      'article',
      'section',
      'aside',
      'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p',
      'a',
      'button',
      '.btn', '.button',
      '.card',
      '.hero',
      '.container'
    ];

    importantSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const computed = window.getComputedStyle(el);

        // Colors
        if (isValidColor(computed.color)) {
          colors.add(rgbToHex(computed.color));
        }
        if (isValidColor(computed.backgroundColor)) {
          colors.add(rgbToHex(computed.backgroundColor));
        }
        if (isValidColor(computed.borderColor)) {
          colors.add(rgbToHex(computed.borderColor));
        }

        // Fonts
        const fontFamily = computed.fontFamily;
        if (fontFamily && fontFamily !== 'inherit') {
          fonts.add(fontFamily.split(',')[0].replace(/['"]/g, '').trim());
        }

        // Border radius
        const borderRadius = computed.borderRadius;
        if (borderRadius && borderRadius !== '0px' && borderRadius !== 'inherit') {
          borderRadii.add(borderRadius);
        }

        // Box shadows
        const boxShadow = computed.boxShadow;
        if (boxShadow && boxShadow !== 'none') {
          shadows.add(boxShadow);
        }
      });
    });

    // Get root/body computed styles
    const bodyStyle = window.getComputedStyle(document.body);
    const rootStyle = window.getComputedStyle(document.documentElement);

    return {
      colors: Array.from(colors).filter(c => c).slice(0, 50),
      fonts: Array.from(fonts).slice(0, 20),
      borderRadii: Array.from(borderRadii).slice(0, 10),
      shadows: Array.from(shadows).slice(0, 10),
      rootColors: {
        backgroundColor: rgbToHex(bodyStyle.backgroundColor),
        color: rgbToHex(bodyStyle.color),
        linkColor: rgbToHex(rootStyle.getPropertyValue('--link-color')) || null,
        primaryColor: rgbToHex(rootStyle.getPropertyValue('--primary-color')) ||
          rgbToHex(rootStyle.getPropertyValue('--primary')) || null,
        secondaryColor: rgbToHex(rootStyle.getPropertyValue('--secondary-color')) ||
          rgbToHex(rootStyle.getPropertyValue('--secondary')) || null,
      },
      typography: {
        baseFontSize: bodyStyle.fontSize,
        baseFontFamily: bodyStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
        baseLineHeight: bodyStyle.lineHeight,
        baseFontWeight: bodyStyle.fontWeight,
      }
    };
  });

  await browser.close();

  // ⚡ Classify website type
  const websiteType = classifyWebsiteType(extractedData);

  // ⚡ Generate presentation hints
  const presentationHints = getPresentationHints(websiteType, extractedData);

  // ✅ Format readable output
  let formatted = `WEBSITE: ${extractedData.metadata.url}\n`;
  formatted += `TITLE: ${extractedData.metadata.title}\n`;
  formatted += `DESCRIPTION: ${extractedData.metadata.description}\n`;
  if (extractedData.metadata.image)
    formatted += `IMAGE: ${extractedData.metadata.image}\n`;
  formatted += `\n=== COLOR SCHEME & AESTHETICS ===\n`;
  formatted += `Primary Colors:\n`;
  aestheticData.colors.slice(0, 15).forEach(color => {
    formatted += `  ${color}\n`;
  });
  formatted += `\nTypography:\n`;
  formatted += `  Base Font: ${aestheticData.typography.baseFontFamily}\n`;
  formatted += `  Font Size: ${aestheticData.typography.baseFontSize}\n`;
  formatted += `  Line Height: ${aestheticData.typography.baseLineHeight}\n`;
  formatted += `\nFont Families Used:\n`;
  aestheticData.fonts.forEach(font => {
    formatted += `  ${font}\n`;
  });
  if (aestheticData.rootColors.primaryColor) {
    formatted += `\nBrand Colors:\n`;
    formatted += `  Primary: ${aestheticData.rootColors.primaryColor}\n`;
    if (aestheticData.rootColors.secondaryColor) {
      formatted += `  Secondary: ${aestheticData.rootColors.secondaryColor}\n`;
    }
  }

  // ✅ Add stylesheet references
  formatted += `\n=== STYLESHEETS (${stylesheetData.external.length} external) ===\n`;
  stylesheetData.external.forEach((sheet, idx) => {
    formatted += `${idx + 1}. ${sheet.href} (media: ${sheet.media})\n`;
  });
  if (stylesheetData.inline.length > 0) {
    formatted += `\nInline Styles: ${stylesheetData.inline.length} style blocks found\n`;
  }



  formatted += `\n=== HEADINGS ===\n`;
  extractedData.headings.forEach((h) => {
    formatted += `${h.level.toUpperCase()}: ${h.text}\n`;
  });
  if (extractedData.images.length > 0) {
    formatted += `\n=== IMAGES (${extractedData.images.length}) ===\n`;
    extractedData.images.forEach((img, idx) => {
      formatted += `Image ${idx + 1}:\n`;
      formatted += `  SRC: ${img.src}\n`;
      formatted += `  ALT: ${img.alt || "(no alt text)"}\n`;
      if (img.width && img.height) {
        formatted += `  SIZE: ${img.width}x${img.height}\n`;
      }
      if (img.title) {
        formatted += `  TITLE: ${img.title}\n`;
      }
      formatted += `\n`;
    });
  }

  formatted += `\n=== MAIN CONTENT ===\n`;
  extractedData.paragraphs.slice(0, 100).forEach((p) => {
    formatted += `${p}\n\n`;
  });

  if (extractedData.tables.length > 0) {
    formatted += `\n=== TABLES ===\n`;
    extractedData.tables.forEach((table) => {
      formatted += `\nTable ${table.tableIndex}:\n`;
      table.rows.forEach((row) => {
        formatted += row.join(" | ") + "\n";
      });
    });
  }

  if (formatted.length > 500000) {
    formatted =
      formatted.slice(0, 500000) + "\n\n[Content truncated due to length]";
  }

  // ✅ Return full structured object
  return {
    formatted,
    raw: extractedData,
    stylesheets: stylesheetData,
    aesthetics: aestheticData,
    stats: {
      headings: extractedData.headings.length,
      images: extractedData.images.length,
      paragraphs: extractedData.paragraphs.length,
      tables: extractedData.tables.length,
      stylesheets: stylesheetData.external.length,
      inlineStyles: stylesheetData.inline.length,
      colors: aestheticData.colors.length,
      totalChars: formatted.length,
    },
    websiteType,
    presentationHints,
  };
}

// ⚡ Helper: classify website type
function classifyWebsiteType(data) {
  const text = (data.rawText || data.fullText || "").toLowerCase();
  const { url } = data.metadata;

  if (url.match(/news|article|blog|medium|cnn|bbc/i)) return "news";
  if (url.match(/product|shop|store|item|price/i)) return "ecommerce";
  if (url.match(/wiki|encyclopedia|definition|info/i)) return "reference";
  if (url.match(/tutorial|how-to|guide|learn/i)) return "tutorial";
  if (url.match(/forum|thread|discussion|topic/i)) return "forum";
  if (url.match(/youtube|video|soundcloud|media/i)) return "media";
  if (url.match(/company|agency|portfolio|services/i)) return "portfolio";
  if (url.match(/listing|directory|jobs|realestate|property/i))
    return "directory";
  return "generic";
}

// ⚡ Helper: generate presentation hints
function getPresentationHints(type, data) {
  switch (type) {
    case "news":
      return {
        recommendedView: "timeline",
        dataFocus: ["headlines", "author", "date", "summary"],
        displayStyle: "modern-news-cards",
      };
    case "ecommerce":
      return {
        recommendedView: "grid",
        dataFocus: ["product title", "price", "ratings", "images"],
        displayStyle: "product-catalog",
      };
    case "tutorial":
      return {
        recommendedView: "stepper",
        dataFocus: ["steps", "code blocks", "examples"],
        displayStyle: "instructional",
      };
    case "reference":
      return {
        recommendedView: "sectioned document",
        dataFocus: ["definitions", "tables", "facts"],
        displayStyle: "encyclopedic",
      };
    case "portfolio":
      return {
        recommendedView: "hero layout",
        dataFocus: ["services", "slogans", "contact links"],
        displayStyle: "visual grid",
      };
    case "forum":
      return {
        recommendedView: "thread list",
        dataFocus: ["questions", "answers", "votes"],
        displayStyle: "discussion layout",
      };
    case "directory":
      return {
        recommendedView: "list + map",
        dataFocus: ["titles", "locations", "links"],
        displayStyle: "card listing",
      };
    case "media":
      return {
        recommendedView: "gallery",
        dataFocus: ["titles", "creators", "embed links"],
        displayStyle: "multimedia grid",
      };
    default:
      return {
        recommendedView: "document",
        dataFocus: ["headings", "paragraphs"],
        displayStyle: "generic text layout",
      };
  }
}

module.exports = { fetchWebsiteText };