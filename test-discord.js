/**
 * Discord Integration Test Script
 * 
 * This script tests the Discord integration endpoints
 * 
 * Prerequisites:
 * 1. Create Discord application at https://discord.com/developers/applications
 * 2. Go to "Bot" section and create a bot
 * 3. Copy bot token and add to .env as DISCORD_BOT_TOKEN
 * 4. Generate OAuth2 URL to invite bot to your server:
 *    - Go to OAuth2 → URL Generator
 *    - Select "bot" scope
 *    - Select permissions: Send Messages, Attach Files, Embed Links, Read Message History
 *    - Copy generated URL and visit it to add bot to your server
 * 5. Enable Developer Mode in Discord: User Settings → Advanced → Developer Mode
 * 6. Right-click on a text channel → Copy ID
 * 7. Start the server (npm start)
 * 8. Have a valid JWT token and presentation with slides
 * 
 * Bot Invite URL:
https://discord.com/oauth2/authorize?client_id=1449027773770371154&permissions=116736&integration_type=0&scope=bot
 * 
 * Permissions Value: 52224
 * - Send Messages (2048)
 * - Attach Files (32768)
 * - Embed Links (16384)
 * - Read Message History (1024)
 */

require("dotenv").config();
const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:5000/api/discord";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTMzMjBhZDhkMjNlZWEwY2E2ZGUyYjciLCJpYXQiOjE3NjUzOTEyODYsImV4cCI6MTc5Njk0ODg4Nn0.OInRxec653W_Imofc-_a1elPA5rzdbe4vkRgEEQfk6g"; // Get from login response
const CHANNEL_ID = "1449050053414093025"; // Right-click channel → Copy ID
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
    description: "Verify Discord bot token is valid",
  },
  {
    name: "2. Connect Discord Channel",
    method: "POST",
    endpoint: "/connect",
    requiresAuth: true,
    body: {
      channelId: CHANNEL_ID,
    },
    description: "Connect to Discord channel",
  },
  {
    name: "3. Get Connection Status",
    method: "GET",
    endpoint: "/status",
    requiresAuth: true,
    body: null,
    description: "Check if Discord channel is connected",
  },
  {
    name: "4. Send Test Message",
    method: "POST",
    endpoint: "/send-message",
    requiresAuth: true,
    body: {
      message: "🧪 This is a test message from Neuro Engine!",
    },
    description: "Send a simple text message",
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
    description: "Share a single slide with embed",
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
    description: "Share custom image URL",
  },
  {
    name: "7. Share Multiple Slides",
    method: "POST",
    endpoint: "/share-multiple",
    requiresAuth: true,
    body: {
      presentationId: PRESENTATION_ID,
      slideIndices: [0, 1, 2],
      message: "Here are multiple slides from my presentation! 📊",
    },
    description: "Share multiple slides at once",
  },
  // {
  //   name: "8. Disconnect Discord",
  //   method: "DELETE",
  //   endpoint: "/disconnect",
  //   requiresAuth: true,
  //   body: null,
  //   description: "Remove Discord connection",
  // },
];

// Helper function to make API calls
async function makeRequest(test) {
  const config = {
    method: test.method.toLowerCase(),
    url: `${BASE_URL}${test.endpoint}`,
    headers: {},
  };

  if (test.requiresAuth) {
    config.headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  }

  if (test.body) {
    config.data = test.body;
    config.headers["Content-Type"] = "application/json";
  }

  return axios(config);
}

