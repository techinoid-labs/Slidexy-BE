/**
 * Telegram Integration Test Script
 * 
 * This script tests the Telegram integration endpoints
 * 
 * Prerequisites:
 * 1. Create a bot via @BotFather on Telegram
 * 2. Get bot token and add to .env as TELEGRAM_BOT_TOKEN
 * 3. Start conversation with your bot
 * 4. Get your chat ID (see instructions below)
 * 5. Have a valid JWT token and presentation with slides
 * 
 * How to get your Chat ID:
 * 1. Start a conversation with your bot on Telegram
 * 2. Send any message to the bot
 * 3. Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
 * 4. Look for "chat":{"id":123456789} in the response
 * 5. Use that ID as your chatId
 */

require("dotenv").config();
const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:5000/api/telegram";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTMzMjBhZDhkMjNlZWEwY2E2ZGUyYjciLCJpYXQiOjE3NjUzOTEyODYsImV4cCI6MTc5Njk0ODg4Nn0.OInRxec653W_Imofc-_a1elPA5rzdbe4vkRgEEQfk6g"; // Get from login response
const CHAT_ID = "7102381099"; // Get from bot updates
const PRESENTATION_ID = "0b114d05-5614-4771-96ec-dc707a24ee0b";
const SLIDE_INDEX = 0;

// Test cases
const tests = [
  {
    name: "1. Get Bot Info",
    method: "GET",
    endpoint: "/bot-info",
    requiresAuth: true,
    body: null,
  },
  {
    name: "2. Connect Telegram",
    method: "POST",
    endpoint: "/connect",
    requiresAuth: true,
    body: {
      chatId: CHAT_ID,
    },
  },
  {
    name: "3. Get Connection Status",
    method: "GET",
    endpoint: "/status",
    requiresAuth: true,
    body: null,
  },
  {
    name: "4. Send Test Message",
    method: "POST",
    endpoint: "/send-message",
    requiresAuth: true,
    body: {
      message: "🧪 This is a test message from Neuro Engine!",
    },
  },
  {
    name: "5. Share Presentation Slide",
    method: "POST",
    endpoint: "/share",
    requiresAuth: true,
    body: {
      presentationId: PRESENTATION_ID,
      slideIndex: SLIDE_INDEX,
      message: "Check out this amazing slide! 🎨",
    },
  },
  {
    name: "6. Share Custom Content",
    method: "POST",
    endpoint: "/share-custom",
    requiresAuth: true,
    body: {
      imageUrl: "https://picsum.photos/800/600",
      message: "This is a custom image shared from Neuro Engine! 🚀",
    },
  },
//   {
//     name: "7. Disconnect Telegram",
//     method: "DELETE",
//     endpoint: "/disconnect",
//     requiresAuth: true,
//     body: null,
//   },
];

// Helper function to make API calls
async function makeRequest(test) {
  const config = {
    method: test.method.toLowerCase(),
    url: `${BASE_URL}${test.endpoint}`,
    headers: {},
  };

  if (test.requiresAuth) {
    config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }

  if (test.body) {
    config.data = test.body;
    config.headers["Content-Type"] = "application/json";
  }

  try {
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message,
    };
  }
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting Telegram Integration Tests\n");
  console.log("=" .repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  console.log(`Chat ID: ${CHAT_ID}`);
  console.log("=" .repeat(60));
  console.log();

  // Check configuration
  if (AUTH_TOKEN === "YOUR_JWT_TOKEN_HERE") {
    console.error("❌ Please set AUTH_TOKEN in the script");
    return;
  }

  if (CHAT_ID === "YOUR_TELEGRAM_CHAT_ID_HERE") {
    console.error("❌ Please set CHAT_ID in the script");
    console.log("\n💡 How to get Chat ID:");
    console.log("1. Start conversation with your bot");
    console.log("2. Send a message to the bot");
    console.log("3. Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates");
    console.log("4. Find your chat ID in the response");
    return;
  }

  let passCount = 0;
  let failCount = 0;

  for (const test of tests) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log(`   Method: ${test.method} ${test.endpoint}`);
    
    if (test.body) {
      console.log(`   Body:`, JSON.stringify(test.body, null, 2));
    }

    const result = await makeRequest(test);

    if (result.success) {
      console.log(`   ✅ PASSED (Status: ${result.status})`);
      console.log(`   Response:`, JSON.stringify(result.data, null, 2));
      passCount++;
    } else {
      console.log(`   ❌ FAILED (Status: ${result.status})`);
      console.log(`   Error:`, JSON.stringify(result.error, null, 2));
      failCount++;
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   Total: ${tests.length}`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   Success Rate: ${((passCount / tests.length) * 100).toFixed(1)}%`);
  console.log("\n" + "=".repeat(60));
}

// Run the tests
runTests().catch(console.error);
