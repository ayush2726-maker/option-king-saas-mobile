const React = require("react");
const { View, Text } = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const { evaluateMarket } = require("../ai");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const COLORS = {
  surface: "#13131f",
  surface2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#80809f",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#b06deb",
};

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function ageFromTimestamp(timestamp) {
  if (!timestamp) return 999999;
  const parsed = new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return 999999;
  return Math.max(0, Date.now() - parsed);
}

function directionHint(signal) {
  return firstValue(
    signal?.signal_direction,
    signal?.trade_side,
    signal?.option_type,
    signal?.optionType,
    signal?.direction,
    signal?.side,
    signal?.trend_direction,
    signal?.trend,
    signal?.signal
  );
}

function signalToSnapshot(signal = {}) {
  const hint = directionHint(signal);
  const explicitFeedAge = firstValue(signal.feed_age_ms, signal.feedAgeMs);
  const timestamp = firstValue(
    signal.engine_updated_at,
    signal.data_timestamp,
    signal.updated_at,
    signal.timestamp,
    signal.candle_time
  );
  const noData = String(signal.signal || "").toUpperCase() === "NO_DATA";

  return {
    symbol: firstValue(signal.symbol, signal.underlying, signal.instrument, "NIFTY"),
    timestamp,
    feedConnected: Boolean(firstValue(signal.feed_connected, signal.data_live, !noData)),
    feedAgeMs: explicitFeedAge != null ? Number(explicitFeedAge) : ageFromTimestamp(timestamp),
    price: firstValue(signal.price, signal.ltp, signal.spot_price, signal.close),
    ema20: firstValue(signal.ema20, signal.ema_20, signal.ema9, signal.ema_9),
    ema50: firstValue(signal.ema50, signal.ema_50, signal.ema21, signal.ema_21),
    vwap: signal.vwap,
    adx: signal.adx,
    rsi: signal.rsi,
    atr: signal.atr,
    atrPercent: firstValue(signal.atr_percent, signal.atrPercent),
    volumeRatio: firstValue(signal.volume_ratio, signal.volumeRatio),
    spreadPercent: firstValue(signal.spread_percent, signal.spreadPercent, 0),
    signalDirection: hint,
    supertrend: firstValue(signal.supertrend_direction, signal.supertrend_dir, signal.supertrend),
    structure: firstValue(signal.structure_direction, signal.market_structure),
    mtfDirection: firstValue(signal.mtf_direction, signal.mtf_trend, signal.mtf_confirmed ? hint : null),
    mtfConfirmed: Boolean(firstValue(signal.mtf_confirmed, signal.mtfConfirmed, false)),
    strategyScore: firstValue(signal.strategy_score, signal.score, 0),
    minStrategyScore: firstValue(signal.min_strategy_score, signal.min_score, 75),
    serverTradeAllowed: Boolean(firstValue(signal.server_trade_allowed, signal.trade_allowed, false)),
    dailyLossPercent: firstValue(signal.daily_loss_percent, signal.dailyLossPercent, 0),
    consecutiveLosses: firstValue(signal.consecutive_losses, signal.consecutiveLosses, 0),
    marketOpen: signal.market_open == null ? true : Boolean(signal.market_open),
    hasOpenPosition: Boolean(signal.active_trade || signal.open_trade || signal.has_open_position),
  };
}

function probabilityRow(label, value, color) {
  return React.createElement(
    View,
    {
      key: label,
      style: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: color + "18",
        borderWidth: 1,
        borderColor: color + "55",
        alignItems: "center",
      },
    },
    React.createElement(Text, { style: { color: COLORS.muted, fontSize: 10, fontWeight: "800" } }, label),
    React.createElement(Text, { style: { color, fontSize: 18, fontWeight: "900", marginTop: 3 } }, `${Number(value || 0)}%`)
  );
}

function metricCell(label, value, color) {
  return React.createElement(
    View,
    {
      key: label,
      style: {
        width: "48%",
        padding: 10,
        borderRadius: 10,
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
      },
    },
    React.createElement(Text, { style: { color: COLORS.muted, fontSize: 9, fontWeight: "800" } }, label),
    React.createElement(Text, { style: { color: color || COLORS.text, fontSize: 13, fontWeight: "900", marginTop: 4 } }, String(value ?? "--"))
  );
}

function normalizeRemotePrediction(data) {
  if (!data || !["CE", "PE", "NO_TRADE"].includes(data.decision)) return null;
  return {
    engineVersion: data.model_version || "railway-shared",
    decision: data.decision,
    confidence: Number(data.confidence || 0),
    probabilities: data.probabilities || { CE: 0, PE: 0, NO_TRADE: 100 },
    riskAllowed: Boolean(data.risk_allowed),
    reasons: Array.isArray(data.reasons) ? data.reasons : [],
    mode: "RAILWAY_SHARED_AI",
  };
}

