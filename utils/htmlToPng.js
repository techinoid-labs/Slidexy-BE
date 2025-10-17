const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

/**
 * Converts an HTML string into a PNG screenshot using Puppeteer.
 * In portrait mode, it automatically fits the screenshot to the HTML's natural size.
 */
async function htmlToPng(html, outputName, options = {}, viewMode = "landscape") {
  const {
    width = 1280,
    height = 720,
    outputDir = path.join(__dirname, "../../screenshots"),
  } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${outputName}.png`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Default viewport
  const viewport =
    viewMode === "portrait"
      ? { width: 720, height: 1280 }
      : { width, height };

  await page.setViewport(viewport);

  const wrappedHtml = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  await page.setContent(wrappedHtml, { waitUntil: "networkidle0" });

  // Wait a bit for rendering
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 🧩 If portrait: adjust viewport dynamically to match the HTML’s true size
  if (viewMode === "portrait") {
    const bodyHandle = await page.$("body");
    const boundingBox = await bodyHandle.boundingBox();

    await page.setViewport({
      width: Math.ceil(boundingBox.width),
      height: Math.ceil(boundingBox.height),
      deviceScaleFactor: 2, // crisp output
    });
  }

  // Take screenshot of full content only
  await page.screenshot({
    path: outputPath,
    fullPage: false,
    captureBeyondViewport: false,
  });

  await browser.close();

  const buffer = fs.readFileSync(outputPath);
  const base64 = buffer.toString("base64");

  return { path: outputPath, base64 };
}

module.exports = { htmlToPng };
