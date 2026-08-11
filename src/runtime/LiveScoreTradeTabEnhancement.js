const React = require("react");
const {
  ActivityIndicator,
  Alert,
  AppState,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const {
  updateTradeLiveSnapshot,
  useTradeLiveSnapshot,
} = require("./TradeLivePriceEnhancement");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const SIGNAL_POLL_MS = 10000;
const HISTORY_POLL_MS = 60000;

const C = {
  bg: "#0a0a0f",
  card: "#13131f",
  card2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#606080",
  sub: "#a0a0c0",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#7c6deb",
};

let installed = false;

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error(`Invalid server response for ${path}`);
  }
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.detail || `Request failed: ${path}`);
  }
  return data;
}

async function loadHistory(token) {
  try {
    return await apiGet("/bot/trade-history", token);
  } catch (_) {
    const legacy = await apiGet("/history/paper", token);
    return {
      ...legacy,
      paper_trades: Array.isArray(legacy?.paper_trades)
        ? legacy.paper_trades
        : [],
    };
  }
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value, signed = false) {
  const parsed = number(value, 0);
  const sign = signed && parsed > 0 ? "+" : "";
  return `${sign}₹${parsed.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function price(value) {
  if (value == null || value === "") return "--";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return `₹${parsed.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseBackendDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const millis = value < 100000000000 ? value * 1000 : value;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  let text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += "T00:00:00Z";
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)) {
    text = text.replace(/\s+/, "T");
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && !/(Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    text += "Z";
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function istParts(value) {
  const parsed = parseBackendDate(value);
  if (!parsed) return null;
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
  };
}

function todayIstKey(offsetDays = 0) {
  const now = new Date(Date.now() + 330 * 60 * 1000 + offsetDays * 86400000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function istDayKey(value) {
  const parts = istParts(value);
  if (!parts) return "";
  return `${parts.year}-${String(parts.month + 1).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function tradeTimestamp(trade, preferExit = false) {
  const exitValue = trade?.exit_time || trade?.closed_at || trade?.updated_at || null;
  const entryValue =
    trade?.entry_time || trade?.created_at || trade?.timestamp || trade?.time || trade?.date || null;
  return preferExit ? exitValue || entryValue : entryValue || exitValue;
}

function tradePnl(trade) {
  return number(trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl, 0);
}

function dateLabel(value) {
  const parts = istParts(value);
  if (!parts) return "DATE NOT AVAILABLE";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const key = `${parts.year}-${String(parts.month + 1).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const relative = key === todayIstKey(0) ? "TODAY" : key === todayIstKey(-1) ? "YESTERDAY" : "";
  const full = `${String(parts.day).padStart(2, "0")} ${months[parts.month]} ${parts.year}`;
  return relative ? `${relative} • ${full}` : full;
}

function timeLabel(value) {
  const parts = istParts(value);
  if (!parts) return "--:--";
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function Card({ children, glow, style }) {
  return React.createElement(
    View,
    {
      style: [
        {
          backgroundColor: C.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          padding: 16,
          ...(glow ? { shadowColor: glow, shadowOpacity: 0.22, shadowRadius: 10, elevation: 7 } : {}),
        },
        style,
      ],
    },
    children
  );
}

function Row({ children, style }) {
  return React.createElement(View, { style: [{ flexDirection: "row", alignItems: "center" }, style] }, children);
}

function StatusTag({ label, color }) {
  return React.createElement(
    View,
    {
      style: {
        backgroundColor: color + "20",
        borderColor: color + "66",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 4,
      },
    },
    React.createElement(Text, { style: { color, fontSize: 10, fontWeight: "900" } }, label)
  );
}

function ValueRow({ label, value, color = C.text }) {
  return React.createElement(
    Row,
    {
      style: {
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(Text, { style: { color: C.muted, fontSize: 13 } }, label),
    React.createElement(
      Text,
      { style: { color, fontSize: 13, fontWeight: "900", maxWidth: "68%", textAlign: "right" } },
      value
    )
  );
}

function openOnly(trade) {
  return String(trade?.status || "").toUpperCase() === "OPEN" ? trade : null;
}

function mergeLiveTrade(signalTrade, snapshot) {
  const baseTrade = openOnly(signalTrade);
  const liveTrade = snapshot?.open ? openOnly(snapshot?.trade) : null;
  if (!liveTrade) return baseTrade;
  if (!baseTrade) return liveTrade;
  const sameTrade =
    (liveTrade.id && baseTrade.id && String(liveTrade.id) === String(baseTrade.id)) ||
    (liveTrade.symbol && baseTrade.symbol && String(liveTrade.symbol) === String(baseTrade.symbol));
  return sameTrade ? { ...baseTrade, ...liveTrade } : liveTrade;
}

function scanScore(scan) {
  return number(
    scan?.decision_score ??
      scan?.score ??
      scan?.live_score_breakdown?.decision_score ??
      scan?.live_score_breakdown?.score,
    0
  );
}

function scanMinScore(scan, signal) {
  return number(scan?.min_score ?? scan?.live_score_breakdown?.min_score ?? signal?.min_score, 82);
}

function bestScan(signal) {
  const scans = Array.isArray(signal?.scan_results) ? signal.scan_results : [];
  const selected = signal?.selected_for_entry;
  if (selected?.underlying) {
    const match = scans.find((scan) => scan?.underlying === selected.underlying);
    if (match) return match;
  }
  const copy = [...scans];
  copy.sort((a, b) => scanScore(b) - scanScore(a));
  return copy[0] || null;
}

function scanColor(scan, signal) {
  const score = scanScore(scan);
  const minScore = scanMinScore(scan, signal);
  if (scan?.trade_allowed) return C.green;
  if (score >= minScore) return C.gold;
  return C.red;
}

function fallbackComponents(scan) {
  const breakdown = scan?.score_breakdown || scan?.live_score_breakdown || {};
  return [
    { key: "directional", label: "Directional Score", score: breakdown.directional ?? scan?.base_score ?? 0, max_score: 71, passed: number(breakdown.directional ?? scan?.base_score, 0) > 0, detail: `Candidate ${scan?.candidate_signal || scan?.signal || "WAIT"}` },
    { key: "adx", label: "ADX Strength", score: scan?.adx_score ?? breakdown.adx ?? 0, max_score: scan?.profile_weights?.adx ?? 14, passed: number(scan?.adx_score ?? breakdown.adx, 0) > 0, detail: `ADX ${number(scan?.adx, 0).toFixed(1)}` },
    { key: "volume", label: "Volume Confirmation", score: scan?.volume_score ?? breakdown.volume ?? 0, max_score: scan?.profile_weights?.volume ?? 5, passed: number(scan?.volume_score ?? breakdown.volume, 0) > 0, detail: `Volume ${number(scan?.volume_ratio, 0).toFixed(2)}x` },
    { key: "mtf", label: "Trend / MTF Confirmation", score: scan?.mtf_score ?? breakdown.mtf ?? 0, max_score: scan?.profile_weights?.mtf ?? 10, passed: number(scan?.mtf_score ?? breakdown.mtf, 0) > 0, detail: scan?.mtf_status || scan?.mtf || "MTF" },
  ];
}

function scoreComponents(scan) {
  const detailed = scan?.score_components || scan?.live_score_breakdown?.components;
  if (Array.isArray(detailed) && detailed.length) {
    // The header and entry engine use decision_score. item.score is only a
    // proportional visual-strength value and can misleadingly total 82 while
    // the real entry score is 71. Render the actual contribution here too.
    return detailed.map((item) => ({
      ...item,
      visual_score: item?.display_score ?? item?.score,
      score: item?.decision_score ?? item?.score,
    }));
  }
  return fallbackComponents(scan);
}

function ComponentScoreLine({ item }) {
  const score = number(item?.score, 0);
  const max = number(item?.max_score, 0);
  const enabled = item?.enabled !== false;
  const color = !enabled ? C.muted : item?.passed || score > 0 ? C.green : C.red;
  const title = item?.label || item?.key || "Score";
  const direction = item?.direction && item.direction !== "CONFIRM" && item.direction !== "STRENGTH"
    ? ` • ${item.direction}`
    : "";
  return React.createElement(
    View,
    { style: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border } },
    React.createElement(
      Row,
      { style: { justifyContent: "space-between", alignItems: "flex-start" } },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 8 } },
        React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900" } }, `${title}${direction}`),
        React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 2, lineHeight: 14 } }, item?.detail || "--")
      ),
      React.createElement(Text, { style: { color, fontSize: 13, fontWeight: "900" } }, enabled ? `${score}/${max}` : "OFF")
    )
  );
}

