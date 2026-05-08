#!/usr/bin/env node
/**
 * Comprehensive API Status Check
 */

require("dotenv").config();

console.log("═════════════════════════════════════════════════════════════════════");
console.log("SLIDEXY NEURO ENGINE - API CONFIGURATION STATUS");
console.log("═════════════════════════════════════════════════════════════════════\n");

// 1. Check environment variables
console.log("📋 ENVIRONMENT CONFIGURATION");
console.log("─────────────────────────────────────────────────────────────────────");

const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
const hasGoogle = !!process.env.API_KEY1;
const hasFAL = !!process.env.FAL_API_KEY;

console.log(`OpenRouter API Key: ${hasOpenRouter ? "✅ SET" : "❌ NOT SET"}`);
if (hasOpenRouter) {
  const key = process.env.OPENROUTER_API_KEY;
  console.log(`  └─ ${key.substring(0, 15)}...${key.substring(key.length - 5)}`);
}

console.log(`\nGoogle API Key (API_KEY1): ${hasGoogle ? "✅ SET" : "❌ NOT SET"}`);
if (hasGoogle) {
  const key = process.env.API_KEY1;
  console.log(`  └─ ${key.substring(0, 15)}...${key.substring(key.length - 5)}`);
}

console.log(`\nFAL API Key: ${hasFAL ? "✅ SET" : "❌ NOT SET"}`);
if (hasFAL) {
  const key = process.env.FAL_API_KEY;
  console.log(`  └─ ${key.substring(0, 15)}...${key.substring(key.length - 5)}`);
}

// 2. Test OpenRouter
console.log("\n\n📡 OPENROUTER STATUS");
console.log("─────────────────────────────────────────────────────────────────────");

async function testOpenRouter() {
  if (!hasOpenRouter) {
    console.log("❌ OPENROUTER_API_KEY not configured");
    return;
  }

  const OpenAI = require("openai");
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://slidexy.ai",
      "X-Title": "Slidexy Neuro Engine",
    },
  });

  try {
    console.log("Testing: google/gemini-2.0-flash-001");
    const completion = await client.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: "Return only: OK" }],
      max_tokens: 10,
    });
    console.log("✅ WORKING - OpenRouter has credits and model is available");
  } catch (err) {
    console.log("❌ FAILED");
    console.log(`   Error: ${err.message}`);
    
    if (err.status === 402) {
      console.log("   Issue: Insufficient credits on OpenRouter account");
      console.log("   Fix: Add credits at https://openrouter.ai/settings/credits");
    }
  }
}

// 3. Test Google API
console.log("\n\n🔍 GOOGLE API STATUS");
console.log("─────────────────────────────────────────────────────────────────────");

async function testGoogle() {
  if (!hasGoogle) {
    console.log("❌ API_KEY1 (Google) not configured");
    return;
  }

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.API_KEY1);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    console.log("Testing: gemini-1.5-flash");
    const result = await model.generateContent("Return only: OK");
    const response = await result.response;
    console.log("✅ WORKING - Google API is functional");
  } catch (err) {
    console.log("❌ FAILED");
    console.log(`   Error: ${err.message.split('\n')[0]}`);
    
    if (err.message.includes("429")) {
      console.log("   Issue: Free tier quota exceeded");
      console.log("   Fix: Upgrade to paid plan at https://console.cloud.google.com/");
    } else if (err.message.includes("404")) {
      console.log("   Issue: Model not available or API key invalid");
      console.log("   Fix: Verify API key and model availability");
    }
  }
}

// 4. Test FAL (for images)
console.log("\n\n🎨 FAL.AI IMAGE GENERATION STATUS");
console.log("─────────────────────────────────────────────────────────────────────");

async function testFAL() {
  if (!hasFAL) {
    console.log("❌ FAL_API_KEY not configured");
    return;
  }

  try {
    const { fal } = require("@fal-ai/client");
    fal.config({ credentials: process.env.FAL_API_KEY });
    console.log("✅ FAL API key is configured");
    console.log("   (Images will use FAL/Flux for AI generation)");
  } catch (err) {
    console.log("❌ FAL configuration failed:", err.message);
  }
}

// Run all tests
async function runTests() {
  await testOpenRouter();
  await testGoogle();
  await testFAL();

  console.log("\n\n═════════════════════════════════════════════════════════════════════");
  console.log("RECOMMENDATIONS");
  console.log("═════════════════════════════════════════════════════════════════════\n");

  if (!hasOpenRouter && !hasGoogle) {
    console.log("❌ CRITICAL: No text generation API is configured!");
    console.log("   Configure at least one of: OPENROUTER_API_KEY or API_KEY1 (Google)\n");
  }

  if (hasOpenRouter && !hasGoogle) {
    console.log("⚠️  Using OpenRouter as primary text generation");
    console.log("   Make sure your account has credits: https://openrouter.ai/settings/credits\n");
  }

  if (hasGoogle && !hasOpenRouter) {
    console.log("⚠️  Using Google API as primary text generation");
    console.log("   Monitor free tier quota at: https://ai.google.dev/tutorials/python_quickstart\n");
  }

  if (hasFAL) {
    console.log("✅ FAL configured for AI image generation");
  } else {
    console.log("⚠️  FAL not configured - using fallback image services");
  }

  console.log("\n═════════════════════════════════════════════════════════════════════\n");
}

runTests().catch(console.error);
