const { AI_CONFIG } = require("./config");
const { clamp } = require("./featureBuilder");
const { runRiskGate } = require("./riskGate");

function add(score, condition, points) {
  return condition ? score + points : score;
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

  // Blend with a small neutral prior so a directional model never claims
  // impossible 100% certainty. Hard safety blocks can still return 100%.
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

  let ce = 20;
  let pe = 20;
  let noTrade = 30;
  const reasons = [];

  ce = add(ce, features.ema20Vs50Percent > 0, 14);
  pe = add(pe, features.ema20Vs50Percent < 0, 14);
  ce = add(ce, features.priceVsVwapPercent > 0, 12);
  pe = add(pe, features.priceVsVwapPercent < 0, 12);
  ce = add(ce, features.supertrendDirection > 0, 12);
  pe = add(pe, features.supertrendDirection < 0, 12);
  ce = add(ce, features.structureDirection > 0, 12);
  pe = add(pe, features.structureDirection < 0, 12);
  ce = add(ce, features.mtfDirection > 0, 10);
  pe = add(pe, features.mtfDirection < 0, 10);
  ce = add(ce, features.rsi >= config.rsiBullMin && features.rsi < 75, 8);
  pe = add(pe, features.rsi <= config.rsiBearMax && features.rsi > 25, 8);

  if (features.adx >= config.strongAdx) {
    ce = add(ce, features.ema20Vs50Percent > 0, 8);
    pe = add(pe, features.ema20Vs50Percent < 0, 8);
  } else if (features.adx < config.minAdxForTrade) {
    noTrade += 24;
    reasons.push("ADX_WEAK");
  }

  if (features.volumeRatio >= config.strongVolumeRatio) {
    ce = add(ce, features.priceVsVwapPercent > 0, 7);
    pe = add(pe, features.priceVsVwapPercent < 0, 7);
  } else if (features.volumeRatio < config.minVolumeRatio) {
    noTrade += 16;
    reasons.push("VOLUME_WEAK");
  }

  if (!features.mtfConfirmed) {
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

  ce = clamp(ce, 0, 100);
  pe = clamp(pe, 0, 100);
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
