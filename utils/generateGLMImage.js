/**
 * GLM Image Generation Utility
 * Uses Zhipu API for AI image generation as a fallback
 * 
 * Documentation: https://open.bigmodel.cn/dev/api#image_model
 * API Endpoint: https://api.z.ai/api/paas/v4/images/generations
 */

const axios = require('axios');
const sharp = require('sharp');

const GLM_API_TOKEN = process.env.GLM_API_TOKEN;
const GLM_BASE_URL = 'https://api.z.ai/api/paas/v4/images/generations';

if (!GLM_API_TOKEN) {
  console.warn('⚠️  GLM_API_TOKEN not configured in environment - GLM Image fallback will not be available');
}

/**
 * Generate image using GLM Image API
 * @param {string} prompt - Image generation prompt
 * @param {Object} options - Generation options
 * @param {string} options.size - Image size (default: 1280x1280)
 * @param {number} options.timeout - Request timeout in ms (default: 120000)
 * @returns {Promise<string>} Base64 encoded image data with data URI
 */
async function generateWithGLMImage(prompt, options = {}) {
  const { size = '1280x1280', timeout = 120000 } = options;

  if (!GLM_API_TOKEN) {
    throw new Error('GLM_API_TOKEN is not configured');
  }

  try {
    console.log('🎨 Generating image with GLM Image API...');
    console.log(`   Prompt: ${prompt.substring(0, 80)}...`);
    console.log(`   Size: ${size}`);

    const response = await axios.post(
      GLM_BASE_URL,
      {
        model: 'glm-image',
        prompt: prompt,
        size: size,
      },
      {
        headers: {
          'Authorization': `Bearer ${GLM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: timeout,
      }
    );

    // Check if response contains image data
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      throw new Error('GLM Image API returned no image data');
    }

    console.log('✅ GLM Image generation successful');

    // GLM returns image URL in the response data
    const imageItem = response.data.data[0];
    let imageBuffer;

    // Try to get image buffer from response
    if (imageItem.url) {
      // Download from URL with retry logic
      console.log('   Downloading image from URL...');
      
      let downloadSuccess = false;
      let lastError = null;
      
      // Retry up to 3 times with exponential backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const imageResponse = await axios.get(imageItem.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'image/*',
              'Accept-Encoding': 'gzip, deflate',
            },
            maxRedirects: 5,
          });
          imageBuffer = imageResponse.data;
          console.log('   ✅ Image downloaded successfully');
          downloadSuccess = true;
          break;
        } catch (downloadError) {
          lastError = downloadError;
          const status = downloadError.response?.status;
          const isRetryable = status === 404 || status === 503 || downloadError.code === 'ECONNABORTED';
          
          if (isRetryable && attempt < 3) {
            // Wait before retry with exponential backoff
            const waitTime = 500 * Math.pow(2, attempt - 1);
            console.log(`   ⚠️  Attempt ${attempt} failed (${status || 'timeout'}), retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (attempt === 3) {
            console.warn('   ⚠️  All download attempts failed');
          }
        }
      }
      
      if (!downloadSuccess) {
        console.warn('   Checking for b64_json fallback...');
        
        // Fallback: Check if b64_json is in response
        if (imageItem.b64_json) {
          console.log('   Using base64 data from response');
          imageBuffer = Buffer.from(imageItem.b64_json, 'base64');
          downloadSuccess = true;
        } else {
          throw new Error(`Failed to download image after 3 attempts: ${lastError?.message}`);
        }
      }
    } else if (imageItem.b64_json) {
      // Use base64 directly if URL not available
      console.log('   Using base64 data from response');
      imageBuffer = Buffer.from(imageItem.b64_json, 'base64');
    } else {
      throw new Error('GLM Image API returned no URL or base64 data');
    }

    // Resize to 1920x1080 for presentation consistency
    const resizedBuffer = await sharp(imageBuffer)
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();

    // Convert to base64 with data URI
    const base64Image = resizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('❌ GLM Image generation failed:', error.message || error);
    throw error;
  }
}

/**
 * Validate GLM API token connectivity
 * @returns {Promise<Object>} Validation result
 */
async function validateGLMConnection() {
  if (!GLM_API_TOKEN) {
    return {
      valid: false,
      message: 'GLM_API_TOKEN not configured',
    };
  }

  try {
    // Try a simple request to validate token
    const response = await axios.post(
      GLM_BASE_URL,
      {
        model: 'glm-image',
        prompt: 'test',
        size: '256x256',
      },
      {
        headers: {
          'Authorization': `Bearer ${GLM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return {
      valid: true,
      message: 'GLM API connection successful',
    };
  } catch (error) {
    return {
      valid: false,
      message: `GLM API validation failed: ${error.message}`,
    };
  }
}

module.exports = {
  generateWithGLMImage,
  validateGLMConnection,
};
