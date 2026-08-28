const SCORE_MAX = 100;

const DIRECTIONAL_KEYS = [
  "vwap",
  "supertrend",
  "ema_trend",
  "orb",
  "momentum",
];

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function profileWeights(scan) {
  return (
    scan?.profile_weights ||
    scan?.live_score_breakdown?.profile_weights ||
    scan?.signal_data?.profile_weights ||
    {}
  );
}

function profileEnabled(scan) {
  return (
    scan?.profile_enabled ||
    scan?.live_score_breakdown?.profile_enabled ||
    scan?.signal_data?.profile_enabled ||
    {}
  );
}

function sumEnabledWeights(weights, enabled, keys = Object.keys(weights || {})) {
  return keys.reduce(
    (sum, key) =>
      sum + (enabled?.[key] === false ? 0 : Math.max(0, number(weights?.[key], 0))),
    0
  );
}

function scoreMaximum(scan) {
  const explicit = number(
    scan?.enabled_weight_total ??
      scan?.live_score_breakdown?.enabled_weight_total ??
      scan?.signal_data?.enabled_weight_total ??
      scan?.score_max ??
      scan?.live_score_breakdown?.max_score,
    0
  );
  if (explicit > 0) return Math.round(explicit);

  const weights = profileWeights(scan);
  const weightTotal = sumEnabledWeights(weights, profileEnabled(scan));
  if (weightTotal > 0) return Math.round(weightTotal);

  const components =
    scan?.score_components || scan?.live_score_breakdown?.components || [];
  if (Array.isArray(components) && components.length) {
    const componentTotal = components.reduce(
      (sum, item) =>
        sum + (item?.enabled === false ? 0 : Math.max(0, number(item?.max_score, 0))),
      0
    );
    if (componentTotal > 0) return Math.round(componentTotal);
  }

  return SCORE_MAX;
}

function directionalMaximum(scan) {
  const weights = profileWeights(scan);
  const directionalTotal = sumEnabledWeights(
    weights,
    profileEnabled(scan),
    DIRECTIONAL_KEYS
  );
  if (directionalTotal > 0) return Math.round(directionalTotal);

  const adxMax = number(scan?.profile_weights?.adx, 20);
  const volumeMax = number(scan?.profile_weights?.volume, 15);
  const mtfMax = number(scan?.profile_weights?.mtf, 10);
  return Math.max(0, scoreMaximum(scan) - adxMax - volumeMax - mtfMax);
}

function isTechnicalStrategyWarning(value) {
  const warning = String(value || "").trim();
  return (
    warning.startsWith("LIVE_USING_STRATEGY:") ||
    warning.startsWith("APPLIED_WEIGHTS:") ||
    warning.startsWith("CONFIG_MATCH:") ||
    warning.startsWith("AUDIT:") ||
    warning.startsWith("ENTRY_READY_AUDIT:")
  );
}

function simpleReasonText(value) {
  const reason = String(value || "").trim();
  if (!reason) return "";

  if (reason === "VOLUME_UNAVAILABLE_NEUTRAL") {
    return "Volume data available nahi hai; neutral score use hua.";
  }

  const normalized = reason.match(
    /^VOLUME_AVAILABILITY_NORMALIZED:(.+?)->(.+)$/
  );
  if (normalized) {
    return `Volume data nahi mila, isliye score ${normalized[1]} se ${normalized[2]} par adjust hua.`;
  }

  if (reason.startsWith("VWAP_FALLBACK_ACTIVE")) {
    return "VWAP ka backup method active hai; price-chase rule trade ko block nahi karega.";
  }
  if (reason.startsWith("EMA_ANTI_CHASE_OBSERVATION_ONLY")) {
    return "EMA distance sirf observation ke liye hai; trade block nahi hoga.";
  }
  if (reason.startsWith("MARKET_CLOSED")) {
    return "Market band hai; ab nayi trade nahi li jayegi.";
  }
  if (reason === "POST_ATR_SL_SAME_SIDE_COOLDOWN_15M") {
    return "Loss ya SL ke baad isi index aur side me 15 minute ka wait hai.";
  }
  if (reason === "CORRELATED_SAME_DIRECTION_POSITION_OPEN") {
    return "Same direction ki correlated trade pehle se open hai.";
  }
  if (reason === "OPPOSITE_HEDGE_REQUIRES_EXISTING_LOSS") {
    return "Opposite hedge tabhi li jayegi jab pehli trade loss me ho.";
  }
  if (reason === "OPPOSITE_HEDGE_REQUIRES_DIFFERENT_INDEX") {
    return "Same index me opposite hedge allowed nahi hai.";
  }
  if (reason === "STRATEGY_NOT_QUALIFIED") {
    return "Strategy ke sabhi entry rules pass nahi hue.";
  }
  if (reason.startsWith("SCORE_BELOW_")) {
    return `Entry ke liye score ${reason.slice("SCORE_BELOW_".length)} se kam hai.`;
  }
  if (reason === "REPLAY_FIRST_LIVE_SCAN") {
    return "Live market ka pehla scan complete hua.";
  }

  const readable = reason
    .replace(/_/g, " ")
    .replace(/\s*->\s*/g, " se ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function visibleWarnings(warnings) {
  return (Array.isArray(warnings) ? warnings : [])
    .map((item) => String(item))
    .filter((item) => item && !isTechnicalStrategyWarning(item))
    .map(simpleReasonText)
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

module.exports = {
  SCORE_MAX,
  directionalMaximum,
  scoreMaximum,
  simpleReasonText,
  visibleWarnings,
};
