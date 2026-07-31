const React = require("react");
const { View, Text, TouchableOpacity } = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const ACCORDION_STORAGE_KEY = "okai_ai_accordion_v1";

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

const FEATURE_LABELS = {
  base_ce: "Base CE signal",
  base_pe: "Base PE signal",
  base_no_trade: "Base no-trade",
  option_ce: "Option-chain CE view",
  option_pe: "Option-chain PE view",
  option_no_trade: "Option-chain no-trade",
  option_confidence: "Option confidence",
  option_risk: "Option risk",
  coverage: "Data coverage",
  pcr: "PCR",
  oi_direction: "OI direction",
  depth_imbalance: "Bid/ask depth",
  spread_percent: "Option spread",
  average_iv: "Implied volatility",
  news_ce: "Positive-news bias",
  news_pe: "Negative-news bias",
  news_strength: "News strength",
  news_risk: "News risk",
  india_vix: "India VIX",
  india_vix_change: "VIX change",
  adx: "ADX trend strength",
  rsi: "RSI",
  atr_percent: "ATR volatility",
  volume_ratio: "Volume ratio",
};

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function signalToSnapshot(signal = {}) {
  return {
    symbol: firstValue(signal.symbol, signal.underlying, signal.instrument, "NIFTY"),
    timestamp: firstValue(signal.engine_updated_at, signal.updated_at, signal.timestamp),
    feedConnected: Boolean(firstValue(signal.feed_connected, signal.data_live, false)),
    price: firstValue(signal.price, signal.ltp, signal.spot_price, signal.close),
    adx: signal.adx,
    rsi: signal.rsi,
    atrPercent: firstValue(signal.atr_percent, signal.atrPercent),
    volumeRatio: firstValue(signal.volume_ratio, signal.volumeRatio),
  };
}

function metricCell(label, value, color) {
  return React.createElement(
    View,
    {
      key: label,
      style: {
        width: "48%",
        minHeight: 72,
        padding: 11,
        borderRadius: 12,
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: "center",
      },
    },
    React.createElement(
      Text,
      { style: { color: COLORS.muted, fontSize: 9, fontWeight: "800" } },
      label
    ),
    React.createElement(
      Text,
      {
        style: {
          color: color || COLORS.text,
          fontSize: 13,
          fontWeight: "900",
          marginTop: 5,
        },
      },
      String(value ?? "--")
    )
  );
}

function statusPill(label, color) {
  return React.createElement(
    View,
    {
      style: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: color + "22",
        borderWidth: 1,
        borderColor: color + "44",
      },
    },
    React.createElement(
      Text,
      { style: { color, fontSize: 10, fontWeight: "900" } },
      label
    )
  );
}

function chevron(expanded, color) {
  return React.createElement(
    View,
    {
      style: {
        width: 30,
        height: 30,
        marginLeft: 8,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color + "14",
      },
    },
    React.createElement(
      Text,
      { style: { color, fontSize: 18, fontWeight: "900", lineHeight: 20 } },
      expanded ? "⌃" : "⌄"
    )
  );
}

function sectionTitle(title, subtitle) {
  return React.createElement(
    View,
    { style: { marginTop: 14, marginBottom: 8 } },
    React.createElement(
      Text,
      { style: { color: COLORS.text, fontSize: 12, fontWeight: "900" } },
      title
    ),
    subtitle
      ? React.createElement(
          Text,
          { style: { color: COLORS.muted, fontSize: 9, lineHeight: 14, marginTop: 3 } },
          subtitle
        )
      : null
  );
}

function infoBox(text, color) {
  return React.createElement(
    View,
    {
      style: {
        backgroundColor: (color || COLORS.blue) + "12",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: (color || COLORS.blue) + "35",
        padding: 10,
        marginTop: 7,
      },
    },
    React.createElement(
      Text,
      { style: { color: color || COLORS.text, fontSize: 10, lineHeight: 16 } },
      text
    )
  );
}

function featureLine(item, index) {
  const name = FEATURE_LABELS[item?.feature] || String(item?.feature || "Unknown feature");
  const supports = String(item?.supports || "--").replace("NO_TRADE", "NO TRADE");
  return React.createElement(
    Text,
    {
      key: `${item?.feature || index}-${index}`,
      style: { color: COLORS.muted, fontSize: 10, lineHeight: 17, marginTop: 2 },
    },
    `${index + 1}. ${name} → ${supports}`
  );
}

