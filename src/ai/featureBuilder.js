function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDirection(value) {
  const v = String(value || "").trim().toUpperCase();
  if (["BULLISH", "UP", "BUY", "CE", "LONG"].includes(v)) return 1;
  if (["BEARISH", "DOWN", "SELL", "PE", "SHORT"].includes(v)) return -1;
  return 0;
}

function percentDistance(value, base) {
  const v = toNumber(value, 0);
  const b = toNumber(base, 0);
  if (!b) return 0;
  return ((v - b) / Math.abs(b)) * 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildAiFeatures(snapshot = {}) {
  const price = toNumber(snapshot.price ?? snapshot.ltp ?? snapshot.close, 0);
  const ema20 = toNumber(snapshot.ema20, price);
  const ema50 = toNumber(snapshot.ema50, price);
  const vwap = toNumber(snapshot.vwap, price);
  const atr = toNumber(snapshot.atr, 0);
  const atrPercent = snapshot.atrPercent != null
    ? toNumber(snapshot.atrPercent, 0)
    : (price > 0 ? (atr / price) * 100 : 0);

  return Object.freeze({
    timestamp: snapshot.timestamp || new Date().toISOString(),
    symbol: String(snapshot.symbol || "NIFTY").toUpperCase(),
    feedConnected: Boolean(snapshot.feedConnected ?? snapshot.feed_connected),
    feedAgeMs: Math.max(0, toNumber(snapshot.feedAgeMs ?? snapshot.feed_age_ms, 999999)),
    price,
    ema20,
    ema50,
    vwap,
    ema20Vs50Percent: percentDistance(ema20, ema50),
    priceVsEma20Percent: percentDistance(price, ema20),
    priceVsVwapPercent: percentDistance(price, vwap),
    adx: clamp(toNumber(snapshot.adx, 0), 0, 100),
    rsi: clamp(toNumber(snapshot.rsi, 50), 0, 100),
    atrPercent: Math.max(0, atrPercent),
    volumeRatio: Math.max(0, toNumber(snapshot.volumeRatio ?? snapshot.volume_ratio, 0)),
    spreadPercent: Math.max(0, toNumber(snapshot.spreadPercent ?? snapshot.spread_percent, 0)),
    supertrendDirection: normalizeDirection(snapshot.supertrend ?? snapshot.supertrendDirection),
    structureDirection: normalizeDirection(snapshot.structure ?? snapshot.structureDirection),
    mtfDirection: normalizeDirection(snapshot.mtfDirection ?? snapshot.mtf_direction),
    mtfConfirmed: Boolean(snapshot.mtfConfirmed ?? snapshot.mtf_confirmed),
    dailyLossPercent: Math.max(0, toNumber(snapshot.dailyLossPercent ?? snapshot.daily_loss_percent, 0)),
    consecutiveLosses: Math.max(0, Math.trunc(toNumber(snapshot.consecutiveLosses ?? snapshot.consecutive_losses, 0))),
    marketOpen: snapshot.marketOpen == null ? true : Boolean(snapshot.marketOpen),
    hasOpenPosition: Boolean(snapshot.hasOpenPosition ?? snapshot.has_open_position),
  });
}

module.exports = {
  buildAiFeatures,
  clamp,
  normalizeDirection,
  percentDistance,
  toNumber,
};
