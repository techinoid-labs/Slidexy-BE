/**
 * Generation is gone. Seeds are converted decks in app-library/.
 * Mutate one with services/templatePipeline/mutate.js.
 */

function sampleOurs() {
  const error = new Error("Deck generation was removed. Convert with pptxToDeck.js or mutate a seed with mutate.js.");
  error.status = 410;
  throw error;
}

module.exports = { sampleOurs };

if (require.main === module) {
  console.error("Deck generation was removed. Convert with pptxToDeck.js or mutate a seed with mutate.js.");
  process.exit(1);
}