function MiniScanRow({ scan, signal, selected }) {
  const color = scanColor(scan, signal);
  const score = scanScore(scan);
  const minScore = scanMinScore(scan, signal);
  const side = scan?.candidate_signal || scan?.signal || "WAIT";
  return React.createElement(
    View,
    {
      style: {
        backgroundColor: selected ? color + "18" : C.card2,
        borderColor: selected ? color + "88" : C.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginTop: 8,
      },
    },
    React.createElement(
      Row,
      { style: { justifyContent: "space-between" } },
      React.createElement(Text, { style: { color: C.text, fontWeight: "900", fontSize: 13 } }, scan?.underlying || "INDEX"),
      React.createElement(Text, { style: { color, fontWeight: "900", fontSize: 13 } }, `${score}/${minScore}`)
    ),
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
      `${side} • ${scan?.trade_allowed ? "ALLOW" : "BLOCK"} • ADX ${number(scan?.adx, 0).toFixed(1)} • Vol ${number(scan?.volume_ratio, 0).toFixed(2)}x`
    )
  );
}

function LiveStrategyScoreCard({ signal }) {
  const [open, setOpen] = React.useState(false);
  const scans = Array.isArray(signal?.scan_results) ? signal.scan_results : [];
  const selected = bestScan(signal);
  const color = selected ? scanColor(selected, signal) : C.blue;
  const score = selected ? scanScore(selected) : number(signal?.score, 0);
  const minScore = selected ? scanMinScore(selected, signal) : number(signal?.min_score, 82);
  const updated = timeLabel(signal?.updated_at);

  const body = scans.length === 0
    ? React.createElement(
        Text,
        { style: { color: C.muted, fontSize: 12, lineHeight: 18 } },
        signal?.running
          ? "Engine warm-up me hai. Candle data aate hi live score dikhega."
          : "Bot stopped hai. Start karoge to live score yaha dikhega."
      )
    : React.createElement(
        View,
        null,
        React.createElement(
          Text,
          { style: { color: C.sub, fontSize: 10, fontWeight: "900", marginBottom: 2 } },
          `Updated ${updated} IST`
        ),
        scans.map((scan) =>
          React.createElement(MiniScanRow, {
            key: scan?.underlying || scan?.instrument || Math.random().toString(16),
            scan,
            signal,
            selected: selected && scan?.underlying === selected?.underlying,
          })
        ),
        selected
          ? React.createElement(
              View,
              {
                style: {
                  marginTop: 12,
                  backgroundColor: C.card2,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 10,
                },
              },
              React.createElement(
                Row,
                { style: { justifyContent: "space-between", marginBottom: 4 } },
                React.createElement(
                  Text,
                  { style: { color: C.text, fontSize: 13, fontWeight: "900" } },
                  `${selected?.underlying || "Selected"} breakdown`
                ),
                React.createElement(StatusTag, {
                  label: selected?.trade_allowed ? "ALLOW" : "BLOCK",
                  color,
                })
              ),
              scoreComponents(selected).map((item, index) =>
                React.createElement(ComponentScoreLine, {
                  key: item?.key || String(index),
                  item,
                })
              ),
              Array.isArray(selected?.warnings) && selected.warnings.length
                ? React.createElement(
                    Text,
                    { style: { color: C.gold, fontSize: 10, marginTop: 8, lineHeight: 15 } },
                    selected.warnings.slice(0, 3).join(" • ")
                  )
                : null
            )
          : null
      );

  return React.createElement(
    Card,
    { glow: color },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((value) => !value),
        activeOpacity: 0.82,
        accessibilityRole: "button",
        accessibilityState: { expanded: open },
        style: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 8 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 18, fontWeight: "900" } },
          "📊 Live Strategy Score"
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, marginTop: 3, lineHeight: 15 } },
          open ? "Tap to close live score" : "Tap to view live strategy score"
        )
      ),
      React.createElement(
        View,
        { style: { alignItems: "flex-end", marginLeft: 10 } },
        React.createElement(
          Text,
          { style: { color, fontSize: 22, fontWeight: "900" } },
          `${score}`
        ),
        React.createElement(
          Row,
          { style: { gap: 8, marginTop: 2 } },
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 10, fontWeight: "800" } },
            `/ ${minScore}`
          ),
          React.createElement(
            Text,
            { style: { color, fontSize: 17, fontWeight: "900" } },
            open ? "⌃" : "⌄"
          )
        )
      )
    ),
    open
      ? React.createElement(View, { style: { marginTop: 12 } }, body)
      : null
  );
}

