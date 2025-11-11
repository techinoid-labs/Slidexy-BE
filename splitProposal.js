import fs from "fs-extra";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

// Setup for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input file
const inputFile = path.resolve(__dirname, "proposal.html");

// Output folders
const baseDir = path.resolve(__dirname, "templates");
const pagesDir = path.join(baseDir, "pages");

// Make sure folders exist
await fs.ensureDir(pagesDir);

// Read full HTML
const html = await fs.readFile(inputFile, "utf-8");
const $ = cheerio.load(html);

// Extract <style> and <head> metadata
const styles = $("style").html();
const title = $("title").text() || "Proposal Template";

// Create shared CSS
await fs.writeFile(path.join(baseDir, "styles.css"), styles);

// Create head.html
const headHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <div class="container">
`;

await fs.writeFile(path.join(baseDir, "head.html"), headHtml);

// Create footer.html
const footerHtml = `
  </div>
</body>
</html>
`;
await fs.writeFile(path.join(baseDir, "footer.html"), footerHtml);

// Extract all <section class="slide">
const sections = $("section.slide");

for (const el of sections) {
  const id = $(el).attr("id") || "page";
  const htmlContent = $.html(el).trim();
  const pageFile = path.join(pagesDir, `${id}.html`);

  const fullPage = `<!-- include:head -->
${htmlContent}
<!-- include:footer -->`;

  await fs.writeFile(pageFile, fullPage);
  console.log(`✅ Saved ${id}.html`);
}

console.log("\n🎉 Split complete! Files saved in /templates/pages/");
