// planConfig.js
module.exports = {
  free: {
    decksPerDay: 3,
    imageDecks: 1,
    predefinedDecks: 2,
    features: {
      deepResearch: false,
      aiAgent: false,
      presentationAgent: false,
    },
  },
  weekly: {
    decksPerDay: 15,
    imageDecks: 5,
    predefinedDecks: 10,
    features: {
      deepResearch: true,
      aiAgent: true,
      presentationAgent: true,
    },
  },
  monthly: {
    decksPerDay: 20,
    imageDecks: 5,
    predefinedDecks: 15,
    features: {
      deepResearch: true,
      aiAgent: true,
      presentationAgent: true,
    },
  },
  yearly: {
    decksPerDay: 20,
    imageDecks: 5,
    predefinedDecks: 15,
    features: {
      deepResearch: true,
      aiAgent: true,
      presentationAgent: true,
    },
  },
};
