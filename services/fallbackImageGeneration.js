/**
 * The image generation fallback chain.
 *
 * Every provider here returns a base64 data URL, because that is what
 * convertToWebP in services/generateImage.js consumes. A provider that
 * hands back an http URL has to download it first.
 *
 * WHAT CHANGED AND WHY
 *
 * This chain had five entries and all five were dead:
 *
 *   GLM           no GLM_API_TOKEN in the environment
 *   Pollinations  free tier is one image every 45 seconds per IP, so a
 *                 seven slide deck spent five minutes collecting 402s
 *   Unsplash      source.unsplash.com was retired and answers 503
 *   HuggingFace   api-inference.huggingface.co was replaced by
 *                 router.huggingface.co, and no key is set anyway
 *   Replicate     no REPLICATE_API_KEY, and it is paid
 *
 * The primary generator in front of this chain, fal.ai Flux, answers
 * 403 "User is locked. Reason: TOP_UP." Runware, whose key is in .env
 * but which nothing called, authenticates and then reports
 * insufficientCredits. So every path to a generated image was closed and
 * decks silently fell through to Pexels stock photos.
 *
 * Cloudflare Workers AI now leads the chain. It has a real free tier
 * (10,000 Neurons a day, about 170 Flux Schnell images) and the model is
 * Apache 2.0, so the output can ship commercially.
 *
 * Unsplash is gone from the chain rather than repaired. The repair is
 * easy, utils/unsplashImageFetcher.js already uses the live API key, but
 * this chain's contract is a bare image string with nowhere to carry the
 * photographer credit that the Unsplash licence requires. Stock photos
 * belong in getPexelsFallbackImage, which does return attribution.
 *
 * ORDER
 *
 * Generated images first, cheapest working option at the front, then the
 * keyed paid services, then Pollinations last as a slow free backstop.
 * A provider with no credentials is skipped quietly; a provider that is
 * configured and then fails is logged, because that is a real fault.
 */

const axios = require('axios');
const sharp = require('sharp');
const { generateWithGLMImage } = require('../utils/generateGLMImage');
const { generateCloudflareImage, isConfigured: cloudflareConfigured } = require('../utils/cloudflareImage');
const { generateImage: generateRunwareImage } = require('../utils/runwareImageGen');

// Cloudflare Workers AI, FLUX.1 [schnell]. Free tier, Apache 2.0 output.
async function generateWithCloudflare(prompt) {
  console.log('Generating image with Cloudflare Workers AI (Flux Schnell)...');
  return await generateCloudflareImage(prompt);
}

// Runware. Key is present but the balance is empty; this starts working
// the moment the wallet is topped up, so it stays in the chain.
async function generateWithRunware(prompt) {
  console.log('Generating image with Runware...');
  const result = await generateRunwareImage(prompt, {
    width: 1344,
    height: 768,
    steps: 20,
    outputType: 'base64Data',
  });

  if (typeof result === 'string' && result.startsWith('data:')) return result;

  // Runware handed back a URL rather than base64, so fetch the bytes.
  const response = await axios.get(result, { responseType: 'arraybuffer', timeout: 30000 });
  return `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
}

// GLM Image (Zhipu). Paid, highest quality of the keyed options.
async function generateWithGLM(prompt) {
  console.log('Generating image with GLM Image API...');
  return await generateWithGLMImage(prompt, {
    size: '1280x1280',
    timeout: 120000,
  });
}

// Hugging Face. api-inference.huggingface.co is retired; the inference
// providers router replaced it. Untested here because no key is set.
async function generateWithHuggingFace(prompt) {
  console.log('Generating image with Hugging Face...');

  const response = await axios.post(
    'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
    {
      inputs: prompt,
      parameters: { width: 1024, height: 1024 },
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      timeout: 60000,
    }
  );

  const resizedBuffer = await sharp(response.data)
    .resize(1920, 1080, { fit: 'cover' })
    .toBuffer();

  return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
}

// Replicate. Paid, reliable, slow because it polls.
async function generateWithReplicate(prompt) {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
  console.log('Generating image with Replicate...');

  const startResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: { prompt, width: 1920, height: 1088 },
    },
    {
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const predictionId = startResponse.data.id;

  let result;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      { headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` } }
    );

    if (statusResponse.data.status === 'succeeded') {
      result = statusResponse.data.output[0];
      break;
    }
    if (statusResponse.data.status === 'failed') {
      throw new Error('Replicate prediction failed');
    }
  }

  if (!result) throw new Error('Replicate generation timeout');

  const imageResponse = await axios.get(result, { responseType: 'arraybuffer' });
  return `data:image/jpeg;base64,${Buffer.from(imageResponse.data).toString('base64')}`;
}

/**
 * Pollinations. Free and keyless, but one image every 45 seconds per IP
 * and a 402 if you ask sooner. Generating a deck in a loop trips that on
 * slide two, so the gate below skips rather than waiting: a fast skip
 * lets the deck fall through to Pexels, a 60 second timeout does not.
 */