function shorten(text, max = 110) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
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
  if (status === "VALIDATED") return COLORS.green;
  if (status === "REJECTED" || status === "ERROR") return COLORS.red;
  if (status === "RETRAINING") return COLORS.gold;
  return COLORS.purple;
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
    coverage: Number(latest?.data_coverage_score || option.data_coverage_score || 0),
    optionRisk: Number(latest?.option_risk_score || option.risk_score || 0),
    pcr: option.pcr,
    maxPain: option.max_pain,
    modelStatus: String(model15.status || "COLLECTING"),
    displayStatus: modelDisplayStatus(model15),
    modelExplanation: model15.status_explanation || "Model status update pending.",
    modelSamples: Number(model15.sample_count || 0),
    modelRequired: Number(data.adaptive_models?.minimum_training_samples || 300),
    validationAccuracy: model15.validation_accuracy_percent,
    baselineAccuracy: model15.baseline_accuracy_percent,
    brierScore: model15.brier_score,
    evaluated15m: Number(summary.evaluated_15m || 0),
    hitRate15m: summary.advanced_15m_hit_rate_percent,
    netBenefit15m: summary.advanced_vs_base_net_benefit_rupees_per_lot_15m,
    topFeatures: Array.isArray(diagnostics.top_features) ? diagnostics.top_features : [],
    groupImportance: diagnostics.feature_group_importance_percent || {},
    failedChecks: diagnostics.activation_gate?.failed_checks || [],
    newsEffect: diagnostics.news_effect || {},
    reasons: Array.isArray(latest?.reasons) ? latest.reasons : [],
  };
}

function normalizeNewsReport(data) {
  if (!data || data.success !== true) return null;
  const current = data.current_news || {};
  const summary = data.summary || {};
  const latest = Array.isArray(data.recent_decisions) ? data.recent_decisions[0] : null;
  return {
    bias: String(current.news_bias || "NEUTRAL").toUpperCase(),
    strength: Number(current.news_strength || 0),
    risk: Number(current.news_risk_score || 0),
    eventCount: Number(current.event_count || 0),
    highImpactCount: Number(current.high_impact_count || 0),
    fresh: Boolean(current.fresh),
    fetchError: current.fetch_error || "",
    headlines: Array.isArray(current.top_headlines) ? current.top_headlines : [],
    categories: current.categories || {},
    hitRate15m: summary.fusion_15m_hit_rate_percent,
    benefit15m: summary.estimated_net_benefit_vs_base_spot_points_15m,
    marketReaction: latest?.market_reaction || "NEWS_MARKET_REACTION_UNCLEAR",
    relationToBase: latest?.relation_to_base || "--",
  };
}

