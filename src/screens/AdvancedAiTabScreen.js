const React = require("react");
const {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorageModule = require("@react-native-async-storage/async-storage");

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  card: "#13131f",
  card2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  sub: "#b5b5ca",
  muted: "#85859f",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#b06deb",
};

const COPY = {
  en: {
    title: "Advanced AI Analysis",
    subtitle: "Option data, model learning, and news impact on one dedicated screen.",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    overview: "Live overview",
    overviewSub: "Current broker, option-chain view, and model status.",
    broker: "Broker",
    optionView: "Option view",
    coverage: "Data coverage",
    optionRisk: "Option risk",
    pcr: "PCR",
    maxPain: "Max Pain",
    model: "Model",
    result15m: "15-minute result",
    freeTitle: "Free AI indicators",
    freeSub: "Live Squeeze Momentum and Choppiness from completed broker candles.",
    freeBadge: "FREE • BROKER CANDLES",
    choppiness: "Choppiness Index",
    regime: "Market regime",
    squeeze: "Squeeze status",
    momentum: "Squeeze momentum",
    candles: "Completed candles",
    trend: "Trending",
    transition: "Transition",
    sideways: "Sideways / choppy",
    squeezeOn: "SQUEEZE ON",
    squeezeReleased: "SQUEEZE RELEASED",
    squeezeOff: "SQUEEZE OFF",
    rising: "Rising",
    falling: "Falling",
    waitingCandles: "Waiting for candles",
    freeSafety: "AI training display only • Baseline strategy unchanged • Trade blocking OFF",
    performance: "Model performance",
    performanceSub: "The model is accepted only after chronological validation beats the base strategy.",
    validation: "Validation accuracy",
    baseline: "Baseline accuracy",
    brier: "Brier score",
    benefit: "Advanced vs base",
    perLot: "per lot (15 min)",
    learned: "What the AI learned",
    learnedSub: "Patterns are shown for explanation; only validated patterns can influence future activation.",
    patterns: "Most important patterns",
    groups: "Feature-group importance",
    optionChain: "Option chain",
    news: "News",
    market: "Market",
    global: "Global",
    failed: "Failed validation checks",
    newsTitle: "What the news data indicates",
    newsSub: "Headlines are checked against actual market reaction. A headline alone is not a trade signal.",
    newsBias: "News bias",
    strengthRisk: "Strength / risk",
    events: "Events",
    newsTest: "News usefulness test",
    headlines: "Recent high-impact headlines",
    noHeadlines: "No fresh high-impact headline is available.",
    retrying: "The monitor will retry automatically",
    monitorOnly: "MONITOR ONLY • Trade blocking OFF • Order execution OFF",
    waiting: "Waiting",
    evaluated: "evaluated",
    high: "high impact",
    collecting: "Collecting",
    rejected: "Rejected",
    validated: "Validated",
    retraining: "Retraining",
    error: "Error",
    noTrade: "NO TRADE",
    bullish: "CE / Bullish",
    bearish: "PE / Bearish",
    neutral: "Neutral",
    missedTitle: "Missed-trade learning",
    missedSub: "Qualified-but-skipped setups are checked with exact option prices and all costs after 5, 15, and 30 minutes.",
    missedApplied: "MISSED-TRADE AI V2 • APPLIED",
    missedAppliedSub: "Exact option P&L at 5/15/30m • shadow learning only",
    captured: "Captured setups",
    tracking: "Still tracking",
    wouldProfit: "Would profit (15m)",
    avoidedLoss: "Block saved loss (15m)",
    learningSamples: "AI learning samples",
    noMissed: "No qualified missed setup has been captured yet.",
    counterfactual: "Counterfactual shadow report only. It teaches the AI after the result is known, but cannot block a trade or place an order.",
    pendingOutcome: "Outcome pending",
    missedProfit: "MISSED PROFIT",
    savedLoss: "GOOD BLOCK",
    noEdge: "NO EDGE",
    unavailableOutcome: "UNAVAILABLE",
    perLotShort: "per lot",
    profitPnl: "PROFIT (+)",
    lossPnl: "LOSS (-)",
    flatPnl: "FLAT (0)",
    pendingPnl: "PENDING",
    netProfitPnl: "NET PROFIT (+)",
    netLossPnl: "NET LOSS (-)",
    netFlatPnl: "NET FLAT (0)",
    pnlAfterCosts: "Hypothetical trade P&L after all costs • per lot",
    expiryShort: "EXP",
    entryPremium: "Entry premium",
    quantityShort: "Qty",
    scoreShort: "Score",
    capturedAt: "Captured",
    retiredRule: "OLD RULE REMOVED",
    retiredEmaRule: "Fixed EMA-distance rule no longer blocks new trades",
    retiredTriggerRule: "ORB/momentum is no longer mandatory for new trades",
    brokerSymbol: "Contract",
    contractResolving: "Exact option contract resolving",
  },
  hi: {
    title: "उन्नत AI विश्लेषण",
    subtitle: "ऑप्शन डेटा, मॉडल ने क्या सीखा और समाचार का प्रभाव—सब एक अलग स्क्रीन पर।",
    refresh: "रीफ़्रेश",
    refreshing: "रीफ़्रेश हो रहा है…",
    overview: "लाइव सारांश",
    overviewSub: "वर्तमान ब्रोकर, ऑप्शन-चेन संकेत और मॉडल की स्थिति।",
    broker: "ब्रोकर",
    optionView: "ऑप्शन संकेत",
    coverage: "डेटा कवरेज",
    optionRisk: "ऑप्शन जोखिम",
    pcr: "PCR",
    maxPain: "मैक्स पेन",
    model: "मॉडल",
    result15m: "15-मिनट परिणाम",
    freeTitle: "मुफ़्त AI इंडिकेटर",
    freeSub: "ब्रोकर की पूरी हो चुकी कैंडल से लाइव स्क्वीज़ मोमेंटम और चॉपिनेस।",
    freeBadge: "मुफ़्त • ब्रोकर कैंडल",
    choppiness: "चॉपिनेस इंडेक्स",
    regime: "बाज़ार स्थिति",
    squeeze: "स्क्वीज़ स्थिति",
    momentum: "स्क्वीज़ मोमेंटम",
    candles: "पूरी कैंडल",
    trend: "ट्रेंडिंग",
    transition: "बदलाव का क्षेत्र",
    sideways: "साइडवेज़ / चॉपी",
    squeezeOn: "स्क्वीज़ चालू",
    squeezeReleased: "स्क्वीज़ रिलीज़",
    squeezeOff: "स्क्वीज़ बंद",
    rising: "बढ़ रहा है",
    falling: "घट रहा है",
    waitingCandles: "कैंडल का इंतज़ार",
    freeSafety: "केवल AI ट्रेनिंग डिस्प्ले • बेसलाइन रणनीति में बदलाव नहीं • ट्रेड ब्लॉक बंद",
    performance: "मॉडल प्रदर्शन",
    performanceSub: "मॉडल तभी स्वीकार होगा जब समयानुसार वैलिडेशन में बेस रणनीति से बेहतर परिणाम दे।",
    validation: "वैलिडेशन सटीकता",
    baseline: "बेसलाइन सटीकता",
    brier: "ब्रायर स्कोर",
    benefit: "बेस रणनीति से अंतर",
    perLot: "प्रति लॉट (15 मिनट)",
    learned: "AI ने क्या सीखा",
    learnedSub: "पैटर्न समझाने के लिए दिखाए जाते हैं; केवल वैलिडेटेड पैटर्न भविष्य में सक्रिय हो सकते हैं।",
    patterns: "सबसे महत्वपूर्ण पैटर्न",
    groups: "डेटा समूह का महत्व",
    optionChain: "ऑप्शन चेन",
    news: "समाचार",
    market: "बाज़ार",
    global: "वैश्विक",
    failed: "असफल वैलिडेशन जाँच",
    newsTitle: "समाचार डेटा से क्या पता चला",
    newsSub: "हेडलाइन को बाज़ार की वास्तविक प्रतिक्रिया से मिलाया जाता है। केवल हेडलाइन ट्रेड संकेत नहीं है।",
    newsBias: "समाचार दिशा",
    strengthRisk: "ताकत / जोखिम",
    events: "घटनाएँ",
    newsTest: "समाचार उपयोगिता जाँच",
    headlines: "हाल की महत्वपूर्ण हेडलाइन",
    noHeadlines: "अभी कोई ताज़ा उच्च-प्रभाव वाली हेडलाइन उपलब्ध नहीं है।",
    retrying: "मॉनिटर अपने-आप दोबारा प्रयास करेगा",
    monitorOnly: "केवल निगरानी • ट्रेड ब्लॉक बंद • ऑर्डर निष्पादन बंद",
    waiting: "प्रतीक्षा",
    evaluated: "परिणाम जाँचे गए",
    high: "उच्च प्रभाव",
    collecting: "डेटा एकत्र हो रहा है",
    rejected: "अस्वीकृत",
    validated: "मान्य",
    retraining: "दोबारा सीख रहा है",
    error: "त्रुटि",
    noTrade: "कोई ट्रेड नहीं",
    bullish: "CE / तेजी",
    bearish: "PE / मंदी",
    neutral: "तटस्थ",
    missedTitle: "छूटे ट्रेड की सीख",
    missedSub: "क्वालिफ़ाई होने के बाद भी न खुले सेटअप को 5, 15 और 30 मिनट बाद वास्तविक ऑप्शन भाव व सभी खर्चों के साथ जाँचा जाता है।",
    missedApplied: "मिस्ड-ट्रेड AI V2 • लागू है",
    missedAppliedSub: "5/15/30मि का वास्तविक ऑप्शन P&L • केवल शैडो सीख",
    captured: "सेव किए सेटअप",
    tracking: "परिणाम लंबित",
    wouldProfit: "15मि में लाभ होता",
    avoidedLoss: "ब्लॉक से नुकसान बचा",
    learningSamples: "AI सीख नमूने",
    noMissed: "अभी कोई क्वालिफ़ाइड छूटा सेटअप सेव नहीं हुआ है।",
    counterfactual: "यह केवल शैडो तुलना है। परिणाम मिलने के बाद AI इससे सीखता है, लेकिन यह ट्रेड ब्लॉक या ऑर्डर नहीं कर सकता।",
    pendingOutcome: "परिणाम लंबित",
    missedProfit: "लाभ वाला छूटा ट्रेड",
    savedLoss: "सही ब्लॉक",
    noEdge: "खर्च बाद लाभ नहीं",
    unavailableOutcome: "उपलब्ध नहीं",
    perLotShort: "प्रति लॉट",
    profitPnl: "लाभ (+)",
    lossPnl: "नुकसान (-)",
    flatPnl: "बराबर (0)",
    pendingPnl: "लंबित",
    netProfitPnl: "कुल लाभ (+)",
    netLossPnl: "कुल नुकसान (-)",
    netFlatPnl: "कुल बराबर (0)",
    pnlAfterCosts: "सभी खर्चों के बाद अनुमानित ट्रेड P&L • प्रति लॉट",
    expiryShort: "एक्सपायरी",
    entryPremium: "एंट्री प्रीमियम",
    quantityShort: "मात्रा",
    scoreShort: "स्कोर",
    retiredRule: "पुराना नियम हटाया गया",
    retiredEmaRule: "फिक्स्ड EMA दूरी अब नए ट्रेड को ब्लॉक नहीं करती",
    retiredTriggerRule: "नए ट्रेड के लिए ORB/मोमेंटम अब अनिवार्य नहीं है",
    capturedAt: "सेव समय",
    brokerSymbol: "कॉन्ट्रैक्ट",
    contractResolving: "सटीक ऑप्शन कॉन्ट्रैक्ट मिल रहा है",
  },
};

