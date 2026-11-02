/**
 * The text model client.
 *
 * Replaces the Gemini and OpenRouter clients with the self-hosted Groq
 * multi-key proxy. One place to change the model, no per-request keys,
 * and no provider SDK.
 *
 * WHAT THE PROXY WILL AND WILL NOT DO
 *
 * It takes POST /generate with { input, max_output_tokens } and returns
 * { success, truncated, model, output }. That is the whole contract, and
 * three things follow from it:
 *
 *   1. `model` in the request body is IGNORED. The server uses whatever
 *      is set on it via PUT /model, currently qwen/qwen3.8-27b. So the
 *      quality and utility tiers are the same model now. The two exports
 *      are kept so callers do not have to change, and so the split can
 *      come back if the proxy ever honours a per-request model.
 *
 *   2. `input` is a single string. There are no roles, so a system
 *      prompt is folded into the prompt text.
 *
 *   3. There is no image input. A caller that passes inlineData is
 *      asking for something this server cannot do, and gets a clear
 *      error rather than a silent text-only answer that looks like the
 *      model ignored the picture.
 *
 * There is also no temperature. Callers that cooled down on a retry are
 * not broken by this, they simply retry at the same setting.
 *
 * The returned object carries both `response.text()` and
 * `response.candidates[0].content.parts[0].text`, because the codebase
 * reads it both ways: 14 call sites use text() and 5 read candidates.
 * The previous OpenRouter path returned only candidates, so every text()
 * caller threw whenever OpenRouter was the live path.
 */

// No default for the host. A hardcoded fallback means that the day the
// box moves, a deploy with the variable missing keeps talking to the old
// address and nobody finds out until the output is wrong. Fail at boot
// with a message that says what to set.
if (!process.env.TEXT_MODEL_URL) {
  throw new Error(
    "TEXT_MODEL_URL is not set. Point it at the text model server, " +
      "for example TEXT_MODEL_URL=http://64.23.174.222:8010 in .env"
  );
}

const BASE_URL = process.env.TEXT_MODEL_URL.replace(/\/+$/, "");
const DEFAULT_MAX_TOKENS = Number(process.env.TEXT_MODEL_MAX_TOKENS || 8192);
const TIMEOUT_MS = Number(process.env.TEXT_MODEL_TIMEOUT_MS || 120000);

/**
 * Reported in logs only. The proxy ignores the model in the request and
 * uses whatever its own PUT /model is set to, so this name is a label,
 * not a selection. If the two drift, the log is the thing that is wrong.
 */
const MODEL_NAME = process.env.TEXT_MODEL_NAME || "qwen/qwen3.8-27b";

console.log("Text model: " + MODEL_NAME + " via " + BASE_URL);

class ImageInputUnsupported extends Error {
  constructor() {
    super(
      "The text model endpoint accepts text only. Extract the text from the " +
        "file before calling the model, or route this through a vision service."
    );
    this.name = "ImageInputUnsupported";
    this.code = "IMAGE_INPUT_UNSUPPORTED";
  }
}

/**
 * Folds every shape the codebase calls with into one prompt string.
 *
 * Three patterns are in use:
 *   "prompt"
 *   [{ text }, { inlineData }]
 *   { contents: [{ role, parts: [{ text }] }] }
 */
function flattenToPrompt(input) {
  if (typeof input === "string") return input;

  const pieces = [];
  let sawImage = false;

  const eatParts = (parts, role) => {
    const text = [];
    for (const part of parts || []) {
      if (part && typeof part.text === "string") text.push(part.text);
      else if (part && part.inlineData) sawImage = true;
    }
    if (!text.length) return;
    // The proxy has no roles, so an assistant turn is labelled in the
    // prompt rather than dropped, which would lose the conversation.
    pieces.push(role && role !== "user" ? role.toUpperCase() + ": " + text.join("\n") : text.join("\n"));
  };

  if (Array.isArray(input)) {
    eatParts(input);
  } else if (input && typeof input === "object" && Array.isArray(input.contents)) {
    for (const item of input.contents) eatParts(item.parts, item.role);
  } else if (input && typeof input === "object" && typeof input.text === "string") {
    pieces.push(input.text);
  }

  if (sawImage) throw new ImageInputUnsupported();
  return pieces.join("\n\n");
}

/** The shape the rest of the codebase reads, both ways. */
function wrap(text, meta) {
  return {
    response: {
      text: () => text,
      candidates: [{ content: { parts: [{ text }] } }],
    },
    meta,
  };
}

async function generateContent(input, opts = {}) {
  const prompt = flattenToPrompt(input);
  if (!prompt || !prompt.trim()) throw new Error("The model was called with an empty prompt");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(BASE_URL + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: prompt,
        max_output_tokens: opts.maxTokens || DEFAULT_MAX_TOKENS,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Text model timed out after " + TIMEOUT_MS + "ms");
    throw new Error("Text model unreachable at " + BASE_URL + ": " + err.message);
  }
  clearTimeout(timer);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("Text model returned " + res.status + ": " + body.slice(0, 300));
  }

  const data = await res.json();
  if (data.success === false) {
    throw new Error("Text model failed: " + (data.detail || data.error || "unknown"));
  }

  const output = typeof data.output === "string" ? data.output : "";

  // Truncation is the failure that looks like bad writing rather than an
  // error: the JSON is cut mid-object and the caller's parser blames the
  // model. Say it plainly in the log so it is diagnosable.
  if (data.truncated) {
    console.warn(
      "Text model output was truncated at " +
        (opts.maxTokens || DEFAULT_MAX_TOKENS) +
        " tokens. Raise maxTokens for this call."
    );
  }

  return wrap(output, { model: data.model, truncated: !!data.truncated, keyUsed: data.key_used });
}

module.exports = {
  /** Cheap tier. Same model as quality: the proxy chooses, not us. */
  textGenModel: { generateContent },

  /** Quality tier, kept so callers need not change. Same model today. */
  qualityGenModel: {
    generateContent: (input, opts = {}) => generateContent(input, { maxTokens: 16000, ...opts }),
  },

  QUALITY_MODEL: MODEL_NAME,
  UTILITY_MODEL: MODEL_NAME,
  MODEL_NAME,
  ImageInputUnsupported,
};
