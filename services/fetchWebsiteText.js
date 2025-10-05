const puppeteer = require("puppeteer");

async function fetchWebsiteText(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Block unnecessary resources to speed up loading
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, {
    waitUntil: "networkidle2",
     timeout: 120000, 
  });

  // Wait a bit for any dynamic content
await new Promise(resolve => setTimeout(resolve, 2000));

  // Extract structured content
  const extractedData = await page.evaluate(() => {
    // Remove unwanted elements
    const selectorsToRemove = [
      'script', 'style', 'noscript', 'iframe',
      'nav', 'footer', 'header', '.advertisement',
      '.cookie-banner', '.popup', '.modal'
    ];
    
    selectorsToRemove.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Helper to clean text
    const cleanText = (text) => {
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
    };

    // Extract metadata
    const title = document.title || '';
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    
    // Extract headings hierarchically
    const headings = [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      document.querySelectorAll(tag).forEach(el => {
        const text = cleanText(el.innerText);
        if (text) {
          headings.push({
            level: tag,
            text: text
          });
        }
      });
    });

    // Extract main content paragraphs
    const paragraphs = [];
    document.querySelectorAll('p, li, td, th, div[class*="content"], article').forEach(el => {
      const text = cleanText(el.innerText);
      // Only include substantial text blocks
      if (text && text.length > 20 && !text.match(/^(cookie|accept|decline|privacy)/i)) {
        paragraphs.push(text);
      }
    });

    // Extract links with context
    const links = [];
    document.querySelectorAll('a[href]').forEach(link => {
      const text = cleanText(link.innerText);
      const href = link.href;
      if (text && href && !href.startsWith('javascript:')) {
        links.push({ text, url: href });
      }
    });

    // Extract tables
    const tables = [];
    document.querySelectorAll('table').forEach((table, idx) => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => 
          cleanText(cell.innerText)
        );
        if (cells.some(c => c)) rows.push(cells);
      });
      if (rows.length > 0) {
        tables.push({ tableIndex: idx + 1, rows });
      }
    });

    // Get all visible text as fallback
    const fullText = cleanText(document.body.innerText);

    return {
      metadata: {
        title,
        description: metaDescription,
        url: window.location.href
      },
      headings,
      paragraphs: [...new Set(paragraphs)], // Remove duplicates
      tables,
      links: links.slice(0, 50), // Limit links
      fullText: fullText.slice(0, 100000) // Keep more text
    };
  });

  await browser.close();

  // Format for LLM consumption
  let formatted = `WEBSITE: ${extractedData.metadata.url}\n`;
  formatted += `TITLE: ${extractedData.metadata.title}\n`;
  formatted += `DESCRIPTION: ${extractedData.metadata.description}\n\n`;

  formatted += `=== HEADINGS ===\n`;
  extractedData.headings.forEach(h => {
    formatted += `${h.level.toUpperCase()}: ${h.text}\n`;
  });

  formatted += `\n=== MAIN CONTENT ===\n`;
  extractedData.paragraphs.slice(0, 100).forEach(p => {
    formatted += `${p}\n\n`;
  });

  if (extractedData.tables.length > 0) {
    formatted += `\n=== TABLES ===\n`;
    extractedData.tables.forEach(table => {
      formatted += `\nTable ${table.tableIndex}:\n`;
      table.rows.forEach(row => {
        formatted += row.join(' | ') + '\n';
      });
    });
  }

  // Token limit for Gemini (roughly 1 million tokens = ~4 million chars)
  // Keep much more data - cut at 500k chars to be safe
  if (formatted.length > 500000) {
    formatted = formatted.slice(0, 500000) + "\n\n[Content truncated due to length]";
  }

  return {
    formatted, // Clean formatted text for LLM
    raw: extractedData, // Raw structured data
    stats: {
      headings: extractedData.headings.length,
      paragraphs: extractedData.paragraphs.length,
      tables: extractedData.tables.length,
      totalChars: formatted.length
    }
  };
}

module.exports = { fetchWebsiteText };