/**
 * Image generation on Cloudflare Workers AI (FLUX.1 [schnell]).
 *
 * WHY THIS ONE
 *
 * Every other generator wired into this codebase is either out of credit
 * or retired. Workers AI has a free allowance of 10,000 Neurons a day
 * that resets at 00:00 UTC and does not expire. Flux Schnell costs about
 * 58 Neurons for a 1024px image at 4 steps, so the free tier is roughly
 * 170 images a day, which is around 24 decks. When the allowance runs
 * out the API returns an error rather than a bill.
 *
 * FLUX.1-schnell is Apache 2.0, so the output is fine to ship in a
 * commercial product.
 *
 * WHAT THE MODEL WILL AND WILL NOT DO
 *
 *   - `prompt` is capped at 2048 characters by the API. Our art-direction
 *     prompts are shorter than that, but they are machine-built and can
 *     grow, so they are trimmed here rather than left to 400 on a long
 *     slide.
 *   - `steps` maxes out at 8 and defaults to 4. Schnell is a distilled
 *     model built for few steps; above 4 the gain is small and the
 *     Neuron cost rises 9.6 per step, so 4 is the sensible default.
 *   - There is NO width or height. Output is square. The caller resizes,
 *     which is what convertToWebP in services/generateImage.js already
 *     does for every other provider.
 *   - There is no negative prompt. The "no text" instruction has to live
 *     in the prompt itself.
 *
 * Docs: https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/
 * Pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
 */

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MAX_PROMPT_CHARS = 2048;

/**
 * Thrown when the account is not set up. The fallback chain treats this
 * differently from a failure: an unconfigured provider is skipped
 * quietly, a configured one that breaks is worth a loud log.
 */
class NotConfigured extends Error {
  constructor(message) {
    super(message);
    this.name = "NotConfigured";
    this.code = "NOT_CONFIGURED";
  }
}

function credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  return { accountId, apiToken, ready: Boolean(accountId && apiToken) };
}

function isConfigured() {
  return credentials().ready;
}

/**
 * Generates one image and returns it as a data URL.
 *
 * @param {string} prompt
 * @param {{ steps?: number, seed?: number, timeout?: number }} [options]
 * @returns {Promise<string>} data:image/jpeg;base64,...
 */
async function generateCloudflareImage(prompt, options = {}) {
  const { accountId, apiToken, ready } = credentials();
  if (!ready) {
    throw new NotConfigured(
      "Cloudflare Workers AI is not configured. Set CLOUDFLARE_ACCOUNT_ID and " +
        "CLOUDFLARE_API_TOKEN in .env. The token needs the Workers AI read " +
        "permission and the account id is on the right of any page in the " +
        "Cloudflare dashboard."
    );
  }

  if (typeof prompt !== "string" || prompt.trim().length < 2) {
    throw new Error("Cloudflare image generation needs a prompt");
  }

  const trimmed =
    prompt.trim().length > MAX_PROMPT_CHARS
      ? prompt.trim().slice(0, MAX_PROMPT_CHARS)
      : prompt.trim();

  const steps = Math.min(
    8,
    Math.max(1, Number(options.steps || process.env.CLOUDFLARE_IMAGE_STEPS || 4))
  );

  const timeoutMs = Number(options.timeout || process.env.CLOUDFLARE_IMAGE_TIMEOUT_MS || 60000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // No seed. Cloudflare's own docs show `{ "prompt": ..., "seed": 1234 }`
  // in the example, but the live endpoint answers 400 "Additional or
  // unevaluated properties '/seed' at '/' not allowed". Sending it
  // fails every request, so the documented field is left out.
  const body = { prompt: trimmed, steps };

  let res;
  try {
    res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`Cloudflare image generation timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Cloudflare Workers AI unreachable: ${err.message}`);
  }
  clearTimeout(timer);

  const raw = await res.text();

  if (!res.ok) {
    // 429 here is the daily free allowance, not a per-second throttle.
    // Saying so saves someone half an hour of chasing a rate limiter.
    if (res.status === 429) {
      throw new Error(
        "Cloudflare Workers AI daily free allowance is used up. It resets at " +
          "00:00 UTC. Raw response: " + raw.slice(0, 200)
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Cloudflare rejected the token. Check CLOUDFLARE_API_TOKEN has the " +
          "Workers AI permission and that CLOUDFLARE_ACCOUNT_ID matches it. " +
          "Raw response: " + raw.slice(0, 200)
      );
    }
    throw new Error(`Cloudflare Workers AI returned ${res.status}: ${raw.slice(0, 250)}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error("Cloudflare Workers AI returned a response that is not JSON");
  }

  if (data.success === false) {
    const detail = (data.errors || []).map((e) => e.message).join("; ");
    throw new Error(`Cloudflare Workers AI failed: ${detail || "unknown error"}`);
  }

  // The REST API wraps the model output in `result`; the Workers binding
  // returns it bare. Accept both so this keeps working if the call ever
  // moves inside a Worker.
  const base64 = data?.result?.image || data?.image;
  if (!base64) {
    throw new Error("Cloudflare Workers AI returned no image data");
  }

  return `data:image/jpeg;base64,${base64}`;
}

module.exports = {
  generateCloudflareImage,
  isConfigured,
  NotConfigured,
  MODEL,
};
