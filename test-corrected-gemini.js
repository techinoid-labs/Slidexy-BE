#!/usr/bin/env node
/**
 * Test Gemini models with corrected model IDs
 */

require("dotenv").config();

const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_API_KEY = process.env.API_KEY1;

console.log("═══════════════════════════════════════════════════════════════");
console.log("Testing Corrected Gemini Model Configuration");
console.log("═══════════════════════════════════════════════════════════════\n");

async function testOpenRouter() {
  if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not configured");
    return false;
  }

  console.log("🔄 Testing OpenRouter (google/gemini-2.0-flash-001)...");
  try {
    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://slidexy.ai",
        "X-Title": "Slidexy Neuro Engine",
      },
    });

    const completion = await client.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "user",
          content: "Generate 3 creative slide titles for a tech presentation. Return ONLY a JSON array of strings.",
        },
      ],
      max_tokens: 200,
    });

    const response = completion.choices?.[0]?.message?.content || "";
    console.log("✅ OpenRouter SUCCESS\n");
    console.log("Response:", response);
    return true;
  } catch (err) {
    console.error("❌ OpenRouter FAILED");
    console.error("   Error:", err.message);
    return false;
  }
}

async function testGoogleFallback() {
  if (!GOOGLE_API_KEY) {
    console.error("❌ API_KEY1 (Google) not configured");
    return false;
  }

  console.log("\n🔄 Testing Google Generative AI (gemini-2.0-flash-exp)...");
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(
      "Generate 3 creative slide titles for a tech presentation. Return ONLY a JSON array of strings."
    );

    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Google Generative AI SUCCESS\n");
    console.log("Response:", text);
    return true;
  } catch (err) {
    console.error("❌ Google Generative AI FAILED");
    console.error("   Error:", err.message);
    
    if (err.message.includes("429") || err.message.includes("quota")) {
      console.error("\n⚠️  QUOTA ISSUE: Your Google free tier quota is exhausted.");
      console.error("   → Upgrade to a paid plan at https://console.cloud.google.com/");
      console.error("   → Or rely solely on OpenRouter");
    }
    return false;
  }
}

async function main() {
  const results = {};
  
  results.openRouter = await testOpenRouter();
  results.googleFallback = await testGoogleFallback();

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`OpenRouter (google/gemini-2.0-flash-001): ${results.openRouter ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Google Fallback (gemini-2.0-flash-exp): ${results.googleFallback ? "✅ PASS" : "❌ FAIL"}`);

  if (results.openRouter) {
    console.log("\n✅ OpenRouter is working! Slide generation should work with this.");
  }
  if (!results.googleFallback) {
    console.log("\n⚠️  Google API is not available. Using OpenRouter as primary.");
  }
}

main().catch(console.error);
