const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function fetchWebsiteText(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
          "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();

  // ✅ Block unnecessary resources (faster scraping)
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // ✅ Visit website
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  });

  const pageText = await page.content();
if (/Just a moment|checking your connection/i.test(pageText)) {
  console.warn("⚠️ Cloudflare challenge detected — waiting extra time...");
  await new Promise((r) => setTimeout(r, 8000));
  await page.reload({ waitUntil: "networkidle2" });
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
      paragraphs: [...new Set(paragraphs)],
      tables,
      links: links.slice(0, 50),
      fullText: fullText.slice(0, 100000),
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
  formatted += `\n=== HEADINGS ===\n`;
  extractedData.headings.forEach((h) => {
    formatted += `${h.level.toUpperCase()}: ${h.text}\n`;
  });

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
    stats: {
      headings: extractedData.headings.length,
      paragraphs: extractedData.paragraphs.length,
      tables: extractedData.tables.length,
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