function WhyTradeMini({ trade }) {
  const explanation = trade?.entry_explanation || trade?.trade_explanation || null;
  const title = explanation?.title || "Why Trade Taken";
  const summary = explanation?.summary || trade?.reason || "Next fresh trade se full reason yaha dikhega.";
  const rows = Array.isArray(explanation?.rows) ? explanation.rows : [];
  return React.createElement(
    View,
    { style: { marginTop: 10, backgroundColor: C.card2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 10 } },
    React.createElement(Text, { style: { color: C.blue, fontSize: 13, fontWeight: "900" } }, title),
    React.createElement(Text, { style: { color: C.muted, fontSize: 11, marginTop: 5, lineHeight: 16 } }, summary),
    rows.slice(0, 5).map((row, index) =>
      React.createElement(
        Row,
        { key: String(index), style: { justifyContent: "space-between", marginTop: 6 } },
        React.createElement(Text, { style: { color: C.sub, fontSize: 10 } }, row?.label || row?.key || "Reason"),
        React.createElement(Text, { style: { color: row?.ok === false ? C.red : C.green, fontSize: 10, fontWeight: "900", maxWidth: "55%", textAlign: "right" } }, String(row?.value ?? "--"))
      )
    )
  );
}

const TradeHistoryCard = React.memo(function TradeHistoryCard({ history }) {
  return React.createElement(
    Card,
    { style: { marginTop: 12 } },
    React.createElement(
      Row,
      { style: { justifyContent: "space-between", marginBottom: 10 } },
      React.createElement(Text, { style: { color: C.text, fontSize: 18, fontWeight: "900" } }, "📜 Trade History"),
      React.createElement(Text, { style: { color: C.muted, fontSize: 10 } }, `${history.length} trades`)
    ),
    history.length === 0
      ? React.createElement(Text, { style: { color: C.muted } }, "History load nahi hui. Pull-down refresh karein.")
      : history.slice(0, 100).map((item, index) => {
          const itemPnl = tradePnl(item);
          const itemStatus = String(item?.status || "--").toUpperCase();
          const entryTime = item?.entry_time || item?.created_at || item?.timestamp || item?.time || item?.date;
          const exitTime = item?.exit_time || item?.closed_at || item?.updated_at;
          const dateSource = tradeTimestamp(item, false);
          return React.createElement(
            View,
            { key: item?.id || `${item?.symbol || "trade"}-${index}`, style: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border } },
            React.createElement(
              Row,
              { style: { justifyContent: "space-between", alignItems: "flex-start" } },
              React.createElement(
                View,
                { style: { flex: 1, paddingRight: 8 } },
                React.createElement(Text, { style: { color: C.text, fontWeight: "900", fontSize: 13 } }, item?.symbol || "PAPER TRADE"),
                React.createElement(Text, { style: { color: C.blue, fontSize: 10, fontWeight: "900", marginTop: 4 } }, dateLabel(dateSource)),
                React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 3 } }, `Entry ${timeLabel(entryTime)}${exitTime ? ` • Exit ${timeLabel(exitTime)}` : itemStatus === "OPEN" ? " • OPEN" : ""} IST`)
              ),
              React.createElement(StatusTag, { label: itemStatus, color: itemStatus === "OPEN" ? C.green : C.gold })
            ),
            React.createElement(Text, { style: { color: C.muted, fontSize: 11, marginTop: 6 } }, `${item?.side || "--"} • Qty ${item?.qty ?? "--"} • Entry ${price(item?.entry_price)} • Exit ${price(item?.exit_price)}`),
            React.createElement(Text, { style: { color: itemPnl >= 0 ? C.green : C.red, fontWeight: "900", fontSize: 12, marginTop: 4, lineHeight: 17 } }, `${money(itemPnl, true)} NET • ${item?.reason || "--"}`)
          );
        })
  );
});

