const React = require("react");
const {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const LANGUAGE_KEY = "okai_advanced_ai_language_v1";
const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

const COLORS = {
  surface: "#13131f",
  surface2: "#0f0f1a",
  surface3: "#10121d",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#9292ad",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#b06deb",
};

const COPY = {
  hi: {
    title: "Advanced AI V2",
    subtitle: "ऑप्शन डेटा, बाज़ार संकेत, वैश्विक संकेत और समाचार विश्लेषण",
    open: "AI विश्लेषण खोलें",
    overview: "सारांश",
    learning: "AI ने क्या सीखा",
    news: "समाचार विश्लेषण",
    broker: "ब्रोकर",
    optionView: "ऑप्शन संकेत",
    coverage: "डेटा कवरेज",
    optionRisk: "ऑप्शन जोखिम",
    model: "मॉडल स्थिति",
    result15m: "15 मिनट परिणाम",
    validation: "वैलिडेशन सटीकता",
    baseline: "बेसलाइन सटीकता",
    brier: "प्रॉबेबिलिटी त्रुटि",
    topPatterns: "सबसे प्रभावशाली पैटर्न",
    importance: "डेटा समूहों का प्रभाव",
    newsBias: "समाचार संकेत",
    strengthRisk: "ताकत / जोखिम",
    events: "समाचार घटनाएँ",
    newsTest: "समाचार उपयोगिता परीक्षण",
    headlines: "प्रमुख समाचार",
    currentReading: "वर्तमान निष्कर्ष",
    retrying: "डेटा दोबारा प्राप्त किया जा रहा है",
    refreshing: "AI डेटा अपडेट हो रहा है…",
    monitorOnly: "केवल निगरानी • ट्रेड ब्लॉकिंग बंद • ऑर्डर निष्पादन बंद",
    close: "बंद करें",
    waiting: "प्रतीक्षा",
    collecting: "डेटा एकत्र हो रहा है",
    validated: "मान्य",
    rejected: "अस्वीकृत",
    retraining: "दोबारा प्रशिक्षण",
    error: "त्रुटि",
    noTrade: "कोई ट्रेड नहीं",
    ce: "CE (तेजी)",
    pe: "PE (मंदी)",
    neutral: "तटस्थ",
    helpful: "उपयोगी",
    harmful: "हानिकारक",
    unproven: "अभी प्रमाणित नहीं",
    modelRejected: "मॉडल ने पर्याप्त डेटा पर परीक्षण पूरा किया, लेकिन वह सामान्य रणनीति से बेहतर और पर्याप्त रूप से विश्वसनीय साबित नहीं हुआ। इसलिए इसे ट्रेड निर्णयों में उपयोग नहीं किया जा रहा है।",
    modelValidated: "मॉडल ने समय-क्रम के अनुसार किए गए परीक्षण में आवश्यक मानक पूरे किए हैं। फिर भी यह अभी केवल निगरानी मोड में है और ट्रेड को ब्लॉक या निष्पादित नहीं करता।",
    modelRetraining: "नए बाज़ार डेटा के साथ मॉडल दोबारा प्रशिक्षित हो रहा है। नया परिणाम आने तक पुराना मॉडल ट्रेड निर्णयों में उपयोग नहीं होगा।",
    modelCollecting: "मॉडल अभी नए नमूने एकत्र कर रहा है। आवश्यक डेटा पूरा होने के बाद समय-क्रम के अनुसार वैलिडेशन किया जाएगा।",
    modelError: "मॉडल रिपोर्ट में तकनीकी त्रुटि मिली है। सिस्टम सुरक्षित रूप से निगरानी मोड में है।",
    noPatterns: "विश्वसनीय पैटर्न अभी प्रमाणित नहीं हुए हैं। अगले सफल प्रशिक्षण और वैलिडेशन के बाद यहाँ परिणाम दिखेंगे।",
    noFreshNews: "अभी कोई ताज़ा और स्पष्ट दिशात्मक समाचार संकेत नहीं मिला है। समाचार को ट्रेड का अकेला कारण नहीं माना जा रहा है।",
    newsHelpful: "समाचार डेटा जोड़ने से वैलिडेशन सटीकता बेहतर हुई। इसका उपयोग केवल अन्य बाज़ार संकेतों की पुष्टि के लिए किया जाएगा।",
    newsHarmful: "समाचार डेटा जोड़ने से वैलिडेशन सटीकता घटी। यह फिलहाल उपयोगी संकेत के बजाय शोर पैदा कर रहा है।",
    newsUnproven: "समाचार डेटा का लाभ अभी स्पष्ट रूप से प्रमाणित नहीं हुआ है। अधिक डेटा और दोबारा परीक्षण आवश्यक है।",
    advancedVsBase: "सामान्य रणनीति की तुलना में परिणाम",
    perLot15m: "प्रति लॉट, 15 मिनट",
    evaluated: "मूल्यांकित",
    highImpact: "उच्च प्रभाव",
    withNews: "समाचार सहित सटीकता",
    withoutNews: "समाचार के बिना सटीकता",
    fusionResult: "समाचार-फ्यूजन 15 मिनट हिट रेट",
    baseDifference: "बेस रणनीति से अंतर",
    spotPoints: "स्पॉट अंक",
    noHeadlines: "अभी कोई प्रमुख समाचार उपलब्ध नहीं है।",
    compactLine: "विस्तृत AI सीख और समाचार विश्लेषण अलग स्क्रीन में देखें।",
  },
  en: {
    title: "Advanced AI V2",
    subtitle: "Options data, market signals, global cues and news analysis",
    open: "Open AI Analysis",
    overview: "Overview",
    learning: "What AI Learned",
    news: "News Analysis",
    broker: "Broker",
    optionView: "Option View",
    coverage: "Data Coverage",
    optionRisk: "Option Risk",
    model: "Model Status",
    result15m: "15-Minute Result",
    validation: "Validation Accuracy",
    baseline: "Baseline Accuracy",
    brier: "Probability Error",
    topPatterns: "Most Influential Patterns",
    importance: "Feature-Group Importance",
    newsBias: "News Bias",
    strengthRisk: "Strength / Risk",
    events: "News Events",
    newsTest: "News Usefulness Test",
    headlines: "Top Headlines",
    currentReading: "Current Reading",
    retrying: "Retrying data request",
    refreshing: "Refreshing AI data…",
    monitorOnly: "MONITOR ONLY • Trade blocking OFF • Order execution OFF",
    close: "Close",
    waiting: "Waiting",
    collecting: "Collecting",
    validated: "Validated",
    rejected: "Rejected",
    retraining: "Retraining",
    error: "Error",
    noTrade: "No Trade",
    ce: "CE (Bullish)",
    pe: "PE (Bearish)",
    neutral: "Neutral",
    helpful: "Helpful",
    harmful: "Harmful",
    unproven: "Not Proven Yet",
    modelRejected: "The model completed testing on sufficient data, but it did not prove more reliable than the baseline strategy. It is therefore not being used for trade decisions.",
    modelValidated: "The model passed chronological validation. It remains in monitoring mode and cannot block trades or execute orders.",
    modelRetraining: "The model is being retrained with newer market data. The previous model will not be used for trade decisions while retraining is in progress.",
    modelCollecting: "The model is collecting new samples. Chronological validation will run after the required data is available.",
    modelError: "A technical error was found in the model report. The system remains safely in monitoring mode.",
    noPatterns: "No reliable pattern has been proven yet. Results will appear after the next successful training and validation cycle.",
    noFreshNews: "No fresh and clear directional news signal is available. News is not being treated as a standalone trade reason.",
    newsHelpful: "Adding news data improved validation accuracy. It will be used only as confirmation alongside market signals.",
    newsHarmful: "Adding news data reduced validation accuracy. It is currently creating noise instead of a useful signal.",
    newsUnproven: "The value of news data has not been proven clearly yet. More data and another validation cycle are required.",
    advancedVsBase: "Result versus baseline strategy",
    perLot15m: "per lot, 15 minutes",
    evaluated: "evaluated",
    highImpact: "high impact",
    withNews: "Accuracy with news",
    withoutNews: "Accuracy without news",
    fusionResult: "News-fusion 15-minute hit rate",
    baseDifference: "Difference versus base",
    spotPoints: "spot points",
    noHeadlines: "No major headline is available yet.",
    compactLine: "View detailed AI learning and news analysis on a separate screen.",
  },
};

const FEATURE_LABELS = {
  hi: {
    base_ce: "बेस रणनीति का CE संकेत", base_pe: "बेस रणनीति का PE संकेत", base_no_trade: "बेस रणनीति का नो-ट्रेड संकेत",
    option_ce: "ऑप्शन-चेन का CE संकेत", option_pe: "ऑप्शन-चेन का PE संकेत", option_no_trade: "ऑप्शन-चेन का नो-ट्रेड संकेत",
    option_confidence: "ऑप्शन संकेत का भरोसा", option_risk: "ऑप्शन जोखिम", coverage: "डेटा कवरेज", pcr: "PCR",
    oi_direction: "ओपन इंटरेस्ट दिशा", depth_imbalance: "बिड/आस्क डेप्थ", spread_percent: "ऑप्शन स्प्रेड",
    average_iv: "इम्प्लाइड वोलैटिलिटी", news_ce: "सकारात्मक समाचार संकेत", news_pe: "नकारात्मक समाचार संकेत",
    news_strength: "समाचार संकेत की ताकत", news_risk: "समाचार जोखिम", india_vix: "इंडिया VIX", india_vix_change: "VIX बदलाव",
    adx: "ADX ट्रेंड ताकत", rsi: "RSI", atr_percent: "ATR वोलैटिलिटी", volume_ratio: "वॉल्यूम अनुपात",
  },
  en: {
    base_ce: "Base CE signal", base_pe: "Base PE signal", base_no_trade: "Base no-trade signal",
    option_ce: "Option-chain CE view", option_pe: "Option-chain PE view", option_no_trade: "Option-chain no-trade view",
    option_confidence: "Option confidence", option_risk: "Option risk", coverage: "Data coverage", pcr: "PCR",
    oi_direction: "Open-interest direction", depth_imbalance: "Bid/ask depth", spread_percent: "Option spread",
    average_iv: "Implied volatility", news_ce: "Positive-news bias", news_pe: "Negative-news bias", news_strength: "News strength",
    news_risk: "News risk", india_vix: "India VIX", india_vix_change: "VIX change", adx: "ADX trend strength", rsi: "RSI",
    atr_percent: "ATR volatility", volume_ratio: "Volume ratio",
  },
};

function firstValue(...values) { return values.find((value) => value !== undefined && value !== null && value !== ""); }
function signalToSnapshot(signal = {}) {
  return { symbol: firstValue(signal.symbol, signal.underlying, signal.instrument, "NIFTY"), timestamp: firstValue(signal.engine_updated_at, signal.updated_at, signal.timestamp), feedConnected: Boolean(firstValue(signal.feed_connected, signal.data_live, false)), price: firstValue(signal.price, signal.ltp, signal.spot_price, signal.close), adx: signal.adx, rsi: signal.rsi, atrPercent: firstValue(signal.atr_percent, signal.atrPercent), volumeRatio: firstValue(signal.volume_ratio, signal.volumeRatio) };
}
function modelDisplayStatus(model) {
  const raw = String(model?.display_status || model?.status || "COLLECTING").toUpperCase();
  if (raw.includes("VALIDATED") || raw === "ACTIVE_SHADOW") return "VALIDATED";
  if (raw.includes("REJECTED") || raw === "VALIDATION_FAILED") return "REJECTED";
  if (raw.includes("RETRAIN")) return "RETRAINING";
  if (raw.includes("ERROR")) return "ERROR";
  return "COLLECTING";
}
function statusColor(status) { if (status === "VALIDATED") return COLORS.green; if (status === "REJECTED" || status === "ERROR") return COLORS.red; if (status === "RETRAINING") return COLORS.gold; return COLORS.purple; }
function normalizeAdvancedReport(data) {
  if (!data || data.success !== true) return null;
  const latest = Array.isArray(data.recent_decisions) ? data.recent_decisions[0] : null;
  const option = latest?.option_summary || {}; const summary = data.summary || {}; const models = data.adaptive_models?.models || [];
  const model15 = models.find((item) => Number(item?.horizon_minutes) === 15) || models[0] || {}; const diagnostics = model15?.diagnostics || {};
  return { broker: String(latest?.broker || data.active_broker || "waiting").toUpperCase(), optionDecision: latest?.option_decision || option.option_direction || "NO_TRADE", coverage: Number(latest?.data_coverage_score || option.data_coverage_score || 0), optionRisk: Number(latest?.option_risk_score || option.risk_score || 0), pcr: option.pcr, maxPain: option.max_pain, displayStatus: modelDisplayStatus(model15), modelSamples: Number(model15.sample_count || 0), modelRequired: Number(data.adaptive_models?.minimum_training_samples || 300), validationAccuracy: model15.validation_accuracy_percent, baselineAccuracy: model15.baseline_accuracy_percent, brierScore: model15.brier_score, evaluated15m: Number(summary.evaluated_15m || 0), hitRate15m: summary.advanced_15m_hit_rate_percent, netBenefit15m: summary.advanced_vs_base_net_benefit_rupees_per_lot_15m, topFeatures: Array.isArray(diagnostics.top_features) ? diagnostics.top_features : [], groupImportance: diagnostics.feature_group_importance_percent || {}, failedChecks: diagnostics.activation_gate?.failed_checks || [], newsEffect: diagnostics.news_effect || {} };
}
function normalizeNewsReport(data) {
  if (!data || data.success !== true) return null;
  const current = data.current_news || {}; const summary = data.summary || {}; const latest = Array.isArray(data.recent_decisions) ? data.recent_decisions[0] : null;
  return { bias: String(current.news_bias || "NEUTRAL").toUpperCase(), strength: Number(current.news_strength || 0), risk: Number(current.news_risk_score || 0), eventCount: Number(current.event_count || 0), highImpactCount: Number(current.high_impact_count || 0), fresh: Boolean(current.fresh), headlines: Array.isArray(current.top_headlines) ? current.top_headlines : [], hitRate15m: summary.fusion_15m_hit_rate_percent, benefit15m: summary.estimated_net_benefit_vs_base_spot_points_15m, marketReaction: latest?.market_reaction || "NEWS_MARKET_REACTION_UNCLEAR" };
}
function prettyStatus(status, t) { if (status === "VALIDATED") return t.validated; if (status === "REJECTED") return t.rejected; if (status === "RETRAINING") return t.retraining; if (status === "ERROR") return t.error; return t.collecting; }
function modelSummary(status, t) { if (status === "VALIDATED") return t.modelValidated; if (status === "REJECTED") return t.modelRejected; if (status === "RETRAINING") return t.modelRetraining; if (status === "ERROR") return t.modelError; return t.modelCollecting; }
function optionLabel(value, t) { const normalized = String(value || "NO_TRADE").toUpperCase(); if (normalized === "CE") return t.ce; if (normalized === "PE") return t.pe; return t.noTrade; }
function biasLabel(value, t) { const normalized = String(value || "NEUTRAL").toUpperCase(); if (normalized === "CE") return t.ce; if (normalized === "PE") return t.pe; return t.neutral; }
function usefulnessLabel(value, t) { const normalized = String(value || "").toUpperCase(); if (normalized === "HELPFUL") return t.helpful; if (normalized === "HARMFUL") return t.harmful; return t.unproven; }
function newsSummary(value, t) { const normalized = String(value || "").toUpperCase(); if (normalized === "HELPFUL") return t.newsHelpful; if (normalized === "HARMFUL") return t.newsHarmful; return t.newsUnproven; }
function directionColor(value) { const normalized = String(value || "").toUpperCase(); if (normalized === "CE") return COLORS.green; if (normalized === "PE") return COLORS.red; return COLORS.gold; }
function formatFailure(item, language) {
  const raw = String(item || "").toUpperCase();
  const en = { NO_EDGE_OVER_BASELINE: "No accuracy edge over the baseline strategy", PROBABILITY_CALIBRATION_WEAK: "Probability estimates are not calibrated well", VALIDATION_ACCURACY_LOW: "Validation accuracy is below the required level", CLASS_COVERAGE_WEAK: "CE, PE and no-trade samples are not balanced enough" };
  const hi = { NO_EDGE_OVER_BASELINE: "बेस रणनीति की तुलना में अतिरिक्त सटीकता नहीं मिली", PROBABILITY_CALIBRATION_WEAK: "प्रॉबेबिलिटी अनुमान पर्याप्त रूप से सही नहीं हैं", VALIDATION_ACCURACY_LOW: "वैलिडेशन सटीकता आवश्यक स्तर से कम है", CLASS_COVERAGE_WEAK: "CE, PE और नो-ट्रेड नमूनों का संतुलन पर्याप्त नहीं है" };
  return (language === "hi" ? hi : en)[raw] || raw.replaceAll("_", " ").toLowerCase();
}
function shorten(text, max = 130) { const value = String(text || "").trim(); return value.length <= max ? value : value.slice(0, max - 1).trimEnd() + "…"; }
function containsHindi(text) { return /[\u0900-\u097F]/.test(String(text || "")); }
function headlineKey(headline, index) { return String(firstValue(headline?.event_id, headline?.url, headline?.title, index)); }
function embeddedHindiHeadline(headline) {
  const value = firstValue(headline?.title_hi, headline?.hindi_title, headline?.translated_title_hi, headline?.translations?.hi);
  return value ? String(value).trim() : "";
}
async function translateHeadlineToHindi(text) {
  const original = String(text || "").trim();
  if (!original || containsHindi(original)) return original;
  const query = `${TRANSLATE_URL}?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(original)}`;
  const response = await fetch(query);
  if (!response.ok) throw new Error(`Headline translation HTTP ${response.status}`);
  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part) => String(part?.[0] || "")).join("").trim()
    : "";
  return translated || original;
}
function displayHeadlineTitle(headline, index, language, translations) {
  const original = String(headline?.title || "").trim();
  if (language !== "hi" || !original) return original;
  const embedded = embeddedHindiHeadline(headline);
  return embedded || translations[headlineKey(headline, index)] || original;
}
function StatusPill({ label, color }) { return React.createElement(View, { style: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: color + "22", borderWidth: 1, borderColor: color + "55" } }, React.createElement(Text, { style: { color, fontSize: 10, fontWeight: "900" } }, label)); }
function Metric({ label, value, color }) { return React.createElement(View, { style: { width: "48%", minHeight: 78, padding: 11, borderRadius: 12, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center" } }, React.createElement(Text, { style: { color: COLORS.muted, fontSize: 9, fontWeight: "800" } }, label), React.createElement(Text, { style: { color: color || COLORS.text, fontSize: 14, fontWeight: "900", marginTop: 6, lineHeight: 19 } }, String(value ?? "--"))); }
function SectionTitle({ title }) { return React.createElement(Text, { style: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginTop: 18, marginBottom: 9 } }, title); }
function InfoBox({ text, color }) { return React.createElement(View, { style: { backgroundColor: (color || COLORS.blue) + "12", borderRadius: 11, borderWidth: 1, borderColor: (color || COLORS.blue) + "40", padding: 11, marginTop: 8 } }, React.createElement(Text, { style: { color: COLORS.text, fontSize: 11, lineHeight: 18 } }, text)); }
function LanguageToggle({ language, onChange }) {
  return React.createElement(View, { style: { flexDirection: "row", gap: 6 } }, [["hi", "हिंदी"], ["en", "English"]].map(([key, label]) => React.createElement(TouchableOpacity, { key, onPress: () => onChange(key), style: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: language === key ? COLORS.blue + "22" : COLORS.surface2, borderWidth: 1, borderColor: language === key ? COLORS.blue : COLORS.border } }, React.createElement(Text, { style: { color: language === key ? COLORS.blue : COLORS.muted, fontSize: 10, fontWeight: "900" } }, label))));
}
function TabBar({ activeTab, onChange, t }) {
  const tabs = [["overview", t.overview], ["learning", t.learning], ["news", t.news]];
  return React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: { gap: 7, paddingVertical: 10 } }, tabs.map(([key, label]) => React.createElement(TouchableOpacity, { key, onPress: () => onChange(key), style: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11, backgroundColor: activeTab === key ? COLORS.purple + "24" : COLORS.surface2, borderWidth: 1, borderColor: activeTab === key ? COLORS.purple : COLORS.border } }, React.createElement(Text, { style: { color: activeTab === key ? COLORS.purple : COLORS.muted, fontSize: 11, fontWeight: "900" } }, label))));
}

