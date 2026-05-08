#!/usr/bin/env node
/**
 * Check available Gemini models on OpenRouter
 */

require("dotenv").config();
const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found");
  process.exit(1);
}

async function listModels() {
  try {
    console.log("🔄 Fetching available models from OpenRouter...\n");
    
    const response = await axios.get("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      timeout: 10000,
    });

    const models = response.data.data || [];
    
    // Filter for Google models
    const googleModels = models.filter(m => 
      m.id.toLowerCase().includes("gemini") && m.id.toLowerCase().includes("google")
    );

    console.log("📊 Available Google Gemini Models on OpenRouter:\n");
    googleModels.forEach(model => {
      console.log(`  • ${model.id}`);
      if (model.description) console.log(`    Description: ${model.description}`);
      if (model.pricing?.prompt) console.log(`    Prompt price: $${model.pricing.prompt}/1M tokens`);
      console.log();
    });

    if (googleModels.length === 0) {
      console.log("❌ No Gemini models found");
      console.log("\n🔍 Checking all available models (first 20):\n");
      models.slice(0, 20).forEach(m => {
        console.log(`  • ${m.id}`);
      });
    }
  } catch (err) {
    console.error("❌ Error fetching models:", err.message);
  }
}

listModels();
