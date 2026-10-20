/**
 * Pass/fail review of a rendered slide. It does not edit the slide.
 *
 *   node services/templatePipeline/reviewer.js <slide.png>
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const OpenAI = require("openai");

const OPENROUTER_MODEL = "deepseek/deepseek-v4-flash-vision-exp";
const GEMINI_MODEL = "gemini-2.5-flash";
const PROMPT = "You are a design quality reviewer. Analyze this slide render. Return strict JSON with these keys: `legible` (boolean: is all text readable?), `washed_out` (boolean: is the background image too faded or is contrast too low?), `broken_layout` (boolean: do any elements overlap in a way that looks like an error?), `quality_score` (0.0–1.0), and `issues` (array of short strings describing any problems). Do not guess. Only return the JSON.";
let backend = null;

function openRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://slidexy.ai",
      "X-Title": "Slidexy Neuro Engine",
    },
  });
}

function dataUri(input) {
  if (typeof input === "string" && input.startsWith("data:")) return input;
  const bytes = fs.readFileSync(input);
  return "data:image/png;base64," + bytes.toString("base64");
}

function parseReview(text) {
  const fenced = String(text || "").match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : String(text || "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("reviewer did not return JSON");
  return JSON.parse(body.slice(start, end + 1));
}

async function complete(uri) {
  if (backend !== "gemini") {
    const router = openRouter();
    if (router) {
      try {
        const completion = await router.chat.completions.create({
          model: OPENROUTER_MODEL,
          temperature: 0,
          max_tokens: 500,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: uri } },
            ],
          }],
        });
        backend = "openrouter";
        const text = completion.choices && completion.choices[0] && completion.choices[0].message
          ? completion.choices[0].message.content
          : "";
        return { text, model: OPENROUTER_MODEL };
      } catch (error) {
        const message = String(error && error.message ? error.message : error);
        if (!/402|credit|insufficient/i.test(message)) throw error;
        backend = "gemini";
      }
    }
  }
  const key = process.env.API_KEY1 || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No vision model is available. OpenRouter returned no credits and API_KEY1 is unset.");
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: GEMINI_MODEL });
  const data = uri.replace(/^data:image\/png;base64,/, "");
  const result = await model.generateContent([
    { text: PROMPT },
    { inlineData: { mimeType: "image/png", data } },
  ]);
  backend = "gemini";
  return { text: result.response.text(), model: GEMINI_MODEL };
}

async function reviewSlide(input) {
  const completed = await complete(dataUri(input));
  const parsed = parseReview(completed.text);
  const legible = parsed.legible === true;
  const washedOut = parsed.washed_out === true;
  const broken = parsed.broken_layout === true;
  let quality = Number(parsed.quality_score);
  if (quality > 1 && quality <= 100) quality = Math.round((quality / 100) * 1000) / 1000;
  const issues = Array.isArray(parsed.issues) ? parsed.issues.map(String) : [];
  const passed = legible && !washedOut && !broken && quality >= 0.6;
  return {
    passed,
    quality_score: quality,
    issues,
    legible,
    washed_out: washedOut,
    broken_layout: broken,
    model: completed.model,
  };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node services/templatePipeline/reviewer.js <slide.png>");
    process.exit(1);
  }
  reviewSlide(path.resolve(file)).then((verdict) => {
    console.log(JSON.stringify(verdict));
  }).catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { reviewSlide, OPENROUTER_MODEL, GEMINI_MODEL, PROMPT };
