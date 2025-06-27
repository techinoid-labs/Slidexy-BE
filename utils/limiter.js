const Bottleneck = require("bottleneck");

const ytLimiter = new Bottleneck({ minTime: 1000 });
const imageGenLimiter = new Bottleneck({ minTime: 2000, maxConcurrent: 5 });

module.exports = { ytLimiter, imageGenLimiter };
