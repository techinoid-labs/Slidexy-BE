const crypto = require("crypto");

function generateJazzCashHash(data, salt) {
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map((key) => data[key]).join("&");
  const hash = crypto
    .createHmac("sha256", salt)
    .update(concatenated)
    .digest("hex");
  return hash.toUpperCase();
}

module.exports = { generateJazzCashHash };