function normalizeAdvancedReport(data) {
  if (!data || data.success !== true) return null;
  const latest = Array.isArray(data.recent_decisions) ? data.recent_decisions[0] : null;
  const option = latest?.option_summary || {};
  const summary = data.summary || {};
  const models = data.adaptive_models?.models || [];
  const model15 = models.find((item) => Number(item?.horizon_minutes) === 15) || models[0] || {};
  const decision = latest?.advanced_decision || "COLLECTING";
  const confidence = Number(latest?.advanced_confidence || 0);
  return {
    version: data.version || "OKAI-ADVANCED-V2",
    broker: String(latest?.broker || data.active_broker || "waiting").toUpperCase(),
    decision,
    confidence,
    probabilities: latest?.advanced_probabilities || {},
    optionDecision: latest?.option_decision || option.option_direction || "--",
    optionConfidence: Number(latest?.option_confidence || option.option_confidence || 0),
    coverage: Number(latest?.data_coverage_score || option.data_coverage_score || 0),
    optionRisk: Number(latest?.option_risk_score || option.risk_score || 0),
    pcr: option.pcr,
    maxPain: option.max_pain,
    modelStatus: model15.status || "COLLECTING",
    modelSamples: Number(model15.sample_count || 0),
    modelRequired: Number(data.adaptive_models?.minimum_training_samples || 300),
    evaluated15m: Number(summary.evaluated_15m || 0),
    hitRate15m: summary.advanced_15m_hit_rate_percent,
    netBenefit15m: summary.advanced_vs_base_net_benefit_rupees_per_lot_15m,
    reasons: Array.isArray(latest?.reasons) ? latest.reasons : [],
    shadowOnly: data.trade_blocking === false && data.order_execution === false,
  };
}