// OKAI-LIVE-SCORE-MULTI-TRADE-V8
function explicitTradeId(trade) {
  return trade?.id ?? trade?.trade_id ?? trade?.position_id ?? null;
}

function openStatus(trade) {
  return String(trade?.status || "OPEN").toUpperCase() === "OPEN";
}

function livePriceValue(trade) {
  return (
    trade?.live_price ??
    trade?.current_price ??
    trade?.last_ltp ??
    trade?.ltp ??
    trade?.entry_price
  );
}

function tradeIdentityV8(trade, index = 0) {
  const id = explicitTradeId(trade);
  if (id != null) return `id:${String(id)}`;
  return [
    "fallback",
    trade?.symbol || "trade",
    trade?.entry_time || trade?.created_at || trade?.timestamp || "",
    trade?.capital_slot ?? "",
    trade?.qty ?? "",
    index,
  ].join("|");
}

function samePositionV8(left, right) {
  if (!left || !right) return false;
  const leftId = explicitTradeId(left);
  const rightId = explicitTradeId(right);

  // Two different trade IDs are always two different open positions, even when
  // the option symbol is the same (for example repeated entries in one contract).
  if (leftId != null && rightId != null) {
    return String(leftId) === String(rightId);
  }
  if (leftId != null || rightId != null) return false;

  const leftSymbol = String(left?.symbol || "").toUpperCase();
  const rightSymbol = String(right?.symbol || "").toUpperCase();
  if (!leftSymbol || leftSymbol !== rightSymbol) return false;

  const leftTime = String(left?.entry_time || left?.created_at || "");
  const rightTime = String(right?.entry_time || right?.created_at || "");
  if (leftTime && rightTime) return leftTime === rightTime;

  const leftSlot = left?.capital_slot;
  const rightSlot = right?.capital_slot;
  return leftSlot != null && rightSlot != null && String(leftSlot) === String(rightSlot);
}

