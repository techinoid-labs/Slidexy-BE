/**
 * Generate one themed deck from a prompt. Auto-selects the highest scored seed.
 *
 *   node scripts/auto_generate.js "A neighborhood bakery"
 *
 * Keys are read from .env. The deck stays in the admin temporary folder until it is published.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { generateTemplate } = require("../services/templatePipeline/adminCatalog");

const prompt = process.argv.slice(2).join(" ").trim();

if (!prompt) {
  console.error("Usage: node scripts/auto_generate.js \"A neighborhood bakery\"");
  process.exit(1);
}

generateTemplate({ prompt, autoLayout: true })
  .then((result) => {
    console.log(JSON.stringify({
      id: result.id,
      name: result.name,
      layoutId: result.layoutId,
      slides: (result.slides || []).length,
    }));
  })
  .catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
