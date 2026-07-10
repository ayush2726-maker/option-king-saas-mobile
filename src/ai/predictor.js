const { AI_CONFIG } = require("./config");
const { clamp } = require("./featureBuilder");
const { runRiskGate } = require("./riskGate");

function add(score, condition, points) {
  return condition ? score + points : score;
}

function addDirectional(scores, direction, points) {
  if (direction > 0) scores.ce += points;
  if (direction < 0) scores.pe += points;
}

function roundProbabilities(values) {
  const ce = Math.round(values.CE);
  const pe = Math.round(values.PE);
  const noTrade = Math.max(0, 100 - ce - pe);
  return { CE: ce, PE: pe, NO_TRADE: noTrade };
}

function softmax3(ceScore, peScore, noTradeScore) {
  const maxScore = Math.max(ceScore, peScore, noTradeScore);
  const temperature = 22;
  const ce = Math.exp((ceScore - maxScore) / temperature);
  const pe = Math.exp((peScore - maxScore) / temperature);
  const nt = Math.exp((noTradeScore - maxScore) / temperature);
  const total = ce + pe + nt;

  const modelWeight = 0.9;
  const prior = (1 - modelWeight) / 3;

  return roundProbabilities({
    CE: ((ce / total) * modelWeight + prior) * 100,
    PE: ((pe / total) * modelWeight + prior) * 100,
    NO_TRADE: ((nt / total) * modelWeight + prior) * 100,
  });
}

function predictTrade(features, config = AI_CONFIG) {
  const gate = runRiskGate(features, config);
  if (!gate.allowed) {
    return Object.freeze({
      engineVersion: config.version,
      decision: "NO_TRADE",
      confidence: 100,
      probabilities: { CE: 0, PE: 0, NO_TRADE: 100 },
      riskAllowed: false,
      reasons: gate.reasons,
      mode: "LOCAL_RULE_MODEL",
    });
  }

  const scores = { ce: 20, pe: 20 };
  let noTrade = 30;
  const reasons = [];

  scores.ce = add(scores.ce, features.ema20Vs50Percent > 0, 14);
  scores.pe = add(scores.pe, features.ema20Vs50Percent < 0, 14);
  scores.ce = add(scores.ce, features.priceVsVwapPercent > 0, 12);
  scores.pe = add(scores.pe, features.priceVsVwapPercent < 0, 12);
  addDirectional(scores, features.signalDirection, 14);
  addDirectional(scores, features.supertrendDirection, 12);
  addDirectional(scores, features.structureDirection, 12);
  addDirectional(scores, features.mtfDirection, 10);
  scores.ce = add(scores.ce, features.rsi >= config.rsiBullMin && features.rsi < 75, 8);
  scores.pe = add(scores.pe, features.rsi <= config.rsiBearMax && features.rsi > 25, 8);

  const scoreRatio = features.strategyScore / Math.max(1, features.minStrategyScore);
  if (features.signalDirection !== 0 && features.serverTradeAllowed && scoreRatio >= 1) {
    addDirectional(scores, features.signalDirection, 24);
  } else if (features.signalDirection !== 0 && scoreRatio >= 0.9) {
    addDirectional(scores, features.signalDirection, 12);
    noTrade += 6;
    reasons.push("STRATEGY_SCORE_NEAR_THRESHOLD");
  } else if (features.strategyScore > 0) {
    noTrade += 18;
    reasons.push("STRATEGY_SCORE_BELOW_THRESHOLD");
  }

  if (features.adx >= config.strongAdx) {
    const adxDirection = features.ema20Vs50Percent !== 0
      ? Math.sign(features.ema20Vs50Percent)
      : features.signalDirection;
    addDirectional(scores, adxDirection, 8);
  } else if (features.adx < config.minAdxForTrade) {
    noTrade += 24;
    reasons.push("ADX_WEAK");
  }

  if (features.volumeRatio >= config.strongVolumeRatio) {
    const volumeDirection = features.priceVsVwapPercent !== 0
      ? Math.sign(features.priceVsVwapPercent)
      : features.signalDirection;
    addDirectional(scores, volumeDirection, 7);
  } else if (features.volumeRatio < config.minVolumeRatio) {
    noTrade += 16;
    reasons.push("VOLUME_WEAK");
  }

  if (features.mtfConfirmed) {
    addDirectional(scores, features.signalDirection, 10);
  } else {
    noTrade += 15;
    reasons.push("MTF_NOT_CONFIRMED");
  }

  const directionalConflict =
    (features.supertrendDirection > 0 && features.structureDirection < 0) ||
    (features.supertrendDirection < 0 && features.structureDirection > 0) ||
    (features.mtfDirection > 0 && features.ema20Vs50Percent < 0) ||
    (features.mtfDirection < 0 && features.ema20Vs50Percent > 0);

  if (directionalConflict) {
    noTrade += 26;
    reasons.push("DIRECTION_CONFLICT");
  }

  const ce = clamp(scores.ce, 0, 100);
  const pe = clamp(scores.pe, 0, 100);
  noTrade = clamp(noTrade, 0, 100);

  const probabilities = softmax3(ce, pe, noTrade);
  const ranked = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  let decision = ranked[0][0];
  let confidence = ranked[0][1];

  if (decision !== "NO_TRADE" && confidence < config.minConfidence) {
    reasons.push("CONFIDENCE_BELOW_MINIMUM");
    decision = "NO_TRADE";
    confidence = Math.max(probabilities.NO_TRADE, 100 - ranked[0][1]);
  }

  return Object.freeze({
    engineVersion: config.version,
    decision,
    confidence,
    probabilities,
    riskAllowed: true,
    reasons,
    mode: "LOCAL_RULE_MODEL",
  });
}

module.exports = { predictTrade };
