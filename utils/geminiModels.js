const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKeys = [
  process.env.API_KEY1, process.env.API_KEY2, process.env.API_KEY3,
  process.env.API_KEY4, process.env.API_KEY5, process.env.API_KEY6,
  process.env.API_KEY7, process.env.API_KEY8, process.env.API_KEY9,
  process.env.API_KEY10, process.env.API_KEY11, process.env.API_KEY12,
].filter(Boolean);

if (apiKeys.length === 0) throw new Error("No API keys configured!");

class KeyPool {
  constructor(keys) {
    this.keys = keys.map(key => ({ key, inUse: false, lastUsed: 0, fails: 0 }));
  }
  async acquire() {
    this.keys.sort((a, b) => a.lastUsed - b.lastUsed || a.fails - b.fails);
    let candidate = this.keys.find(k => !k.inUse);
    if (!candidate) await new Promise(r => setTimeout(r, 100));
    candidate = this.keys.find(k => !k.inUse) || this.keys[0];
    candidate.inUse = true;
    candidate.lastUsed = Date.now();
    return candidate.key;
  }
  release(key, success = true) {
    const k = this.keys.find(k => k.key === key);
    if (k) { k.inUse = false; if (!success) k.fails++; }
  }
}

const pool = new KeyPool(apiKeys);

async function safeGenerateContent(modelName, config) {
  const key = await pool.acquire();
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelName });
  try {
    const res = await model.generateContent(config);
    pool.release(key, true);
    return res;
  } catch (err) {
    pool.release(key, false);
    if (err.statusCode === 429 || err.message.includes("quota")) {
      console.warn("Rate limit - rotating key");
      return safeGenerateContent(modelName, config);
    }
    throw err;
  }
}

module.exports = {
  textGenModel: { generateContent: (c) => safeGenerateContent("gemini-2.5-flash", c) },
};