const FEATURE_LABELS = {
  base_ce: ["Base CE signal", "बेस CE संकेत"],
  base_pe: ["Base PE signal", "बेस PE संकेत"],
  base_no_trade: ["Base no-trade", "बेस नो-ट्रेड संकेत"],
  option_ce: ["Option-chain CE view", "ऑप्शन-चेन CE संकेत"],
  option_pe: ["Option-chain PE view", "ऑप्शन-चेन PE संकेत"],
  option_no_trade: ["Option-chain no-trade", "ऑप्शन-चेन नो-ट्रेड"],
  option_confidence: ["Option confidence", "ऑप्शन भरोसा"],
  option_risk: ["Option risk", "ऑप्शन जोखिम"],
  coverage: ["Data coverage", "डेटा कवरेज"],
  pcr: ["PCR", "PCR"],
  oi_direction: ["Open-interest direction", "ओपन इंटरेस्ट दिशा"],
  depth_imbalance: ["Bid/ask depth", "बिड/आस्क डेप्थ"],
  spread_percent: ["Option spread", "ऑप्शन स्प्रेड"],
  average_iv: ["Implied volatility", "इम्प्लाइड वोलैटिलिटी"],
  news_ce: ["Positive-news bias", "सकारात्मक समाचार संकेत"],
  news_pe: ["Negative-news bias", "नकारात्मक समाचार संकेत"],
  news_strength: ["News strength", "समाचार की ताकत"],
  news_risk: ["News risk", "समाचार जोखिम"],
  india_vix: ["India VIX", "इंडिया VIX"],
  india_vix_change: ["VIX change", "VIX बदलाव"],
  adx: ["ADX trend strength", "ADX ट्रेंड ताकत"],
  rsi: ["RSI", "RSI"],
  atr_percent: ["ATR volatility", "ATR अस्थिरता"],
  volume_ratio: ["Volume ratio", "वॉल्यूम अनुपात"],
  free_indicator_available: ["Free indicators available", "मुफ़्त इंडिकेटर उपलब्ध"],
  choppiness_index: ["Choppiness Index", "चॉपिनेस इंडेक्स"],
  choppiness_trending: ["Trending regime", "ट्रेंडिंग स्थिति"],
  choppiness_sideways: ["Sideways regime", "साइडवेज़ स्थिति"],
  squeeze_on: ["Squeeze active", "स्क्वीज़ चालू"],
  squeeze_release: ["Squeeze release", "स्क्वीज़ रिलीज़"],
  squeeze_momentum: ["Squeeze momentum", "स्क्वीज़ मोमेंटम"],
  squeeze_direction_ce: ["Squeeze CE direction", "स्क्वीज़ CE दिशा"],
  squeeze_direction_pe: ["Squeeze PE direction", "स्क्वीज़ PE दिशा"],
  squeeze_momentum_rising: ["Squeeze momentum rising", "स्क्वीज़ मोमेंटम बढ़ रहा"],
};

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fixed(value, digits = 2) {
  if (value == null || value === "") return "--";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "--";
}

function money(value) {
  if (value == null || value === "") return "--";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  const sign = parsed > 0 ? "+" : parsed < 0 ? "-" : "";
  return `${sign}₹${Math.abs(parsed).toFixed(2)}`;
}

