// utils/runwareImageGen.js
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY || "fjTujpofzwb8tYDkDytlHXuHEuPsB2Zx";
const RUNWARE_WS_URL = "wss://ws-api.runware.ai/v1";
const { v4: uuidv4 } = require('uuid');
/**
 * Generate image using Runware API via WebSocket
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Image URL
 */
async function generateImage(prompt, options = {}) {
    if (typeof prompt !== 'string' || !prompt || prompt.trim().length < 2) {
        console.error('INVALID PROMPT RECEIVED:', typeof prompt, prompt);
        prompt = "Professional presentation background, modern abstract design, clean composition, no text, high quality";
    }
    prompt = prompt.trim();
    if (prompt.length > 3000) {
        prompt = prompt.substring(0, 3000);
    }
    return new Promise((resolve, reject) => {
        const WebSocket = require('ws');
        const ws = new WebSocket(RUNWARE_WS_URL);
        const taskUUID = uuidv4();
        let isAuthenticated = false;
        let requestSent = false;

        const timeout = setTimeout(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                ws.close();
                reject(new Error("Runware connection timeout"));
                return;
            }
            ws.close();
            reject(new Error("Runware API timeout - no response after 90 seconds"));
        }, 90000); // Increased to 90 seconds

        ws.on('open', () => {
            console.log('🔌 Runware WebSocket connected');
            // Send authentication
            ws.send(JSON.stringify([{
                taskType: "authentication",
                apiKey: RUNWARE_API_KEY
            }]));
        });

        ws.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                console.log('📥 Runware response:', JSON.stringify(response).substring(0, 300));

                if (!response.data || !Array.isArray(response.data)) {
                    console.warn('Unexpected response format:', response);
                    return;
                }

                // Handle authentication success
                if (response.data[0]?.taskType === "authentication") {
                    isAuthenticated = true;
                    console.log('Authenticated with Runware');

                    // Send image generation request after authentication
                    if (!requestSent) {
                        requestSent = true;

                        const imagePayload = {
                            taskType: "imageInference",
                            taskUUID: taskUUID,
                            positivePrompt: prompt,

                            // Required fields
                            height: options.height || 1344,
                            width: options.width || 768,
                            model: options.model || "runware:100@1",

                            // Optional fields with defaults
                            negativePrompt: options.negativePrompt || "text, watermark, signature, blurry, low quality",
                            numberResults: options.numberResults || 1,
                            outputType: options.outputType || "URL",
                            outputFormat: options.outputFormat || "PNG",

                            // Advanced settings
                            steps: options.steps || 25,
                            CFGScale: options.CFGScale || 7,
                            seed: options.seed || Math.floor(Math.random() * 1000000),
                            scheduler: options.scheduler || "default",

                            // Safety
                            checkNSFW: options.checkNSFW !== undefined ? options.checkNSFW : true,
                        };

                        console.log('Sending image generation request:', {
                            taskUUID,
                            model: imagePayload.model,
                            size: `${imagePayload.width}x${imagePayload.height}`
                        });

                        ws.send(JSON.stringify([imagePayload]));
                    }
                    return;
                }

                // Handle image generation response
                if (response.data[0]?.taskType === "imageInference") {
                    const result = response.data[0];

                    console.log('Image inference response:', {
                        taskUUID: result.taskUUID,
                        hasImageURL: !!result.imageURL,
                        hasImageBase64: !!result.imageBase64,
                        error: result.error
                    });

                    if (result.error) {
                        clearTimeout(timeout);
                        ws.close();
                        reject(new Error(`Runware error: ${JSON.stringify(result.error)}`));
                        return;
                    }

                    // Check for image URL first
                    if (result.imageURL) {
                        clearTimeout(timeout);
                        ws.close();
                        console.log('Runware image generated successfully (URL)');
                        resolve(result.imageURL);
                        return;
                    }

                    // Check for base64
                    if (result.imageBase64) {
                        clearTimeout(timeout);
                        ws.close();
                        const imageUrl = `data:image/png;base64,${result.imageBase64}`;
                        console.log('Runware image generated successfully (Base64)');
                        resolve(imageUrl);
                        return;
                    }

                    // If we got taskType but no image data, might be processing
                    if (result.taskUUID === taskUUID) {
                        console.log('Image generation in progress...');
                    }
                }

                // Handle error responses
                if (response.error || response.data[0]?.error) {
                    clearTimeout(timeout);
                    ws.close();
                    const errorMsg = response.error || response.data[0]?.error;
                    reject(new Error(`Runware API error: ${JSON.stringify(errorMsg)}`));
                    return;
                }

            } catch (err) {
                console.error('Error parsing Runware response:', err);
                console.error('Raw data:', data.toString().substring(0, 500));
            }
        });

        ws.on('error', (err) => {
            clearTimeout(timeout);
            console.error('Runware WebSocket error:', err.message);
            reject(new Error(`Runware WebSocket error: ${err.message}`));
        });

        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔌 Runware WebSocket closed (code: ${code}, reason: ${reason || 'none'})`);

            // If closed before getting image, reject
            if (!isAuthenticated) {
                reject(new Error('Connection closed before authentication'));
            } else if (!requestSent) {
                reject(new Error('Connection closed before sending request'));
            }
        });
    });
}

/**
 * Generate image with retry logic
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Generation options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} - Image URL
 */
async function generateImageWithRetry(prompt, options = {}, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Runware attempt ${attempt + 1}/${maxRetries + 1}`);

            // Add variation to prompt on retries
            let modifiedPrompt = prompt;
            if (attempt > 0) {
                const variations = [
                    "alternative perspective",
                    "different lighting angle",
                    "varied composition approach",
                    "fresh visual interpretation"
                ];
                const variation = variations[attempt % variations.length];
                modifiedPrompt = `${prompt}\n\nIMPORTANT: Create with ${variation}.`;
                console.log(`Using variation: ${variation}`);
            }

            const imageUrl = await generateImage(modifiedPrompt, {
                ...options,
                seed: options.seed || Math.floor(Math.random() * 1000000) // New seed on retry
            });

            console.log(`Image generated successfully on attempt ${attempt + 1}`);
            return imageUrl;

        } catch (err) {
            lastError = err;
            console.error(`Runware attempt ${attempt + 1} failed:`, err.message);

            if (attempt < maxRetries) {
                const delay = 3000 * (attempt + 1); // Increased delay
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Test connection to Runware API
 */
async function testConnection() {
    try {
        console.log('Testing Runware connection...');
        const testUrl = await generateImage("a simple red circle on white background", {
            width: 1344,
            height: 768,
            steps: 20,
        });
        console.log('Runware connection test successful:', testUrl);
        return true;
    } catch (error) {
        console.error('Runware connection test failed:', error.message);
        return false;
    }
}

module.exports = {
    generateImage,
    generateImageWithRetry,
    testConnection
};