function AiDecisionCard({ signal, token }) {
  const [storedToken, setStoredToken] = React.useState(token || "");
  const [remotePrediction, setRemotePrediction] = React.useState(null);
  const [advancedReport, setAdvancedReport] = React.useState(null);
  const [remoteError, setRemoteError] = React.useState("");
  const [advancedError, setAdvancedError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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

    async function loadRailwayData() {
      if (!storedToken) return;
      if (active) setLoading(true);

      try {
        const data = await fetchJson("/bot/ai-decision");
        const normalized = normalizeRemotePrediction(data);
        if (!normalized) throw new Error("Invalid Railway AI response");
        if (active) {
          setRemotePrediction(normalized);
          setRemoteError("");
        }
      } catch (error) {
        if (active) setRemoteError(String(error?.message || "Railway AI unavailable"));
      }

      try {
        const data = await fetchJson("/bot/ai-advanced-monitor?recent_limit=1");
        const normalized = normalizeAdvancedReport(data);
        if (!normalized) throw new Error("Invalid Advanced AI response");
        if (active) {
          setAdvancedReport(normalized);
          setAdvancedError("");
        }
      } catch (error) {
        if (active) setAdvancedError(String(error?.message || "Advanced AI unavailable"));
      }

      if (active) setLoading(false);
    }

    loadRailwayData();
    timer = setInterval(loadRailwayData, 15000);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [storedToken]);

  const localFallback = React.useMemo(
    () => evaluateMarket(signalToSnapshot(signal || {})).prediction,
    [signal]
  );
  const prediction = remotePrediction || localFallback;
  const usingRailway = Boolean(remotePrediction);
  const decisionColor = prediction.decision === "CE"
    ? COLORS.green
    : prediction.decision === "PE"
      ? COLORS.red
      : COLORS.gold;

  const advancedDecision = advancedReport?.decision || "COLLECTING";
  const advancedColor = advancedDecision === "CE"
    ? COLORS.green
    : advancedDecision === "PE"
      ? COLORS.red
      : advancedDecision === "NO_TRADE"
        ? COLORS.gold
        : COLORS.purple;

  const advancedSection = React.createElement(
    View,
    {
      style: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
      },
    },
    React.createElement(
      View,
      { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 } },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 8 } },
        React.createElement(Text, { style: { color: COLORS.text, fontSize: 14, fontWeight: "900" } }, "🧬 Advanced AI V2"),
        React.createElement(
          Text,
          { style: { color: COLORS.muted, fontSize: 9, lineHeight: 14, marginTop: 3 } },
          advancedReport
            ? `${advancedReport.broker} • Option OI/Greeks/Depth + News + Global`
            : "Angel One • Upstox • Zerodha • Railway shadow"
        )
      ),
      React.createElement(
        View,
        { style: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: advancedColor + "22" } },
        React.createElement(Text, { style: { color: advancedColor, fontSize: 10, fontWeight: "900" } }, advancedDecision)
      )
    ),
    advancedReport && advancedReport.decision !== "COLLECTING"
      ? React.createElement(
          View,
          { style: { flexDirection: "row", gap: 7, marginBottom: 10 } },
          probabilityRow("CE", advancedReport.probabilities.CE, COLORS.green),
          probabilityRow("PE", advancedReport.probabilities.PE, COLORS.red),
          probabilityRow("NO TRADE", advancedReport.probabilities.NO_TRADE, COLORS.gold)
        )
      : null,
    React.createElement(
      View,
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
      metricCell("BROKER", advancedReport?.broker || "WAITING", COLORS.blue),
      metricCell("OPTION VIEW", advancedReport?.optionDecision || "--", advancedColor),
      metricCell("DATA COVERAGE", advancedReport ? `${advancedReport.coverage}%` : "--", advancedReport?.coverage >= 65 ? COLORS.green : COLORS.gold),
      metricCell("OPTION RISK", advancedReport ? `${advancedReport.optionRisk}/100` : "--", advancedReport?.optionRisk >= 60 ? COLORS.red : COLORS.green),
      metricCell("PCR", advancedReport?.pcr != null ? Number(advancedReport.pcr).toFixed(2) : "--", COLORS.blue),
      metricCell("MAX PAIN", advancedReport?.maxPain != null ? advancedReport.maxPain : "--", COLORS.purple),
      metricCell(
        "MODEL",
        advancedReport ? `${advancedReport.modelStatus} ${advancedReport.modelSamples}/${advancedReport.modelRequired}` : "COLLECTING",
        advancedReport?.modelStatus === "ACTIVE_SHADOW" ? COLORS.green : COLORS.gold
      ),
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
              marginTop: 9,
            },
          },
          `Advanced vs base: ${Number(advancedReport.netBenefit15m) >= 0 ? "+" : ""}₹${advancedReport.netBenefit15m} per lot (15m evaluated)`
        )
      : null,
    React.createElement(
      Text,
      { style: { color: advancedError ? COLORS.gold : COLORS.muted, fontSize: 9, lineHeight: 14, marginTop: 9 } },
      advancedError
        ? `Advanced monitor retrying: ${advancedError}`
        : advancedReport?.reasons?.length
          ? advancedReport.reasons.slice(0, 4).join(" • ")
          : "Exact option outcomes collect ho rahe hain. 300 valid samples ke baad validated adaptive model shadow mode me active hoga."
    ),
    React.createElement(
      Text,
      { style: { color: COLORS.blue, fontSize: 9, fontWeight: "900", marginTop: 6 } },
      "MONITOR ONLY • Trade blocking OFF • Order execution OFF"
    )
  );

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: decisionColor + "88",
      },
    },
    React.createElement(
      View,
      { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } },
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: { color: COLORS.text, fontSize: 16, fontWeight: "900" } }, "🧠 Shared AI Decision"),
        React.createElement(
          Text,
          { style: { color: COLORS.muted, fontSize: 10, marginTop: 3 } },
          `${usingRailway ? "Railway" : "Local fallback"} • ${prediction.engineVersion}`
        )
      ),
      React.createElement(
        View,
        { style: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: decisionColor + "22" } },
        React.createElement(Text, { style: { color: decisionColor, fontSize: 12, fontWeight: "900" } }, prediction.decision)
      )
    ),
    React.createElement(
      Text,
      { style: { color: decisionColor, fontSize: 26, fontWeight: "900", marginBottom: 12 } },
      `${prediction.confidence}% confidence`
    ),
    React.createElement(
      View,
      { style: { flexDirection: "row", gap: 8, marginBottom: 12 } },
      probabilityRow("CE", prediction.probabilities.CE, COLORS.green),
      probabilityRow("PE", prediction.probabilities.PE, COLORS.red),
      probabilityRow("NO TRADE", prediction.probabilities.NO_TRADE, COLORS.gold)
    ),
    React.createElement(
      View,
      { style: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 } },
      React.createElement(
        Text,
        { style: { color: prediction.riskAllowed ? COLORS.green : COLORS.red, fontSize: 11, fontWeight: "900" } },
        prediction.riskAllowed ? "✅ Hard safety gate passed" : "⛔ Hard safety gate blocked"
      ),
      React.createElement(
        Text,
        { style: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 5 } },
        prediction.reasons.length ? prediction.reasons.join(" • ") : "All available confirmations aligned"
      ),
      React.createElement(
        Text,
        { style: { color: remoteError ? COLORS.gold : COLORS.blue, fontSize: 10, lineHeight: 15, marginTop: 8 } },
        remoteError
          ? `Railway fallback active: ${remoteError}`
          : loading
            ? "Railway AI refreshing..."
            : "Same Railway AI model personal bot aur SaaS dono ke liye. Order execution OFF."
      )
    ),
    advancedSection
  );
}

module.exports = AiDecisionCard;
module.exports.signalToSnapshot = signalToSnapshot;
