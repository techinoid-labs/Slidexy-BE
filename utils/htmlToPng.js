const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

/**
 * Converts an HTML string into a PNG screenshot using Puppeteer.
 * Captures only the main div (no extra background or white space).
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

  // Default viewport (we’ll resize later if needed)
  await page.setViewport({
    width: viewMode === "portrait" ? 720 : width,
    height: viewMode === "portrait" ? 1280 : height,
    deviceScaleFactor: 2, // ensures high-quality PNG
  });

  // Wrap the user HTML inside a container with an ID
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
            align-items: flex-start;
          }
          #capture-container {
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div id="capture-container">
          ${html}
        </div>
      </body>
    </html>
  `;

  await page.setContent(wrappedHtml, { waitUntil: "networkidle0" });
  await new Promise((resolve) => setTimeout(resolve, 1000)); // ensure fonts/render done

  // 🎯 Get the bounding box of only the div we want
  const element = await page.$("#capture-container");
  const box = await element.boundingBox();

  // Adjust viewport exactly to element size (optional)
  await page.setViewport({
    width: Math.ceil(box.width),
    height: Math.ceil(box.height),
    deviceScaleFactor: 2,
  });

  // 📸 Capture ONLY the div area
  await element.screenshot({
    path: outputPath,
  });

  await browser.close();

  const buffer = fs.readFileSync(outputPath);
  const base64 = buffer.toString("base64");

  return { path: outputPath, base64 };
}

module.exports = { htmlToPng };