function historyOpenRowsV8(history) {
  const rows = Array.isArray(history)
    ? history
    : Array.isArray(history?.paper_trades)
    ? history.paper_trades
    : Array.isArray(history?.trades)
    ? history.trades
    : Array.isArray(history?.history)
    ? history.history
    : [];
  return rows.filter(openStatus);
}

function liveRowsV8(payload) {
  const rows = [];
  if (!payload || typeof payload !== "object") return rows;
  for (const key of ["trades", "active_trades", "open_positions", "positions"]) {
    if (Array.isArray(payload?.[key])) rows.push(...payload[key]);
  }
  if (payload?.open && payload?.trade) rows.push(payload.trade);
  if (payload?.active_trade) rows.push(payload.active_trade);
  if (payload?.latest_trade && openStatus(payload.latest_trade)) rows.push(payload.latest_trade);
  return rows.filter(Boolean).filter(openStatus);
}

function mergeOpenPositionsV8(history, livePayload, signal, snapshot) {
  const merged = historyOpenRowsV8(history).map((trade) => ({ ...trade, status: "OPEN" }));
  const supplemental = [
    ...liveRowsV8(livePayload),
    ...liveRowsV8(snapshot),
    ...liveRowsV8(signal),
  ];

  for (const liveTrade of supplemental) {
    const index = merged.findIndex((trade) => samePositionV8(trade, liveTrade));
    if (index >= 0) {
      merged[index] = { ...merged[index], ...liveTrade, status: "OPEN" };
    } else {
      merged.push({ ...liveTrade, status: "OPEN" });
    }
  }

  const deduped = [];
  for (const trade of merged) {
    const id = explicitTradeId(trade);
    const index = id == null
      ? -1
      : deduped.findIndex((candidate) => {
          const candidateId = explicitTradeId(candidate);
          return candidateId != null && String(candidateId) === String(id);
        });
    if (index >= 0) deduped[index] = { ...deduped[index], ...trade, status: "OPEN" };
    else deduped.push(trade);
  }

  deduped.sort((left, right) => {
    const leftSlot = number(left?.capital_slot, 99);
    const rightSlot = number(right?.capital_slot, 99);
    if (leftSlot !== rightSlot) return leftSlot - rightSlot;
    const leftTime = parseBackendDate(left?.entry_time || left?.created_at)?.getTime() || 0;
    const rightTime = parseBackendDate(right?.entry_time || right?.created_at)?.getTime() || 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return number(explicitTradeId(left), 0) - number(explicitTradeId(right), 0);
  });
  return deduped;
}

