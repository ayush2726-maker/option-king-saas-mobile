const React = require("react");
const { View, Text } = require("react-native");
const { evaluateMarket } = require("../ai");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const COLORS = {
  surface: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#80809f",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
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
    React.createElement(Text, { style: { color, fontSize: 18, fontWeight: "900", marginTop: 3 } }, `${value}%`)
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

function AiDecisionCard({ signal, token }) {
  const [remotePrediction, setRemotePrediction] = React.useState(null);
  const [remoteError, setRemoteError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    let timer = null;

    async function loadRailwayDecision() {
      if (!token) return;
      if (active) setLoading(true);
      try {
        const response = await fetch(`${SAAS_URL}/bot/ai-decision`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const normalized = normalizeRemotePrediction(data);
        if (!response.ok || !normalized) {
          throw new Error(data?.detail || data?.message || `HTTP ${response.status}`);
        }
        if (active) {
          setRemotePrediction(normalized);
          setRemoteError("");
        }
      } catch (error) {
        if (active) setRemoteError(String(error?.message || "Railway AI unavailable"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRailwayDecision();
    timer = setInterval(loadRailwayDecision, 15000);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [token]);

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
    )
  );
}

module.exports = AiDecisionCard;
module.exports.signalToSnapshot = signalToSnapshot;