function pnlPresentation(value, copy, net = false) {
  if (value == null || value === "") {
    return { color: C.purple, label: copy.pendingPnl, value: "--", sign: "PENDING" };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { color: C.purple, label: copy.pendingPnl, value: "--", sign: "PENDING" };
  }
  if (parsed > 0) {
    return {
      color: C.green,
      label: net ? copy.netProfitPnl : copy.profitPnl,
      value: money(parsed),
      sign: "PROFIT",
    };
  }
  if (parsed < 0) {
    return {
      color: C.red,
      label: net ? copy.netLossPnl : copy.lossPnl,
      value: money(parsed),
      sign: "LOSS",
    };
  }
  return {
    color: C.blue,
    label: net ? copy.netFlatPnl : copy.flatPnl,
    value: money(0),
    sign: "FLAT",
  };
}

function compactNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
}

function formatExpiry(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value || "--");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(match[3])} ${months[Number(match[2]) - 1] || match[2]} ${match[1]}`;
}

function formatCapturedIst(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) return "--";
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hour24 = ist.getUTCHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(ist.getUTCMinutes()).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  return `${ist.getUTCDate()} ${months[ist.getUTCMonth()]} • ${hour12}:${minute} ${period} IST`;
}

function missedContractTitle(item) {
  const contract = item?.candidateContract || {};
  const side = String(contract.side || item?.side || "WAIT").toUpperCase();
  const strike = Number(contract.strike);
  if (Number.isFinite(strike) && strike > 0) {
    return `${item?.underlying || "INDEX"} ${compactNumber(strike)} ${side}`;
  }
  const symbol = String(contract.symbol || "").trim();
  return symbol || `${item?.underlying || "INDEX"} ${side}`;
}

function humanize(value) {
  return String(value || "--").replace(/_/g, " ").trim();
}

function missedReasonText(value, copy) {
  const reason = String(value || "").trim().toUpperCase();
  if (reason === "EMA_EXTENSION_OVER_0.95_ATR") {
    return `${copy.retiredRule} • ${copy.retiredEmaRule}`;
  }
  if (reason === "ORB_OR_MOMENTUM_TRIGGER_REQUIRED") {
    return `${copy.retiredRule} • ${copy.retiredTriggerRule}`;
  }
  return humanize(value);
}

function shorten(value, max = 125) {
  const text = String(value || "").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function modelDisplayStatus(model) {
  const raw = String(model?.display_status || model?.status || "COLLECTING").toUpperCase();
  if (raw.includes("VALIDATED") || raw === "ACTIVE_SHADOW") return "VALIDATED";
  if (raw.includes("REJECTED") || raw === "VALIDATION_FAILED") return "REJECTED";
  if (raw.includes("RETRAIN")) return "RETRAINING";
  if (raw.includes("ERROR")) return "ERROR";
  return "COLLECTING";
}

function statusColor(status) {
  if (status === "VALIDATED") return C.green;
  if (status === "REJECTED" || status === "ERROR") return C.red;
  if (status === "RETRAINING") return C.gold;
  return C.purple;
}

function normalizeAdvancedReport(data) {
  if (!data || data.success !== true) return null;
  const latest = Array.isArray(data.recent_decisions) ? data.recent_decisions[0] : null;
  const option = latest?.option_summary || {};
  const summary = data.summary || {};
  const models = data.adaptive_models?.models || [];
  const model15 = models.find((item) => Number(item?.horizon_minutes) === 15) || models[0] || {};
  const diagnostics = model15?.diagnostics || {};
  return {
    broker: String(latest?.broker || data.active_broker || "waiting").toUpperCase(),
    optionDecision: latest?.option_decision || option.option_direction || "NO_TRADE",
    coverage: asNumber(latest?.data_coverage_score || option.data_coverage_score, 0),
    optionRisk: asNumber(latest?.option_risk_score || option.risk_score, 0),
    pcr: option.pcr,
    maxPain: option.max_pain,
    displayStatus: modelDisplayStatus(model15),
    modelSamples: asNumber(model15.sample_count, 0),
    modelRequired: asNumber(data.adaptive_models?.minimum_training_samples, 300),
    validationAccuracy: model15.validation_accuracy_percent,
    baselineAccuracy: model15.baseline_accuracy_percent,
    brierScore: model15.brier_score,
    evaluated15m: asNumber(summary.evaluated_15m, 0),
    hitRate15m: summary.advanced_15m_hit_rate_percent,
    netBenefit15m: summary.advanced_vs_base_net_benefit_rupees_per_lot_15m,
    topFeatures: Array.isArray(diagnostics.top_features) ? diagnostics.top_features : [],
    groupImportance: diagnostics.feature_group_importance_percent || {},
    failedChecks: Array.isArray(diagnostics.activation_gate?.failed_checks)
      ? diagnostics.activation_gate.failed_checks
      : [],
    newsEffect: diagnostics.news_effect || {},
  };
}

function normalizeNewsReport(data) {
  if (!data || data.success !== true) return null;
  const current = data.current_news || {};
  const summary = data.summary || {};
  const latest = Array.isArray(data.recent_decisions) ? data.recent_decisions[0] : null;
  return {
    bias: String(current.news_bias || "NEUTRAL").toUpperCase(),
    strength: asNumber(current.news_strength, 0),
    risk: asNumber(current.news_risk_score, 0),
    eventCount: asNumber(current.event_count, 0),
    highImpactCount: asNumber(current.high_impact_count, 0),
    fresh: Boolean(current.fresh),
    headlines: Array.isArray(current.top_headlines) ? current.top_headlines : [],
    hitRate15m: summary.fusion_15m_hit_rate_percent,
    benefit15m: summary.estimated_net_benefit_vs_base_spot_points_15m,
    marketReaction: latest?.market_reaction || "NEWS_MARKET_REACTION_UNCLEAR",
  };
}

function normalizeFreeIndicatorReport(data) {
  if (!data || data.success !== true) return null;
  const features = data.features || {};
  return {
    symbol: String(data.symbol || "NIFTY").toUpperCase(),
    available: asNumber(features.free_indicator_available, 0) >= 0.5,
    completedCandles: asNumber(data.completed_candle_count, 0),
    requiredCandles: asNumber(data.minimum_candles_required, 40),
    choppiness: asNumber(features.choppiness_index, 0) * 100,
    trending: asNumber(features.choppiness_trending, 0),
    sideways: asNumber(features.choppiness_sideways, 0),
    squeezeOn: asNumber(features.squeeze_on, 0) >= 0.5,
    squeezeRelease: asNumber(features.squeeze_release, 0) >= 0.5,
    momentum: asNumber(features.squeeze_momentum, 0),
    directionCe: asNumber(features.squeeze_direction_ce, 0) >= 0.5,
    directionPe: asNumber(features.squeeze_direction_pe, 0) >= 0.5,
    momentumRising: asNumber(features.squeeze_momentum_rising, 0) >= 0.5,
    engineUpdatedAt: data.engine_updated_at || null,
  };
}

function normalizeMissedReport(data) {
  if (!data || data.success !== true) return null;
  const summary = data.summary || {};
  const recent = Array.isArray(data.recent_missed_setups)
    ? data.recent_missed_setups.map((item) => ({
        id: item?.id,
        createdAt: item?.created_at,
        underlying: String(item?.underlying || "INDEX").toUpperCase(),
        side: String(item?.candidate_side || "WAIT").toUpperCase(),
        score: asNumber(item?.strategy_score, 0),
        minScore: asNumber(item?.min_score, 82),
        status: String(item?.status || "PENDING_CONTRACT").toUpperCase(),
        decisionKind: String(item?.decision_kind || "STRATEGY_BLOCKED").toUpperCase(),
        reasons: Array.isArray(item?.block_reasons) ? item.block_reasons : [],
        primary: item?.primary_outcome || null,
        outcomes: Array.isArray(item?.outcomes) ? item.outcomes : [],
        learningEligible: Boolean(item?.learning_eligible),
        candidateContract: item?.candidate_contract || {},
        entryPrice: item?.candidate_entry_price,
        lotSize: asNumber(item?.candidate_lot_size, 0),
      }))
    : [];
  return {
    captured: asNumber(summary.captured_total, 0),
    tracking: asNumber(summary.tracking, 0),
    evaluated15m: asNumber(summary.evaluated_15m, 0),
    wouldProfit15m: asNumber(summary.would_have_profited_15m, 0),
    avoidedLoss15m: asNumber(summary.block_avoided_loss_15m, 0),
    learningSamples15m: asNumber(summary.training_samples_added_15m, 0),
    netPnl15m: asNumber(summary.candidate_net_pnl_rupees_per_lot_15m, 0),
    shown: asNumber(data?.recent_pagination?.shown, recent.length),
    total: asNumber(data?.recent_pagination?.total, summary.captured_total || recent.length),
    hasMore: data?.recent_pagination?.has_more == null
      ? recent.length < asNumber(summary.captured_total, recent.length)
      : Boolean(data.recent_pagination.has_more),
    nextLimit: asNumber(data?.recent_pagination?.next_limit, recent.length + 20),
    recent,
  };
}

function Card({ children, glow }) {
  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: glow ? `${glow}66` : C.border,
        padding: 15,
        marginBottom: 12,
        ...(glow ? { shadowColor: glow, shadowOpacity: 0.16, shadowRadius: 10, elevation: 5 } : {}),
      },
    },
    children
  );
}

function SectionTitle({ title, subtitle }) {
  return React.createElement(
    View,
    { style: { marginBottom: 11 } },
    React.createElement(Text, { style: { color: C.text, fontSize: 17, fontWeight: "900" } }, title),
    React.createElement(Text, { style: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 } }, subtitle)
  );
}

function Metric({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        width: "48%",
        minHeight: 76,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card2,
        padding: 11,
        justifyContent: "center",
      },
    },
    React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: "900" } }, label),
    React.createElement(Text, { style: { color: color || C.text, fontSize: 14, fontWeight: "900", marginTop: 6 } }, String(value ?? "--"))
  );
}

function MetricGrid({ children }) {
  return React.createElement(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, children);
}

function InfoBox({ children, color = C.blue }) {
  return React.createElement(
    View,
    {
      style: {
        marginTop: 9,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: `${color}44`,
        backgroundColor: `${color}12`,
        padding: 11,
      },
    },
    React.createElement(Text, { style: { color: C.sub, fontSize: 11, lineHeight: 18 } }, children)
  );
}

function directionLabel(value, copy) {
  const raw = String(value || "NO_TRADE").toUpperCase();
  if (raw === "CE") return copy.bullish;
  if (raw === "PE") return copy.bearish;
  if (raw === "NEUTRAL") return copy.neutral;
  return copy.noTrade;
}

function featureDirection(value, lang) {
  const raw = String(value || "--").toUpperCase();
  if (raw === "CE") return lang === "hi" ? "CE / तेजी" : "CE / Bullish";
  if (raw === "PE") return lang === "hi" ? "PE / मंदी" : "PE / Bearish";
  if (raw === "NO_TRADE") return lang === "hi" ? "कोई ट्रेड नहीं" : "NO TRADE";
  if (raw === "NEUTRAL") return lang === "hi" ? "तटस्थ" : "Neutral";
  return humanize(value);
}

function statusLabel(status, copy) {
  if (status === "VALIDATED") return copy.validated;
  if (status === "REJECTED") return copy.rejected;
  if (status === "RETRAINING") return copy.retraining;
  if (status === "ERROR") return copy.error;
  return copy.collecting;
}

function missedVerdict(item, copy) {
  const verdict = String(item?.primary?.verdict || "").toUpperCase();
  if (verdict === "MISSED_PROFIT") return copy.missedProfit;
  if (verdict === "BLOCK_AVOIDED_LOSS") return copy.savedLoss;
  if (verdict === "NO_EDGE_AFTER_COSTS") return copy.noEdge;
  if (["CONTRACT_UNAVAILABLE", "PARTIAL_OR_UNAVAILABLE"].includes(item?.status)) {
    return copy.unavailableOutcome;
  }
  return copy.pendingOutcome;
}

function missedVerdictColor(item) {
  const verdict = String(item?.primary?.verdict || "").toUpperCase();
  if (verdict === "MISSED_PROFIT") return C.gold;
  if (verdict === "BLOCK_AVOIDED_LOSS") return C.green;
  if (verdict === "NO_EDGE_AFTER_COSTS") return C.blue;
  if (["CONTRACT_UNAVAILABLE", "PARTIAL_OR_UNAVAILABLE"].includes(item?.status)) return C.red;
  return C.purple;
}

function MissedOutcomeBadges({ item, copy }) {
  const outcomes = Array.isArray(item?.outcomes) ? item.outcomes : [];
  const byHorizon = new Map(
    outcomes.map((outcome) => [asNumber(outcome?.horizon_minutes, 0), outcome])
  );

  return React.createElement(
    View,
    null,
    React.createElement(
      View,
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 } },
      [5, 15, 30].map((horizon) => {
        const outcome = byHorizon.get(horizon);
        const pnl = pnlPresentation(outcome?.candidate_net_pnl, copy);
        return React.createElement(
          View,
          {
            key: horizon,
            style: {
              flexGrow: 1,
              flexBasis: "30%",
              minWidth: 88,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: `${pnl.color}77`,
              backgroundColor: `${pnl.color}12`,
              paddingHorizontal: 7,
              paddingVertical: 7,
            },
          },
          React.createElement(
            Text,
            { style: { color: pnl.color, fontSize: 8.5, fontWeight: "900" } },
            `${horizon}m • ${pnl.label}`
          ),
          React.createElement(
            Text,
            { style: { color: pnl.color, fontSize: 12, fontWeight: "900", marginTop: 3 } },
            pnl.value
          )
        );
      })
    ),
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 5 } },
      copy.pnlAfterCosts
    )
  );
}

function modelConclusion(report, lang) {
  const hi = lang === "hi";
  if (!report) return hi ? "मॉडल रिपोर्ट लोड हो रही है।" : "The model report is loading.";
  const validation = fixed(report.validationAccuracy, 2);
  const baseline = fixed(report.baselineAccuracy, 2);
  if (report.displayStatus === "REJECTED") {
    return hi
      ? `मॉडल की वैलिडेशन सटीकता ${validation}% रही, जबकि बेसलाइन ${baseline}% थी। मॉडल बेस रणनीति से बेहतर साबित नहीं हुआ, इसलिए इसे ट्रेड निर्णय में उपयोग नहीं किया जा रहा। नया डेटा मिलने पर यह दोबारा ट्रेन होगा।`
      : `Validation accuracy was ${validation}% versus a ${baseline}% baseline. The model did not beat the base strategy, so it is not used for trade decisions and will retrain as new data arrives.`;
  }
  if (report.displayStatus === "VALIDATED") {
    return hi
      ? `मॉडल ने समयानुसार वैलिडेशन में ${validation}% सटीकता दी और ${baseline}% बेसलाइन से बेहतर रहा। फिर भी यह अभी केवल निगरानी में है।`
      : `The model achieved ${validation}% chronological validation accuracy and beat the ${baseline}% baseline. It still remains monitor-only.`;
  }
  if (report.displayStatus === "RETRAINING") {
    return hi
      ? "नए परिणामों के आधार पर मॉडल दोबारा सीख रहा है। नई वैलिडेशन पूरी होने तक इसे ट्रेड में उपयोग नहीं किया जाएगा।"
      : "The model is retraining on newer outcomes and will not be used until fresh validation is complete.";
  }
  if (report.displayStatus === "ERROR") {
    return hi
      ? "मॉडल जाँच में तकनीकी त्रुटि आई है। ट्रेडिंग रणनीति प्रभावित नहीं होगी क्योंकि AI केवल निगरानी मोड में है।"
      : "A technical error occurred during model evaluation. The trading strategy is unaffected because AI remains monitor-only.";
  }
  return hi
    ? `अभी ${report.modelSamples}/${report.modelRequired} सत्यापित परिणाम एकत्र हुए हैं। न्यूनतम डेटा और वैलिडेशन पूरा होने से पहले मॉडल ट्रेड में उपयोग नहीं होगा।`
    : `${report.modelSamples}/${report.modelRequired} verified outcomes have been collected. The model will not be used until minimum data and validation requirements are met.`;
}

function newsUsefulnessText(effect, lang) {
  const hi = lang === "hi";
  const usefulness = String(effect?.usefulness || "PENDING").toUpperCase();
  const delta = asNumber(effect?.accuracy_delta_percentage_points, 0);
  const signed = `${delta >= 0 ? "+" : ""}${fixed(delta, 2)} pp`;
  if (usefulness === "HELPFUL") {
    return hi
      ? `समाचार डेटा जोड़ने से वैलिडेशन सटीकता ${signed} बदली और परिणाम बेहतर हुए। फिर भी इसे बाज़ार और ऑप्शन डेटा के साथ ही देखा जाएगा।`
      : `Adding news changed validation accuracy by ${signed} and improved the result. It will still be combined with market and option data.`;
  }
  if (usefulness === "HARMFUL") {
    return hi
      ? `समाचार डेटा जोड़ने से वैलिडेशन सटीकता ${signed} बदली और परिणाम कमजोर हुए। इसे फिलहाल शोर माना जाएगा।`
      : `Adding news changed validation accuracy by ${signed} and weakened the result. It will be treated as noise.`;
  }
  if (usefulness === "NEUTRAL" || usefulness === "NEUTRAL_UNPROVEN") {
    return hi
      ? "अभी यह साबित नहीं हुआ कि समाचार मॉडल को लगातार बेहतर बनाता है। अधिक परिणाम मिलने तक यह केवल संदर्भ रहेगा।"
      : "There is not yet enough evidence that news consistently improves the model. It remains contextual until more outcomes are available.";
  }
  return hi ? "समाचार के प्रभाव की अलग वैलिडेशन जाँच अभी लंबित है।" : "The separate validation test for news impact is pending.";
}

function currentNewsReading(news, lang) {
  const hi = lang === "hi";
  if (!news) return hi ? "समाचार रिपोर्ट लोड हो रही है।" : "The news report is loading.";
  if (!news.fresh) {
    return hi
      ? "अभी कोई ताज़ा दिशात्मक समाचार संकेत नहीं मिला। समाचार को ट्रेड का कारण नहीं माना जा रहा।"
      : "No fresh directional news signal is available. News is not being treated as a trade reason.";
  }
  const direction = featureDirection(news.bias, lang);
  const reaction = humanize(news.marketReaction);
  return hi
    ? `वर्तमान समाचार दिशा ${direction} है। बाज़ार प्रतिक्रिया: ${reaction}। यह संबंध बताता है, लेकिन केवल इससे कारण सिद्ध नहीं होता।`
    : `The current news bias is ${direction}. Market reaction: ${reaction}. This shows correlation, not proof that the headline caused the move.`;
}

function AdvancedAiTabScreen() {
  const [token, setToken] = React.useState("");
  const [lang, setLang] = React.useState("en");
  const [advanced, setAdvanced] = React.useState(null);
  const [news, setNews] = React.useState(null);
  const [missed, setMissed] = React.useState(null);
  const [missedLimit, setMissedLimit] = React.useState(20);
  const [showMissedTrades, setShowMissedTrades] = React.useState(true);
  const OKAI_MISSED_TRADE_DROPDOWN_V6 = true;
  const [freeIndicators, setFreeIndicators] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(["saas_token", "okai_lang"])
      .then((rows) => {
        if (!active) return;
        const values = Object.fromEntries(rows);
        if (values.saas_token) setToken(values.saas_token);
        if (values.okai_lang === "hi" || values.okai_lang === "en") setLang(values.okai_lang);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const fetchJson = async (path) => {
      const response = await fetch(`${SAAS_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = null;
      try { data = await response.json(); } catch (_) { throw new Error(`HTTP ${response.status}`); }
      if (!response.ok) throw new Error(data?.detail || data?.message || `HTTP ${response.status}`);
      return data;
    };

    const results = await Promise.allSettled([
      fetchJson("/bot/ai-advanced-monitor?recent_limit=3"),
      fetchJson("/bot/ai-news-monitor?recent_limit=3"),
      fetchJson(`/bot/ai-missed-trades?recent_limit=${missedLimit}`),
      fetchJson("/bot/ai-free-indicators"),
    ]);
    const messages = [];
    if (results[0].status === "fulfilled") {
      const value = normalizeAdvancedReport(results[0].value);
      if (value) setAdvanced(value); else messages.push("Advanced AI response invalid");
    } else messages.push(String(results[0].reason?.message || "Advanced AI unavailable"));
    if (results[1].status === "fulfilled") {
      const value = normalizeNewsReport(results[1].value);
      if (value) setNews(value); else messages.push("News AI response invalid");
    } else messages.push(String(results[1].reason?.message || "News AI unavailable"));
    if (results[2].status === "fulfilled") {
      const value = normalizeMissedReport(results[2].value);
      if (value) setMissed(value); else messages.push("Missed-trade learning response invalid");
    } else messages.push(String(results[2].reason?.message || "Missed-trade learning unavailable"));
    if (results[3].status === "fulfilled") {
      const value = normalizeFreeIndicatorReport(results[3].value);
      if (value) setFreeIndicators(value); else messages.push("Free-indicator response invalid");
    } else messages.push(String(results[3].reason?.message || "Free indicators unavailable"));
    setError(messages.join(" • "));
    setLoading(false);
  }, [token, missedLimit]);

  React.useEffect(() => {
    if (!token) return undefined;
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [token, load]);

  function changeLanguage(next) {
    setLang(next);
    AsyncStorage.setItem("okai_lang", next).catch(() => {});
  }

  const copy = COPY[lang] || COPY.en;
  const status = advanced?.displayStatus || "COLLECTING";
  const mainColor = statusColor(status);
  const optionDirection = String(advanced?.optionDecision || "NO_TRADE").toUpperCase();
  const optionColor = optionDirection === "CE" ? C.green : optionDirection === "PE" ? C.red : C.gold;
  const newsColor = news?.bias === "CE" ? C.green : news?.bias === "PE" ? C.red : C.gold;
  const effect = advanced?.newsEffect || {};
  const usefulness = String(effect?.usefulness || "PENDING").toUpperCase();
  const usefulnessColor = usefulness === "HELPFUL" ? C.green : usefulness === "HARMFUL" ? C.red : C.gold;
  const usefulnessLabel = usefulness === "HELPFUL"
    ? (lang === "hi" ? "उपयोगी" : "Helpful")
    : usefulness === "HARMFUL"
      ? (lang === "hi" ? "हानिकारक" : "Harmful")
      : usefulness === "PENDING"
        ? (lang === "hi" ? "लंबित" : "Pending")
        : (lang === "hi" ? "अभी सिद्ध नहीं" : "Not proven");
  const group = advanced?.groupImportance || {};
  const freeAvailable = Boolean(freeIndicators?.available);
  const chopValue = freeAvailable ? fixed(freeIndicators?.choppiness, 2) : "--";
  const regimeLabel = !freeAvailable
    ? copy.waitingCandles
    : freeIndicators.choppiness < 38.2
      ? copy.trend
      : freeIndicators.choppiness > 61.8
        ? copy.sideways
        : copy.transition;
  const regimeColor = !freeAvailable
    ? C.purple
    : freeIndicators.choppiness < 38.2
      ? C.green
      : freeIndicators.choppiness > 61.8
        ? C.red
        : C.gold;
  const squeezeLabel = !freeAvailable
    ? copy.waitingCandles
    : freeIndicators.squeezeRelease
      ? copy.squeezeReleased
      : freeIndicators.squeezeOn
        ? copy.squeezeOn
        : copy.squeezeOff;
  const squeezeColor = !freeAvailable
    ? C.purple
    : freeIndicators.squeezeRelease
      ? C.green
      : freeIndicators.squeezeOn
        ? C.gold
        : C.blue;
  const momentumDirection = !freeAvailable
    ? copy.waitingCandles
    : freeIndicators.directionCe
      ? copy.bullish
      : freeIndicators.directionPe
        ? copy.bearish
        : copy.neutral;
  const momentumColor = !freeAvailable
    ? C.purple
    : freeIndicators.directionCe
      ? C.green
      : freeIndicators.directionPe
        ? C.red
        : C.gold;
  const momentumValue = freeAvailable
    ? `${momentumDirection} • ${freeIndicators.momentum >= 0 ? "+" : ""}${fixed(freeIndicators.momentum, 2)} • ${freeIndicators.momentumRising ? copy.rising : copy.falling}`
    : copy.waitingCandles;
  const aggregate15m = pnlPresentation(
    missed?.evaluated15m > 0 ? missed?.netPnl15m : null,
    copy,
    true
  );

  return React.createElement(
    View,
    { style: { padding: 16, paddingBottom: 115 } },
    React.createElement(
      Card,
      { glow: mainColor },
      React.createElement(
        View,
        { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" } },
        React.createElement(
          View,
          { style: { flex: 1, paddingRight: 10 } },
          React.createElement(Text, { style: { color: C.text, fontSize: 21, fontWeight: "900" } }, `🧠 ${copy.title}`),
          React.createElement(Text, { style: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 } }, copy.subtitle)
        ),
        React.createElement(
          View,
          { style: { borderRadius: 9, borderWidth: 1, borderColor: `${mainColor}66`, backgroundColor: `${mainColor}18`, paddingHorizontal: 9, paddingVertical: 5 } },
          React.createElement(Text, { style: { color: mainColor, fontSize: 10, fontWeight: "900" } }, statusLabel(status, copy))
        )
      ),
      React.createElement(
        View,
        {
          style: {
            marginTop: 13,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: `${C.gold}88`,
            backgroundColor: `${C.gold}13`,
            paddingHorizontal: 11,
            paddingVertical: 9,
          },
        },
        React.createElement(Text, { style: { color: C.gold, fontSize: 11, fontWeight: "900" } }, copy.missedApplied),
        React.createElement(
          Text,
          { style: { color: C.sub, fontSize: 9.5, lineHeight: 15, marginTop: 3 } },
          `${copy.missedAppliedSub} • ${missed?.captured ?? 0} captured`
        )
      ),
      React.createElement(
        View,
        { style: { flexDirection: "row", gap: 7, marginTop: 13 } },
        [
          ["hi", "हिंदी", C.green],
          ["en", "English", C.blue],
        ].map(([value, label, color]) => React.createElement(
          TouchableOpacity,
          {
            key: value,
            onPress: () => changeLanguage(value),
            style: {
              flex: 1,
              minHeight: 39,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: lang === value ? color : C.border,
              backgroundColor: lang === value ? `${color}16` : C.card2,
              alignItems: "center",
              justifyContent: "center",
            },
          },
          React.createElement(Text, { style: { color: lang === value ? color : C.muted, fontSize: 11, fontWeight: "900" } }, label)
        ))
      ),
      React.createElement(
        TouchableOpacity,
        {
          onPress: load,
          disabled: loading || !token,
          style: {
            marginTop: 10,
            minHeight: 42,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${C.blue}66`,
            backgroundColor: `${C.blue}12`,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 7,
          },
        },
        loading ? React.createElement(ActivityIndicator, { color: C.blue, size: "small" }) : null,
        React.createElement(Text, { style: { color: C.blue, fontSize: 12, fontWeight: "900" } }, loading ? copy.refreshing : copy.refresh)
      )
    ),

    React.createElement(
      Card,
      null,
      React.createElement(SectionTitle, { title: copy.overview, subtitle: copy.overviewSub }),
      React.createElement(
        MetricGrid,
        null,
        React.createElement(Metric, { label: copy.broker, value: advanced?.broker || copy.waiting, color: C.blue }),
        React.createElement(Metric, { label: copy.optionView, value: directionLabel(optionDirection, copy), color: optionColor }),
        React.createElement(Metric, { label: copy.coverage, value: advanced ? `${fixed(advanced.coverage, 0)}%` : "--", color: advanced?.coverage >= 65 ? C.green : C.gold }),
        React.createElement(Metric, { label: copy.optionRisk, value: advanced ? `${fixed(advanced.optionRisk, 0)}/100` : "--", color: advanced?.optionRisk >= 60 ? C.red : C.green }),
        React.createElement(Metric, { label: copy.pcr, value: fixed(advanced?.pcr, 2), color: C.blue }),
        React.createElement(Metric, { label: copy.maxPain, value: advanced?.maxPain ?? "--", color: C.purple }),
        React.createElement(Metric, { label: copy.model, value: `${statusLabel(status, copy)} ${advanced?.modelSamples || 0}/${advanced?.modelRequired || 300}`, color: mainColor }),
        React.createElement(Metric, {
          label: copy.result15m,
          value: advanced?.hitRate15m != null
            ? `${fixed(advanced.hitRate15m, 2)}% • ${advanced.evaluated15m} ${copy.evaluated}`
            : `${advanced?.evaluated15m || 0} ${copy.evaluated}`,
          color: C.purple,
        })
      )
    ),

    React.createElement(
      Card,
      { glow: freeAvailable ? regimeColor : C.purple },
      React.createElement(
        View,
        { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } },
        React.createElement(
          View,
          { style: { flex: 1 } },
          React.createElement(SectionTitle, { title: `📊 ${copy.freeTitle}`, subtitle: copy.freeSub })
        ),
        React.createElement(
          View,
          { style: { borderRadius: 8, borderWidth: 1, borderColor: `${C.green}66`, backgroundColor: `${C.green}14`, paddingHorizontal: 7, paddingVertical: 4 } },
          React.createElement(Text, { style: { color: C.green, fontSize: 8, fontWeight: "900" } }, copy.freeBadge)
        )
      ),
      React.createElement(
        MetricGrid,
        null,
        React.createElement(Metric, { label: copy.choppiness, value: freeAvailable ? `${chopValue}/100` : "--", color: regimeColor }),
        React.createElement(Metric, { label: copy.regime, value: regimeLabel, color: regimeColor }),
        React.createElement(Metric, { label: copy.squeeze, value: squeezeLabel, color: squeezeColor }),
        React.createElement(Metric, { label: copy.momentum, value: momentumValue, color: momentumColor }),
        React.createElement(Metric, {
          label: copy.candles,
          value: `${freeIndicators?.completedCandles || 0}/${freeIndicators?.requiredCandles || 40}`,
          color: freeAvailable ? C.green : C.purple,
        }),
        React.createElement(Metric, { label: copy.brokerSymbol, value: freeIndicators?.symbol || "NIFTY", color: C.blue })
      ),
      React.createElement(InfoBox, { color: C.blue }, copy.freeSafety)
    ),

    React.createElement(
      Card,
      { glow: C.gold },
      React.createElement(SectionTitle, { title: `🎯 ${copy.missedTitle}`, subtitle: copy.missedSub }),
      React.createElement(
        MetricGrid,
        null,
        React.createElement(Metric, { label: copy.captured, value: missed?.captured ?? 0, color: C.blue }),
        React.createElement(Metric, { label: copy.tracking, value: missed?.tracking ?? 0, color: C.purple }),
        React.createElement(Metric, { label: copy.wouldProfit, value: `${missed?.wouldProfit15m || 0}/${missed?.evaluated15m || 0}`, color: C.gold }),
        React.createElement(Metric, { label: copy.avoidedLoss, value: `${missed?.avoidedLoss15m || 0}/${missed?.evaluated15m || 0}`, color: C.green }),
        React.createElement(Metric, { label: copy.learningSamples, value: missed?.learningSamples15m ?? 0, color: C.blue }),
        React.createElement(Metric, {
          label: `15m ${aggregate15m.label} • ${copy.perLotShort}`,
          value: aggregate15m.value,
          color: aggregate15m.color,
        })
      ),
      missed?.recent?.length
        ? React.createElement(
            TouchableOpacity,
            {
              accessibilityRole: "button",
              accessibilityState: { expanded: showMissedTrades },
              onPress: () => setShowMissedTrades((value) => !value),
              style: {
                marginTop: 13,
                marginBottom: showMissedTrades ? 2 : 0,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.card2,
                paddingHorizontal: 13,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            },
            React.createElement(
              Text,
              { style: { color: C.text, fontSize: 12, fontWeight: "900" } },
              `${showMissedTrades
                ? (lang === "hi" ? "छूटे ट्रेड छिपाएँ" : "Hide missed trades")
                : (lang === "hi" ? "छूटे ट्रेड देखें" : "View missed trades")} (${missed.recent.length}/${missed.total})`
            ),
            React.createElement(
              Text,
              { style: { color: C.gold, fontSize: 18, fontWeight: "900" } },
              showMissedTrades ? "⌃" : "⌄"
            )
          )
        : null,
      showMissedTrades && missed?.recent?.length
        ? React.createElement(
            View,
            { style: { marginTop: 13 } },
            missed.recent.map((item, index) => {
              const color = missedVerdictColor(item);
              const contract = item.candidateContract || {};
              const contractDetails = [
                contract.expiry
                  ? `${copy.expiryShort} ${formatExpiry(contract.expiry)}`
                  : copy.contractResolving,
                asNumber(item.entryPrice, 0) > 0
                  ? `${copy.entryPremium} ₹${Number(item.entryPrice).toFixed(2)}`
                  : null,
                item.lotSize > 0 ? `${copy.quantityShort} ${item.lotSize}` : null,
                `${copy.scoreShort} ${item.score}/${item.minScore}`,
              ].filter(Boolean);
              return React.createElement(
                View,
                {
                  key: item.id || `${item.underlying}-${item.createdAt}-${index}`,
                  style: {
                    borderTopWidth: index ? 1 : 0,
                    borderTopColor: C.border,
                    paddingTop: index ? 11 : 0,
                    paddingBottom: 10,
                  },
                },
                React.createElement(
                  View,
                  { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 } },
                  React.createElement(
                    Text,
                    { style: { color: C.text, fontSize: 12, fontWeight: "900", flex: 1 } },
                    missedContractTitle(item)
                  ),
                  React.createElement(
                    View,
                    { style: { borderRadius: 8, borderWidth: 1, borderColor: `${color}66`, backgroundColor: `${color}16`, paddingHorizontal: 7, paddingVertical: 4 } },
                    React.createElement(Text, { style: { color, fontSize: 8.5, fontWeight: "900" } }, missedVerdict(item, copy))
                  )
                ),
                React.createElement(
                  Text,
                  { style: { color: C.blue, fontSize: 9.5, fontWeight: "800", lineHeight: 15, marginTop: 6 } },
                  contractDetails.join(" • ")
                ),
                contract.symbol
                  ? React.createElement(
                      Text,
                      { style: { color: C.sub, fontSize: 8.5, lineHeight: 14, marginTop: 2 } },
                      `${copy.brokerSymbol}: ${contract.symbol}`
                    )
                  : null,
                React.createElement(
                  Text,
                  { style: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 2 } },
                  `${copy.capturedAt}: ${formatCapturedIst(item.createdAt)}`
                ),
                React.createElement(MissedOutcomeBadges, { item, copy }),
                React.createElement(
                  Text,
                  { style: { color: C.muted, fontSize: 9.5, lineHeight: 15, marginTop: 5 } },
                  shorten(missedReasonText(item.reasons?.[0] || item.decisionKind, copy), 145)
                )
              );
            }),
            missed.hasMore
              ? React.createElement(
                  TouchableOpacity,
                  {
                    accessibilityRole: "button",
                    onPress: () => setMissedLimit((current) => Math.min(5000, Math.max(current + 20, missed.nextLimit))),
                    disabled: loading,
                    style: {
                      marginTop: 4,
                      borderRadius: 11,
                      borderWidth: 1,
                      borderColor: C.blue,
                      paddingVertical: 11,
                      alignItems: "center",
                      opacity: loading ? 0.55 : 1,
                    },
                  },
                  React.createElement(
                    Text,
                    { style: { color: C.blue, fontSize: 10.5, fontWeight: "900" } },
                    loading
                      ? (lang === "hi" ? "लोड हो रहा है..." : "Loading...")
                      : (lang === "hi"
                        ? `20 और लोड करें (${missed.recent.length}/${missed.total})`
                        : `Load 20 more (${missed.recent.length}/${missed.total})`)
                  )
                )
              : React.createElement(
                  Text,
                  { style: { color: C.green, fontSize: 9.5, fontWeight: "800", textAlign: "center", marginTop: 4 } },
                  lang === "hi" ? `सभी ${missed.total} ट्रेड दिख रहे हैं` : `All ${missed.total} missed trades are shown`
                )
          )
        : missed?.recent?.length
        ? null
        : React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 12 } },
            copy.noMissed
          ),
      React.createElement(InfoBox, { color: C.blue }, copy.counterfactual)
    ),

    React.createElement(
      Card,
      { glow: mainColor },
      React.createElement(SectionTitle, { title: copy.performance, subtitle: copy.performanceSub }),
      React.createElement(
        MetricGrid,
        null,
        React.createElement(Metric, { label: copy.validation, value: advanced?.validationAccuracy != null ? `${fixed(advanced.validationAccuracy, 2)}%` : "--", color: mainColor }),
        React.createElement(Metric, { label: copy.baseline, value: advanced?.baselineAccuracy != null ? `${fixed(advanced.baselineAccuracy, 2)}%` : "--", color: C.blue }),
        React.createElement(Metric, { label: copy.brier, value: fixed(advanced?.brierScore, 6), color: C.gold }),
        React.createElement(Metric, {
          label: copy.benefit,
          value: advanced?.netBenefit15m != null
            ? `${Number(advanced.netBenefit15m) >= 0 ? "+" : ""}₹${fixed(advanced.netBenefit15m, 2)} ${copy.perLot}`
            : "--",
          color: Number(advanced?.netBenefit15m || 0) >= 0 ? C.green : C.red,
        })
      ),
      React.createElement(InfoBox, { color: mainColor }, modelConclusion(advanced, lang)),
      advanced?.failedChecks?.length
        ? React.createElement(
            View,
            { style: { marginTop: 11 } },
            React.createElement(Text, { style: { color: C.red, fontSize: 11, fontWeight: "900", marginBottom: 5 } }, copy.failed),
            advanced.failedChecks.slice(0, 5).map((item, index) => React.createElement(
              Text,
              { key: `${item}-${index}`, style: { color: C.muted, fontSize: 10, lineHeight: 17 } },
              `• ${humanize(item)}`
            ))
          )
        : null
    ),

    React.createElement(
      Card,
      null,
      React.createElement(SectionTitle, { title: copy.learned, subtitle: copy.learnedSub }),
      React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900", marginBottom: 6 } }, copy.patterns),
      advanced?.topFeatures?.length
        ? advanced.topFeatures.slice(0, 6).map((item, index) => {
            const labels = FEATURE_LABELS[item?.feature];
            const label = labels ? labels[lang === "hi" ? 1 : 0] : humanize(item?.feature);
            return React.createElement(
              View,
              {
                key: `${item?.feature || index}-${index}`,
                style: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: index < Math.min(advanced.topFeatures.length, 6) - 1 ? 1 : 0, borderBottomColor: C.border },
              },
              React.createElement(Text, { style: { color: C.sub, fontSize: 11, flex: 1, paddingRight: 10 } }, `${index + 1}. ${label}`),
              React.createElement(Text, { style: { color: C.blue, fontSize: 11, fontWeight: "900" } }, featureDirection(item?.supports, lang))
            );
          })
        : React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 11, lineHeight: 18 } },
            lang === "hi" ? "अगली सफल ट्रेनिंग और वैलिडेशन के बाद भरोसेमंद पैटर्न यहाँ दिखेंगे।" : "Trusted patterns will appear after the next successful training and validation cycle."
          ),
      Object.keys(group).length
        ? React.createElement(
            View,
            { style: { marginTop: 13 } },
            React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900", marginBottom: 8 } }, copy.groups),
            React.createElement(
              MetricGrid,
              null,
              React.createElement(Metric, { label: copy.optionChain, value: `${fixed(group.OPTION_CHAIN, 2)}%`, color: C.blue }),
              React.createElement(Metric, { label: copy.news, value: `${fixed(group.NEWS, 2)}%`, color: C.gold }),
              React.createElement(Metric, { label: copy.market, value: `${fixed(group.MARKET, 2)}%`, color: C.green }),
              React.createElement(Metric, { label: copy.global, value: `${fixed(group.GLOBAL, 2)}%`, color: C.purple })
            )
          )
        : null
    ),

    React.createElement(
      Card,
      { glow: newsColor },
      React.createElement(SectionTitle, { title: copy.newsTitle, subtitle: copy.newsSub }),
      React.createElement(
        MetricGrid,
        null,
        React.createElement(Metric, { label: copy.newsBias, value: directionLabel(news?.bias || "NEUTRAL", copy), color: newsColor }),
        React.createElement(Metric, { label: copy.strengthRisk, value: `${fixed(news?.strength, 0)}% / ${fixed(news?.risk, 0)}/100`, color: news?.risk >= 65 ? C.red : newsColor }),
        React.createElement(Metric, { label: copy.events, value: `${news?.eventCount || 0} • ${news?.highImpactCount || 0} ${copy.high}`, color: C.blue }),
        React.createElement(Metric, {
          label: copy.newsTest,
          value: `${usefulnessLabel}${effect?.accuracy_delta_percentage_points != null ? ` • ${asNumber(effect.accuracy_delta_percentage_points, 0) >= 0 ? "+" : ""}${fixed(effect.accuracy_delta_percentage_points, 2)} pp` : ""}`,
          color: usefulnessColor,
        })
      ),
      React.createElement(InfoBox, { color: newsColor }, currentNewsReading(news, lang)),
      React.createElement(InfoBox, { color: usefulnessColor }, newsUsefulnessText(effect, lang)),
      news?.hitRate15m != null
        ? React.createElement(
            Text,
            { style: { color: C.purple, fontSize: 10, lineHeight: 17, marginTop: 10 } },
            lang === "hi"
              ? `समाचार-संयोजन 15-मिनट हिट रेट ${fixed(news.hitRate15m, 2)}% • बेस से अंतर ${asNumber(news.benefit15m, 0) >= 0 ? "+" : ""}${fixed(news.benefit15m, 2)} स्पॉट पॉइंट।`
              : `News-fusion 15-minute hit rate ${fixed(news.hitRate15m, 2)}% • Difference versus base ${asNumber(news.benefit15m, 0) >= 0 ? "+" : ""}${fixed(news.benefit15m, 2)} spot points.`
          )
        : null,
      React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900", marginTop: 13, marginBottom: 6 } }, copy.headlines),
      news?.headlines?.length
        ? news.headlines.slice(0, 5).map((headline, index) => React.createElement(
            View,
            { key: `${headline?.title || index}-${index}`, style: { paddingVertical: 8, borderBottomWidth: index < Math.min(news.headlines.length, 5) - 1 ? 1 : 0, borderBottomColor: C.border } },
            React.createElement(Text, { style: { color: C.sub, fontSize: 11, lineHeight: 17 } }, `• ${shorten(headline?.title)}`),
            React.createElement(Text, { style: { color: C.muted, fontSize: 9, marginTop: 3 } }, featureDirection(headline?.direction || "NEUTRAL", lang))
          ))
        : React.createElement(Text, { style: { color: C.muted, fontSize: 11, lineHeight: 18 } }, copy.noHeadlines)
    ),

    error
      ? React.createElement(
          Card,
          { glow: C.gold },
          React.createElement(Text, { style: { color: C.gold, fontSize: 11, lineHeight: 18 } }, `${copy.retrying}: ${error}`)
        )
      : null,

    React.createElement(
      View,
      { style: { borderRadius: 12, borderWidth: 1, borderColor: `${C.blue}55`, backgroundColor: `${C.blue}10`, padding: 12 } },
      React.createElement(Text, { style: { color: C.blue, fontSize: 10, fontWeight: "900", textAlign: "center" } }, copy.monitorOnly)
    )
  );
}

module.exports = AdvancedAiTabScreen;
module.exports.default = AdvancedAiTabScreen;
module.exports.normalizeAdvancedReport = normalizeAdvancedReport;
module.exports.normalizeNewsReport = normalizeNewsReport;
module.exports.normalizeMissedReport = normalizeMissedReport;
module.exports.normalizeFreeIndicatorReport = normalizeFreeIndicatorReport;
