const gen = require('./services/dynamicWebsiteGenerator');
(async () => {
  try {
    console.log('Starting generation...');
    const result = await gen.unifiedWebDeck('https://devsinc.com', {});
    console.log('Success! Generated at:', result.outputDirectory);
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