function AiDecisionCard({ token }) {
  const [storedToken, setStoredToken] = React.useState(token || ""); const [advancedReport, setAdvancedReport] = React.useState(null); const [newsReport, setNewsReport] = React.useState(null); const [translatedHeadlines, setTranslatedHeadlines] = React.useState({}); const [error, setError] = React.useState(""); const [loading, setLoading] = React.useState(false); const [visible, setVisible] = React.useState(false); const [activeTab, setActiveTab] = React.useState("overview"); const [language, setLanguage] = React.useState("hi");
  React.useEffect(() => { let active = true; Promise.all([token ? Promise.resolve(token) : AsyncStorage.getItem("saas_token"), AsyncStorage.getItem(LANGUAGE_KEY)]).then(([savedToken, savedLanguage]) => { if (!active) return; if (savedToken) setStoredToken(savedToken); if (savedLanguage === "hi" || savedLanguage === "en") setLanguage(savedLanguage); }).catch(() => {}); return () => { active = false; }; }, [token]);
  React.useEffect(() => {
    let active = true; let timer = null;
    async function fetchJson(path) { const response = await fetch(`${SAAS_URL}${path}`, { headers: { Authorization: `Bearer ${storedToken}` } }); let data = null; try { data = await response.json(); } catch { throw new Error(`HTTP ${response.status}`); } if (!response.ok) throw new Error(data?.detail || data?.message || `HTTP ${response.status}`); return data; }
    async function load() { if (!storedToken) return; if (active) setLoading(true); const results = await Promise.allSettled([fetchJson("/bot/ai-advanced-monitor?recent_limit=1"), fetchJson("/bot/ai-news-monitor?recent_limit=1")]); if (!active) return; const errors = []; if (results[0].status === "fulfilled") { const normalized = normalizeAdvancedReport(results[0].value); if (normalized) setAdvancedReport(normalized); else errors.push("Advanced AI response invalid"); } else errors.push(String(results[0].reason?.message || "Advanced AI unavailable")); if (results[1].status === "fulfilled") { const normalized = normalizeNewsReport(results[1].value); if (normalized) setNewsReport(normalized); else errors.push("News AI response invalid"); } else errors.push(String(results[1].reason?.message || "News AI unavailable")); setError(errors.join(" • ")); setLoading(false); }
    load(); timer = setInterval(load, 15000); return () => { active = false; if (timer) clearInterval(timer); };
  }, [storedToken]);
  React.useEffect(() => {
    let active = true;
    if (language !== "hi" || !newsReport?.headlines?.length) return () => { active = false; };
    const pending = newsReport.headlines.slice(0, 5).map((headline, index) => ({
      headline,
      index,
      key: headlineKey(headline, index),
      title: String(headline?.title || "").trim(),
    })).filter((item) => item.title && !containsHindi(item.title) && !embeddedHindiHeadline(item.headline) && !translatedHeadlines[item.key]);
    if (!pending.length) return () => { active = false; };
    Promise.allSettled(pending.map((item) => translateHeadlineToHindi(item.title))).then((results) => {
      if (!active) return;
      const next = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) next[pending[index].key] = result.value;
      });
      if (Object.keys(next).length) setTranslatedHeadlines((previous) => ({ ...previous, ...next }));
    }).catch(() => {});
    return () => { active = false; };
  }, [language, newsReport?.headlines, translatedHeadlines]);
  function changeLanguage(next) { setLanguage(next); AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => {}); }
  const t = COPY[language]; const displayStatus = advancedReport?.displayStatus || "COLLECTING"; const mainColor = statusColor(displayStatus); const optionColor = directionColor(advancedReport?.optionDecision); const newsColor = directionColor(newsReport?.bias); const modelNews = advancedReport?.newsEffect || {}; const group = advancedReport?.groupImportance || {}; const topFeatures = (advancedReport?.topFeatures || []).slice(0, 6); const failedChecks = advancedReport?.failedChecks || [];
  const overview = React.createElement(View, null,
    React.createElement(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
      React.createElement(Metric, { label: t.broker, value: advancedReport?.broker || t.waiting, color: COLORS.blue }), React.createElement(Metric, { label: t.optionView, value: optionLabel(advancedReport?.optionDecision, t), color: optionColor }), React.createElement(Metric, { label: t.coverage, value: advancedReport ? `${advancedReport.coverage}%` : "--", color: advancedReport?.coverage >= 65 ? COLORS.green : COLORS.gold }), React.createElement(Metric, { label: t.optionRisk, value: advancedReport ? `${advancedReport.optionRisk}/100` : "--", color: advancedReport?.optionRisk >= 60 ? COLORS.red : COLORS.green }), React.createElement(Metric, { label: "PCR", value: advancedReport?.pcr != null ? Number(advancedReport.pcr).toFixed(2) : "--", color: COLORS.blue }), React.createElement(Metric, { label: "MAX PAIN", value: advancedReport?.maxPain ?? "--", color: COLORS.purple }), React.createElement(Metric, { label: t.model, value: `${prettyStatus(displayStatus, t)} ${advancedReport?.modelSamples || 0}/${advancedReport?.modelRequired || 300}`, color: mainColor }), React.createElement(Metric, { label: t.result15m, value: advancedReport?.hitRate15m != null ? `${advancedReport.hitRate15m}% • ${advancedReport.evaluated15m} ${t.evaluated}` : `${advancedReport?.evaluated15m || 0} ${t.evaluated}`, color: COLORS.purple })),
    advancedReport?.netBenefit15m != null ? React.createElement(InfoBox, { color: Number(advancedReport.netBenefit15m) >= 0 ? COLORS.green : COLORS.red, text: `${t.advancedVsBase}: ${Number(advancedReport.netBenefit15m) >= 0 ? "+" : ""}₹${advancedReport.netBenefit15m} ${t.perLot15m}` }) : null,
    React.createElement(SectionTitle, { title: t.currentReading }), React.createElement(InfoBox, { color: mainColor, text: modelSummary(displayStatus, t) }), React.createElement(InfoBox, { color: newsColor, text: newsReport?.fresh ? `${t.newsBias}: ${biasLabel(newsReport.bias, t)} • ${t.strengthRisk}: ${newsReport.strength}% / ${newsReport.risk}` : t.noFreshNews }));
  const learning = React.createElement(View, null,
    React.createElement(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, React.createElement(Metric, { label: t.validation, value: advancedReport?.validationAccuracy != null ? `${advancedReport.validationAccuracy}%` : "--", color: mainColor }), React.createElement(Metric, { label: t.baseline, value: advancedReport?.baselineAccuracy != null ? `${advancedReport.baselineAccuracy}%` : "--", color: COLORS.blue }), React.createElement(Metric, { label: t.brier, value: advancedReport?.brierScore ?? "--", color: COLORS.gold }), React.createElement(Metric, { label: t.model, value: prettyStatus(displayStatus, t), color: mainColor })),
    React.createElement(InfoBox, { color: mainColor, text: modelSummary(displayStatus, t) }),
    failedChecks.length ? React.createElement(View, { style: { marginTop: 10 } }, failedChecks.slice(0, 4).map((item, index) => React.createElement(Text, { key: `${item}-${index}`, style: { color: COLORS.red, fontSize: 10, lineHeight: 17, marginTop: 3 } }, `• ${formatFailure(item, language)}`))) : null,
    React.createElement(SectionTitle, { title: t.topPatterns }),
    topFeatures.length ? React.createElement(View, null, topFeatures.map((item, index) => { const featureName = FEATURE_LABELS[language][item?.feature] || String(item?.feature || "--").replaceAll("_", " "); return React.createElement(View, { key: `${item?.feature || index}-${index}`, style: { backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, padding: 11, marginBottom: 7 } }, React.createElement(Text, { style: { color: COLORS.text, fontSize: 11, fontWeight: "900" } }, `${index + 1}. ${featureName}`), React.createElement(Text, { style: { color: directionColor(item?.supports), fontSize: 10, marginTop: 4, fontWeight: "800" } }, optionLabel(item?.supports, t))); })) : React.createElement(InfoBox, { color: COLORS.gold, text: t.noPatterns }),
    Object.keys(group).length ? React.createElement(React.Fragment, null, React.createElement(SectionTitle, { title: t.importance }), React.createElement(InfoBox, { color: COLORS.blue, text: `Options ${group.OPTION_CHAIN ?? 0}% • News ${group.NEWS ?? 0}% • Market ${group.MARKET ?? 0}% • Global ${group.GLOBAL ?? 0}%` })) : null);
  const news = React.createElement(View, null,
    React.createElement(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, React.createElement(Metric, { label: t.newsBias, value: biasLabel(newsReport?.bias, t), color: newsColor }), React.createElement(Metric, { label: t.strengthRisk, value: `${newsReport?.strength || 0}% / ${newsReport?.risk || 0}`, color: newsReport?.risk >= 65 ? COLORS.red : newsColor }), React.createElement(Metric, { label: t.events, value: `${newsReport?.eventCount || 0} • ${newsReport?.highImpactCount || 0} ${t.highImpact}`, color: COLORS.blue }), React.createElement(Metric, { label: t.newsTest, value: usefulnessLabel(modelNews.usefulness, t), color: String(modelNews.usefulness).toUpperCase() === "HELPFUL" ? COLORS.green : String(modelNews.usefulness).toUpperCase() === "HARMFUL" ? COLORS.red : COLORS.gold })),
    React.createElement(InfoBox, { color: newsColor, text: newsReport?.fresh ? `${t.currentReading}: ${biasLabel(newsReport.bias, t)} • ${String(newsReport.marketReaction || "").replaceAll("_", " ").toLowerCase()}` : t.noFreshNews }), React.createElement(InfoBox, { color: COLORS.purple, text: newsSummary(modelNews.usefulness, t) }),
    modelNews.validation_accuracy_with_news_percent != null ? React.createElement(InfoBox, { color: COLORS.blue, text: `${t.withNews}: ${modelNews.validation_accuracy_with_news_percent}% • ${t.withoutNews}: ${modelNews.validation_accuracy_without_news_percent ?? "--"}% • Δ ${Number(modelNews.accuracy_delta_percentage_points || 0) >= 0 ? "+" : ""}${modelNews.accuracy_delta_percentage_points || 0} pp` }) : null,
    newsReport?.hitRate15m != null ? React.createElement(InfoBox, { color: COLORS.purple, text: `${t.fusionResult}: ${newsReport.hitRate15m}% • ${t.baseDifference}: ${Number(newsReport.benefit15m || 0) >= 0 ? "+" : ""}${newsReport.benefit15m || 0} ${t.spotPoints}` }) : null,
    React.createElement(SectionTitle, { title: t.headlines }), newsReport?.headlines?.length ? React.createElement(View, null, newsReport.headlines.slice(0, 5).map((headline, index) => React.createElement(View, { key: `${headlineKey(headline, index)}-${index}`, style: { backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, padding: 11, marginBottom: 7 } }, React.createElement(Text, { style: { color: COLORS.text, fontSize: 10, lineHeight: 16 } }, shorten(displayHeadlineTitle(headline, index, language, translatedHeadlines))), React.createElement(Text, { style: { color: directionColor(headline?.direction), fontSize: 9, fontWeight: "900", marginTop: 5 } }, biasLabel(headline?.direction, t))))) : React.createElement(InfoBox, { color: COLORS.gold, text: t.noHeadlines }));
  return React.createElement(React.Fragment, null,
    React.createElement(View, { style: { backgroundColor: COLORS.surface3, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: mainColor + "77" } },
      React.createElement(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } }, React.createElement(View, { style: { flex: 1, paddingRight: 10 } }, React.createElement(Text, { style: { color: COLORS.text, fontSize: 17, fontWeight: "900" } }, `🧬 ${t.title}`), React.createElement(Text, { style: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 4 } }, t.compactLine)), React.createElement(StatusPill, { label: prettyStatus(displayStatus, t), color: mainColor })),
      React.createElement(View, { style: { flexDirection: "row", gap: 8, marginTop: 12 } }, React.createElement(Metric, { label: t.optionView, value: optionLabel(advancedReport?.optionDecision, t), color: optionColor }), React.createElement(Metric, { label: t.newsBias, value: biasLabel(newsReport?.bias, t), color: newsColor })),
      React.createElement(TouchableOpacity, { onPress: () => { setActiveTab("overview"); setVisible(true); }, style: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: COLORS.purple + "22", borderWidth: 1, borderColor: COLORS.purple + "77" } }, React.createElement(Text, { style: { color: COLORS.purple, fontSize: 12, fontWeight: "900" } }, t.open))),
    React.createElement(Modal, { visible, animationType: "slide", onRequestClose: () => setVisible(false), statusBarTranslucent: false },
      React.createElement(SafeAreaView, { style: { flex: 1, backgroundColor: "#090911" } }, React.createElement(View, { style: { flex: 1, paddingHorizontal: 15 } },
        React.createElement(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 8 } }, React.createElement(View, { style: { flex: 1, paddingRight: 10 } }, React.createElement(Text, { style: { color: COLORS.text, fontSize: 20, fontWeight: "900" } }, `🧬 ${t.title}`), React.createElement(Text, { style: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 } }, t.subtitle)), React.createElement(TouchableOpacity, { onPress: () => setVisible(false), style: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border } }, React.createElement(Text, { style: { color: COLORS.text, fontSize: 20, fontWeight: "900" } }, "×"))),
        React.createElement(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } }, React.createElement(StatusPill, { label: prettyStatus(displayStatus, t), color: mainColor }), React.createElement(LanguageToggle, { language, onChange: changeLanguage })),
        React.createElement(TabBar, { activeTab, onChange: setActiveTab, t }),
        React.createElement(ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 34 }, showsVerticalScrollIndicator: false }, activeTab === "overview" ? overview : activeTab === "learning" ? learning : news,
          error ? React.createElement(Text, { style: { color: COLORS.gold, fontSize: 9, lineHeight: 15, marginTop: 12 } }, `${t.retrying}: ${error}`) : loading ? React.createElement(View, { style: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 } }, React.createElement(ActivityIndicator, { size: "small", color: COLORS.blue }), React.createElement(Text, { style: { color: COLORS.blue, fontSize: 10 } }, t.refreshing)) : null,
          React.createElement(Text, { style: { color: COLORS.blue, fontSize: 9, fontWeight: "900", lineHeight: 15, marginTop: 14, textAlign: "center" } }, t.monitorOnly))))));
}

module.exports = AiDecisionCard;
module.exports.signalToSnapshot = signalToSnapshot;
