// utils/cache.js
const textCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of textCache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) textCache.delete(key);
  }
}, 60_000);

module.exports = { textCache };