// Run tests
async function runTests() {
  console.log("🚀 Starting Discord Integration Tests\n");
  console.log("=" .repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  console.log(`Channel ID: ${CHANNEL_ID}`);
  console.log("=" .repeat(80));
  console.log();

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   ${test.description || ""}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    console.log("-" .repeat(80));

    try {
      const response = await makeRequest(test);
      
      console.log(`✅ Success (${response.status})`);
      
      // Pretty print response
      if (response.data) {
        if (test.name.includes("Bot Info")) {
          // Special handling for bot info
          console.log("\n🤖 Bot Information:");
          const bot = response.data.bot;
          console.log(`   Username: ${bot.username}#${bot.discriminator}`);
          console.log(`   ID: ${bot.id}`);
          console.log(`   Is Bot: ${bot.bot ? "✅" : "❌"}`);
        } else if (test.name.includes("Status")) {
          // Special handling for status
          console.log("\n📊 Connection Status:");
          console.log(`   Connected: ${response.data.connected}`);
          if (response.data.connected && response.data.profile) {
            console.log(`   Channel: #${response.data.profile.channelName}`);
            console.log(`   Server: ${response.data.profile.guildName}`);
            console.log(`   Connected At: ${new Date(response.data.connectedAt).toLocaleString()}`);
          }
        } else if (test.name.includes("Connect")) {
          // Special handling for connection
          console.log("\n✅ Connected Successfully!");
          if (response.data.channel) {
            console.log(`   Channel: #${response.data.channel.name}`);
            console.log(`   Server: ${response.data.channel.guildName}`);
            console.log("\n💡 Check your Discord channel for a confirmation message!");
          }
        } else {
          // Default response display
          console.log("\n📦 Response:");
          console.log(JSON.stringify(response.data, null, 2));
        }
      }
      
      // Wait between requests to avoid rate limits
      if (test !== tests[tests.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(`❌ Failed`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || "Unknown error"}`);
        
        if (error.response.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
        
        if (error.response.data?.detail) {
          console.log(`   Details: ${error.response.data.detail}`);
        }
        
        if (error.response.status === 401) {
          console.log("\n⚠️  Authentication failed. Please check:");
          console.log("   1. JWT token is valid and not expired");
          console.log("   2. Token is properly formatted in this script");
        } else if (error.response.status === 404) {
          console.log("\n⚠️  Not found. Please check:");
          console.log("   1. Server is running on port 5000");
          console.log("   2. Discord routes are properly registered");
        } else if (error.response.status === 400 && error.response.data?.error?.includes("channel")) {
          console.log("\n⚠️  Channel access issue. Please ensure:");
          console.log("   1. Bot is invited to your Discord server");
          console.log("   2. Bot has access to the channel");
          console.log("   3. Channel ID is correct (enable Developer Mode → right-click → Copy ID)");
        }
      } else if (error.request) {
        console.log("   No response received from server");
        console.log("   Is the server running? (npm start)");
      } else {
        console.log(`   ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✨ Test run completed!");
  console.log("=".repeat(80));
  console.log("\n📝 Notes:");
  console.log("   • Make sure the bot is invited to your Discord server");
  console.log("   • Bot needs Send Messages, Attach Files, and Embed Links permissions");
  console.log("   • Enable Developer Mode to copy channel IDs");
  console.log("   • Discord has rate limits (5 requests per channel per second)");
  console.log("   • Uncomment Test #8 if you want to disconnect at the end");
  console.log("\n💡 How to get Channel ID:");
  console.log("   1. Enable Developer Mode: User Settings → Advanced → Developer Mode");
  console.log("   2. Right-click on channel → Copy ID");
}

// Check configuration before running
function checkConfig() {
  const missing = [];
  
  if (AUTH_TOKEN === "your_jwt_token_here") {
    missing.push("AUTH_TOKEN");
  }
  
  if (CHANNEL_ID === "your_discord_channel_id_here") {
    missing.push("CHANNEL_ID");
  }
  
  if (PRESENTATION_ID === "your_presentation_id_here") {
    missing.push("PRESENTATION_ID (needed for tests #5 and #7)");
  }
  
  if (!process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_BOT_TOKEN === "your_discord_bot_token_here") {
    missing.push("DISCORD_BOT_TOKEN in .env");
  }
  
  if (missing.length > 0) {
    console.log("⚠️  Missing Configuration:\n");
    missing.forEach(item => console.log(`   • ${item}`));
    console.log("\nPlease update the configuration and try again.");
    console.log("\n💡 Setup Steps:");
    console.log("   1. Create Discord app at https://discord.com/developers/applications");
    console.log("   2. Go to Bot section and copy bot token");
    console.log("   3. Add token to .env as DISCORD_BOT_TOKEN");
    console.log("   4. Generate OAuth2 URL with bot scope and permissions");
    console.log("   5. Invite bot to your server using the URL");
    console.log("   6. Enable Developer Mode in Discord settings");
    console.log("   7. Right-click channel → Copy ID");
    return false;
  }
  
  return true;
}

// Main execution
if (checkConfig()) {
  runTests().catch((error) => {
    console.error("\n❌ Unexpected error:", error.message);
    process.exit(1);
  });
}
