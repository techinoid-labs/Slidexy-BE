// Create a new file: services/fallbackImageGeneration.js
const axios = require('axios');
const sharp = require('sharp');

/**
 * Fallback image generation when Gemini quota is exhausted
 * Uses multiple free/paid services as backup
 */

// Option 1: Pollinations.ai (Free, no API key needed)
async function generateWithPollinations(prompt) {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true&enhance=true`;
    
    console.log('Generating image with Pollinations.ai...');
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 second timeout
    });
    
    // Convert to base64
    const base64Image = Buffer.from(response.data).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Pollinations.ai generation failed:', error.message);
    throw error;
  }
}

// Option 2: Unsplash (Free stock photos - not AI generated but high quality)
async function generateWithUnsplash(keywords) {
  try {
    // Extract key terms from prompt for search
    const searchTerms = keywords.split(' ')
      .filter(word => word.length > 4)
      .slice(0, 3)
      .join(',');
    
    const url = `https://source.unsplash.com/1920x1080/?${searchTerms}`;
    
    console.log('Fetching image from Unsplash...');
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    
    const base64Image = Buffer.from(response.data).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Unsplash fetch failed:', error.message);
    throw error;
  }
}

// Option 3: Hugging Face Inference API (Free tier available)
async function generateWithHuggingFace(prompt) {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }
  
  try {
    console.log('Generating image with Hugging Face...');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        inputs: prompt,
        parameters: {
          width: 1024,
          height: 1024,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );
    
    // Resize to 1920x1080
    const resizedBuffer = await sharp(response.data)
      .resize(1920, 1080, { fit: 'cover' })
      .toBuffer();
    
    const base64Image = resizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Hugging Face generation failed:', error.message);
    throw error;
  }
}

// Option 4: Replicate API (Paid but affordable)
async function generateWithReplicate(prompt) {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
  
  if (!REPLICATE_API_KEY) {
    throw new Error('Replicate API key not configured');
  }
  
  try {
    console.log('Generating image with Replicate...');
    
    // Start prediction
    const startResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
          prompt: prompt,
          width: 1920,
          height: 1080,
        }
      },
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    const predictionId = startResponse.data.id;
    
    // Poll for completion
    let result;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          }
        }
      );
      
      if (statusResponse.data.status === 'succeeded') {
        result = statusResponse.data.output[0];
        break;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Replicate prediction failed');
      }
      
      attempts++;
    }
    
    if (!result) {
      throw new Error('Replicate generation timeout');
    }
    
    // Download and convert to base64
    const imageResponse = await axios.get(result, {
      responseType: 'arraybuffer'
    });
    
    const base64Image = Buffer.from(imageResponse.data).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Replicate generation failed:', error.message);
    throw error;
  }
}

// Main fallback function with cascade
async function generateFallbackImage(prompt, preferredService = 'pollinations') {
  const services = {
    'pollinations': generateWithPollinations,
    'unsplash': generateWithUnsplash,
    'huggingface': generateWithHuggingFace,
    'replicate': generateWithReplicate,
  };
  
  // Try preferred service first
  if (services[preferredService]) {
    try {
      return await services[preferredService](prompt);
    } catch (error) {
      console.warn(`Preferred service ${preferredService} failed, trying alternatives...`);
    }
  }
  
  // Try all services in order
  const serviceOrder = ['pollinations', 'unsplash', 'huggingface', 'replicate'];
  
  for (const serviceName of serviceOrder) {
    if (serviceName === preferredService) continue; // Already tried
    
    try {
      console.log(`Attempting ${serviceName}...`);
      return await services[serviceName](prompt);
    } catch (error) {
      console.warn(`${serviceName} failed: ${error.message}`);
    }
  }
  
  throw new Error('All fallback image services failed');
}

module.exports = {
  generateFallbackImage,
  generateWithPollinations,
  generateWithUnsplash,
  generateWithHuggingFace,
  generateWithReplicate,
};