function AiDecisionCard({ token }) {
  const [storedToken, setStoredToken] = React.useState(token || "");
  const [advancedReport, setAdvancedReport] = React.useState(null);
  const [newsReport, setNewsReport] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    if (token) {
      setStoredToken(token);
      return () => { active = false; };
    }
    AsyncStorage.getItem("saas_token")
      .then((value) => {
        if (active && value) setStoredToken(value);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [token]);

  React.useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ACCORDION_STORAGE_KEY)
      .then((value) => {
        if (!active || !value) return;
        const saved = JSON.parse(value);
        if (typeof saved.advanced === "boolean") setExpanded(saved.advanced);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    let active = true;
    let timer = null;

    async function fetchJson(path) {
      const response = await fetch(`${SAAS_URL}${path}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `HTTP ${response.status}`);
      }
      return data;
    }

    async function load() {
      if (!storedToken) return;
      if (active) setLoading(true);
      const results = await Promise.allSettled([
        fetchJson("/bot/ai-advanced-monitor?recent_limit=1"),
        fetchJson("/bot/ai-news-monitor?recent_limit=1"),
      ]);
      if (!active) return;

      const errors = [];
      if (results[0].status === "fulfilled") {
        const normalized = normalizeAdvancedReport(results[0].value);
        if (normalized) setAdvancedReport(normalized);
        else errors.push("Advanced AI response invalid");
      } else {
        errors.push(String(results[0].reason?.message || "Advanced AI unavailable"));
      }

      if (results[1].status === "fulfilled") {
        const normalized = normalizeNewsReport(results[1].value);
        if (normalized) setNewsReport(normalized);
        else errors.push("News AI response invalid");
      } else {
        errors.push(String(results[1].reason?.message || "News AI unavailable"));
      }

      setError(errors.join(" • "));
      setLoading(false);
    }

    load();
    timer = setInterval(load, 15000);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [storedToken]);

  function toggleExpanded() {
    setExpanded((current) => {
      const next = !current;
      AsyncStorage.setItem(
        ACCORDION_STORAGE_KEY,
        JSON.stringify({ shared: false, advanced: next })
      ).catch(() => {});
      return next;
    });
  }

  const displayStatus = advancedReport?.displayStatus || "COLLECTING";
  const mainColor = statusColor(displayStatus);
  const optionDirection = String(advancedReport?.optionDecision || "NO_TRADE").replace("NO_TRADE", "NO TRADE");
  const group = advancedReport?.groupImportance || {};
  const news = newsReport || {};
  const newsColor = news.bias === "CE" ? COLORS.green : news.bias === "PE" ? COLORS.red : COLORS.gold;
  const topFeatures = (advancedReport?.topFeatures || []).slice(0, 4);
  const failedChecks = (advancedReport?.failedChecks || []).map((item) => String(item).replaceAll("_", " "));
  const modelNews = advancedReport?.newsEffect || {};

  const body = expanded
    ? React.createElement(
        View,
        {
          style: {
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            marginTop: 12,
            paddingTop: 13,
          },
        },
        React.createElement(
          View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
          metricCell("BROKER", advancedReport?.broker || "WAITING", COLORS.blue),
          metricCell("OPTION VIEW", optionDirection, optionDirection === "CE" ? COLORS.green : optionDirection === "PE" ? COLORS.red : COLORS.gold),
          metricCell("DATA COVERAGE", advancedReport ? `${advancedReport.coverage}%` : "--", advancedReport?.coverage >= 65 ? COLORS.green : COLORS.gold),
          metricCell("OPTION RISK", advancedReport ? `${advancedReport.optionRisk}/100` : "--", advancedReport?.optionRisk >= 60 ? COLORS.red : COLORS.green),
          metricCell("PCR", advancedReport?.pcr != null ? Number(advancedReport.pcr).toFixed(2) : "--", COLORS.blue),
          metricCell("MAX PAIN", advancedReport?.maxPain != null ? advancedReport.maxPain : "--", COLORS.purple),
          metricCell("MODEL", advancedReport ? `${displayStatus} ${advancedReport.modelSamples}/${advancedReport.modelRequired}` : "COLLECTING", mainColor),
          metricCell(
            "15M RESULT",
            advancedReport?.hitRate15m != null
              ? `${advancedReport.hitRate15m}% • ${advancedReport.evaluated15m}`
              : `${advancedReport?.evaluated15m || 0} evaluated`,
            COLORS.purple
          )
        ),
        advancedReport?.netBenefit15m != null
          ? React.createElement(
              Text,
              {
                style: {
                  color: Number(advancedReport.netBenefit15m) >= 0 ? COLORS.green : COLORS.red,
                  fontSize: 10,
                  fontWeight: "900",
                  marginTop: 10,
                },
              },
              `Advanced vs base: ${Number(advancedReport.netBenefit15m) >= 0 ? "+" : ""}₹${advancedReport.netBenefit15m} per lot (15m)`
            )
          : null,

        sectionTitle("AI NE KYA SIKHA", "Model weights aur chronological validation se nikla result"),
        advancedReport?.validationAccuracy != null
          ? infoBox(
              `Validation ${advancedReport.validationAccuracy}% • Baseline ${advancedReport.baselineAccuracy ?? "--"}% • Brier ${advancedReport.brierScore ?? "--"}`,
              mainColor
            )
          : infoBox(`Abhi ${advancedReport?.modelSamples || 0}/${advancedReport?.modelRequired || 300} samples collect ho rahe hain.`, COLORS.purple),
        React.createElement(
          Text,
          { style: { color: COLORS.muted, fontSize: 10, lineHeight: 16, marginTop: 7 } },
          advancedReport?.modelExplanation || "Model learning summary next retrain ke baad aayegi."
        ),
        failedChecks.length
          ? React.createElement(
              Text,
              { style: { color: COLORS.red, fontSize: 9, lineHeight: 15, marginTop: 6 } },
              `Fail reason: ${failedChecks.slice(0, 3).join(" • ")}`
            )
          : null,
        topFeatures.length
          ? React.createElement(
              View,
              { style: { marginTop: 7 } },
              React.createElement(Text, { style: { color: COLORS.text, fontSize: 10, fontWeight: "900", marginBottom: 2 } }, "Sabse important patterns:"),
              ...topFeatures.map(featureLine)
            )
          : React.createElement(
              Text,
              { style: { color: COLORS.muted, fontSize: 10, lineHeight: 16, marginTop: 7 } },
              "Top learned features next successful retrain ke baad yahan dikhenge."
            ),
        Object.keys(group).length
          ? React.createElement(
              Text,
              { style: { color: COLORS.blue, fontSize: 9, lineHeight: 15, marginTop: 7 } },
              `Importance: Option ${group.OPTION_CHAIN ?? 0}% • News ${group.NEWS ?? 0}% • Market ${group.MARKET ?? 0}% • Global ${group.GLOBAL ?? 0}%`
            )
          : null,

        sectionTitle("NEWS SE KYA PATA CHALA", "Current headlines + market reaction + model ablation test"),
        React.createElement(
          View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
          metricCell("NEWS BIAS", news.bias || "WAITING", newsColor),
          metricCell("STRENGTH / RISK", `${news.strength || 0}% / ${news.risk || 0}`, news.risk >= 65 ? COLORS.red : newsColor),
          metricCell("EVENTS", `${news.eventCount || 0} • High ${news.highImpactCount || 0}`, COLORS.blue),
          metricCell(
            "NEWS TEST",
            modelNews.usefulness
              ? `${String(modelNews.usefulness).replaceAll("_", " ")} ${Number(modelNews.accuracy_delta_percentage_points || 0) >= 0 ? "+" : ""}${modelNews.accuracy_delta_percentage_points || 0}pp`
              : "PENDING",
            modelNews.usefulness === "HELPFUL" ? COLORS.green : modelNews.usefulness === "HARMFUL" ? COLORS.red : COLORS.gold
          )
        ),
        infoBox(
          news.fresh
            ? `News engine ka current view ${news.bias || "NEUTRAL"} hai. Market reaction: ${String(news.marketReaction || "UNCLEAR").replaceAll("_", " ")}.`
            : "Fresh directional news signal abhi nahi mila; news ko trade reason nahi maana ja raha.",
          newsColor
        ),
        modelNews.usefulness
          ? React.createElement(
              Text,
              { style: { color: COLORS.muted, fontSize: 9, lineHeight: 15, marginTop: 6 } },
              `With news accuracy ${modelNews.validation_accuracy_with_news_percent ?? "--"}% vs without news ${modelNews.validation_accuracy_without_news_percent ?? "--"}%. Isse pata chalega news sach me help kar rahi hai ya noise hai.`
            )
          : null,
        news.hitRate15m != null
          ? React.createElement(
              Text,
              { style: { color: COLORS.purple, fontSize: 9, lineHeight: 15, marginTop: 6 } },
              `News fusion 15m hit rate ${news.hitRate15m}% • Base ke मुकाबले ${Number(news.benefit15m || 0) >= 0 ? "+" : ""}${news.benefit15m || 0} spot points.`
            )
          : null,
        news.headlines?.length
          ? React.createElement(
              View,
              { style: { marginTop: 7 } },
              ...news.headlines.slice(0, 3).map((headline, index) =>
                React.createElement(
                  Text,
                  {
                    key: `${headline?.title || index}-${index}`,
                    style: { color: COLORS.muted, fontSize: 9, lineHeight: 15, marginTop: 2 },
                  },
                  `• ${shorten(headline?.title)} (${headline?.direction || "NEUTRAL"})`
                )
              )
            )
          : null,

        error
          ? React.createElement(
              Text,
              { style: { color: COLORS.gold, fontSize: 9, lineHeight: 14, marginTop: 9 } },
              `Monitor retrying: ${error}`
            )
          : loading
            ? React.createElement(
                Text,
                { style: { color: COLORS.blue, fontSize: 9, marginTop: 9 } },
                "Railway AI refresh ho rahi hai..."
              )
            : null,
        React.createElement(
          Text,
          { style: { color: COLORS.blue, fontSize: 9, fontWeight: "900", marginTop: 9 } },
          "MONITOR ONLY • Trade blocking OFF • Order execution OFF"
        )
      )
    : React.createElement(
        View,
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 } },
        metricCell("BROKER", advancedReport?.broker || "WAITING", COLORS.blue),
        metricCell("MODEL", advancedReport ? `${displayStatus} ${advancedReport.modelSamples}/${advancedReport.modelRequired}` : "COLLECTING", mainColor)
      );

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: COLORS.surface3,
        borderRadius: 17,
        padding: 15,
        borderWidth: 1,
        borderColor: mainColor + "77",
        overflow: "hidden",
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        activeOpacity: 0.78,
        onPress: toggleExpanded,
        accessibilityRole: "button",
        accessibilityState: { expanded },
        accessibilityLabel: expanded ? "Collapse Advanced AI V2" : "Expand Advanced AI V2",
        style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 8 } },
        React.createElement(
          Text,
          { style: { color: COLORS.text, fontSize: 17, fontWeight: "900" } },
          "🧬 Advanced AI V2"
        ),
        React.createElement(
          Text,
          { style: { color: COLORS.muted, fontSize: 9, lineHeight: 14, marginTop: 4 } },
          advancedReport
            ? `${advancedReport.broker} • Option OI/Greeks/Depth + News + Global`
            : "Angel One • Upstox • Zerodha • Railway shadow"
        )
      ),
      React.createElement(
        View,
        { style: { flexDirection: "row", alignItems: "center" } },
        statusPill(displayStatus, mainColor),
        chevron(expanded, mainColor)
      )
    ),
    body
  );
}

module.exports = AiDecisionCard;
module.exports.signalToSnapshot = signalToSnapshot;
