/**
 * Reddit Integration Test Script
 * 
 * This script tests the Reddit integration endpoints
 * 
 * Prerequisites:
 * 1. Create a Reddit app at https://www.reddit.com/prefs/apps
 *    - Select "web app" as the app type
 *    - Set redirect URI to: http://localhost:5000/api/reddit/callback
 * 2. Get your client ID and secret
 * 3. Add credentials to .env:
 *    - REDDIT_CLIENT_ID
 *    - REDDIT_CLIENT_SECRET
 *    - REDDIT_REDIRECT_URI
 *    - REDDIT_USER_AGENT
 * 4. Start the server (npm start)
 * 5. Have a valid JWT token and presentation with slides
 * 6. Have a test subreddit (e.g., r/test or your own subreddit)
 * 
 * How to Connect:
 * 1. Run test #1 to initiate OAuth
 * 2. Visit the authorization URL in browser
 * 3. Authorize the app
 * 4. You'll be redirected back and connected
 * 5. Run remaining tests
 */

require("dotenv").config();
const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:5000/api/reddit";
const AUTH_TOKEN = "your_jwt_token_here"; // Get from login response
const PRESENTATION_ID = "your_presentation_id_here";
const SLIDE_INDEX = 0;
const TEST_SUBREDDIT = "test"; // Use r/test or your own subreddit

// Test cases
const tests = [
  {
    name: "1. Initiate OAuth (Get Authorization URL)",
    method: "GET",
    endpoint: "/auth",
    requiresAuth: true,
    body: null,
    description: "Get OAuth URL to authorize Reddit account",
  },
  {
    name: "2. Get Connection Status",
    method: "GET",
    endpoint: "/status",
    requiresAuth: true,
    body: null,
    description: "Check if Reddit account is connected",
  },
  {
    name: "3. Get Subreddit Info",
    method: "GET",
    endpoint: `/subreddit/${TEST_SUBREDDIT}`,
    requiresAuth: true,
    body: null,
    description: "Verify subreddit exists and get details",
  },
  {
    name: "4. Share Text Post",
    method: "POST",
    endpoint: "/share-text",
    requiresAuth: true,
    body: {
      subreddit: TEST_SUBREDDIT,
      title: "Test Post from Neuro Engine",
      text: "This is a test post created via the Neuro Engine Reddit integration! 🚀\n\nThis is a multi-line text post with **markdown** support.",
    },
    description: "Post text content to subreddit",
  },
  {
    name: "5. Share Single Slide (Image Post)",
    method: "POST",
    endpoint: "/share",
    requiresAuth: true,
    body: {
      presentationId: PRESENTATION_ID,
      slideIndex: SLIDE_INDEX,
      subreddit: TEST_SUBREDDIT,
      title: "Check out this amazing slide from Neuro Engine! 🎨",
    },
    description: "Share a presentation slide as image post",
  },
  {
    name: "6. Share Gallery Post (Multiple Slides)",
    method: "POST",
    endpoint: "/share-gallery",
    requiresAuth: true,
    body: {
      presentationId: PRESENTATION_ID,
      slideIndices: [0, 1, 2],
      subreddit: TEST_SUBREDDIT,
      title: "Gallery Post: Multiple Slides from Neuro Engine 📊",
    },
    description: "Share multiple slides as gallery post",
  },
  // {
  //   name: "7. Disconnect Reddit",
  //   method: "DELETE",
  //   endpoint: "/disconnect",
  //   requiresAuth: true,
  //   body: null,
  //   description: "Remove Reddit connection",
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
  console.log("🚀 Starting Reddit Integration Tests\n");
  console.log("=" .repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  console.log(`Test Subreddit: r/${TEST_SUBREDDIT}`);
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
        if (test.name.includes("Authorization URL")) {
          // Special handling for OAuth URL
          console.log("\n📝 Authorization URL:");
          console.log(`   ${response.data.authorizationUrl}`);
          console.log("\n⚠️  IMPORTANT: Visit this URL in your browser to authorize!");
          console.log("   After authorization, you'll be redirected back to the app.");
        } else if (test.name.includes("Status")) {
          // Special handling for status
          console.log("\n📊 Connection Status:");
          console.log(`   Connected: ${response.data.connected}`);
          if (response.data.connected && response.data.profile) {
            console.log(`   Username: u/${response.data.profile.username}`);
            console.log(`   Link Karma: ${response.data.profile.linkKarma}`);
            console.log(`   Comment Karma: ${response.data.profile.commentKarma}`);
            console.log(`   Token Expires: ${new Date(response.data.tokenExpiry).toLocaleString()}`);
            console.log(`   Token Valid: ${response.data.isTokenValid ? "✅" : "❌"}`);
          }
        } else if (test.name.includes("Subreddit Info")) {
          // Special handling for subreddit info
          const sub = response.data.subreddit;
          console.log("\n📊 Subreddit Details:");
          console.log(`   Name: r/${sub.display_name}`);
          console.log(`   Title: ${sub.title}`);
          console.log(`   Subscribers: ${sub.subscribers?.toLocaleString()}`);
          console.log(`   Type: ${sub.subreddit_type}`);
          console.log(`   Allows Images: ${sub.allow_images ? "✅" : "❌"}`);
          console.log(`   Allows Galleries: ${sub.allow_galleries ? "✅" : "❌"}`);
          console.log(`   Over18: ${sub.over18 ? "Yes" : "No"}`);
        } else {
          // Default response display
          console.log("\n📦 Response:");
          console.log(JSON.stringify(response.data, null, 2));
        }
      }
      
      // Wait between requests to avoid rate limiting
      if (test !== tests[tests.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(`❌ Failed`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || "Unknown error"}`);
        
        if (error.response.data?.details) {
          console.log(`   Details: ${error.response.data.details}`);
        }
        
        if (error.response.status === 401) {
          console.log("\n⚠️  Authentication failed. Please check:");
          console.log("   1. JWT token is valid and not expired");
          console.log("   2. Token is properly formatted in this script");
        } else if (error.response.status === 404) {
          console.log("\n⚠️  Not found. Please check:");
          console.log("   1. Server is running on port 5000");
          console.log("   2. Reddit routes are properly registered");
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
  console.log("   • Test #1 requires visiting the OAuth URL in browser");
  console.log("   • After authorization, check connection with Test #2");
  console.log("   • Make sure you have posts enabled in your test subreddit");
  console.log("   • Reddit has rate limits (60 requests/minute)");
  console.log("   • Uncomment Test #7 if you want to disconnect at the end");
}

// Check configuration before running
function checkConfig() {
  const missing = [];
  
  if (AUTH_TOKEN === "your_jwt_token_here") {
    missing.push("AUTH_TOKEN");
  }
  
  if (PRESENTATION_ID === "your_presentation_id_here") {
    missing.push("PRESENTATION_ID (needed for tests #5 and #6)");
  }
  
  if (!process.env.REDDIT_CLIENT_ID || process.env.REDDIT_CLIENT_ID === "your_reddit_client_id_here") {
    missing.push("REDDIT_CLIENT_ID in .env");
  }
  
  if (!process.env.REDDIT_CLIENT_SECRET || process.env.REDDIT_CLIENT_SECRET === "your_reddit_client_secret_here") {
    missing.push("REDDIT_CLIENT_SECRET in .env");
  }
  
  if (missing.length > 0) {
    console.log("⚠️  Missing Configuration:\n");
    missing.forEach(item => console.log(`   • ${item}`));
    console.log("\nPlease update the configuration and try again.");
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
