/**
 * Comprehensive Testing Script for OpenRouter + fal.ai Integration
 * 
 * Tests:
 * 1. OpenRouter text generation (via geminiModels adapter)
 * 2. fal.ai Flux image generation
 * 3. Full slide text generation pipeline
 * 4. Full image generation pipeline (art knowledge → prompt → Flux)
 * 
 * Usage: node test-openrouter.js
 */

require("dotenv").config();

const passed = [];
const failed = [];

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

async function runTest(name, fn) {
  try {
    log("🧪", `Testing: ${name}...`);
    const start = Date.now();
    const result = await fn();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log("✅", `PASSED: ${name} (${elapsed}s)`);
    passed.push(name);
    return result;
  } catch (err) {
    log("❌", `FAILED: ${name} — ${err.message}`);
    failed.push({ name, error: err.message });
    return null;
  }
}

async function main() {
  console.log("═".repeat(60));
  console.log("  Slidexy Neuro Engine — Integration Test Suite");
  console.log("═".repeat(60));
  console.log();

  // ── Test 1: Environment Variables ──────────────────────────
  await runTest("Environment: OPENROUTER_API_KEY is set", async () => {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not found in .env");
    log("  ", `Key prefix: ${process.env.OPENROUTER_API_KEY.substring(0, 15)}...`);
  });

  await runTest("Environment: FAL_API_KEY is set", async () => {
    const key = process.env.FAL_API_KEY || process.env.FAL_KEY;
    if (!key) throw new Error("FAL_API_KEY / FAL_KEY not found in .env");
    log("  ", `Key prefix: ${key.substring(0, 15)}...`);
  });

  // ── Test 2: OpenRouter Text Generation ─────────────────────
  await runTest("OpenRouter: Basic text generation", async () => {
    const { textGenModel } = require("./utils/geminiModels");
    const result = await textGenModel.generateContent(
      "Respond with exactly one sentence: What is artificial intelligence?"
    );
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.length < 10) throw new Error(`Empty or too short response: "${text}"`);
    log("  ", `Response (${text.length} chars): "${text.substring(0, 120)}..."`);
  });

  // ── Test 3: OpenRouter JSON generation ─────────────────────
  await runTest("OpenRouter: JSON generation (slide format)", async () => {
    const { textGenModel } = require("./utils/geminiModels");
    const result = await textGenModel.generateContent(
      `Return ONLY a valid JSON array with 2 objects, each having "title" and "bullets" (array of 3 strings). Topic: Space exploration.`
    );
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array found in response");
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed) || parsed.length < 2) throw new Error("Expected array with 2+ items");
    log("  ", `Got ${parsed.length} slide objects, first title: "${parsed[0].title}"`);
  });

  // ── Test 4: OpenRouter multipart (text + file) ─────────────
  await runTest("OpenRouter: Multipart input handling", async () => {
    const { textGenModel } = require("./utils/geminiModels");
    const result = await textGenModel.generateContent([
      { text: "Describe this topic in one sentence: Climate change and its global impact" },
    ]);
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.length < 10) throw new Error(`Bad multipart response: "${text}"`);
    log("  ", `Multipart response: "${text.substring(0, 100)}..."`);
  });

  // ── Test 5: fal.ai Flux Image Generation ───────────────────
  await runTest("fal.ai Flux: Image generation", async () => {
    const { generateFluxImage } = require("./utils/generateFluxImage");
    const result = await generateFluxImage({
      prompt: "A beautiful sunset over mountains, digital art, vibrant colors, no text",
      artStyle: "Digital Painting",
      artPalette: ["#ff6b35", "#004e89", "#1a659e"],
    });
    if (!result || !result.image_url) throw new Error("Flux returned no image URL");
    log("  ", `Image URL: ${result.image_url.substring(0, 80)}...`);
  });

  // ── Test 6: Full Slide Text Pipeline ───────────────────────
  await runTest("Pipeline: generateSlideText (3 slides)", async () => {
    const { generateSlideText } = require("./services/generateSlideText");
    const slides = await generateSlideText(
      "Artificial Intelligence is transforming healthcare through early disease detection, personalized treatment plans, and drug discovery. Machine learning models are being trained on vast datasets of medical records to identify patterns that humans might miss.",
      { goal: "Educate", tone: "Professional", audience: "Healthcare executives" },
      3
    );
    if (!Array.isArray(slides) || slides.length === 0) throw new Error("No slides generated");
    log("  ", `Generated ${slides.length} slides`);

    // Verify slide content is contextual (not defaults)
    const firstTitle = slides[0]?.slide_title?.text || "";
    log("  ", `Slide 1 title: "${firstTitle}"`);

    // Check that content is NOT the fallback defaults
    const isDefault = firstTitle === "Presentation Title" || firstTitle === "";
    if (isDefault) throw new Error(`Slide title is a default/fallback: "${firstTitle}"`);

    // Check each slide has required fields
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (!s.slide_id) throw new Error(`Slide ${i + 1} missing slide_id`);
      if (!s.layout_type) throw new Error(`Slide ${i + 1} missing layout_type`);
      if (!s.elements || s.elements.length === 0) throw new Error(`Slide ${i + 1} has no elements`);
      log("  ", `  Slide ${i + 1}: ${s.layout_type} — "${s.slide_title?.text}" (${s.elements.length} elements)`);
    }
  });

  // ── Summary ────────────────────────────────────────────────
  console.log();
  console.log("═".repeat(60));
  console.log(`  Results: ${passed.length} passed, ${failed.length} failed`);
  console.log("═".repeat(60));

  if (passed.length > 0) {
    console.log("\n  ✅ Passed:");
    passed.forEach((t) => console.log(`     • ${t}`));
  }

  if (failed.length > 0) {
    console.log("\n  ❌ Failed:");
    failed.forEach((t) => console.log(`     • ${t.name}: ${t.error}`));
    console.log();
    process.exit(1);
  }

  console.log("\n  🎉 All tests passed!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
