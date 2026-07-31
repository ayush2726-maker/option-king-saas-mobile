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

function humanize(value) {
  return String(value || "--").replace(/_/g, " ").trim();
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
    setError(messages.join(" • "));
    setLoading(false);
  }, [token]);

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