function LiveScoreTradeTab({ token }) {
  const snapshot = useTradeLiveSnapshot();
  const [signal, setSignal] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [livePayload, setLivePayload] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [busyTradeId, setBusyTradeId] = React.useState("");
  const requestRef = React.useRef(false);
  const aliveRef = React.useRef(true);
  const appStateRef = React.useRef(AppState.currentState);
  const initialLoadRef = React.useRef(true);
  const historyLoadedAtRef = React.useRef(0);

  const loadTrade = React.useCallback(async (silent = false) => {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;
    const showLoader = !silent && !initialLoadRef.current;
    if (showLoader && aliveRef.current) setLoading(true);
    if (!silent && aliveRef.current) setMsg("");

    try {
      if (silent) {
        // The global watcher already refreshes /bot/trade-live. Refresh the
        // strategy snapshot every ten seconds and history only once a minute.
        const refreshHistory =
          Date.now() - historyLoadedAtRef.current >= HISTORY_POLL_MS;
        if (refreshHistory) historyLoadedAtRef.current = Date.now();
        const [sig, hist] = await Promise.all([
          apiGet("/bot/signal", token),
          refreshHistory ? loadHistory(token).catch(() => null) : null,
        ]);
        if (aliveRef.current) {
          setSignal(sig || {});
          const rows = Array.isArray(hist?.paper_trades)
            ? hist.paper_trades
            : Array.isArray(hist?.trades)
            ? hist.trades
            : null;
          if (rows) setHistory(rows);
        }
      } else {
        const [sig, hist, live] = await Promise.all([
          apiGet("/bot/signal", token),
          loadHistory(token).catch(() => null),
          apiGet("/bot/trade-live", token).catch(() => null),
        ]);
        if (aliveRef.current) {
          setSignal(sig || {});
          const rows = Array.isArray(hist?.paper_trades)
            ? hist.paper_trades
            : Array.isArray(hist?.trades)
            ? hist.trades
            : null;
          if (rows) {
            setHistory(rows);
            historyLoadedAtRef.current = Date.now();
          }
          setLivePayload(live || null);
          if (live && typeof live === "object") updateTradeLiveSnapshot(live);
        }
      }
    } catch (error) {
      if (!silent && aliveRef.current) {
        setMsg(error?.message || "Trade data load failed");
      }
    } finally {
      requestRef.current = false;
      initialLoadRef.current = false;
      if (showLoader && aliveRef.current) setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;
    loadTrade(false);
    const timer = setInterval(() => loadTrade(true), SIGNAL_POLL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state === "active") loadTrade(true);
    });

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [loadTrade]);

  const openTrades = React.useMemo(
    () => mergeOpenPositionsV8(history, livePayload, signal, snapshot),
    [history, livePayload, signal, snapshot]
  );
  const isLiveMode = openTrades.some(
    (trade) => String(trade?.trading_mode || "paper").toLowerCase() === "live"
  ) || String(signal?.trading_mode || "paper").toLowerCase() === "live";
  const lastUpdate = timeLabel(
    livePayload?.as_of || livePayload?.updated_at || snapshot?.as_of || signal?.updated_at
  );

  const executeManualExit = React.useCallback(async (trade) => {
    const id = explicitTradeId(trade);
    if (id == null || busyTradeId) return;
    setBusyTradeId(String(id));
    try {
      const response = await fetch(SAAS_URL + "/bot/manual-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ trade_id: id }),
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || data?.detail || "Exit failed");
      }
      Alert.alert(
        "Trade Exited",
        data?.message || `${trade?.symbol || "Selected trade"} exit ho gayi.`
      );
      await loadTrade(false);
    } catch (error) {
      Alert.alert("Exit Failed", String(error?.message || error || "Trade exit nahi hui"));
    } finally {
      setBusyTradeId("");
    }
  }, [busyTradeId, loadTrade, token]);

  const confirmManualExit = React.useCallback((trade) => {
    const id = explicitTradeId(trade);
    if (id == null || busyTradeId) {
      if (id == null) Alert.alert("Exit unavailable", "Is trade ka trade_id nahi mila.");
      return;
    }
    Alert.alert(
      "Exit This Trade?",
      `${trade?.symbol || "Selected trade"}\nQty: ${trade?.qty ?? "--"}\nLive: ${price(livePriceValue(trade))}\n\nSirf selected trade exit hogi.`,
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "EXIT THIS TRADE",
          style: "destructive",
          onPress: () => executeManualExit(trade),
        },
      ]
    );
  }, [busyTradeId, executeManualExit]);

  return React.createElement(
    ScrollView,
    {
      __okaiFinalMultiOpenInjected: true,
      __okaiManualExitInjectedV5: true,
      style: { flex: 1, backgroundColor: C.bg },
      contentContainerStyle: { padding: 16, paddingBottom: 120 },
      refreshControl: React.createElement(RefreshControl, {
        refreshing: loading,
        onRefresh: () => loadTrade(false),
        tintColor: C.blue,
        colors: [C.blue],
      }),
    },
    React.createElement(
      Card,
      {
        __okaiDirectMultiOpenPanelV3: true,
        glow: openTrades.length ? C.green : C.blue,
        style: { marginBottom: 12 },
      },
      React.createElement(
        Row,
        { style: { justifyContent: "space-between", marginBottom: 10 } },
        React.createElement(
          View,
          { style: { flex: 1, paddingRight: 10 } },
          React.createElement(
            Text,
            { style: { color: C.text, fontSize: 20, fontWeight: "900" } },
            `🧾 Active ${isLiveMode ? "Live" : "Paper"} Trades (${openTrades.length})`
          ),
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 9, marginTop: 4 } },
            openTrades.length
              ? `Har open trade alag card me • Updated ${lastUpdate} IST`
              : "Closed trade ko active position nahi dikhaya jayega."
          )
        ),
        React.createElement(
          TouchableOpacity,
          {
            onPress: () => loadTrade(false),
            disabled: loading,
            style: { paddingVertical: 8, paddingLeft: 8 },
          },
          loading
            ? React.createElement(ActivityIndicator, { color: C.blue, size: "small" })
            : React.createElement(Text, { style: { color: C.blue, fontWeight: "900" } }, "Refresh")
        )
      ),
      openTrades.length === 0
        ? React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 13, lineHeight: 19 } },
            "Abhi koi active trade nahi hai. Sirf fully qualified signal par nayi trade create hogi."
          )
        : openTrades.map((trade, index) => {
            const pnl = tradePnl(trade);
            const id = explicitTradeId(trade);
            const busy = id != null && busyTradeId === String(id);
            const slot = trade?.capital_slot ?? index + 1;
            const allocation = trade?.allocation_pct ??
              (Number(slot) === 1 ? 50 : Number(slot) === 2 ? 40 : null);
            return React.createElement(
              View,
              {
                key: `${tradeIdentityV8(trade, index)}-${index}`,
                style: {
                  backgroundColor: C.card2,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: pnl >= 0 ? C.green + "66" : C.red + "66",
                  padding: 13,
                  marginTop: 12,
                },
              },
              React.createElement(
                Row,
                { style: { justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 } },
                React.createElement(
                  View,
                  { style: { flex: 1, paddingRight: 8 } },
                  React.createElement(
                    Text,
                    { style: { color: C.blue, fontSize: 11, fontWeight: "900" } },
                    `TRADE ${index + 1} OF ${openTrades.length} • SLOT ${slot}${allocation != null ? ` (${allocation}%)` : ""}`
                  ),
                  React.createElement(
                    Text,
                    { style: { color: C.text, fontSize: 15, fontWeight: "900", marginTop: 5 } },
                    trade?.symbol || `OPEN TRADE ${index + 1}`
                  )
                ),
                React.createElement(StatusTag, { label: "OPEN", color: C.green })
              ),
              React.createElement(ValueRow, {
                label: "Side / Quantity",
                value: `${trade?.side || "--"} / ${trade?.qty ?? "--"}`,
              }),
              React.createElement(ValueRow, {
                label: "Entry / Time",
                value: `${price(trade?.entry_price)} • ${timeLabel(trade?.entry_time || trade?.created_at)} IST`,
              }),
              React.createElement(ValueRow, {
                label: "Live Price",
                value: price(livePriceValue(trade)),
                color: C.green,
              }),
              React.createElement(ValueRow, {
                label: "Live SL",
                value: price(trade?.sl_price),
                color: C.red,
              }),
              React.createElement(ValueRow, {
                label: "Target",
                value: price(trade?.target_price),
                color: C.green,
              }),
              React.createElement(ValueRow, {
                label: "Net P&L",
                value: money(pnl, true),
                color: pnl >= 0 ? C.green : C.red,
              }),
              trade?.total_charges != null
                ? React.createElement(ValueRow, {
                    label: "Est. Charges",
                    value: money(trade.total_charges, false),
                    color: C.gold,
                  })
                : null,
              React.createElement(ValueRow, { label: "Status", value: "OPEN", color: C.green }),
              React.createElement(WhyTradeMini, { trade }),
              React.createElement(
                TouchableOpacity,
                {
                  __okaiPerTradeExitButton: true,
                  onPress: () => confirmManualExit(trade),
                  disabled: busy || id == null,
                  activeOpacity: 0.84,
                  style: {
                    minHeight: 50,
                    borderRadius: 13,
                    marginTop: 12,
                    backgroundColor: C.red,
                    borderWidth: 1,
                    borderColor: "#ff91a1",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: busy || id == null ? 0.55 : 1,
                  },
                },
                busy
                  ? React.createElement(ActivityIndicator, { color: "#ffffff" })
                  : React.createElement(
                      Text,
                      { style: { color: "#ffffff", fontSize: 13, fontWeight: "900" } },
                      `⛔ EXIT THIS TRADE (${index + 1}/${openTrades.length})`
                    )
              )
            );
          }),
      msg
        ? React.createElement(
            Text,
            { style: { color: C.red, marginTop: 10, fontWeight: "900" } },
            msg
          )
        : null
    ),
    React.createElement(LiveStrategyScoreCard, { signal: signal || {} }),
    React.createElement(TradeHistoryCard, { history })
  );
}

function componentSource(type) {
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
}

function isTradeTab(type, props) {
  if (!type || typeof type !== "function" || props?.__okaiLiveScoreBypass) return false;
  const name = String(type.displayName || type.name || "");
  if (name === "TradeTab") return true;
  const source = componentSource(type);
  return source.includes("/history/paper") && source.includes("Active Paper Trade") && source.includes("Trade History");
}

function installLiveScoreTradeTabEnhancement() {
  if (installed || React.__OKAI_LIVE_SCORE_TRADE_TAB_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiLiveScoreCreateElement(type, props, ...children) {
    if (isTradeTab(type, props)) {
      return previousCreateElement(LiveScoreTradeTab, { ...(props || {}), __okaiLiveScoreBypass: true, __okaiMultiTradeBypass: true }, ...children);
    }
    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiLiveScoreJsx(type, props, reactKey) {
        if (isTradeTab(type, props)) {
          return previous(LiveScoreTradeTab, { ...(props || {}), __okaiLiveScoreBypass: true, __okaiMultiTradeBypass: true }, reactKey);
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_LIVE_SCORE_TRADE_TAB_PATCHED__ = true;
}

module.exports = { installLiveScoreTradeTabEnhancement };
