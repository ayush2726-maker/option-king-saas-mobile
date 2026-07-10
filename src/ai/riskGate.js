const { AI_CONFIG } = require("./config");

function runRiskGate(features, config = AI_CONFIG) {
  const reasons = [];

  if (!features.marketOpen) reasons.push("MARKET_CLOSED");
  if (!features.feedConnected) reasons.push("FEED_DISCONNECTED");
  if (features.feedAgeMs > config.maxFeedAgeMs) reasons.push("STALE_DATA");
  if (features.price <= 0) reasons.push("INVALID_PRICE");
  if (features.spreadPercent > config.maxSpreadPercent) reasons.push("SPREAD_TOO_HIGH");
  if (features.dailyLossPercent >= config.maxDailyLossPercent) reasons.push("DAILY_LOSS_LIMIT");
  if (features.consecutiveLosses >= config.maxConsecutiveLosses) reasons.push("CONSECUTIVE_LOSS_LIMIT");
  if (features.atrPercent > config.maxAtrPercent) reasons.push("VOLATILITY_TOO_HIGH");
  if (Math.abs(features.priceVsVwapPercent) > config.overextendedVwapPercent) reasons.push("PRICE_OVEREXTENDED");
  if (features.hasOpenPosition) reasons.push("POSITION_ALREADY_OPEN");

  return Object.freeze({
    allowed: reasons.length === 0,
    reasons,
  });
}

module.exports = { runRiskGate };
