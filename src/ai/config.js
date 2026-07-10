const AI_CONFIG = Object.freeze({
  version: "0.1.0",
  minConfidence: 75,
  maxFeedAgeMs: 5000,
  maxSpreadPercent: 1.2,
  maxDailyLossPercent: 1.5,
  maxConsecutiveLosses: 2,
  minAdxForTrade: 18,
  strongAdx: 25,
  minVolumeRatio: 0.9,
  strongVolumeRatio: 1.2,
  maxAtrPercent: 1.8,
  overextendedVwapPercent: 0.65,
  rsiBullMin: 52,
  rsiBearMax: 48,
});

module.exports = { AI_CONFIG };
