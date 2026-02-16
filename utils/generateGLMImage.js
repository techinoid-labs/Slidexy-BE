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

    // GLM returns image URL in the response data
    const imageUrl = response.data.data[0].url;
    if (!imageUrl) {
      throw new Error('GLM Image API returned image but no URL');
    }

    console.log('✅ GLM Image generation successful');

    // Download the image from the provided URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // Resize to 1920x1080 for presentation consistency
    const resizedBuffer = await sharp(imageResponse.data)
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
