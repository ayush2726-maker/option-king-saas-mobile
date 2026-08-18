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
    warning.startsWith("CONFIG_MATCH:")
  );
}

function visibleWarnings(warnings) {
  return (Array.isArray(warnings) ? warnings : [])
    .map((item) => String(item))
    .filter((item) => item && !isTechnicalStrategyWarning(item));
}

module.exports = {
  SCORE_MAX,
  directionalMaximum,
  scoreMaximum,
  visibleWarnings,
};
