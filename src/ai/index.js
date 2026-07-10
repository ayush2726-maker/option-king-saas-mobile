const { AI_CONFIG } = require("./config");
const { buildAiFeatures } = require("./featureBuilder");
const { predictTrade } = require("./predictor");
const { runRiskGate } = require("./riskGate");

function evaluateMarket(snapshot, config = AI_CONFIG) {
  const features = buildAiFeatures(snapshot);
  const prediction = predictTrade(features, config);
  return Object.freeze({ features, prediction });
}

module.exports = {
  AI_CONFIG,
  buildAiFeatures,
  evaluateMarket,
  predictTrade,
  runRiskGate,
};
