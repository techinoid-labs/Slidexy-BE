#!/usr/bin/env node
/**
 * Test Gemini 2.0-flash model configuration
 */

require("dotenv").config();

const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_API_KEY = process.env.API_KEY1;

console.log("═══════════════════════════════════════════════════════════════");
console.log("Testing Gemini 2.0-flash Configuration");
console.log("═══════════════════════════════════════════════════════════════\n");

async function testOpenRouter() {
  if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not configured");
    return false;
  }

  console.log("🔄 Testing OpenRouter (google/gemini-2.0-flash)...");
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
      model: "google/gemini-2.0-flash",
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
    console.error("   Status:", err.status);
    if (err.response) {
      console.error("   Response:", err.response);
    }
    return false;
  }
}

async function testGoogleDirect() {
  if (!GOOGLE_API_KEY) {
    console.error("❌ API_KEY1 (Google) not configured");
    return false;
  }

  console.log("\n🔄 Testing Google Generative AI (gemini-2.0-flash)...");
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    console.error("   Status:", err.status);
    return false;
  }
}

async function main() {
  const results = {};
  
  results.openRouter = await testOpenRouter();
  results.googleDirect = await testGoogleDirect();

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`OpenRouter (google/gemini-2.0-flash): ${results.openRouter ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Google Direct (gemini-2.0-flash): ${results.googleDirect ? "✅ PASS" : "❌ FAIL"}`);

  if (results.openRouter || results.googleDirect) {
    console.log("\n✅ At least one API is working. Slide generation should work.");
  } else {
    console.log("\n❌ No API is working. Please check your API keys.");
  }
}

main().catch(console.error);