const POLLINATIONS_COOLDOWN_MS = 45000;
let pollinationsBusyUntil = 0;

async function generateWithPollinations(prompt) {
  const now = Date.now();
  if (now < pollinationsBusyUntil) {
    const seconds = Math.ceil((pollinationsBusyUntil - now) / 1000);
    throw new Error(`Pollinations is in its ${seconds}s free-tier cooldown`);
  }

  console.log('Generating image with Pollinations.ai...');
  pollinationsBusyUntil = now + POLLINATIONS_COOLDOWN_MS;

  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true&enhance=true`;

  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
  return `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
}

/**
 * The chain, in the order it is tried.
 *
 * `configured` separates "we never set this up" from "this broke", so
 * the logs say which one happened.
 */
const PROVIDERS = [
  {
    name: 'cloudflare',
    run: generateWithCloudflare,
    configured: () => cloudflareConfigured(),
    missing: 'set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN',
  },
  {
    name: 'runware',
    run: generateWithRunware,
    configured: () => Boolean(process.env.RUNWARE_API_KEY),
    missing: 'set RUNWARE_API_KEY',
  },
  {
    name: 'glm',
    run: generateWithGLM,
    configured: () => Boolean(process.env.GLM_API_TOKEN),
    missing: 'set GLM_API_TOKEN',
  },
  {
    name: 'huggingface',
    run: generateWithHuggingFace,
    configured: () => Boolean(process.env.HUGGINGFACE_API_KEY),
    missing: 'set HUGGINGFACE_API_KEY',
  },
  {
    name: 'replicate',
    run: generateWithReplicate,
    configured: () => Boolean(process.env.REPLICATE_API_KEY),
    missing: 'set REPLICATE_API_KEY',
  },
  {
    name: 'pollinations',
    run: generateWithPollinations,
    configured: () => true,
    missing: '',
  },
];

const NO_TEXT_SUFFIX =
  'Absolutely no readable text, letters, numbers, words, signs, labels or typography anywhere in the image.';

/**
 * Walks the chain and returns the first image anyone produces, along
 * with the name of whoever produced it.
 *
 * The caller wants that name: "fallback_used" on a slide is how anyone
 * later works out why one deck looks different from another, and the
 * old code recorded the uninformative "glm-or-cascade" for all of them.
 *
 * @param {string} prompt
 * @param {string|null} preferredService - try this one first
 * @returns {Promise<{ image: string, provider: string }>}
 */
async function generateFallbackImageDetailed(prompt, preferredService = null) {
  // Every model in the chain drifts towards putting text in the picture,
  // and text in a generated image looks like a typo on the slide. Say it
  // once more at the end, which is where diffusion models weight it.
  const safePrompt = `${prompt}\n\n${NO_TEXT_SUFFIX}`;

  const order = preferredService
    ? [
        ...PROVIDERS.filter(p => p.name === preferredService),
        ...PROVIDERS.filter(p => p.name !== preferredService),
      ]
    : PROVIDERS;

  const skipped = [];
  const failed = [];

  for (const provider of order) {
    if (!provider.configured()) {
      skipped.push(`${provider.name} (${provider.missing})`);
      continue;
    }

    try {
      const result = await provider.run(safePrompt);
      if (!result) throw new Error('returned nothing');
      console.log(`Image generated by ${provider.name}`);
      return { image: result, provider: provider.name };
    } catch (error) {
      failed.push(`${provider.name}: ${error.message}`);
      console.warn(`${provider.name} failed: ${error.message}`);
    }
  }

  // One summary line rather than scattered warnings, so the reason a
  // deck came back with stock photos is readable at a glance.
  const parts = [];
  if (failed.length) parts.push(`failed - ${failed.join(' | ')}`);
  if (skipped.length) parts.push(`not configured - ${skipped.join(', ')}`);

  throw new Error(`No image generator is available. ${parts.join('; ')}`);
}

/**
 * The old signature, kept because scripts/ and anything written against
 * this module expect a bare image string.
 *
 * @returns {Promise<string>} a base64 data URL
 */
async function generateFallbackImage(prompt, preferredService = null) {
  const { image } = await generateFallbackImageDetailed(prompt, preferredService);
  return image;
}

/**
 * Which providers could run right now. Used by the diagnostics script
 * and worth having in a health endpoint.
 */
function imageProviderStatus() {
  return PROVIDERS.map(p => ({
    name: p.name,
    configured: p.configured(),
    missing: p.configured() ? null : p.missing,
  }));
}

module.exports = {
  generateFallbackImage,
  generateFallbackImageDetailed,
  imageProviderStatus,
  generateWithCloudflare,
  generateWithRunware,
  generateWithGLM,
  generateWithPollinations,
  generateWithHuggingFace,
  generateWithReplicate,
};
