/**
 * LinkedIn Integration Test Script
 * 
 * This script helps you test the LinkedIn integration endpoints
 * without needing a frontend.
 * 
 * Usage:
 * 1. Update the USER_TOKEN with a valid JWT from your system
 * 2. Run: node test-linkedin.js
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:5000/api';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTMxOWEzYTE1Mjk5NWY3ZjY2Y2I4MGYiLCJpYXQiOjE3NjQ4NTg0MjYsImV4cCI6MTc5NjQxNjAyNn0.cdGJkYf3m52FlxrmCmXQX8ph50DAKcXQbfIApbFFJZY'; // Replace with actual JWT token

// Test datas
const testData = {
  presentationId: '64471642-ebfe-454b-82f1-abeb50637738', // Replace with actual presentation ID
  slideIndex: 0,
  message: 'Testing LinkedIn integration from Neuro Engine! 🚀'
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testGetAuthUrl() {
  console.log('\n🔍 Test 1: Get LinkedIn Auth URL');
  console.log('─'.repeat(50));
  
  const result = await apiCall('GET', '/linkedin/auth');
  
  if (result.success) {
    console.log('✅ Success!');
    console.log('Auth URL:', result.data.authUrl);
    console.log('\n📝 Next step: Visit this URL in your browser to authorize');
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

async function testGetStatus() {
  console.log('\n🔍 Test 2: Check LinkedIn Connection Status');
  console.log('─'.repeat(50));
  
  const result = await apiCall('GET', '/linkedin/status');
  
  if (result.success) {
    console.log('✅ Success!');
    console.log('Connected:', result.data.connected);
    console.log('Token Valid:', result.data.tokenValid);
    if (result.data.profile) {
      console.log('Profile:', result.data.profile);
    }
    return result.data.connected && result.data.tokenValid;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

async function testShare() {
  console.log('\n🔍 Test 3: Share to LinkedIn');
  console.log('─'.repeat(50));
  
  const result = await apiCall('POST', '/linkedin/share', testData);
  
  if (result.success) {
    console.log('✅ Success!');
    console.log('Post ID:', result.data.postId);
    console.log('Share URL:', result.data.shareUrl);
    console.log('\n📝 Visit the URL above to see your post on LinkedIn!');
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

async function testShareCustom() {
  console.log('\n🔍 Test 4: Share Custom Content');
  console.log('─'.repeat(50));
  
  const customData = {
    imageUrl: 'https://placehold.co/1200x630/6c5ce7/ffffff?text=Neuro+Engine',
    message: 'Testing custom content sharing! 🎨'
  };
  
  const result = await apiCall('POST', '/linkedin/share-custom', customData);
  
  if (result.success) {
    console.log('✅ Success!');
    console.log('Post ID:', result.data.postId);
    console.log('Share URL:', result.data.shareUrl);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

async function testDisconnect() {
  console.log('\n🔍 Test 5: Disconnect LinkedIn');
  console.log('─'.repeat(50));
  
  const result = await apiCall('DELETE', '/linkedin/disconnect');
  
  if (result.success) {
    console.log('✅ Success!');
    console.log(result.data.message);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   LinkedIn Integration Test Suite            ║');
  console.log('╚═══════════════════════════════════════════════╝');
  
  // Validate configuration
  if (USER_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n❌ Error: Please update USER_TOKEN in the script');
    console.log('   Get a valid JWT token by logging in to your app');
    return;
  }
  
  // Test 1: Get auth URL
  await testGetAuthUrl();
  
  // Test 2: Check status
  const isConnected = await testGetStatus();
  
  if (!isConnected) {
    console.log('\n⚠️  LinkedIn not connected yet');
    console.log('   Please complete the OAuth flow first:');
    console.log('   1. Visit the auth URL from Test 1');
    console.log('   2. Authorize on LinkedIn');
    console.log('   3. Run this script again');
    return;
  }
  
  // Ask user if they want to proceed with sharing tests
  console.log('\n⚠️  Warning: The following tests will create real LinkedIn posts');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 3: Share presentation slide
  console.log('\n📤 Proceeding with share tests...');
  
  // Only run share tests if presentation ID is provided
  if (testData.presentationId !== 'test-presentation-id') {
    await testShare();
  } else {
    console.log('\n⚠️  Skipping Test 3: Update presentationId in script to test');
  }
  
  // Test 4: Share custom content (using placeholder image)
  await testShareCustom();
  
  // Test 5: Disconnect (optional - uncomment to test)
  // console.log('\n⚠️  Skipping disconnect test (would remove LinkedIn connection)');
  // await testDisconnect();
  
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('🎉 Test suite completed!');
  console.log('═'.repeat(50));
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
